import mongoose from 'mongoose';

const jobRequirementSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobTitle: { type: String, required: true, trim: true },
    openings: { type: Number, required: true, min: 1 },
    department: { type: String, required: true, trim: true },
    jobLocation: { type: String, required: true, trim: true },
    employmentType: { type: String, required: true, trim: true },
    experienceRequired: { type: String, required: true, trim: true },
    minCtcLpa: { type: Number, required: true, min: 0 },
    maxCtcLpa: { type: Number, required: true, min: 0 },
    preferredIndustryBackground: { type: String, trim: true },
    genderPreference: { type: String, trim: true, default: 'No Preference' },
    workModes: { type: [String], default: [] },
    jobDescription: { type: String, required: true, trim: true },
    urgencyLevel: { type: String, required: true },
    expectedJoiningDate: Date,
    status: {
      type: String,
      enum: ['active', 'on-hold', 'closed'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

jobRequirementSchema.index({ clientId: 1, status: 1, createdAt: -1 });

export const JobRequirement = mongoose.model('JobRequirement', jobRequirementSchema);

