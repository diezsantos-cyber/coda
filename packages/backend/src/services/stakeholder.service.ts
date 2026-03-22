import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { AddStakeholderInput, UpdateStakeholderInput } from '../validators/stakeholder';

interface StakeholderResponse {
  id: string;
  role: string;
  userId: string;
  decisionId: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class StakeholderService {
  async addStakeholder(
    organizationId: string,
    userId: string,
    decisionId: string,
    input: AddStakeholderInput,
  ): Promise<StakeholderResponse> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    if (decision.createdById !== userId) {
      const stakeholder = await prisma.stakeholder.findFirst({
        where: { decisionId, userId, role: 'DECISION_MAKER' },
      });
      if (!stakeholder) {
        throw new ForbiddenError('Only the creator or decision makers can add stakeholders');
      }
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: input.userId, organizationId },
    });

    if (!targetUser) {
      throw new NotFoundError('User', input.userId);
    }

    const existing = await prisma.stakeholder.findFirst({
      where: { userId: input.userId, decisionId },
    });

    if (existing) {
      throw new ConflictError('User is already a stakeholder for this decision');
    }

    const stakeholder = await prisma.stakeholder.create({
      data: {
        userId: input.userId,
        decisionId,
        role: input.role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return stakeholder;
  }

  async getStakeholders(
    organizationId: string,
    decisionId: string,
  ): Promise<StakeholderResponse[]> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    const stakeholders = await prisma.stakeholder.findMany({
      where: { decisionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return stakeholders;
  }

  async updateStakeholder(
    organizationId: string,
    userId: string,
    decisionId: string,
    stakeholderId: string,
    input: UpdateStakeholderInput,
  ): Promise<StakeholderResponse> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    if (decision.createdById !== userId) {
      throw new ForbiddenError('Only the creator can update stakeholder roles');
    }

    const stakeholder = await prisma.stakeholder.findFirst({
      where: { id: stakeholderId, decisionId },
    });

    if (!stakeholder) {
      throw new NotFoundError('Stakeholder', stakeholderId);
    }

    const updated = await prisma.stakeholder.update({
      where: { id: stakeholderId },
      data: { role: input.role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  async removeStakeholder(
    organizationId: string,
    userId: string,
    decisionId: string,
    stakeholderId: string,
  ): Promise<void> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    if (decision.createdById !== userId) {
      throw new ForbiddenError('Only the creator can remove stakeholders');
    }

    const stakeholder = await prisma.stakeholder.findFirst({
      where: { id: stakeholderId, decisionId },
    });

    if (!stakeholder) {
      throw new NotFoundError('Stakeholder', stakeholderId);
    }

    if (stakeholder.userId === decision.createdById) {
      throw new ForbiddenError('Cannot remove the decision creator as a stakeholder');
    }

    await prisma.stakeholder.delete({
      where: { id: stakeholderId },
    });
  }
}

export const stakeholderService = new StakeholderService();
