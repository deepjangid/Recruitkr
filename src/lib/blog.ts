import { apiGet } from "@/lib/api";
import { apiPatch, apiPost } from "@/lib/api";

export type BlogPost = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  authorName?: string;
  coverImage?: string | null;
  contentHtml?: string;
  publishedAt: string | null;
  readingTime: string;
  tags: string[];
  content: string[];
  status?: "draft" | "published";
  createdAt?: string | null;
  updatedAt?: string | null;
};

type BlogListResponse = {
  success: boolean;
  blogPosts?: Partial<BlogPost>[];
  meta?: {
    count?: number;
  };
};

type BlogDetailResponse = {
  success: boolean;
  data: BlogPost;
};

type AdminBlogListResponse = {
  success: boolean;
  blogPosts?: Partial<BlogPost>[];
  meta?: {
    count?: number;
  };
};

export type BlogEditorPayload = {
  title: string;
  slug?: string;
  excerpt: string;
  authorName?: string;
  coverImage?: string;
  contentHtml: string;
  tags: string[];
  readingTime: string;
  status: "draft" | "published";
  publishedAt?: string | null;
};

const normalizeBlogPost = (post: Partial<BlogPost>, index = 0): BlogPost => ({
  _id: post._id,
  slug: post.slug?.trim() || `blog-post-${index + 1}`,
  title: post.title?.trim() || "Untitled blog post",
  excerpt: post.excerpt?.trim() || "No description available.",
  authorName: post.authorName?.trim() || "RecruitKr Editorial",
  coverImage: post.coverImage || null,
  contentHtml: post.contentHtml?.trim() || "",
  publishedAt: post.publishedAt ?? null,
  readingTime: post.readingTime?.trim() || "5 min read",
  tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
  content: Array.isArray(post.content) ? post.content.filter(Boolean) : [],
  status: post.status,
  createdAt: post.createdAt ?? null,
  updatedAt: post.updatedAt ?? null,
});

export const fetchBlogPosts = async () => {
  const response = await apiGet<BlogListResponse>("/api/blogposts?published=true");
  console.log("API RESPONSE:", response);

  const rawPosts = Array.isArray(response.blogPosts)
    ? response.blogPosts
    : [];

  const posts = Array.isArray(rawPosts)
    ? rawPosts.map((post, index) => normalizeBlogPost(post, index))
    : [];
  console.info("[blog] fetched blog posts", {
    count: posts.length,
    slugs: posts.map((post) => post.slug),
    responseMeta: response.meta ?? null,
  });
  return posts;
};

export const fetchBlogPost = async (slug: string) => {
  const response = await apiGet<BlogDetailResponse>(`/api/blogposts/${slug}`);
  const post = normalizeBlogPost(response.data);
  console.info("[blog] fetched single blog post", {
    slug: post.slug,
    title: post.title,
  });
  return post;
};

export const fetchAdminBlogPosts = async () => {
  const response = await apiGet<AdminBlogListResponse>("/blogs/admin/all", true);
  const posts = Array.isArray(response.blogPosts)
    ? response.blogPosts.map((post, index) => normalizeBlogPost(post, index))
    : [];
  return posts;
};

export const createAdminBlogPost = async (payload: BlogEditorPayload) => {
  const response = await apiPost<BlogDetailResponse>("/blogs", payload, true);
  return normalizeBlogPost(response.data);
};

export const updateAdminBlogPost = async (blogId: string, payload: Partial<BlogEditorPayload>) => {
  const response = await apiPatch<BlogDetailResponse>(`/blogs/${blogId}`, payload, true);
  return normalizeBlogPost(response.data);
};

export const uploadBlogEditorImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiPost<{ success: boolean; data?: { imageUrl?: string } }>(
    "/api/blogposts/images",
    formData,
    true,
  );

  if (!response.success || !response.data?.imageUrl) {
    throw new Error("Failed to upload image");
  }

  return response.data.imageUrl;
};
