import { prisma } from '../config/database';

export class AuditService {
  async log(
    organizationId: string,
    userId: string | undefined,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, string | number | boolean | null>,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action,
          entityType,
          entityId,
          details: details ?? undefined,
          ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const auditService = new AuditService();
