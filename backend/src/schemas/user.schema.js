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
    profilePhotoUrl: optionalUrl,
    profilePhotoFileId: trimString().min(3).max(255).optional(),
    resumeType: z.enum(['uploaded', 'generated']).optional(),
    resumeUrl: optionalUrl,
    resumeFileId: trimString().min(3).max(255).optional(),
    resumeFileName: trimString().min(1).max(255).optional(),
    resumeData: z
      .object({
        name: trimString().min(2).max(120),
        summary: trimString().max(1200).optional(),
        skills: z.array(trimString().min(1).max(80)).max(50),
        education: z
          .array(
            z
              .object({
                degree: trimString().max(120).optional(),
                institution: trimString().max(160).optional(),
                year: trimString().max(40).optional(),
                description: trimString().max(400).optional(),
              })
              .strict(),
          )
          .max(20)
          .optional(),
        experience: z
          .array(
            z
              .object({
                title: trimString().max(120).optional(),
                company: trimString().max(160).optional(),
                duration: trimString().max(80).optional(),
                description: trimString().max(400).optional(),
              })
              .strict(),
          )
          .max(20)
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine(
    (payload) => {
      if (!payload.resumeType) return true;
      if (payload.resumeType === 'uploaded') {
        return Boolean(payload.resumeUrl) && Boolean(payload.resumeFileId) && !payload.resumeData;
      }

      return Boolean(payload.resumeData) && !payload.resumeUrl && !payload.resumeFileId;
    },
    {
      message: 'Send either resumeUrl + resumeFileId for uploaded resumes or resumeData for generated resumes',
      path: ['resumeType'],
    },
  )
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });
