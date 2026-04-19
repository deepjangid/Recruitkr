import { z } from 'zod';

const normalizeStatusValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'reviewing' || normalized === 'reviewed') return 'under-review';
  if (normalized === 'shortlisted' || normalized === 'screening') return 'screening';
  if (normalized === 'offered') return 'offer';
  return normalized;
};

const normalizeInterviewModeValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'google meet' || normalized === 'gmeet' || normalized === 'meet') {
    return 'google-meet';
  }
  if (normalized === 'video call' || normalized === 'video') return 'video';
  if (normalized === 'phone call' || normalized === 'phone') return 'phone';
  if (normalized === 'on-site' || normalized === 'onsite') return 'onsite';
  if (normalized === 'zoom') return 'zoom';
  if (normalized === 'other') return 'other';
  return normalized;
};

export const applicationStatusEnum = z.preprocess(
  normalizeStatusValue,
  z.enum(['under-review', 'screening', 'interview', 'offer', 'hired', 'rejected']),
);

const optionalTrimmedString = (max) => z.string().trim().max(max).optional();

const interviewDetailsSchema = z
  .object({
    scheduledAt: optionalTrimmedString(100),
    timezone: optionalTrimmedString(100),
    mode: z.preprocess(
      normalizeInterviewModeValue,
      z.enum(['onsite', 'google-meet', 'phone', 'video', 'zoom', 'other']).optional(),
    ),
    locationText: optionalTrimmedString(300),
    googleMapsUrl: optionalTrimmedString(1000),
    meetingLink: optionalTrimmedString(1000),
    contactPerson: optionalTrimmedString(120),
    contactEmail: z.string().trim().email().max(320).optional(),
    contactPhone: optionalTrimmedString(30),
    notes: optionalTrimmedString(1000),
    reportingNotes: optionalTrimmedString(1000),
    documentsRequired: optionalTrimmedString(1000),
    additionalInstructions: optionalTrimmedString(1000),
  })
  .passthrough()
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
    candidateResponse: optionalTrimmedString(1000),
    clientNote: optionalTrimmedString(1000),
    interviewDate: optionalTrimmedString(50),
    interviewTime: optionalTrimmedString(50),
    interviewMode: optionalTrimmedString(50),
    interviewLocation: optionalTrimmedString(300),
    googleMapLocation: optionalTrimmedString(1000),
    contactPerson: optionalTrimmedString(120),
    contactEmail: z.string().trim().email().max(320).optional(),
    contactPhone: optionalTrimmedString(30),
    reportingNotes: optionalTrimmedString(1000),
    documentsRequired: optionalTrimmedString(1000),
    additionalInstructions: optionalTrimmedString(1000),
  })
  .passthrough();

