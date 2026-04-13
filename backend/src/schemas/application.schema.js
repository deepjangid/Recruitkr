import { z } from 'zod';

export const applicationStatusEnum = z.enum([
  'under-review',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
]);

const optionalTrimmedString = (max) => z.string().trim().max(max).optional();

const interviewDetailsSchema = z
  .object({
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    timezone: optionalTrimmedString(100),
    mode: z.enum(['onsite', 'google-meet', 'phone', 'video', 'other']).optional(),
    locationText: optionalTrimmedString(300),
    googleMapsUrl: z.string().trim().url().max(1000).optional(),
    meetingLink: z.string().trim().url().max(1000).optional(),
    contactPerson: optionalTrimmedString(120),
    contactEmail: z.string().trim().email().max(320).optional(),
    contactPhone: optionalTrimmedString(30),
    notes: optionalTrimmedString(1000),
  })
  .strict()
  .optional();

export const applyJobSchema = z
  .object({
    jobId: z.string().length(24),
  })
  .strict();

export const updateApplicationStatusSchema = z
  .object({
    status: applicationStatusEnum,
    note: optionalTrimmedString(1000),
    interviewDetails: interviewDetailsSchema,
  })
  .strict();

