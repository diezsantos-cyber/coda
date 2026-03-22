import { z } from 'zod';

export const castVoteSchema = z.object({
  body: z.object({
    optionId: z.string().uuid('Invalid option ID'),
    type: z.enum(['APPROVE', 'REJECT', 'ABSTAIN']),
    comment: z.string().max(2000).optional(),
  }),
  params: z.object({
    decisionId: z.string().uuid(),
  }),
});

export const updateVoteSchema = z.object({
  body: z.object({
    optionId: z.string().uuid('Invalid option ID').optional(),
    type: z.enum(['APPROVE', 'REJECT', 'ABSTAIN']).optional(),
    comment: z.string().max(2000).optional(),
  }),
  params: z.object({
    decisionId: z.string().uuid(),
    voteId: z.string().uuid(),
  }),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>['body'];
export type UpdateVoteInput = z.infer<typeof updateVoteSchema>['body'];
