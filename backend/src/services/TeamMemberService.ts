import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

export class TeamMemberService {
  async list(organizationId: string): Promise<Array<{ id: string; telegramId: string; telegramUsername: string | null; name: string | null; email: string | null; isActive: boolean; createdAt: Date }>> {
    return prisma.teamMember.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, input: { telegramId: string; telegramUsername?: string; name?: string; email?: string }): Promise<{ id: string; telegramId: string; telegramUsername: string | null; name: string | null; email: string | null }> {
    const existing = await prisma.teamMember.findFirst({
      where: { organizationId, telegramId: input.telegramId },
    });
    if (existing) {
      throw new ConflictError('Team member with this Telegram ID already exists');
    }

    return prisma.teamMember.create({
      data: {
        organizationId,
        telegramId: input.telegramId,
        telegramUsername: input.telegramUsername,
        name: input.name,
        email: input.email,
      },
      select: { id: true, telegramId: true, telegramUsername: true, name: true, email: true },
    });
  }

  async update(organizationId: string, memberId: string, input: { telegramUsername?: string; name?: string; email?: string }): Promise<{ id: string; telegramId: string; telegramUsername: string | null; name: string | null; email: string | null }> {
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) {
      throw new NotFoundError('Team member', memberId);
    }

    return prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(input.telegramUsername !== undefined && { telegramUsername: input.telegramUsername }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
      },
      select: { id: true, telegramId: true, telegramUsername: true, name: true, email: true },
    });
  }

  async remove(organizationId: string, memberId: string): Promise<void> {
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) {
      throw new NotFoundError('Team member', memberId);
    }

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });
  }
}

export const teamMemberService = new TeamMemberService();
