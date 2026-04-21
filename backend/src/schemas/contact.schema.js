import { z } from 'zod';

export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().toLowerCase().trim(),
    mobile: z
      .string()
      .trim()
      .regex(/^\d{10}$/)
      .optional()
      .or(z.literal('')),
    message: z.string().trim().min(10).max(3000),
  })
  .strict();

export const contactStatusSchema = z
  .object({
    status: z.enum(['unread', 'read']),
  })
  .strict();
