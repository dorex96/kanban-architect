import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'ollama']).default('openai'),
  PORT: z.coerce.number().default(4000),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const config = envSchema.parse(process.env);
