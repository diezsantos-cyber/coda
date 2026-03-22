import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { CastVoteInput, UpdateVoteInput } from '../validators/vote';

interface VoteResponse {
  id: string;
  type: string;
  comment: string | null;
  userId: string;
  decisionId: string;
  optionId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  option: {
    id: string;
    title: string;
  };
}

interface VoteSummary {
  totalVotes: number;
  byOption: Array<{
    optionId: string;
    optionTitle: string;
    approveCount: number;
    rejectCount: number;
    abstainCount: number;
    totalCount: number;
  }>;
  byType: {
    approve: number;
    reject: number;
    abstain: number;
  };
}

export class VoteService {
  async castVote(
    organizationId: string,
    userId: string,
    decisionId: string,
    input: CastVoteInput,
  ): Promise<VoteResponse> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    if (decision.status !== 'OPEN') {
      throw new ForbiddenError('Voting is only allowed on open decisions');
    }

    const option = await prisma.option.findFirst({
      where: { id: input.optionId, decisionId },
    });

    if (!option) {
      throw new NotFoundError('Option', input.optionId);
    }

    const existingVote = await prisma.vote.findFirst({
      where: { userId, decisionId },
    });

    if (existingVote) {
      throw new ConflictError('You have already voted on this decision. Use PUT to update your vote.');
    }

    const stakeholder = await prisma.stakeholder.findFirst({
      where: { userId, decisionId },
    });

    if (!stakeholder) {
      throw new ForbiddenError('Only stakeholders can vote on this decision');
    }

    if (stakeholder.role === 'OBSERVER') {
      throw new ForbiddenError('Observers cannot vote');
    }

    const vote = await prisma.vote.create({
      data: {
        type: input.type,
        comment: input.comment,
        userId,
        decisionId,
        optionId: input.optionId,
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
        option: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return vote;
  }

  async updateVote(
    organizationId: string,
    userId: string,
    decisionId: string,
    voteId: string,
    input: UpdateVoteInput,
  ): Promise<VoteResponse> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    if (decision.status !== 'OPEN') {
      throw new ForbiddenError('Vote updates are only allowed on open decisions');
    }

    const vote = await prisma.vote.findFirst({
      where: { id: voteId, decisionId },
    });

    if (!vote) {
      throw new NotFoundError('Vote', voteId);
    }

    if (vote.userId !== userId) {
      throw new ForbiddenError('You can only update your own vote');
    }

    if (input.optionId) {
      const option = await prisma.option.findFirst({
        where: { id: input.optionId, decisionId },
      });
      if (!option) {
        throw new NotFoundError('Option', input.optionId);
      }
    }

    const updated = await prisma.vote.update({
      where: { id: voteId },
      data: {
        ...(input.type && { type: input.type }),
        ...(input.optionId && { optionId: input.optionId }),
        ...(input.comment !== undefined && { comment: input.comment }),
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
        option: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updated;
  }

  async getVotes(
    organizationId: string,
    decisionId: string,
  ): Promise<VoteResponse[]> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    const votes = await prisma.vote.findMany({
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
        option: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return votes;
  }

  async getVoteSummary(
    organizationId: string,
    decisionId: string,
  ): Promise<VoteSummary> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
      include: {
        options: { select: { id: true, title: true } },
      },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    const votes = await prisma.vote.findMany({
      where: { decisionId },
    });

    const byType = {
      approve: votes.filter((v) => v.type === 'APPROVE').length,
      reject: votes.filter((v) => v.type === 'REJECT').length,
      abstain: votes.filter((v) => v.type === 'ABSTAIN').length,
    };

    const byOption = decision.options.map((option) => {
      const optionVotes = votes.filter((v) => v.optionId === option.id);
      return {
        optionId: option.id,
        optionTitle: option.title,
        approveCount: optionVotes.filter((v) => v.type === 'APPROVE').length,
        rejectCount: optionVotes.filter((v) => v.type === 'REJECT').length,
        abstainCount: optionVotes.filter((v) => v.type === 'ABSTAIN').length,
        totalCount: optionVotes.length,
      };
    });

    return {
      totalVotes: votes.length,
      byOption,
      byType,
    };
  }

  async deleteVote(
    organizationId: string,
    userId: string,
    decisionId: string,
    voteId: string,
  ): Promise<void> {
    const decision = await prisma.decision.findFirst({
      where: { id: decisionId, organizationId },
    });

    if (!decision) {
      throw new NotFoundError('Decision', decisionId);
    }

    const vote = await prisma.vote.findFirst({
      where: { id: voteId, decisionId },
    });

    if (!vote) {
      throw new NotFoundError('Vote', voteId);
    }

    if (vote.userId !== userId) {
      throw new ForbiddenError('You can only delete your own vote');
    }

    await prisma.vote.delete({
      where: { id: voteId },
    });
  }
}

export const voteService = new VoteService();
