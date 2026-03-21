import { z } from 'zod';

export const taskStatusEnum = z.enum(['INBOX', 'TODO', 'IN_PROGRESS', 'DONE']);
