import mongoose from 'mongoose';

const jobRequirementSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceCollection: { type: String, trim: true, enum: ['jobs', 'openings'] },
    sourceJobId: { type: String, trim: true },
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    type: { type: String, trim: true },
    category: { type: String, trim: true },
    genderRequirement: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experience: { type: String, trim: true },
    fixedPrice: { type: Number, min: 0 },
    ageRequirement: { type: String, trim: true },
    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, trim: true, default: 'INR' },
    },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    contactEmail: { type: String, trim: true, lowercase: true },
    applicationDeadline: Date,
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
jobRequirementSchema.index(
  { sourceCollection: 1, sourceJobId: 1 },
  { unique: true, sparse: true },
);

export const JobRequirement = mongoose.model('JobRequirement', jobRequirementSchema);

