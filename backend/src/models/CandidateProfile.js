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
    declarationAccepted: { type: Boolean, required: true },
    representationAuthorized: { type: Boolean, required: true },
  },
  { timestamps: true },
);

candidateProfileSchema.index({ userId: 1 });
candidateProfileSchema.index({ fullName: 1 });

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

