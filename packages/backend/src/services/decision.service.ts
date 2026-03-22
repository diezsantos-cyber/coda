import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { PaginatedResponse } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { parsePagination, paginatedResponse } from '../utils/helpers';
import { CreateDecisionInput, UpdateDecisionInput, ListDecisionsQuery } from '../validators/decision';

interface DecisionResponse {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  deadline: Date | null;
  selectedOptionId: string | null;
  tags: string[];
  createdById: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  options: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;
  _count: {
    stakeholders: number;
    votes: number;
    comments: number;
  };
}

const decisionInclude = {
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  options: {
    select: {
      id: true,
      title: true,
      description: true,
    },
  },
  _count: {
    select: {
      stakeholders: true,
      votes: true,
      comments: true,
    },
  },
} satisfies Prisma.DecisionInclude;

export class DecisionService {
  async create(
    organizationId: string,
    userId: string,
    input: CreateDecisionInput,
  ): Promise<DecisionResponse> {
    const decision = await prisma.decision.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        deadline: input.deadline ? new Date(input.deadline) : undefined,
        tags: input.tags ?? [],
        createdById: userId,
        organizationId,
        options: input.options
          ? {
              create: input.options.map((opt) => ({
                title: opt.title,
                description: opt.description,
              })),
            }
          : undefined,
        stakeholders: {
          create: {
            userId,
            role: 'DECISION_MAKER',
          },
        },
      },
      include: decisionInclude,
    });

    return decision;
  }

  async list(
    organizationId: string,
    query: ListDecisionsQuery,
  ): Promise<PaginatedResponse<DecisionResponse>> {
    const pagination = parsePagination(query as Record<string, unknown>);

    const where: Prisma.DecisionWhereInput = {
      organizationId,
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const orderBy: Prisma.DecisionOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    };

    const [decisions, total] = await Promise.all([
      prisma.decision.findMany({
        where,
        include: decisionInclude,
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.decision.count({ where }),
    ]);

    return paginatedResponse(decisions, total, pagination);
  }

  async getById(
    organizationId: string,
    decisionId: string,
  ): Promise<DecisionResponse> {
    const decision = await prisma.decision.findFirst({
      where: {
        id: decisionId,
        organizationId,
      },
      include: decisionInclude,
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    return decision;
  }

  async update(
    organizationId: string,
    userId: string,
    decisionId: string,
    input: UpdateDecisionInput,
  ): Promise<DecisionResponse> {
    const existing = await prisma.decision.findFirst({
      where: {
        id: decisionId,
        organizationId,
      },
      include: {
        stakeholders: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Decision', decisionId);
    }

    const isCreator = existing.createdById === userId;
    const isDecisionMaker = existing.stakeholders.some(
      (s) => s.userId === userId && s.role === 'DECISION_MAKER',
    );

    if (!isCreator && !isDecisionMaker) {
      throw new ForbiddenError('Only the creator or decision makers can update this decision');
    }

    const decision = await prisma.decision.update({
      where: { id: decisionId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category && { category: input.category }),
        ...(input.status && { status: input.status }),
        ...(input.deadline !== undefined && {
          deadline: input.deadline ? new Date(input.deadline) : null,
        }),
        ...(input.selectedOptionId !== undefined && {
          selectedOptionId: input.selectedOptionId,
        }),
        ...(input.tags && { tags: input.tags }),
      },
      include: decisionInclude,
    });

    return decision;
  }

  async delete(
    organizationId: string,
    userId: string,
    decisionId: string,
  ): Promise<void> {
    const existing = await prisma.decision.findFirst({
      where: {
        id: decisionId,
        organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Decision', decisionId);
    }

    if (existing.createdById !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
        throw new ForbiddenError('Only the creator, owners, or admins can delete decisions');
      }
    }

    await prisma.decision.delete({
      where: { id: decisionId },
    });
  }
}

export const decisionService = new DecisionService();
