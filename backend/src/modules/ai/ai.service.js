import { AIResponseValidationError } from './ai.errors.js';
import {
  ideasOutputSchema,
  postOutputSchema,
  improveOutputSchema,
  writingStyleOutputSchema,
  contentAnalysisOutputSchema,
} from './ai.schemas.js';

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {unknown} data
 * @returns {unknown} the validated, parsed data
 */
function validateOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AIResponseValidationError();
  }
  return result.data;
}

/**
 * Sits between the controller and the `AIProvider` abstraction. Every
 * method: (1) builds whatever context is available today to personalize
 * the prompt, (2) calls the provider, (3) validates the shape of what
 * came back, (4) records an audit entry, (5) returns the validated
 * result — never the provider's raw output.
 *
 * Context is intentionally limited to the user's own profile/preferences
 * for now: the fuller context described in the architecture doc (recent
 * posts, content history, target audience derived from past performance)
 * depends on the `posts`/`content` modules, which land in Phase 4. Once
 * those exist, `#buildWriterContext` is the one place that needs to grow
 * to include them — nothing else in this module changes.
 */
export class AiService {
  /**
   * @param {import('./providers/AIProvider.js').AIProvider} aiProvider
   * @param {import('./ai-generation.repository.js').AiGenerationRepository} aiGenerationRepository
   * @param {import('./writing-style.repository.js').WritingStyleRepository} writingStyleRepository
   * @param {import('../users/users.repository.js').UserRepository} userRepository
   */
  constructor(aiProvider, aiGenerationRepository, writingStyleRepository, userRepository) {
    this.provider = aiProvider;
    this.generations = aiGenerationRepository;
    this.writingStyles = writingStyleRepository;
    this.users = userRepository;
  }

  /**
   * @param {string} userId
   * @param {{ count?: number, topicHint?: string }} input
   */
  async generateIdeas(userId, { count = 5, topicHint } = {}) {
    const userContext = await this.#buildWriterContext(userId);
    const { data, ...meta } = await this.provider.generateIdeas({ count, topicHint, userContext });
    const result = validateOrThrow(ideasOutputSchema, data);
    await this.#recordGeneration(userId, 'idea', { count, topicHint }, result, meta);
    return result;
  }

  /**
   * @param {string} userId
   * @param {{ topic: string, tone?: string, audience?: string, length?: string }} input
   */
  async generatePost(userId, input) {
    const userContext = await this.#buildWriterContext(userId);
    const { data, ...meta } = await this.provider.generatePost({ ...input, userContext });
    const result = validateOrThrow(postOutputSchema, data);
    await this.#recordGeneration(userId, 'post', input, result, meta);
    return result;
  }

  /**
   * @param {string} userId
   * @param {{ content: string }} input
   */
  async improvePost(userId, { content }) {
    const { data, ...meta } = await this.provider.improvePost({ content });
    const result = validateOrThrow(improveOutputSchema, data);
    await this.#recordGeneration(userId, 'improve', { contentLength: content.length }, result, meta);
    return result;
  }

  /**
   * @param {string} userId
   * @param {{ samplePosts: string[] }} input
   */
  async analyzeWritingStyle(userId, { samplePosts }) {
    const { data, ...meta } = await this.provider.analyzeWritingStyle({ samplePosts });
    const result = validateOrThrow(writingStyleOutputSchema, data);
    await this.writingStyles.upsertProfile(userId, result.profile);
    await this.#recordGeneration(userId, 'writing_style', { sampleCount: samplePosts.length }, result, meta);
    return result;
  }

  /**
   * Called by the `analytics` module (architecture doc §32/§C: `analytics
   * → ai (ask for narrative insight)`), not exposed as its own `/api/ai`
   * route — the performance context that makes this useful (a post's
   * engagement rate vs. the user's average) only exists inside
   * `analytics`, so that module is the natural caller.
   * @param {string} userId
   * @param {{ content: string, performance: { engagementRate: number, averageEngagementRate: number, deltaPercent: number } }} input
   */
  async analyzePerformance(userId, { content, performance }) {
    const { data, ...meta } = await this.provider.analyzeContent({ content, performance });
    const result = validateOrThrow(contentAnalysisOutputSchema, data);
    await this.#recordGeneration(userId, 'analyze', { hasPerformanceContext: true }, result, meta);
    return result;
  }

  /** @param {string} userId */
  async #buildWriterContext(userId) {
    const user = await this.users.findById(userId);
    return {
      tone: user?.preferences?.tone || undefined,
      audience: user?.preferences?.audience || undefined,
      language: user?.preferences?.language || undefined,
      emojiUsage: user?.preferences?.emojiUsage || undefined,
    };
  }

  /**
   * @param {string} userId
   * @param {'idea'|'post'|'improve'|'writing_style'} kind
   * @param {unknown} inputSummary
   * @param {unknown} output
   * @param {{ model?: string, tokensUsed?: number, latencyMs?: number }} meta
   */
  async #recordGeneration(userId, kind, inputSummary, output, meta) {
    await this.generations.create({ userId, kind, inputSummary, output, ...meta });
  }
}
