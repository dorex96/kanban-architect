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
  TASK_HEALTH_SCHEDULER_INTERVAL_MIN: z.coerce.number().int().positive().default(60),
  TASK_DEADLINE_LOOKAHEAD_HOURS: z.coerce.number().positive().default(24),
  TASK_WORKLOAD_OPEN_THRESHOLD: z.coerce.number().int().positive().default(20),
  TASK_WORKLOAD_IN_PROGRESS_THRESHOLD: z.coerce.number().int().positive().default(8),
  TASK_HEALTH_DEDUPE_WINDOW_HOURS: z.coerce.number().positive().default(24),
  ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER: booleanFromEnv.default(false),
  WEEKLY_PROJECT_CHECK_CRON: z.string().default('0 9 * * 1'),
  WEEKLY_PROJECT_CHECK_TIMEZONE: z.string().default('Europe/Rome'),
  WEEKLY_PROJECT_CHECK_MAX_PROMPT_CHARS: z.coerce.number().int().positive().default(12000),
  WEEKLY_PROJECT_CHECK_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(900),
  WEEKLY_PROJECT_CHECK_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  WEEKLY_PROJECT_CHECK_RETRY_DELAY_MS: z.coerce.number().int().min(0).default(1000),
  WEEKLY_PROJECT_CHECK_RETRY_SECOND_DELAY_MS: z.coerce.number().int().min(0).default(3000),
  WEEKLY_PROJECT_CHECK_HISTORY_LIMIT: z.coerce.number().int().positive().default(20),
});

export const config = envSchema.parse(process.env);
