import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { Link, useNavigate } from "react-router-dom";
import "react-quill/dist/quill.snow.css";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import {
  createAdminBlogPost,
  fetchAdminBlogPosts,
  type BlogEditorPayload,
  type BlogPost,
  updateAdminBlogPost,
  uploadBlogEditorImage,
} from "@/lib/blog";

const stripBase64Images = (html: string) =>
  html.replace(/<img[^>]+src="data:image\/[^"]+"[^>]*>/gi, "");

const cleanHtml = (html: string) =>
  stripBase64Images(html)
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .trim();

const estimateReadingTime = (html: string) => {
  const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
};

const initialForm: BlogEditorPayload = {
  title: "",
  slug: "",
  excerpt: "",
  authorName: "RecruitKr Editorial",
  coverImage: "",
  contentHtml: "",
  tags: [],
  readingTime: "1 min read",
  status: "draft",
  publishedAt: null,
};

const AdminBlogEditor = () => {
  const navigate = useNavigate();
  const quillRef = useRef<ReactQuill | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogEditorPayload>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session?.accessToken || session.user.role !== "admin") {
      navigate("/login");
      return;
    }
    setSessionChecked(true);
  }, [navigate]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBlogPosts();
      setBlogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionChecked) return;
    void loadBlogs();
  }, [sessionChecked]);

  const handleImageInsert = async () => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const imageUrl = window.prompt("Paste image URL. Leave blank to upload an image file.")?.trim();
    const range = editor.getSelection(true);
    const insertAt = range?.index ?? editor.getLength();

    if (imageUrl) {
      if (imageUrl.startsWith("data:image/")) {
        setError("Base64 images are not allowed. Please use an uploaded image URL.");
        return;
      }
      editor.insertEmbed(insertAt, "image", imageUrl, "user");
      editor.setSelection(insertAt + 1, 0);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setError("");
        const uploadedImageUrl = await uploadBlogEditorImage(file);
        editor.insertEmbed(insertAt, "image", uploadedImageUrl, "user");
        editor.setSelection(insertAt + 1, 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
      }
    };
    input.click();
  };

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.items || [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();

      if (!file) return;
      event.preventDefault();

      try {
        setError("");
        const uploadedImageUrl = await uploadBlogEditorImage(file);
        const range = editor.getSelection(true);
        const insertAt = range?.index ?? editor.getLength();
        editor.insertEmbed(insertAt, "image", uploadedImageUrl, "user");
        editor.setSelection(insertAt + 1, 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload pasted image");
      }
    };

    const handleDrop = async (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      event.preventDefault();

      try {
        setError("");
        const uploadedImageUrl = await uploadBlogEditorImage(file);
        const selection = editor.getSelection(true);
        const insertAt = selection?.index ?? editor.getLength();
        editor.insertEmbed(insertAt, "image", uploadedImageUrl, "user");
        editor.setSelection(insertAt + 1, 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload dropped image");
      }
    };

    editor.root.addEventListener("paste", handlePaste);
    editor.root.addEventListener("drop", handleDrop);
    return () => {
      editor.root.removeEventListener("paste", handlePaste);
      editor.root.removeEventListener("drop", handleDrop);
    };
  }, [quillRef.current]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: handleImageInsert,
        },
      },
    }),
    [],
  );

  const formats = ["header", "bold", "italic", "list", "bullet", "link", "image"];

  const populateForm = (blog: BlogPost) => {
    setSelectedBlogId(blog._id ?? null);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      authorName: blog.authorName || "RecruitKr Editorial",
      coverImage: blog.coverImage || "",
      contentHtml: blog.contentHtml || blog.content.map((paragraph) => `<p>${paragraph}</p>`).join(""),
      tags: blog.tags,
      readingTime: blog.readingTime,
      status: blog.status || "draft",
      publishedAt: blog.publishedAt,
    });
  };

  const resetForm = () => {
    setSelectedBlogId(null);
    setForm(initialForm);
    setSuccessMessage("");
    setError("");
  };

  const handleSave = async () => {
    const cleanedContentHtml = cleanHtml(form.contentHtml);
    if (!cleanedContentHtml) {
      setError("Blog content is required.");
      return;
    }
    if (cleanedContentHtml.includes("data:image/")) {
      setError("Base64 images are not allowed. Please upload images and use their URL.");
      return;
    }

    const payload: BlogEditorPayload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug?.trim() || undefined,
      excerpt: form.excerpt.trim(),
      authorName: form.authorName?.trim() || "RecruitKr Editorial",
      coverImage: form.coverImage?.trim() || undefined,
      contentHtml: cleanedContentHtml,
      tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
      readingTime: form.readingTime.trim() || estimateReadingTime(cleanedContentHtml),
      publishedAt: form.status === "published" ? form.publishedAt || new Date().toISOString() : null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      if (selectedBlogId) {
        await updateAdminBlogPost(selectedBlogId, payload);
        setSuccessMessage("Blog updated successfully.");
      } else {
        await createAdminBlogPost(payload);
        setSuccessMessage("Blog created successfully.");
      }
      await loadBlogs();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_22%,#f7fbff_100%)]">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Admin</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">Blog Editor</h1>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                  >
                    New
                  </button>
                </div>

                <div className="mt-6">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading blogs...</p>
                  ) : (
                    <div className="space-y-3">
                      {blogs.map((blog) => (
                        <button
                          key={blog.slug}
                          type="button"
                          onClick={() => populateForm(blog)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selectedBlogId === blog._id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-slate-50"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {blog.status || "draft"}
                          </p>
                          <h2 className="mt-2 text-sm font-semibold text-slate-900">{blog.title}</h2>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{blog.excerpt}</p>
                        </button>
                      ))}
                      {blogs.length === 0 && (
                        <p className="text-sm text-muted-foreground">No blogs found yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </aside>

              <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">Title</span>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">Slug</span>
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, slug: event.target.value }))
                      }
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-800">Excerpt</span>
                    <textarea
                      value={form.excerpt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, excerpt: event.target.value }))
                      }
                      rows={3}
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">Author name</span>
                    <input
                      value={form.authorName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, authorName: event.target.value }))
                      }
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">Cover image URL</span>
                    <input
                      value={form.coverImage}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, coverImage: event.target.value }))
                      }
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">Tags</span>
                    <input
                      value={form.tags.join(", ")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                        }))
                      }
                      placeholder="Tech, SEO, Hiring Tips"
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">Status</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as "draft" | "published",
                        }))
                      }
                      className="rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-primary"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={form.contentHtml}
                    onChange={(value) => {
                      const cleanedValue = cleanHtml(value);
                      setForm((current) => ({
                        ...current,
                        contentHtml: cleanedValue,
                        readingTime: estimateReadingTime(cleanedValue),
                      }));
                    }}
                    modules={modules}
                    formats={formats}
                    placeholder="Write your blog here..."
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <p>Images are stored via uploaded URL only. Base64 content is blocked automatically.</p>
                  <p>{form.readingTime}</p>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Link to="/blog" className="text-sm font-medium text-primary hover:underline">
                    Preview public blog page
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="btn-gradient rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    {saving ? "Saving..." : selectedBlogId ? "Update Blog" : "Save Blog"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminBlogEditor;
