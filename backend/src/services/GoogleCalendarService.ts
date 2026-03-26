import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { config } from '../config';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.googleCalendar.clientId,
      config.googleCalendar.clientSecret,
      config.googleCalendar.redirectUri,
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async handleCallback(organizationId: string, code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);

    await prisma.googleIntegration.upsert({
      where: { organizationId },
      create: {
        organizationId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || '',
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
        scopes: JSON.stringify(tokens.scope?.split(' ') || []),
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
      },
    });
  }

  async configureCalendar(organizationId: string, calendarId: string): Promise<void> {
    await prisma.googleCalendarConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        calendarId,
        syncEnabled: true,
      },
      update: {
        calendarId,
        syncEnabled: true,
      },
    });
  }

  private async getAuthClient(organizationId: string): Promise<OAuth2Client> {
    const integration = await prisma.googleIntegration.findUnique({
      where: { organizationId },
    });

    if (!integration) {
      throw new Error('Google Calendar not connected for this organization');
    }

    const client = new google.auth.OAuth2(
      config.googleCalendar.clientId,
      config.googleCalendar.clientSecret,
      config.googleCalendar.redirectUri,
    );

    client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.tokenExpiry.getTime(),
    });

    // Auto-refresh token if expired
    client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await prisma.googleIntegration.update({
          where: { organizationId },
          data: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
          },
        });
      }
    });

    return client;
  }

  async syncEvents(organizationId: string): Promise<{ synced: number; created: number; updated: number }> {
    const calendarConfig = await prisma.googleCalendarConfig.findUnique({
      where: { organizationId },
    });

    if (!calendarConfig || !calendarConfig.syncEnabled) {
      throw new Error('Calendar sync not configured');
    }

    const authClient = await this.getAuthClient(organizationId);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    // Sync events from last sync or last 30 days
    const timeMin = calendarConfig.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Next 90 days

    const response = await calendar.events.list({
      calendarId: calendarConfig.calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = response.data.items || [];
    let created = 0;
    let updated = 0;

    for (const event of events) {
      if (!event.id || !event.summary) continue;

      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      if (!startTime) continue;

      const scheduledAt = new Date(startTime);
      const endAt = endTime ? new Date(endTime) : new Date(scheduledAt.getTime() + 60 * 60 * 1000);
      const durationMinutes = Math.round((endAt.getTime() - scheduledAt.getTime()) / (60 * 1000));

      const attendees = (event.attendees || []).map((a) => ({
        email: a.email,
        name: a.displayName || a.email,
      }));

      const existing = await prisma.meeting.findFirst({
        where: {
          organizationId,
          googleCalendarEventId: event.id,
        },
      });

      if (existing) {
        await prisma.meeting.update({
          where: { id: existing.id },
          data: {
            title: event.summary,
            description: event.description || null,
            scheduledAt,
            endTime: endAt,
            durationMinutes,
            location: event.location || null,
            attendees: JSON.stringify(attendees),
            lastSyncedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.meeting.create({
          data: {
            organizationId,
            googleCalendarEventId: event.id,
            googleCalendarId: calendarConfig.calendarId,
            title: event.summary,
            description: event.description || null,
            scheduledAt,
            endTime: endAt,
            durationMinutes,
            location: event.location || null,
            attendees: JSON.stringify(attendees),
            status: 'scheduled',
            lastSyncedAt: new Date(),
          },
        });
        created++;
      }
    }

    await prisma.googleCalendarConfig.update({
      where: { organizationId },
      data: { lastSyncedAt: new Date() },
    });

    return { synced: events.length, created, updated };
  }

  async getUpcomingMeetings(organizationId: string, limit = 10): Promise<any[]> {
    return prisma.meeting.findMany({
      where: {
        organizationId,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();
