import mongoose from 'mongoose';

const educationEntrySchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, default: '' },
    institution: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const experienceEntrySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    resumeType: { type: String, enum: ['uploaded', 'generated'], required: true },
    resumeUrl: { type: String, trim: true, default: '' },
    resumeFileId: { type: String, trim: true, default: '' },
    resumeFileName: { type: String, trim: true, default: '' },
    resumeData: {
      name: { type: String, trim: true, default: '' },
      summary: { type: String, trim: true, default: '' },
      skills: { type: [String], default: [] },
      education: { type: [educationEntrySchema], default: [] },
      experience: { type: [experienceEntrySchema], default: [] },
    },
  },
  { timestamps: true },
);

resumeSchema.pre('validate', function validateResumeShape(next) {
  const hasUrl = Boolean(this.resumeUrl?.trim());
  const hasFileId = Boolean(this.resumeFileId?.trim());
  const hasData =
    Boolean(this.resumeData?.name?.trim()) ||
    Boolean(this.resumeData?.summary?.trim()) ||
    Boolean(this.resumeData?.skills?.length) ||
    Boolean(this.resumeData?.education?.length) ||
    Boolean(this.resumeData?.experience?.length);

  if (this.resumeType === 'uploaded') {
    if (hasData) {
      return next(new Error('Uploaded resumes cannot include resumeData'));
    }
    if (!hasFileId) {
      return next(new Error('Uploaded resumes require a resumeFileId'));
    }
    if (!hasUrl) {
      return next(new Error('Uploaded resumes require a resumeUrl'));
    }
    if (!this.resumeFileName?.trim()) {
      this.resumeFileName = String(this.resumeUrl || '').split(/[\\/]/).pop() || 'candidate_resume.pdf';
    }
    this.resumeData = undefined;
  }

  if (this.resumeType === 'generated') {
    if (hasUrl || hasFileId) {
      return next(new Error('Generated resumes cannot include resumeUrl or resumeFileId'));
    }
    if (!hasData) {
      return next(new Error('Generated resumes require resumeData'));
    }
    this.resumeUrl = '';
    this.resumeFileId = '';
    this.resumeFileName = '';
  }

  return next();
});

export const Resume = mongoose.model('Resume', resumeSchema);

