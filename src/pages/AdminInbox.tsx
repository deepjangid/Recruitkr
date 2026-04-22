import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import { getErrorMessage } from "@/lib/apiError";
import {
  fetchAdminContactMessages,
  updateAdminContactMessageStatus,
  type ContactMessage,
} from "@/lib/contact";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const AdminInbox = () => {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const session = getSession();
    if (!session?.accessToken || session.user.role !== "admin") {
      navigate("/login");
      return;
    }
    setSessionChecked(true);
  }, [navigate]);

  useEffect(() => {
    if (!sessionChecked) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchAdminContactMessages();
        setMessages(data);
        setSelectedMessageId((current) => current || data[0]?._id || null);
      } catch (err) {
        setError(getErrorMessage(err, "We couldn't load your inbox right now. Please try again."));
      } finally {
        setLoading(false);
      }
    };

    void loadMessages();
  }, [reloadCount, sessionChecked]);

  const selectedMessage = useMemo(
    () => messages.find((message) => message._id === selectedMessageId) ?? null,
    [messages, selectedMessageId],
  );

  const openMessage = async (message: ContactMessage) => {
    setSelectedMessageId(message._id);
    if (message.status === "read") return;

    try {
      setUpdatingId(message._id);
      const updated = await updateAdminContactMessageStatus(message._id, "read");
      setMessages((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't update that message right now. Please try again."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_22%,#f7fbff_100%)]">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Admin</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Contact Inbox</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Website contact submissions, newest first.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/dashboard/admin/blogs"
                  className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Blog Editor
                </Link>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadCount((current) => current + 1)}
                  disabled={loading}
                  className="mt-3 inline-flex rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <section className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {messages.length} total
                  </span>
                </div>

                {loading ? (
                  <div className="py-6 text-sm text-muted-foreground">
                    <p>Loading inbox...</p>
                    <p className="mt-1">We're fetching the latest messages for you.</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">No contact messages yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {messages.map((message) => {
                      const isSelected = selectedMessageId === message._id;
                      const isUnread = message.status === "unread";

                      return (
                        <button
                          key={message._id}
                          type="button"
                          onClick={() => void openMessage(message)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{message.name}</p>
                              <p className="truncate text-xs text-slate-500">{message.email}</p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                                isUnread
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {updatingId === message._id ? "Saving" : message.status}
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm text-slate-600">{message.message}</p>
                          <p className="mt-3 text-xs text-slate-500">{formatDateTime(message.createdAt)}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
                {!selectedMessage ? (
                  <div className="flex min-h-[320px] items-center justify-center text-center text-sm text-muted-foreground">
                    Select a message to read it.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedMessage.name}</h2>
                        <p className="mt-1 text-sm text-slate-600">{selectedMessage.email}</p>
                        {selectedMessage.mobile && (
                          <p className="mt-1 text-sm text-slate-600">{selectedMessage.mobile}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{formatDateTime(selectedMessage.createdAt)}</p>
                        <p className="mt-1">
                          Status:{" "}
                          <span className="font-semibold text-slate-700">{selectedMessage.status}</span>
                        </p>
                        {selectedMessage.readAt && (
                          <p className="mt-1">Read: {formatDateTime(selectedMessage.readAt)}</p>
                        )}
                      </div>
                    </div>

                    <article className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                      {selectedMessage.message}
                    </article>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminInbox;
