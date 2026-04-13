import mongoose from 'mongoose';

const interviewDetailsSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date },
    timezone: { type: String, trim: true },
    mode: {
      type: String,
      enum: ['onsite', 'google-meet', 'phone', 'video', 'other'],
    },
    locationText: { type: String, trim: true },
    googleMapsUrl: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const applicationTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['applied', 'under-review', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      required: true,
    },
    note: { type: String, trim: true },
    changedByRole: {
      type: String,
      enum: ['candidate', 'client', 'system'],
      default: 'system',
    },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', required: true, index: true },
    status: {
      type: String,
      enum: ['applied', 'under-review', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
      index: true,
    },
    statusNote: { type: String, trim: true },
    statusUpdatedAt: { type: Date, default: Date.now },
    interviewDetails: interviewDetailsSchema,
    timeline: { type: [applicationTimelineSchema], default: [] },
  },
  { timestamps: true },
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);

