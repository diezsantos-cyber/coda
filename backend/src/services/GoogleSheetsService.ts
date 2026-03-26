import { google, Auth } from 'googleapis';
import { prisma } from '../config/database';
import { config } from '../config';
import { NotFoundError } from '../utils/errors';

export class GoogleSheetsService {
  private getOAuth2Client(): Auth.OAuth2Client {
    return new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri,
    );
  }

  getAuthUrl(): string {
    const client = this.getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async handleCallback(organizationId: string, code: string): Promise<void> {
    const client = this.getOAuth2Client();
    const { tokens } = await client.getToken(code);

    const existing = await prisma.googleSheetsExport.findFirst({
      where: { organizationId },
    });

    const tokenData = {
      accessToken: tokens.access_token ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };

    if (existing) {
      await prisma.googleSheetsExport.update({
        where: { id: existing.id },
        data: tokenData,
      });
    } else {
      await prisma.googleSheetsExport.create({
        data: {
          organizationId,
          spreadsheetId: '',
          ...tokenData,
        },
      });
    }
  }

  async configureSpreadsheet(organizationId: string, spreadsheetId: string, sheetName?: string): Promise<void> {
    const existing = await prisma.googleSheetsExport.findFirst({
      where: { organizationId },
    });

    if (existing) {
      await prisma.googleSheetsExport.update({
        where: { id: existing.id },
        data: { spreadsheetId, sheetName: sheetName ?? 'Agreements' },
      });
    } else {
      await prisma.googleSheetsExport.create({
        data: { organizationId, spreadsheetId, sheetName: sheetName ?? 'Agreements' },
      });
    }
  }

  async exportMinuteToSheets(minuteId: string, organizationId: string): Promise<void> {
    const sheetsConfig = await prisma.googleSheetsExport.findFirst({
      where: { organizationId, syncEnabled: true },
    });

    if (!sheetsConfig?.accessToken || !sheetsConfig.spreadsheetId) {
      console.info('Google Sheets not configured, skipping export');
      return;
    }

    const minute = await prisma.minute.findUnique({
      where: { id: minuteId },
      include: {
        meeting: true,
        agreements: {
          include: {
            assignedToUser: { select: { name: true } },
            assignedToMember: { select: { name: true } },
          },
        },
      },
    });

    if (!minute) {
      throw new NotFoundError('Minute', minuteId);
    }

    const client = this.getOAuth2Client();
    client.setCredentials({
      access_token: sheetsConfig.accessToken,
      refresh_token: sheetsConfig.refreshToken,
    });

    const sheets = google.sheets({ version: 'v4', auth: client });

    const rows = minute.agreements.map((agreement) => [
      minute.meeting.scheduledAt.toISOString().split('T')[0],
      minute.meeting.title,
      agreement.title,
      agreement.assignedToUser?.name ?? agreement.assignedToMember?.name ?? 'Unassigned',
      agreement.dueDate?.toISOString().split('T')[0] ?? '',
      agreement.priority,
      agreement.status,
    ]);

    if (rows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: `${sheetsConfig.sheetName}!A:G`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      });
    }

    await prisma.googleSheetsExport.update({
      where: { id: sheetsConfig.id },
      data: { lastSyncAt: new Date() },
    });

    console.info(`Exported ${rows.length} agreements to Google Sheets`);
  }
}

export const googleSheetsService = new GoogleSheetsService();
