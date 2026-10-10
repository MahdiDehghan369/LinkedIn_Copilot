import { z } from 'zod';

const postContentSchema = z.object({
  hook: z.string().trim().max(500).optional(),
  body: z.string().trim().max(5000).optional(),
  cta: z.string().trim().max(300).optional(),
  hashtags: z.array(z.string().trim().max(50)).max(20).optional(),
});

export const createPostSchema = z.object({
  content: postContentSchema.optional(),
  topicTags: z.array(z.string().trim().max(50)).max(20).optional(),
  originIdeaId: z.string().optional(),
  sourceGenerationId: z.string().optional(),
});

export const updatePostSchema = z
  .object({
    content: postContentSchema,
    topicTags: z.array(z.string().trim().max(50)).max(20),
  })
  .partial()
  .refine((data) => data.content || data.topicTags, { message: 'Nothing to update.' });

export const listPostsQuerySchema = z.object({
  status: z
    .enum(['DRAFT', 'GENERATED', 'EDITED', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED'])
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const schedulePostSchema = z.object({
  scheduledFor: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: 'scheduledFor must be in the future.',
  }),
});
