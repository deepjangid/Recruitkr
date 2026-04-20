import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const emptyStringToUndefined = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const baseCreateBlogPostSchema = z
  .object({
    title: z.string().trim().min(5).max(180),
    slug: z.string().trim().toLowerCase().regex(slugRegex, 'Slug must be URL friendly').optional(),
    excerpt: z.string().trim().min(20).max(320),
    authorName: z.preprocess(emptyStringToUndefined, z.string().trim().min(2).max(120).optional()),
    coverImage: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
    contentHtml: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(200000).optional()),
    content: z.array(z.string().trim().min(1).max(4000)).min(1).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    readingTime: z.string().trim().min(3).max(40),
    status: z.enum(['draft', 'published']).default('draft'),
    publishedAt: z.coerce.date().optional().nullable(),
  });

const refinedCreateBlogPostSchema = baseCreateBlogPostSchema
  .refine((payload) => Boolean(payload.contentHtml || payload.content?.length), {
    message: 'Either contentHtml or content is required',
    path: ['contentHtml'],
  })
  .strict();

export { refinedCreateBlogPostSchema as createBlogPostSchema };

export const updateBlogPostSchema = z
  .object({
    title: z.string().trim().min(5).max(180).optional(),
    slug: z.string().trim().toLowerCase().regex(slugRegex, 'Slug must be URL friendly').optional(),
    excerpt: z.string().trim().min(20).max(320).optional(),
    authorName: z.preprocess(emptyStringToUndefined, z.string().trim().min(2).max(120).optional()),
    coverImage: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
    contentHtml: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).max(200000).optional()),
    content: z.array(z.string().trim().min(1).max(4000)).min(1).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    readingTime: z.string().trim().min(3).max(40).optional(),
    status: z.enum(['draft', 'published']).optional(),
    publishedAt: z.coerce.date().optional().nullable(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  })
  .strict();
