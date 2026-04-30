import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      default: '',
      trim: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: String,
      default: '',
      trim: true,
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
      trim: true,
    },
    linkedInUrl: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    contactLink: {
      type: String,
      default: '',
      trim: true,
    },
    cardStyleVariant: {
      type: String,
      default: 'light',
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'teammembers',
    versionKey: false,
  },
);

export default mongoose.models.OurTeam || mongoose.model('OurTeam', teamSchema);
