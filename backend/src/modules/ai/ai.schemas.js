import { z } from 'zod';


export const generateIdeasRequestSchema = z.object({
  count: z.number().int().min(1).max(10).optional(),
  topicHint: z.string().trim().max(300).optional(),
});

export const generatePostRequestSchema = z.object({
  topic: z.string().trim().min(1, 'Topic is required.').max(300),
  tone: z.string().trim().max(50).optional(),
  audience: z.string().trim().max(200).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

export const improvePostRequestSchema = z.object({
  content: z.string().trim().min(1, 'Post content is required.').max(5000),
});

export const analyzeWritingStyleRequestSchema = z.object({
  samplePosts: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one sample post is required.')
    .max(20, 'No more than 20 sample posts at a time.'),
});


const postContentSchema = z.object({
  hook: z.string(),
  body: z.string(),
  cta: z.string(),
  hashtags: z.array(z.string()),
});

const ideaSchema = z.object({
  title: z.string(),
  hook: z.string(),
  coreIdea: z.string(),
  contentType: z.string(),
  audience: z.string(),
  suggestedCta: z.string(),
  suggestedHashtags: z.array(z.string()),
});

export const ideasOutputSchema = z.object({
  ideas: z.array(ideaSchema).min(1),
});

export const postOutputSchema = z.object({
  post: postContentSchema,
});

const scoreSet = z.object({
  hook: z.number(),
  readability: z.number(),
  technicalValue: z.number(),
  engagement: z.number(),
  cta: z.number(),
});

export const improveOutputSchema = z.object({
  scores: scoreSet,
  improved: postContentSchema,
});

export const writingStyleOutputSchema = z.object({
  profile: z.object({
    tone: z.string(),
    sentenceLength: z.string(),
    technicalDepth: z.string(),
    emojiUsage: z.string(),
    paragraphStyle: z.string(),
    hookStyle: z.string(),
    ctaStyle: z.string(),
  }),
});

export const contentAnalysisOutputSchema = z.object({
  scores: scoreSet,
  suggestions: z.array(z.string()),
});
