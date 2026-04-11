import { apiGet } from "@/lib/api";

export type BlogPost = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  readingTime: string;
  tags: string[];
  content: string[];
  status?: "draft" | "published";
};

type BlogListResponse = {
  success: boolean;
  data: BlogPost[];
};

type BlogDetailResponse = {
  success: boolean;
  data: BlogPost;
};

export const fetchBlogPosts = async () => {
  const response = await apiGet<BlogListResponse>("/blogs");
  return response.data;
};

export const fetchBlogPost = async (slug: string) => {
  const response = await apiGet<BlogDetailResponse>(`/blogs/${slug}`);
  return response.data;
};
