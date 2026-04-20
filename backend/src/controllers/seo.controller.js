import { BlogPost } from '../models/BlogPost.js';
import { env } from '../config/env.js';

const SITEMAP_CACHE_TTL_MS = 15 * 60 * 1000;

const staticPages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/faqs', changefreq: 'monthly', priority: '0.6' },
  { path: '/process', changefreq: 'monthly', priority: '0.7' },
  { path: '/sectors', changefreq: 'monthly', priority: '0.7' },
  { path: '/why-us', changefreq: 'monthly', priority: '0.7' },
];

let cachedXml = null;
let cacheExpiresAt = 0;

const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildPublishedBlogQuery = () => ({
  $or: [
    { isPublished: true },
    { status: 'Published' },
    { status: 'published' },
    { status: { $exists: false } },
    { status: null },
  ],
});

const normalizeBaseUrl = () => env.FRONTEND_URL.replace(/\/$/, '');

const buildSitemapXml = async () => {
  const baseUrl = normalizeBaseUrl();
  const now = new Date();

  const publishedBlogs = await BlogPost.find(buildPublishedBlogQuery())
    .select('slug updatedAt publishedAt createdAt')
    .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
    .lean();

  const uniqueUrls = new Map();

  for (const page of staticPages) {
    uniqueUrls.set(`${baseUrl}${page.path}`, {
      loc: `${baseUrl}${page.path}`,
      lastmod: now.toISOString(),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  for (const blog of publishedBlogs) {
    if (!blog.slug) continue;

    const loc = `${baseUrl}/blog/${blog.slug}`;
    uniqueUrls.set(loc, {
      loc,
      lastmod: new Date(blog.updatedAt || blog.publishedAt || blog.createdAt || now).toISOString(),
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  const urlsXml = Array.from(uniqueUrls.values())
    .map(
      (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
    <changefreq>${xmlEscape(entry.changefreq)}</changefreq>
    <priority>${xmlEscape(entry.priority)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
};

export const getDynamicSitemap = async (_req, res, next) => {
  try {
    if (cachedXml && Date.now() < cacheExpiresAt) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=900');
      return res.send(cachedXml);
    }

    const xml = await buildSitemapXml();
    cachedXml = xml;
    cacheExpiresAt = Date.now() + SITEMAP_CACHE_TTL_MS;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=900');
    return res.send(xml);
  } catch (error) {
    return next(error);
  }
};
