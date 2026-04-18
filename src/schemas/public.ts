import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  message: z.string().trim().min(1),
  newsletter: z.boolean().optional().default(false)
});
