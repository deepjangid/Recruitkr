import { z } from 'zod';

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

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1),
    role: z.enum(['candidate', 'client']),
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
    linkedinUrl: z.url().optional().or(z.literal('')),
    portfolioUrl: z.url().optional().or(z.literal('')),
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
    resume: z
      .object({
        fileName: z.string().trim().min(1).max(180),
        mimeType: z.enum([
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]),
        dataBase64: z.string().min(20),
      })
      .optional(),
  })
  .strict();

export const clientRegisterSchema = z
  .object({
    email,
    mobile,
    password,
    companyName: z.string().trim().min(2).max(180),
    industry: z.string().trim().min(2).max(100),
    companyWebsite: z.url().optional().or(z.literal('')),
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
