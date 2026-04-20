import { useNavigate } from "react-router-dom";

import type { BlogPost } from "@/lib/blog";

type BlogCardProps = {
  blog: BlogPost;
};

const placeholderImageClass =
  "flex h-40 w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(38,74,127,0.95),_rgba(38,74,127,0.78)_42%,_rgba(105,164,79,0.92)_100%)] px-4 text-center text-base font-semibold text-white";

function BlogCard({ blog }: BlogCardProps) {
  const navigate = useNavigate();
  const primaryCategory = blog.tags[0] || "Blog";
  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString()
    : null;

  return (
   <article
  onClick={() => navigate(`/blog/${blog.slug}`)}
  className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
>
  {blog.coverImage ? (
    <img
      src={blog.coverImage}
      alt={blog.title}
      className="h-49 w-full object-cover"
    />
  ) : (
    <div className="h-36 flex items-center justify-center bg-gray-200 text-sm font-semibold">
      {blog.title}
    </div>
  )}

  <div className="p-3">
    <div className="flex justify-between text-[10px] text-gray-500">
      <span>{primaryCategory}</span>
      <span>{blog.readingTime}</span>
    </div>

    <h3 className="mt-1 text-sm font-semibold text-gray-800 line-clamp-2">
      {blog.title}
    </h3>

    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
      {blog.excerpt}
    </p>

    <div className="mt-2 flex justify-between items-center">
      <span className="text-[10px] text-gray-400">{publishedDate ?? ""}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/blog/${blog.slug}`);
        }}
        className="text-xs text-indigo-600 font-medium hover:underline"
      >
        Read
      </button>
    </div>
  </div>
</article>
  );
}

export default BlogCard;
