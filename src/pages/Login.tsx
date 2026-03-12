import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"candidate" | "client">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        role: userType,
      });

      if (!response.success || !response.data?.accessToken || !response.data.user) {
        throw new Error("Login failed");
      }

      setSession({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      });

      navigate(userType === "candidate" ? "/dashboard/candidate" : "/dashboard/client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

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
              <p className="mt-2 text-muted-foreground text-sm">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
            </div>

            <div className="flex rounded-xl overflow-hidden border border-border mb-8">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-semibold transition-all ${userType === "candidate" ? "btn-gradient" : "text-muted-foreground"}`}
                onClick={() => setUserType("candidate")}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-semibold transition-all ${userType === "client" ? "btn-gradient" : "text-muted-foreground"}`}
                onClick={() => setUserType("client")}
              >
                Employer
              </button>
            </div>

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
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your password"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
              >
                {loading ? "Logging in..." : `Login as ${userType === "candidate" ? "Candidate" : "Employer"}`}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
              <p className="text-sm text-muted-foreground">Don't have an account?</p>
              <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                <Link to="/register/candidate" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                  Register as Candidate
                </Link>
                <span className="hidden text-muted-foreground sm:inline">|</span>
                <Link to="/register/client" className="text-sm font-medium hover:underline" style={{ color: "#69a44f" }}>
                  Register as Employer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
