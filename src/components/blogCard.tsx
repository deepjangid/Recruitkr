import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { BlogPost } from "@/lib/blog";

type BlogCardProps = {
  blog: BlogPost;
};

const placeholderImageClass =
  "flex h-40 w-full items-end bg-[radial-gradient(circle_at_top,_rgba(38,74,127,0.95),_rgba(38,74,127,0.78)_42%,_rgba(105,164,79,0.92)_100%)] px-4 py-5 text-left text-sm font-semibold leading-snug text-white sm:h-44";

function BlogCardComponent({ blog }: BlogCardProps) {
  const navigate = useNavigate();
  const openPost = useCallback(() => navigate(`/blog/${blog.slug}`), [blog.slug, navigate]);
  const primaryCategory = blog.tags[0] || "RecruitKr Journal";
  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString()
    : null;

  return (
    <article
      onClick={openPost}
      className="group min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {blog.coverImage ? (
        <img
          src={blog.coverImage}
          alt={blog.title}
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          className="h-40 w-full object-cover sm:h-44"
        />
      ) : (
        <div className={placeholderImageClass}>{blog.title}</div>
      )}

      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          <span className="truncate">{primaryCategory}</span>
          <span className="shrink-0 normal-case tracking-normal">{blog.readingTime}</span>
        </div>

        <div className="space-y-2">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">
            {blog.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
            {blog.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 text-xs text-slate-500">
          <span>{publishedDate || "RecruitKr Editorial"}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openPost();
            }}
            className="font-semibold text-primary transition group-hover:text-[#1f3d69] hover:underline"
          >
            Read More
          </button>
        </div>
      </div>
    </article>
  );
}

const BlogCard = memo(BlogCardComponent);

export default BlogCard;
