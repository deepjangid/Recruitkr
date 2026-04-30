import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['candidate', 'client', 'admin'],
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenJti: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    // Store only the hashed token so raw reset links are never persisted.
    resetToken: {
      type: String,
      select: false,
    },
    resetTokenExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);

