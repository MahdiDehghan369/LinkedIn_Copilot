/**
 * Business logic depends on this abstraction, never on a concrete
 * provider directly — `ai.module.js` registers the concrete
 * implementation under the key `aiProvider`, so `AiService` only ever
 * sees this interface (architecture doc §13):
 *
 *   Business Logic → AIProvider → Concrete AI Provider → AI Model
 *
 * Every method resolves `{ data, tokensUsed, latencyMs, model }`, where
 * `data` is the *raw, not-yet-validated* parsed JSON from the model —
 * schema validation happens one layer up, in `AiService`, so every
 * concrete provider gets that safety net for free instead of
 * reimplementing it.
 */
export class AIProvider {
  /** @param {{ count: number, topicHint?: string, userContext: object }} input */
  async generateIdeas(input) {
    throw new Error('generateIdeas() must be implemented');
  }

  /** @param {{ topic: string, tone?: string, audience?: string, length?: string, userContext: object }} input */
  async generatePost(input) {
    throw new Error('generatePost() must be implemented');
  }

  /** @param {{ content: string }} input */
  async improvePost(input) {
    throw new Error('improvePost() must be implemented');
  }

  /** @param {{ samplePosts: string[] }} input */
  async analyzeWritingStyle(input) {
    throw new Error('analyzeWritingStyle() must be implemented');
  }

  /** @param {{ content: string }} input */
  async analyzeContent(input) {
    throw new Error('analyzeContent() must be implemented');
  }

  /** @param {{ commentText: string, tone?: string }} input */
  async generateReply(input) {
    throw new Error('generateReply() must be implemented');
  }
}
