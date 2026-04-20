import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BlogCard from "@/components/blogCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getRenderableBlogHtml } from "@/lib/blogHtml";
import { fetchBlogPost, fetchBlogPosts, type BlogPost } from "@/lib/blog";

const detailPlaceholderImageClass =
  "flex w-full items-end rounded-xl bg-[radial-gradient(circle_at_top,_rgba(38,74,127,0.96),_rgba(38,74,127,0.82)_42%,_rgba(105,164,79,0.9)_100%)] p-6 text-2xl font-bold leading-tight text-white";

const BlogPostApi = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const publishedDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString()
    : null;

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [data, allBlogs] = await Promise.all([fetchBlogPost(slug), fetchBlogPosts()]);
        console.log("[BlogPostApi] render contentHtml:", data.contentHtml);
        setPost(data);
        setRelatedBlogs(
          allBlogs
            .filter((blog) => blog.slug !== slug)
            .filter((blog) =>
              blog.tags.some((tag) => data.tags.includes(tag)),
            )
            .slice(0, 3),
        );
      } catch (err) {
        setPost(null);
        setRelatedBlogs([]);
        setError(err instanceof Error ? err.message : "Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [slug]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_22%,#f7fbff_100%)]">
      <Navbar />

      <main className="py-6 pt-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {loading ? (
            <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Loading blog post...</p>
            </div>
          ) : !post ? (
            <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
              <h1 className="text-3xl font-bold">Post not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Post not found."}</p>
              <Link
                to="/blog"
                className="btn-gradient mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
              >
                Back to Blog
              </Link>
            </div>
          ) : (
            <article className="space-y-5 sm:space-y-6">
              <div className="rounded-2xl border border-[#264a7f]/10 bg-white p-4 shadow-sm sm:p-5">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-48 w-full rounded-xl object-cover sm:h-56"
                  />
                ) : (
                  <div className={`${detailPlaceholderImageClass} h-48 sm:h-56`}>{post.title}</div>
                )}

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {post.tags[0] || "RecruitKr Journal"}
                  </p>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">
                    {post.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-slate-700">{post.authorName || "RecruitKr Editorial"}</span>
                    {publishedDate && (
                      <>
                        <span>&bull;</span>
                        <time dateTime={post.publishedAt ?? ""}>{publishedDate}</time>
                      </>
                    )}
                    <span>&bull;</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
                {post.excerpt && (
                  <p className="text-sm leading-relaxed text-gray-700">{post.excerpt}</p>
                )}

                <div
                  className="blog-prose prose prose-sm mt-4 max-w-none overflow-hidden break-words text-slate-700 prose-headings:mt-4 prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:text-slate-900 prose-h2:text-xl prose-h3:text-lg prose-p:mt-2 prose-p:text-sm prose-p:leading-relaxed prose-ul:mt-3 prose-ul:pl-5 prose-ol:mt-3 prose-ol:pl-5 prose-li:mt-1 prose-img:my-4 prose-img:w-full prose-img:max-w-full prose-img:rounded-xl prose-img:object-contain prose-a:text-primary md:prose-base"
                  dangerouslySetInnerHTML={{
                    __html: getRenderableBlogHtml(post.contentHtml, post.content),
                  }}
                />

                <div className="mt-8 border-t border-border pt-6">
                  <Link
                    to="/blog"
                    className="inline-flex items-center justify-center rounded-lg border border-[#264a7f]/15 bg-white px-4 py-2 text-sm font-semibold text-[#264a7f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#264a7f]/5"
                  >
                    Back to Blog
                  </Link>
                </div>
              </div>

              <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Related Blogs</h2>
                  <Link
                    to="/blog"
                    className="text-sm font-medium text-primary transition hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedBlogs.map((relatedBlog) => (
                    <BlogCard key={relatedBlog.slug} blog={relatedBlog} />
                  ))}
                </div>

                {relatedBlogs.length === 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No related blogs available right now.
                  </p>
                )}
              </section>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostApi;
