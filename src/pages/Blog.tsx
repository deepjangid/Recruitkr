import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import BlogCard from "@/components/blogCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { fetchBlogPosts, type BlogPost } from "@/lib/blog";

const Blog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchBlogPosts();
      console.info("[BlogPage] setting blogs state", {
        count: response.length,
        titles: response.map((post) => post.title),
      });
      setBlogs(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load blog posts";
      console.error("[BlogPage] failed to load blogs", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const categories = ["All", ...Array.from(new Set(blogs.flatMap((blog) => blog.tags).filter(Boolean)))];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      blog.title.toLowerCase().includes(normalizedQuery);
    const matchesCategory =
      selectedCategory === "All" || blog.tags.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_22%,#f7fbff_100%)]">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <header className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Insights
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">RecruitKr Journal</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Thoughtful notes on hiring, growth, employer branding, and better teams.
            </p>
          </header>

          <section className="mx-auto mt-10 max-w-6xl rounded-[28px] border border-[#264a7f]/10 bg-white/90 p-4 shadow-[0_24px_80px_rgba(38,74,127,0.08)] backdrop-blur sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <Search size={18} className="shrink-0 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title, slug, or excerpt"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {error && (
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadPosts()}
                className="mt-3 inline-flex rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[28px] border border-border bg-card"
                >
                  <div className="h-56 animate-pulse bg-muted" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mx-auto mt-8 flex max-w-6xl items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                  {filteredBlogs.length} article{filteredBlogs.length === 1 ? "" : "s"} found
                </p>
                {(searchQuery || selectedCategory !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredBlogs.map((post) => (
                  <BlogCard key={post.slug} blog={post} />
                ))}

                {filteredBlogs.length === 0 && (
                  <div className="col-span-full rounded-[28px] border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
                    <p className="text-base font-semibold text-foreground">No blogs available</p>
                    <p className="mt-2">
                      Try a different search term or switch the category filter back to `All`.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;

