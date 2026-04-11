import { Router } from 'express';

import {
  createBlogPost,
  deleteBlogPost,
  getPublishedBlogPostBySlug,
  listAdminBlogPosts,
  listPublishedBlogPosts,
  updateBlogPost,
} from '../controllers/blog.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createBlogPostSchema, updateBlogPostSchema } from '../schemas/blog.schema.js';

const router = Router();

router.get('/admin/all', requireAuth, requireRole('admin'), listAdminBlogPosts);
router.get('/', listPublishedBlogPosts);
router.get('/:slug', getPublishedBlogPostBySlug);
router.post('/', requireAuth, requireRole('admin'), validate(createBlogPostSchema), createBlogPost);
router.patch('/:blogId', requireAuth, requireRole('admin'), validate(updateBlogPostSchema), updateBlogPost);
router.delete('/:blogId', requireAuth, requireRole('admin'), deleteBlogPost);

export default router;
