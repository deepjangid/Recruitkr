import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDone(false);

    try {
      await apiPost<{ success: boolean; message?: string }>("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
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
              <p className="mt-2 text-muted-foreground text-sm">Reset your password</p>
            </div>

            {done ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-foreground">
                  If an account exists for this email, we&apos;ve sent a password reset link.
                </p>
                <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-foreground">Email ID</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

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

export default ForgotPassword;

