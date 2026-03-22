import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional(),
    settings: z
      .object({
        defaultDecisionDeadlineDays: z.number().int().min(1).max(365).optional(),
        requireMinimumVoters: z.number().int().min(1).max(100).optional(),
        allowAnonymousVoting: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
  }),
  params: z.object({
    memberId: z.string().uuid(),
  }),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>['body'];
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>['body'];
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>['body'];
