import { AIProvider } from './AIProvider.js';
import { AIProviderError, AIResponseValidationError } from '../ai.errors.js';
import { config } from '../../../infrastructure/config/env.js';

const CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Every prompt instructs the model to return ONLY a JSON object matching
 * a described shape, and every request uses `response_format: {type:
 * 'json_object'}` so the model is constrained to emit valid JSON.
 * `AiService` still schema-validates the parsed result — this provider
 * only guarantees "the model tried to return JSON", not "the JSON has
 * the fields we asked for".
 */
export class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = config.ai.apiKey;
    this.model = config.ai.model;
  }

  /** @param {{ count: number, topicHint?: string, userContext: object }} input */
  generateIdeas({ count, topicHint, userContext }) {
    const system =
      'You are a LinkedIn content strategist. Respond with ONLY a JSON object, no prose, matching exactly: ' +
      '{"ideas":[{"title":"","hook":"","coreIdea":"","contentType":"","audience":"","suggestedCta":"","suggestedHashtags":["..."]}]}';
    const user = [
      `Generate ${count} distinct LinkedIn post ideas${topicHint ? ` related to: ${topicHint}` : ' for this writer'}.`,
      `Writer context: ${JSON.stringify(userContext)}`,
    ].join('\n');
    return this.#complete(system, user);
  }

  /** @param {{ topic: string, tone?: string, audience?: string, length?: string, userContext: object }} input */
  generatePost({ topic, tone, audience, length, userContext }) {
    const system =
      'You are a LinkedIn ghostwriter. Respond with ONLY a JSON object, no prose, matching exactly: ' +
      '{"post":{"hook":"","body":"","cta":"","hashtags":["..."]}}';
    const user = [
      `Write a LinkedIn post on this topic: ${topic}`,
      `Tone: ${tone ?? "match the writer's usual tone"}`,
      `Audience: ${audience ?? 'general professional audience'}`,
      `Length: ${length ?? 'medium'}`,
      `Writer context: ${JSON.stringify(userContext)}`,
    ].join('\n');
    return this.#complete(system, user);
  }

  /** @param {{ content: string }} input */
  improvePost({ content }) {
    const system =
      'You are a LinkedIn editor. Respond with ONLY a JSON object, no prose, matching exactly: ' +
      '{"scores":{"hook":0,"readability":0,"technicalValue":0,"engagement":0,"cta":0},' +
      '"improved":{"hook":"","body":"","cta":"","hashtags":["..."]}} ' +
      '(each score is 0-10)';
    const user = `Score this LinkedIn post and provide an improved version:\n\n${content}`;
    return this.#complete(system, user);
  }

  /** @param {{ samplePosts: string[] }} input */
  analyzeWritingStyle({ samplePosts }) {
    const system =
      'You are a writing style analyst. Respond with ONLY a JSON object, no prose, matching exactly: ' +
      '{"profile":{"tone":"","sentenceLength":"","technicalDepth":"","emojiUsage":"","paragraphStyle":"","hookStyle":"","ctaStyle":""}}';
    const user = `Analyze the writing style shared across these LinkedIn posts:\n\n${samplePosts
      .map((post, index) => `Post ${index + 1}:\n${post}`)
      .join('\n\n')}`;
    return this.#complete(system, user);
  }

  /** @param {{ content: string, performance?: { engagementRate: number, averageEngagementRate: number, deltaPercent: number } }} input */
  analyzeContent({ content, performance }) {
    const system =
      'You are a LinkedIn content analyst. Respond with ONLY a JSON object, no prose, matching exactly: ' +
      '{"scores":{"hook":0,"readability":0,"technicalValue":0,"engagement":0,"cta":0},"suggestions":["..."]} ' +
      '(each score is 0-10)';
    const performanceLine = performance
      ? `\nThis post's engagement rate was ${performance.engagementRate}, versus the writer's average of ` +
        `${performance.averageEngagementRate} (${performance.deltaPercent >= 0 ? '+' : ''}${performance.deltaPercent}%). ` +
        'Take this into account: if it under- or over-performed, say so and suggest concrete, specific reasons ' +
        'grounded in the actual text (opening line, structure, specificity, CTA), not generic advice.'
      : '';
    const user = `Analyze this LinkedIn post:\n\n${content}${performanceLine}`;
    return this.#complete(system, user);
  }

  /** @param {{ commentText: string, tone?: string }} input */
  generateReply({ commentText, tone }) {
    const system =
      'You are helping a LinkedIn user reply to a comment on their post. Respond with ONLY a JSON object, ' +
      'no prose, matching exactly: {"replies":["...", "...", "..."]} (2-3 short reply options)';
    const user = `Comment: ${commentText}\nDesired tone: ${tone ?? 'friendly and professional'}`;
    return this.#complete(system, user);
  }

  /**
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @returns {Promise<{ data: unknown, tokensUsed: number|undefined, latencyMs: number, model: string|undefined }>}
   */
  async #complete(systemPrompt, userPrompt) {
    if (!this.apiKey) {
      throw new AIProviderError('AI generation is not configured (missing AI_API_KEY).');
    }

    const startedAt = Date.now();
    let response;
    try {
      response = await fetch(CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });
    } catch {
      throw new AIProviderError('Could not reach the AI provider.');
    }

    const latencyMs = Date.now() - startedAt;
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AIProviderError(payload?.error?.message);
    }

    const rawContent = payload.choices?.[0]?.message?.content;
    let data;
    try {
      data = JSON.parse(rawContent);
    } catch {
      throw new AIResponseValidationError('The AI did not return valid JSON.');
    }

    return { data, tokensUsed: payload.usage?.total_tokens, latencyMs, model: payload.model };
  }
}
