import { AiGenerationModel } from './ai-generation.model.js';
import { AiGenerationRepository } from './ai-generation.repository.js';
import { WritingStyleModel } from './writing-style.model.js';
import { WritingStyleRepository } from './writing-style.repository.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';
import {
  generateIdeasRequestSchema,
  generatePostRequestSchema,
  improvePostRequestSchema,
  analyzeWritingStyleRequestSchema,
} from './ai.schemas.js';

/**
 * `aiProvider` is registered under that generic key, bound to the
 * concrete `OpenAIProvider` — swapping providers later (architecture doc
 * §14) means adding a new class and changing this one line, never
 * touching `AiService` or anything downstream of it.
 *
 * `aiService` depends on `userRepository` (from the `users` module) for
 * writer-context personalization — the same cross-module DI pattern used
 * by `auth`.
 *
 * @type {Array<object>}
 */
export const aiModuleConfigs = [
  { key: 'aiGenerationModel', type: 'model', Class: AiGenerationModel, dependencies: [] },
  {
    key: 'aiGenerationRepository',
    type: 'repository',
    Class: AiGenerationRepository,
    dependencies: ['aiGenerationModel'],
  },
  { key: 'writingStyleModel', type: 'model', Class: WritingStyleModel, dependencies: [] },
  {
    key: 'writingStyleRepository',
    type: 'repository',
    Class: WritingStyleRepository,
    dependencies: ['writingStyleModel'],
  },
  { key: 'aiProvider', type: 'service', Class: OpenAIProvider, dependencies: [] },
  {
    key: 'aiService',
    type: 'service',
    Class: AiService,
    dependencies: ['aiProvider', 'aiGenerationRepository', 'writingStyleRepository', 'userRepository'],
  },
  { key: 'aiController', type: 'controller', Class: AiController, dependencies: ['aiService'] },
  { key: 'generateIdeasRequestSchema', type: 'schema', schema: generateIdeasRequestSchema },
  { key: 'generatePostRequestSchema', type: 'schema', schema: generatePostRequestSchema },
  { key: 'improvePostRequestSchema', type: 'schema', schema: improvePostRequestSchema },
  { key: 'analyzeWritingStyleRequestSchema', type: 'schema', schema: analyzeWritingStyleRequestSchema },
];

/** @type {{ configs: { prefix: string, controller: string }, routes: Array<object> }} */
export const aiRoutes = {
  configs: { prefix: '/api/ai', controller: 'aiController' },
  routes: [
    {
      url: '/ideas',
      httpMethod: 'post',
      methodName: 'ideas',
      middlewares: [
        { name: 'requireAuth' },
        { name: 'validate', args: ['generateIdeasRequestSchema', 'body'] },
      ],
    },
    {
      url: '/posts/generate',
      httpMethod: 'post',
      methodName: 'generatePost',
      middlewares: [
        { name: 'requireAuth' },
        { name: 'validate', args: ['generatePostRequestSchema', 'body'] },
      ],
    },
    {
      url: '/posts/improve',
      httpMethod: 'post',
      methodName: 'improvePost',
      middlewares: [
        { name: 'requireAuth' },
        { name: 'validate', args: ['improvePostRequestSchema', 'body'] },
      ],
    },
    {
      url: '/analyze',
      httpMethod: 'post',
      methodName: 'analyze',
      middlewares: [
        { name: 'requireAuth' },
        { name: 'validate', args: ['analyzeWritingStyleRequestSchema', 'body'] },
      ],
    },
  ],
};
