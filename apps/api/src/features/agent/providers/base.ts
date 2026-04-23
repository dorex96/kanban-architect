import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV1 } from 'ai';
import { config } from '../../../config.js';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function getModel(): LanguageModelV1 {
  switch (config.LLM_PROVIDER) {
    case 'openai':
      if (!config.OPENAI_API_KEY) {
        throw new ConfigurationError('OPENAI_API_KEY is not set. Add it to your .env file to use the OpenAI provider.');
      }
      return createOpenAI({ apiKey: config.OPENAI_API_KEY })('gpt-4o');
    case 'anthropic':
      if (!config.ANTHROPIC_API_KEY) {
        throw new ConfigurationError(
          'ANTHROPIC_API_KEY is not set. Add it to your .env file to use the Anthropic provider.',
        );
      }
      return createAnthropic({ apiKey: config.ANTHROPIC_API_KEY })(config.ANTHROPIC_MODEL);
    case 'ollama':
      return createOpenAI({
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'ollama',
      })('llama3');
  }
}
