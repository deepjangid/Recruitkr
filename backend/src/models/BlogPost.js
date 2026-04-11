import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    content: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one content paragraph is required',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    readingTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
