import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { fetchBlogPosts, type BlogPost } from "@/lib/blog";

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchBlogPosts();
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blog posts");
      } finally {
        setLoading(false);
      }
    };

    void loadPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <header className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Insights
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Blog</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Hiring, HR, and career tips from the RecruitKr team.
            </p>
          </header>

          {error && (
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
              Loading blog posts...
            </div>
          ) : (
            <section className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="card-hover rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <time dateTime={post.publishedAt ?? ""}>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : "Unpublished"}
                    </time>
                    <span>{post.readingTime}</span>
                  </div>

                  <h2 className="mt-4 text-xl font-bold leading-snug">
                    <Link to={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="btn-gradient inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-transform hover:scale-105"
                    >
                      Read More
                    </Link>
                  </div>
                </article>
              ))}

              {posts.length === 0 && (
                <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Abhi koi published blog post available nahi hai.
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;

