import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { parsePagination } from '../utils/helpers';
import { eventService } from './EventService';

interface CreateAgreementInput {
  title: string;
  description?: string;
  meetingId?: string;
  minuteId?: string;
  assignedToUserId?: string;
  assignedToMemberId?: string;
  dueDate?: string;
  priority?: string;
}

interface UpdateAgreementInput {
  title?: string;
  description?: string;
  status?: string;
  dueDate?: string | null;
  priority?: string;
  assignedToUserId?: string | null;
  assignedToMemberId?: string | null;
}

export class AgreementService {
  async list(organizationId: string, query: Record<string, unknown>): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page, limit, skip } = parsePagination(query);
    const status = query['status'] as string | undefined;
    const assignee = query['assignee'] as string | undefined;

    const where: Record<string, unknown> = { organizationId };
    if (status && status !== 'all') {
      where['status'] = status;
    }
    if (assignee) {
      where['OR'] = [
        { assignedToUserId: assignee },
        { assignedToMemberId: assignee },
      ];
    }

    const [agreements, total] = await Promise.all([
      prisma.agreement.findMany({
        where,
        include: {
          meeting: { select: { id: true, title: true } },
          assignedToUser: { select: { id: true, name: true, email: true } },
          assignedToMember: { select: { id: true, name: true, telegramUsername: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.agreement.count({ where }),
    ]);

    return {
      data: agreements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(organizationId: string, agreementId: string): Promise<unknown> {
    const agreement = await prisma.agreement.findFirst({
      where: { id: agreementId, organizationId },
      include: {
        meeting: { select: { id: true, title: true } },
        assignedToUser: { select: { id: true, name: true, email: true } },
        assignedToMember: { select: { id: true, name: true, telegramUsername: true } },
      },
    });
    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }
    return agreement;
  }

  async create(organizationId: string, input: CreateAgreementInput): Promise<unknown> {
    const agreement = await prisma.agreement.create({
      data: {
        organizationId,
        title: input.title,
        description: input.description,
        meetingId: input.meetingId,
        minuteId: input.minuteId,
        assignedToUserId: input.assignedToUserId,
        assignedToMemberId: input.assignedToMemberId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        priority: input.priority ?? 'medium',
      },
      include: {
        assignedToUser: { select: { id: true, name: true } },
        assignedToMember: { select: { id: true, name: true, telegramUsername: true } },
      },
    });

    eventService.emit('agreement.created', {
      agreementId: agreement.id,
      organizationId,
      assignedToMember: agreement.assignedToMember,
    });

    return agreement;
  }

  async update(organizationId: string, agreementId: string, input: UpdateAgreementInput): Promise<unknown> {
    const agreement = await prisma.agreement.findFirst({
      where: { id: agreementId, organizationId },
    });
    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    const updated = await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate ? new Date(input.dueDate) : null }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.assignedToUserId !== undefined && { assignedToUserId: input.assignedToUserId }),
        ...(input.assignedToMemberId !== undefined && { assignedToMemberId: input.assignedToMemberId }),
        ...(input.status === 'completed' && { completedAt: new Date() }),
      },
      include: {
        assignedToUser: { select: { id: true, name: true } },
        assignedToMember: { select: { id: true, name: true, telegramUsername: true } },
      },
    });

    eventService.emit('agreement.updated', {
      agreementId,
      organizationId,
      changes: input,
    });

    return updated;
  }

  async delete(organizationId: string, agreementId: string): Promise<void> {
    const agreement = await prisma.agreement.findFirst({
      where: { id: agreementId, organizationId },
    });
    if (!agreement) {
      throw new NotFoundError('Agreement', agreementId);
    }

    await prisma.agreement.delete({
      where: { id: agreementId },
    });
  }
}

export const agreementService = new AgreementService();
