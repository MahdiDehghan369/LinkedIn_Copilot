export class AiGenerationRepository {
  /** @param {import('mongoose').Model} aiGenerationModel */
  constructor(aiGenerationModel) {
    this.model = aiGenerationModel;
  }

  /**
   * @param {{ userId: string, kind: string, inputSummary?: unknown, output: unknown, model?: string, tokensUsed?: number, latencyMs?: number }} data
   * @returns {Promise<import('mongoose').Document>}
   */
  async create(data) {
    return this.model.create(data);
  }
}
