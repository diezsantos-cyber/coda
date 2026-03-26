import { prisma } from '../config/database';

export class DashboardService {
  async getStats(organizationId: string): Promise<{
    upcomingMeetings: number;
    pendingAgreements: number;
    completedAgreements: number;
    totalTeamMembers: number;
    recentActivity: unknown[];
  }> {
    const now = new Date();

    const [upcomingMeetings, pendingAgreements, completedAgreements, totalTeamMembers, recentMeetings] = await Promise.all([
      prisma.meeting.count({
        where: { organizationId, status: 'scheduled', scheduledAt: { gte: now } },
      }),
      prisma.agreement.count({
        where: { organizationId, status: { in: ['pending', 'in_progress'] } },
      }),
      prisma.agreement.count({
        where: { organizationId, status: 'completed' },
      }),
      prisma.teamMember.count({
        where: { organizationId, isActive: true },
      }),
      prisma.meeting.findMany({
        where: { organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, scheduledAt: true, updatedAt: true },
      }),
    ]);

    return {
      upcomingMeetings,
      pendingAgreements,
      completedAgreements,
      totalTeamMembers,
      recentActivity: recentMeetings,
    };
  }
}

export const dashboardService = new DashboardService();
