import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { parsePagination } from '../utils/helpers';

interface CreateMeetingInput {
  title: string;
  description?: string;
  agenda?: string;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  participants?: Array<{ userId?: string; teamMemberId?: string; role?: string }>;
}

interface UpdateMeetingInput {
  title?: string;
  description?: string;
  agenda?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  status?: string;
  location?: string;
}

export class MeetingService {
  async list(organizationId: string, query: Record<string, unknown>): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page, limit, skip } = parsePagination(query);
    const status = query['status'] as string | undefined;
    const startDate = query['startDate'] as string | undefined;
    const endDate = query['endDate'] as string | undefined;

    const where: Record<string, unknown> = { organizationId };
    if (status && status !== 'all') {
      where['status'] = status;
    }
    if (startDate || endDate) {
      const scheduledAt: Record<string, Date> = {};
      if (startDate) scheduledAt['gte'] = new Date(startDate);
      if (endDate) scheduledAt['lte'] = new Date(endDate);
      where['scheduledAt'] = scheduledAt;
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true } }, teamMember: { select: { id: true, name: true, telegramUsername: true } } },
          },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { agreements: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      data: meetings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(organizationId: string, meetingId: string): Promise<unknown> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true } }, teamMember: { select: { id: true, name: true, telegramUsername: true } } },
        },
        createdBy: { select: { id: true, name: true } },
        minute: true,
        agreements: true,
      },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }
    return meeting;
  }

  async create(organizationId: string, userId: string, input: CreateMeetingInput): Promise<unknown> {
    const meeting = await prisma.meeting.create({
      data: {
        organizationId,
        title: input.title,
        description: input.description,
        agenda: input.agenda,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes ?? 60,
        location: input.location,
        createdById: userId,
        participants: input.participants ? {
          create: input.participants.map((p) => ({
            userId: p.userId,
            teamMemberId: p.teamMemberId,
            role: p.role ?? 'attendee',
          })),
        } : undefined,
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } }, teamMember: { select: { id: true, name: true } } },
        },
      },
    });
    return meeting;
  }

  async update(organizationId: string, meetingId: string, input: UpdateMeetingInput): Promise<unknown> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    return prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.agenda !== undefined && { agenda: input.agenda }),
        ...(input.scheduledAt !== undefined && { scheduledAt: new Date(input.scheduledAt) }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.location !== undefined && { location: input.location }),
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } }, teamMember: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async delete(organizationId: string, meetingId: string): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'cancelled' },
    });
  }

  async addParticipants(organizationId: string, meetingId: string, participants: Array<{ userId?: string; teamMemberId?: string; role?: string }>): Promise<unknown> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    const created = await prisma.meetingParticipant.createMany({
      data: participants.map((p) => ({
        meetingId,
        userId: p.userId,
        teamMemberId: p.teamMemberId,
        role: p.role ?? 'attendee',
      })),
    });
    return created;
  }

  async removeParticipant(organizationId: string, meetingId: string, participantId: string): Promise<void> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    const participant = await prisma.meetingParticipant.findFirst({
      where: { id: participantId, meetingId },
    });
    if (!participant) {
      throw new NotFoundError('Participant', participantId);
    }

    await prisma.meetingParticipant.delete({
      where: { id: participantId },
    });
  }
}

export const meetingService = new MeetingService();
