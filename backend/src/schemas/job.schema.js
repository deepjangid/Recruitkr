import { z } from 'zod';

export const createJobSchema = z
  .object({
    jobTitle: z.string().trim().min(2).max(120),
    company: z.string().trim().min(1).max(180).optional(),
    openings: z.number().int().positive(),
    department: z.string().trim().min(2).max(100),
    category: z.string().trim().min(1).max(100).optional(),
    jobLocation: z.string().trim().min(2).max(100),
    employmentType: z.string().trim().min(2).max(50),
    experienceRequired: z.string().trim().min(1).max(80),
    qualification: z.string().trim().min(1).max(100).optional(),
    minCtcLpa: z.number().nonnegative(),
    maxCtcLpa: z.number().nonnegative(),
    fixedPrice: z.number().nonnegative().optional(),
    salaryCurrency: z.string().trim().min(1).max(10).optional(),
    preferredIndustryBackground: z.string().trim().max(120).optional(),
    genderPreference: z.string().trim().max(40).optional(),
    ageRequirement: z.string().trim().max(40).optional(),
    workModes: z.array(z.enum(['On-site', 'Hybrid', 'Remote'])).min(1),
    jobDescription: z.string().trim().min(10).max(5000),
    requirements: z.array(z.string().trim().min(1).max(300)).optional(),
    responsibilities: z.array(z.string().trim().min(1).max(300)).optional(),
    skills: z.array(z.string().trim().min(1).max(120)).optional(),
    urgencyLevel: z.string().trim().min(1).max(80),
    expectedJoiningDate: z.coerce.date().optional(),
    contactEmail: z.string().trim().email().max(320).optional(),
  })
  .strict();

export const updateJobStatusSchema = z
  .object({
    status: z.enum(['active', 'on-hold', 'closed']),
  })
  .strict();

export const updateJobSchema = createJobSchema.partial().strict();

export const listJobsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    location: z.string().trim().max(80).optional(),
    type: z.string().trim().max(50).optional(),
  })
   .strict();

