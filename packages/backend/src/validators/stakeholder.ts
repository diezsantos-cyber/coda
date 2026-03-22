import { z } from 'zod';

export const addStakeholderSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['DECISION_MAKER', 'CONTRIBUTOR', 'REVIEWER', 'OBSERVER']),
  }),
  params: z.object({
    decisionId: z.string().uuid(),
  }),
});

export const updateStakeholderSchema = z.object({
  body: z.object({
    role: z.enum(['DECISION_MAKER', 'CONTRIBUTOR', 'REVIEWER', 'OBSERVER']),
  }),
  params: z.object({
    decisionId: z.string().uuid(),
    stakeholderId: z.string().uuid(),
  }),
});

export const removeStakeholderSchema = z.object({
  params: z.object({
    decisionId: z.string().uuid(),
    stakeholderId: z.string().uuid(),
  }),
});

export type AddStakeholderInput = z.infer<typeof addStakeholderSchema>['body'];
export type UpdateStakeholderInput = z.infer<typeof updateStakeholderSchema>['body'];
