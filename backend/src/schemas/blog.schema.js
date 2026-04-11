import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBlogPostSchema = z
  .object({
    title: z.string().trim().min(5).max(180),
    slug: z.string().trim().toLowerCase().regex(slugRegex, 'Slug must be URL friendly').optional(),
    excerpt: z.string().trim().min(20).max(320),
    content: z.array(z.string().trim().min(10).max(4000)).min(1),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    readingTime: z.string().trim().min(3).max(40),
    status: z.enum(['draft', 'published']).default('draft'),
    publishedAt: z.coerce.date().optional().nullable(),
  })
  .strict();

export const updateBlogPostSchema = createBlogPostSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'At least one field is required',
);
