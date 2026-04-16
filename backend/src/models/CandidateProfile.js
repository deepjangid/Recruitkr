import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    linkedinUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    highestQualification: { type: String, required: true },
    experienceStatus: { type: String, enum: ['fresher', 'experienced'], required: true },
    experienceDetails: {
      currentCompany: String,
      designation: String,
      totalExperience: String,
      industry: String,
      currentCtcLpa: Number,
      expectedCtcLpa: Number,
      minimumCtcLpa: Number,
      noticePeriod: String,
      lastWorkingDay: Date,
    },
    preferences: {
      preferredLocation: { type: String, required: true },
      preferredIndustry: { type: String, required: true },
      preferredRole: { type: String, required: true },
      workModes: { type: [String], default: [] },
    },
    summary: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    projects: {
      type: [
        {
          name: { type: String, trim: true, default: '' },
          description: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    certifications: {
      type: [
        {
          name: { type: String, trim: true, default: '' },
          institute: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    referral: { type: String, trim: true, default: '' },
    about: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    currentCity: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    isActive: { type: Boolean, default: true },
    mobile: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    preferredIndustry: { type: String, trim: true, default: '' },
    preferredLocation: { type: String, trim: true, default: '' },
    preferredRole: { type: String, trim: true, default: '' },
    resumePath: { type: String, trim: true, default: '' },
    workModes: { type: [String], default: [] },
    declarationAccepted: { type: Boolean, required: true },
    representationAuthorized: { type: Boolean, required: true },
  },
  { timestamps: true },
);

candidateProfileSchema.index({ userId: 1 });
candidateProfileSchema.index({ fullName: 1 });

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

