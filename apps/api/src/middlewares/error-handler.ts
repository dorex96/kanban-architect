import type { ErrorHandler } from 'hono';
import { HttpError } from '../lib/errors.js';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    const status = err.status as 400 | 401 | 403 | 404 | 409 | 500;
    return c.json({ error: err.message }, status);
  }
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
};
