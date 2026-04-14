import { z } from 'zod';
import { normalizeOptionalHttpUrl, normalizeOptionalLinkedinUrl } from '../utils/url.js';

const trimString = () => z.string().trim();

const optionalUrl = z.preprocess(normalizeOptionalHttpUrl, z.string().trim().url().or(z.literal('')).optional());
const optionalLinkedinUrl = z.preprocess(
  normalizeOptionalLinkedinUrl,
  z.string().trim().url().or(z.literal('')).optional(),
);

const resumeProjectSchema = z
  .object({
    name: trimString().max(120).optional(),
    description: trimString().max(800).optional(),
  })
  .strict();

const resumeCertificationSchema = z
  .object({
    name: trimString().max(120).optional(),
    institute: trimString().max(160).optional(),
  })
  .strict();

export const updateCandidateProfileSchema = z
  .object({
    fullName: trimString().min(2).max(120).optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer Not to Say']).optional(),
    address: trimString().min(5).max(500).optional(),
    pincode: z.string().regex(/^\d{6}$/).optional(),
    linkedinUrl: optionalLinkedinUrl,
    portfolioUrl: optionalUrl,
    highestQualification: trimString().min(2).max(100).optional(),
    experienceStatus: z.enum(['fresher', 'experienced']).optional(),
    experienceDetails: z
      .object({
        currentCompany: trimString().max(150).optional(),
        designation: trimString().max(100).optional(),
        totalExperience: trimString().max(50).optional(),
        industry: trimString().max(100).optional(),
        currentCtcLpa: z.number().nonnegative().optional(),
        expectedCtcLpa: z.number().nonnegative().optional(),
        minimumCtcLpa: z.number().nonnegative().optional(),
        noticePeriod: trimString().max(50).optional(),
        lastWorkingDay: z.coerce.date().optional(),
      })
      .strict()
      .optional(),
    preferences: z
      .object({
        preferredLocation: trimString().min(2).max(100).optional(),
        preferredIndustry: trimString().min(2).max(100).optional(),
        preferredRole: trimString().min(2).max(100).optional(),
        workModes: z.array(z.enum(['On-site', 'Hybrid', 'Remote'])).optional(),
      })
      .strict()
      .optional(),

    // Resume-specific fields (dashboard editor)
    summary: trimString().max(1200).optional(),
    skills: z.array(trimString().min(1).max(60)).max(60).optional(),
    projects: z.array(resumeProjectSchema).max(20).optional(),
    certifications: z.array(resumeCertificationSchema).max(20).optional(),
    referral: trimString().max(200).optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });
