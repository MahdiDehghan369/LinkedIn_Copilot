import { z } from 'zod';

const preferencesSchema = z
  .object({
    language: z.string().trim().max(50),
    tone: z.string().trim().max(50),
    audience: z.string().trim().max(200),
    postingFrequency: z.string().trim().max(50),
    emojiUsage: z.enum(['none', 'minimal', 'moderate', 'heavy']),
  })
  .partial();

const aiSettingsSchema = z
  .object({
    model: z.string().trim().max(50),
    creativity: z.enum(['low', 'medium', 'high']),
  })
  .partial();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty.').max(100),
    preferences: preferencesSchema,
    aiSettings: aiSettingsSchema,
  })
  .partial()
  .strict();
