import mongoose from 'mongoose';

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
  },
  { timestamps: true },
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);

