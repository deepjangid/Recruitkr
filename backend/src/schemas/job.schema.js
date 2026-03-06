import { z } from 'zod';

export const createJobSchema = z
  .object({
    jobTitle: z.string().trim().min(2).max(120),
    openings: z.number().int().positive(),
    department: z.string().trim().min(2).max(100),
    jobLocation: z.string().trim().min(2).max(100),
    employmentType: z.string().trim().min(2).max(50),
    experienceRequired: z.string().trim().min(1).max(80),
    minCtcLpa: z.number().nonnegative(),
    maxCtcLpa: z.number().nonnegative(),
    preferredIndustryBackground: z.string().trim().max(120).optional(),
    genderPreference: z.string().trim().max(40).optional(),
    workModes: z.array(z.enum(['On-site', 'Hybrid', 'Remote'])).min(1),
    jobDescription: z.string().trim().min(10).max(5000),
    urgencyLevel: z.string().trim().min(1).max(80),
    expectedJoiningDate: z.coerce.date().optional(),
  })
  .strict();

export const updateJobStatusSchema = z
  .object({
    status: z.enum(['active', 'on-hold', 'closed']),
  })
  .strict();

export const listJobsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    location: z.string().trim().max(80).optional(),
    type: z.string().trim().max(50).optional(),
  })
  .strict();

