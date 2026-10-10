import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unread: z.coerce.boolean().optional(),
});
