import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    source: { type: String, enum: ['uploaded', 'generated'], required: true },
    textExtract: { type: String, default: '' },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

export const Resume = mongoose.model('Resume', resumeSchema);

