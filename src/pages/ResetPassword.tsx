import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiPost<{ success: boolean; message?: string }>("/auth/reset-password", {
        token,
        newPassword,
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 min-h-screen flex items-center">
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="text-center mb-8">
              <Link to="/" className="font-heading text-3xl font-bold">
                Recruit<span style={{ color: "#264a7f" }}>kr</span>
              </Link>
              <p className="mt-2 text-muted-foreground text-sm">Choose a new password</p>
            </div>

            {done ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-foreground">Password updated. Redirecting to login…</p>
                <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-foreground">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Enter a strong password"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-foreground">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-gradient w-full rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Reset Password"}
                </button>

                {!token && (
                  <p className="text-xs text-muted-foreground text-center">
                    This page needs a valid reset link (token) from your email.
                  </p>
                )}

                <div className="pt-2 text-center">
                  <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;

