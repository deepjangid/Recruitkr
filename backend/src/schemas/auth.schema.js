import { z } from 'zod';
import { normalizeOptionalHttpUrl, normalizeOptionalLinkedinUrl } from '../utils/url.js';

const email = z.string().email().toLowerCase().trim();
const mobile = z.string().trim().regex(/^\d{10}$/);
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must include a special character');

const optionalHttpUrl = z.preprocess(
  normalizeOptionalHttpUrl,
  z.string().url().optional().or(z.literal('')),
);

const optionalLinkedinUrl = z.preprocess(
  normalizeOptionalLinkedinUrl,
  z.string().url().optional().or(z.literal('')),
);

const generatedResumeDataSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    summary: z.string().trim().max(1200).optional().default(''),
    skills: z.array(z.string().trim().min(1).max(80)).max(50),
    education: z
      .array(
        z
          .object({
            degree: z.string().trim().max(120).optional().default(''),
            institution: z.string().trim().max(160).optional().default(''),
            year: z.string().trim().max(40).optional().default(''),
            description: z.string().trim().max(400).optional().default(''),
          })
          .strict(),
      )
      .max(20),
    experience: z
      .array(
        z
          .object({
            title: z.string().trim().max(120).optional().default(''),
            company: z.string().trim().max(160).optional().default(''),
            duration: z.string().trim().max(80).optional().default(''),
            description: z.string().trim().max(400).optional().default(''),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1),
    role: z.enum(['candidate', 'client', 'admin']),
  })
  .strict();

export const candidateRegisterSchema = z
  .object({
    email,
    mobile,
    password,
    fullName: z.string().trim().min(2).max(120),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer Not to Say']),
    address: z.string().trim().min(5).max(500),
    pincode: z.string().regex(/^\d{6}$/),
    linkedinUrl: optionalLinkedinUrl,
    portfolioUrl: optionalHttpUrl,
    highestQualification: z.string().trim().min(2).max(100),
    experienceStatus: z.enum(['fresher', 'experienced']),
    experienceDetails: z
      .object({
        currentCompany: z.string().trim().min(2).max(150).optional(),
        designation: z.string().trim().min(2).max(100).optional(),
        totalExperience: z.string().trim().min(1).max(50).optional(),
        industry: z.string().trim().min(2).max(100).optional(),
        currentCtcLpa: z.number().nonnegative().optional(),
        expectedCtcLpa: z.number().nonnegative().optional(),
        minimumCtcLpa: z.number().nonnegative().optional(),
        noticePeriod: z.string().trim().min(1).max(50).optional(),
        lastWorkingDay: z.coerce.date().optional(),
      })
      .optional(),
    preferences: z
      .object({
        preferredLocation: z.string().trim().min(2).max(100),
        preferredIndustry: z.string().trim().min(2).max(100),
        preferredRole: z.string().trim().min(2).max(100),
        workModes: z.array(z.enum(['On-site', 'Hybrid', 'Remote'])).min(1),
      })
      .strict(),
    declarationAccepted: z.literal(true),
    representationAuthorized: z.literal(true),
    resumeType: z.enum(['uploaded', 'generated']),
    resumeUrl: optionalHttpUrl.optional(),
    resumeFileId: z.string().trim().min(3).max(255).optional(),
    resumeFileName: z.string().trim().min(1).max(255).optional(),
    resumeData: generatedResumeDataSchema.optional(),
  })
  .refine(
    (payload) =>
      (payload.resumeType === 'uploaded' &&
        Boolean(payload.resumeUrl) &&
        Boolean(payload.resumeFileId) &&
        !payload.resumeData) ||
      (payload.resumeType === 'generated' &&
        Boolean(payload.resumeData) &&
        !payload.resumeUrl &&
        !payload.resumeFileId),
    {
      message: 'Send either resumeUrl + resumeFileId for uploaded resumes or resumeData for generated resumes',
      path: ['resumeType'],
    },
  )
  .strict();

export const clientRegisterSchema = z
  .object({
    email,
    mobile,
    password,
    companyName: z.string().trim().min(2).max(180),
    industry: z.string().trim().min(2).max(100),
    companyWebsite: optionalHttpUrl,
    companySize: z.string().trim().min(1).max(80),
    companyType: z.string().trim().min(1).max(80),
    spoc: z
      .object({
        name: z.string().trim().min(2).max(120),
        designation: z.string().trim().min(2).max(120),
        mobile,
        email,
      })
      .strict(),
    commercial: z
      .object({
        recruitmentModel: z.string().trim().min(1).max(80),
        replacementPeriod: z.string().trim().min(1).max(80),
        paymentTerms: z.string().trim().min(1).max(120),
      })
      .strict(),
    billing: z
      .object({
        billingCompanyName: z.string().trim().min(2).max(180),
        gstNumber: z.string().trim().toUpperCase().regex(/^[0-9A-Z]{15}$/),
        billingAddress: z.string().trim().min(5).max(500),
        billingEmail: email,
      })
      .strict(),
    declarationAccepted: z.literal(true),
  })
  .strict();

export const refreshSchema = z.object({ refreshToken: z.string().min(20).optional() }).strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string().min(6).optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: 'Confirm password must match new password',
      path: ['confirmPassword'],
    },
  )
  .strict();

export const resetPasswordParamsSchema = z
  .object({
    token: z.string().min(20),
  })
  .strict();
