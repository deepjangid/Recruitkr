import mongoose from 'mongoose';

const candidateFileSchema = new mongoose.Schema(
  {
    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: { type: String, enum: ['profile_photo', 'certificate'], required: true, index: true },
    title: { type: String, trim: true, default: '' },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

candidateFileSchema.index(
  { candidateUserId: 1, kind: 1 },
  { unique: true, partialFilterExpression: { kind: 'profile_photo' } },
);

export const CandidateFile = mongoose.model('CandidateFile', candidateFileSchema);

