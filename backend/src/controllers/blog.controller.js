import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { BlogPost } from '../models/BlogPost.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const ensureUniqueSlug = async (baseSlug, excludeId) => {
  const rootSlug = toSlug(baseSlug);
  let candidate = rootSlug;
  let counter = 1;

  while (true) {
    const existing = await BlogPost.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select('_id');

    if (!existing) return candidate;
    counter += 1;
    candidate = `${rootSlug}-${counter}`;
  }
};

const normalizePayload = async (payload, existingPost) => {
  const content = payload.content
    ? payload.content.map((paragraph) => paragraph.trim()).filter(Boolean)
    : existingPost?.content;

  const tags = payload.tags
    ? payload.tags.map((tag) => tag.trim()).filter(Boolean)
    : existingPost?.tags;

  const title = payload.title?.trim() ?? existingPost?.title;
  const requestedSlug = payload.slug?.trim() || payload.title || existingPost?.slug || title;

  const slug = await ensureUniqueSlug(requestedSlug, existingPost?._id);
  const status = payload.status ?? existingPost?.status ?? 'draft';

  let publishedAt =
    payload.publishedAt === null
      ? null
      : payload.publishedAt ?? existingPost?.publishedAt ?? null;

  if (status === 'published' && !publishedAt) {
    publishedAt = new Date();
  }

  if (status === 'draft') {
    publishedAt = null;
  }

  return {
    title,
    slug,
    excerpt: payload.excerpt?.trim() ?? existingPost?.excerpt,
    content,
    tags,
    readingTime: payload.readingTime?.trim() ?? existingPost?.readingTime,
    status,
    publishedAt,
  };
};

export const listPublishedBlogPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 });
  res.json({ success: true, data: posts });
});

export const getPublishedBlogPostBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' });
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog post not found');
  }
  res.json({ success: true, data: post });
});

export const listAdminBlogPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find().sort({ updatedAt: -1, createdAt: -1 });
  res.json({ success: true, data: posts });
});

export const createBlogPost = asyncHandler(async (req, res) => {
  const normalized = await normalizePayload(req.body);
  const post = await BlogPost.create({
    ...normalized,
    authorId: req.user.id,
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: post });
});

export const updateBlogPost = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  if (!mongoose.isValidObjectId(blogId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid blog id');
  }

  const existing = await BlogPost.findById(blogId);
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog post not found');
  }

  const normalized = await normalizePayload(req.body, existing);
  Object.assign(existing, normalized);
  await existing.save();

  res.json({ success: true, data: existing });
});

export const deleteBlogPost = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  if (!mongoose.isValidObjectId(blogId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid blog id');
  }

  const deleted = await BlogPost.findByIdAndDelete(blogId);
  if (!deleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Blog post not found');
  }

  res.json({ success: true, message: 'Blog post deleted' });
});
