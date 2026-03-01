import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"candidate" | "client">("candidate");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "candidate") navigate("/dashboard/candidate");
    else navigate("/dashboard/client");
  };

  const inputClass = "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 transition-colors";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 min-h-screen flex items-center">
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="font-display text-3xl font-bold">
                Recruit<span style={{ color: "#264a7f" }}>kr</span>
              </Link>
              <p className="mt-2 text-muted-foreground text-sm">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
            </div>

            {/* User Type Tabs */}
            <div className="flex rounded-xl overflow-hidden border border-border mb-8">
              <button
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={userType === "candidate" ? { background: "linear-gradient(135deg, #264a7f, #69a44f)", color: "white" } : { color: "hsl(var(--muted-foreground))" }}
                onClick={() => setUserType("candidate")}
              >
                🎓 Candidate
              </button>
              <button
                className="flex-1 py-3 text-sm font-semibold transition-all"
                style={userType === "client" ? { background: "linear-gradient(135deg, #e59f56, #264a7f)", color: "white" } : { color: "hsl(var(--muted-foreground))" }}
                onClick={() => setUserType("client")}
              >
                🏢 Employer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-foreground">Email ID</label>
                <input
                  type="email"
                  required
                  className={inputClass}
                  style={{ ["--tw-ring-color" as string]: userType === "candidate" ? "#264a7f" : "#e59f56" }}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  required
                  className={inputClass}
                  placeholder="Enter your password"
                />
                <div className="text-right mt-1.5">
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Forgot password?</a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ background: userType === "candidate" ? "linear-gradient(135deg, #264a7f, #69a44f)" : "linear-gradient(135deg, #e59f56, #264a7f)" }}
              >
                Login as {userType === "candidate" ? "Candidate" : "Employer"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
              <p className="text-sm text-muted-foreground">Don't have an account?</p>
              <div className="flex gap-3 justify-center">
                <Link to="/register/candidate" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                  Register as Candidate
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link to="/register/client" className="text-sm font-medium hover:underline" style={{ color: "#e59f56" }}>
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
