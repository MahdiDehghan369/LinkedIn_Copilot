import { z } from 'zod';

export const saveIdeaSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(300),
  hook: z.string().trim().max(500).optional(),
  coreIdea: z.string().trim().max(1000).optional(),
  contentType: z.string().trim().max(50).optional(),
  audience: z.string().trim().max(200).optional(),
  suggestedCta: z.string().trim().max(300).optional(),
  suggestedHashtags: z.array(z.string().trim().max(50)).max(20).optional(),
});

export const listIdeasQuerySchema = z.object({
  status: z.enum(['proposed', 'used', 'dismissed']).optional(),
});

export const updateIdeaStatusSchema = z.object({
  status: z.enum(['used', 'dismissed']),
});

const calendarSlotSchema = z.object({
  dayOfWeek: z.string(),
  time: z.string().optional(),
  topicTag: z.string().optional(),
  postId: z.string().optional(),
});

export const upsertCalendarSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be an ISO date (YYYY-MM-DD).'),
  slots: z.array(calendarSlotSchema).max(14).optional(),
  preferences: z
    .object({
      postsPerWeek: z.number().int().min(0).max(21).optional(),
      preferredDays: z.array(z.string()).optional(),
      preferredTime: z.string().optional(),
    })
    .optional(),
});

export const getCalendarQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week must be an ISO date (YYYY-MM-DD).'),
});
