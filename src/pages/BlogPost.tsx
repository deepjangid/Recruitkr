import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useParams } from "react-router-dom";
import { getBlogPost } from "@/lib/blog";

const BlogPost = () => {
  const { slug } = useParams();
  const post = slug ? getBlogPost(slug) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          {!post ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
              <h1 className="text-3xl font-bold">Post not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The post you’re looking for doesn’t exist.
              </p>
              <Link
                to="/blog"
                className="btn-gradient mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
              >
                Back to Blog
              </Link>
            </div>
          ) : (
            <article className="mx-auto max-w-3xl">
              <div className="text-center">
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                  Blog
                </p>
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                  {post.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </time>
                  <span>•</span>
                  <span>{post.readingTime}</span>
                </div>
              </div>

              <div className="mt-10 space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8">
                {post.content.map((para) => (
                  <p key={para} className="text-sm leading-relaxed text-muted-foreground md:text-base">
                    {para}
                  </p>
                ))}

                <div className="pt-2">
                  <Link
                    to="/blog"
                    className="btn-gradient inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
                  >
                    Back to Blog
                  </Link>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;

