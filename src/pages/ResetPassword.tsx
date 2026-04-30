import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { apiPost } from "@/lib/api";
import { getErrorMessage } from "@/lib/apiError";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ token?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [done, setDone] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = useMemo(
    () => params.token || new URLSearchParams(location.search).get("token") || "",
    [location.search, params.token],
  );

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");

    if (!token) {
      setPasswordError("This reset link is invalid or incomplete. Please request a new one.");
      return;
    }

    if (newPassword !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiPost<{ success: boolean; message?: string }>(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        { newPassword, confirmPassword: confirm },
      );
      setDone(true);
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const message = getErrorMessage(err, "We couldn't reset your password. Please try again.");
      if (/match/i.test(message)) {
        setConfirmError(message);
      } else {
        setPasswordError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center pt-28 pb-20">
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <Link to="/" className="font-heading text-3xl font-bold">
                Recruit<span style={{ color: "#264a7f" }}>kr</span>
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">Choose a new password</p>
            </div>

            {done ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-foreground">Password updated. Redirecting to login...</p>
                <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className={`${inputClass} pr-20`}
                      placeholder="Enter a strong password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setConfirmError("");
                      }}
                      className={`${inputClass} pr-20`}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {confirmError && <p className="mt-1.5 text-xs text-red-500">{confirmError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-gradient w-full rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Reset Password"}
                </button>

                {!token && (
                  <p className="text-center text-xs text-muted-foreground">
                    This page needs a valid reset link from your email.
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
