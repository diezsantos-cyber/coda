import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { eventService } from './EventService';

interface CreateMinuteInput {
  content: string;
  summary?: string;
  topicsDiscussed?: string[];
}

export class MinuteService {
  async getByMeetingId(organizationId: string, meetingId: string): Promise<unknown> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    const minute = await prisma.minute.findUnique({
      where: { meetingId },
      include: {
        agreements: {
          include: {
            assignedToUser: { select: { id: true, name: true } },
            assignedToMember: { select: { id: true, name: true, telegramUsername: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return minute;
  }

  async createOrUpdate(organizationId: string, meetingId: string, userId: string, input: CreateMinuteInput): Promise<unknown> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    const existing = await prisma.minute.findUnique({
      where: { meetingId },
    });

    if (existing) {
      if (existing.status === 'published') {
        throw new BadRequestError('Cannot edit a published minute');
      }
      return prisma.minute.update({
        where: { id: existing.id },
        data: {
          content: input.content,
          summary: input.summary,
          topicsDiscussed: input.topicsDiscussed ?? [],
        },
      });
    }

    return prisma.minute.create({
      data: {
        organizationId,
        meetingId,
        content: input.content,
        summary: input.summary,
        topicsDiscussed: input.topicsDiscussed ?? [],
        createdById: userId,
      },
    });
  }

  async publish(organizationId: string, meetingId: string): Promise<unknown> {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId },
      include: {
        participants: {
          include: { teamMember: true },
        },
      },
    });
    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    const minute = await prisma.minute.findUnique({
      where: { meetingId },
    });
    if (!minute) {
      throw new NotFoundError('Minute for meeting', meetingId);
    }
    if (minute.status === 'published') {
      throw new BadRequestError('Minute is already published');
    }

    const published = await prisma.minute.update({
      where: { id: minute.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
      include: {
        agreements: true,
      },
    });

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'completed' },
    });

    eventService.emit('minute.published', {
      minuteId: minute.id,
      meetingId,
      organizationId,
      participants: meeting.participants,
    });

    return published;
  }
}

export const minuteService = new MinuteService();
