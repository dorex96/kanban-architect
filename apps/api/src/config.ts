import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string(),
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'ollama']).default('openai'),
  PORT: z.coerce.number().default(4000),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-latest'),
  ENABLE_TASK_HEALTH_SCHEDULER: booleanFromEnv.default(false),
  TASK_HEALTH_SCHEDULER_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  TASK_DEADLINE_LOOKAHEAD_HOURS: z.coerce.number().positive().default(24),
  TASK_WORKLOAD_OPEN_THRESHOLD: z.coerce.number().int().positive().default(20),
  TASK_WORKLOAD_IN_PROGRESS_THRESHOLD: z.coerce.number().int().positive().default(8),
  TASK_HEALTH_DEDUPE_WINDOW_HOURS: z.coerce.number().positive().default(24),
});

export const config = envSchema.parse(process.env);
