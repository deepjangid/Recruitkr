import { z } from 'zod';

export const applyJobSchema = z
  .object({
    jobId: z.string().length(24),
  })
  .strict();

export const updateApplicationStatusSchema = z
  .object({
    status: z.enum(['under-review', 'screening', 'interview', 'offer', 'hired', 'rejected']),
  })
  .strict();

