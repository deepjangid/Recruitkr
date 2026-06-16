import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";

type ClientForm = {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: ClientForm = {
  fullName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const ClientRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "block mb-1.5 text-sm font-medium text-foreground";
  const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500";

  const canSubmit = useMemo(
    () =>
      form.fullName.trim().length >= 2 &&
      /^\d{10}$/.test(form.mobile.trim()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      form.password.length >= 8 &&
      form.password === form.confirmPassword,
    [form.fullName, form.mobile, form.email, form.password, form.confirmPassword],
  );

  const getFieldError = (field: keyof ClientForm) => {
    if (!submitAttempted) return "";

    switch (field) {
      case "fullName":
        return form.fullName.trim().length >= 2 ? "" : "Enter your full name.";
      case "mobile":
        return /^\d{10}$/.test(form.mobile.trim()) ? "" : "Enter a valid 10 digit mobile number.";
      case "email":
        if (!form.email.trim()) return "Email is required.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "" : "Enter a valid email address.";
      case "password":
        if (!form.password) return "Password is required.";
        return form.password.length >= 8 ? "" : "Use at least 8 characters.";
      case "confirmPassword":
        if (!form.confirmPassword) return "Please confirm your password.";
        return form.password === form.confirmPassword ? "" : "Passwords do not match.";
      default:
        return "";
    }
  };

  const getInputClasses = (field: keyof ClientForm) =>
    `${inputClass} ${getFieldError(field) ? errorInputClass : ""}`.trim();

  const handleChange =
    (key: keyof ClientForm) => (e: ChangeEvent<HTMLInputElement>) => {
      const value =
        key === "mobile" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!canSubmit) {
      setError("Please fill in all fields with a valid email and an 8+ character password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const registerResponse = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>("/auth/register/client", {
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        spoc: {
          name: form.fullName.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim().toLowerCase(),
        },
      });

      if (!registerResponse.success || !registerResponse.data?.accessToken || !registerResponse.data.user) {
        throw new Error("Registration failed");
      }

      setSession({
        accessToken: registerResponse.data.accessToken,
        refreshToken: registerResponse.data.refreshToken,
        user: registerResponse.data.user,
      });

      setSubmitted(true);
      setTimeout(() => navigate("/dashboard/client"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--brand-gradient)" }}>
            <span className="text-3xl sm:text-4xl">✓</span>
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3">Registration Complete!</h2>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center pt-28 pb-20">
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground mb-4">
                <span style={{ color: "#69a44f" }}>●</span> Employer / Client Registration
              </div>
              <h1 className="font-heading text-2xl font-bold mb-2 sm:text-3xl">Create an Employer Account</h1>
              <p className="text-sm text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  className={getInputClasses("fullName")}
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  placeholder="Your full name"
                />
                {getFieldError("fullName") && <p className="mt-1.5 text-xs text-red-500">{getFieldError("fullName")}</p>}
              </div>

              <div>
                <label className={labelClass}>Mobile Number *</label>
                <input
                  inputMode="numeric"
                  className={getInputClasses("mobile")}
                  value={form.mobile}
                  onChange={handleChange("mobile")}
                  maxLength={10}
                  placeholder="10 digit number"
                />
                {getFieldError("mobile") && <p className="mt-1.5 text-xs text-red-500">{getFieldError("mobile")}</p>}
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  className={getInputClasses("email")}
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="your@email.com"
                />
                {getFieldError("email") && <p className="mt-1.5 text-xs text-red-500">{getFieldError("email")}</p>}
              </div>

              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    className={`${getInputClasses("password")} pr-20`}
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {getFieldError("password") && <p className="mt-1.5 text-xs text-red-500">{getFieldError("password")}</p>}
              </div>

              <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    className={`${getInputClasses("confirmPassword")} pr-20`}
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {getFieldError("confirmPassword") && <p className="mt-1.5 text-xs text-red-500">{getFieldError("confirmPassword")}</p>}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient w-full rounded-xl py-3.5 text-base font-bold transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-60"
              >
                {submitting ? "Creating account..." : "Create Employer Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#69a44f" }}>
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientRegister;
