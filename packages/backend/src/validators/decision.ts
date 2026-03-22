import { z } from 'zod';

export const createDecisionSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(500),
    description: z.string().max(5000).optional(),
    category: z.enum([
      'STRATEGIC',
      'OPERATIONAL',
      'TACTICAL',
      'TECHNICAL',
      'FINANCIAL',
      'HR',
      'OTHER',
    ]),
    deadline: z.string().datetime().optional(),
    options: z
      .array(
        z.object({
          title: z.string().min(1).max(300),
          description: z.string().max(2000).optional(),
        }),
      )
      .min(2, 'At least 2 options are required')
      .max(20, 'Maximum 20 options allowed')
      .optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  }),
});

export const updateDecisionSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(500).optional(),
    description: z.string().max(5000).optional(),
    category: z
      .enum([
        'STRATEGIC',
        'OPERATIONAL',
        'TACTICAL',
        'TECHNICAL',
        'FINANCIAL',
        'HR',
        'OTHER',
      ])
      .optional(),
    status: z.enum(['DRAFT', 'OPEN', 'IN_REVIEW', 'DECIDED', 'ARCHIVED']).optional(),
    deadline: z.string().datetime().nullable().optional(),
    selectedOptionId: z.string().uuid().nullable().optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  }),
  params: z.object({
    decisionId: z.string().uuid(),
  }),
});

export const listDecisionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z
      .enum(['DRAFT', 'OPEN', 'IN_REVIEW', 'DECIDED', 'ARCHIVED'])
      .optional(),
    category: z
      .enum([
        'STRATEGIC',
        'OPERATIONAL',
        'TACTICAL',
        'TECHNICAL',
        'FINANCIAL',
        'HR',
        'OTHER',
      ])
      .optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'deadline', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const decisionIdParamSchema = z.object({
  params: z.object({
    decisionId: z.string().uuid(),
  }),
});

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>['body'];
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>['body'];
export type ListDecisionsQuery = z.infer<typeof listDecisionsSchema>['query'];
