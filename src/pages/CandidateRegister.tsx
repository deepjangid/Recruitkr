import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { setSession } from "@/lib/auth";
import { apiPost } from "@/lib/api";

type CandidateForm = {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: CandidateForm = {
  fullName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const retryMessage = "Connection issue, retrying...";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CandidateForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
  const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500";
  const isPasswordValid = (value: string) => value.length >= 8;

  const onRetry = () => setStatusMessage(retryMessage);

  const getFieldError = (field: keyof CandidateForm) => {
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
        return isPasswordValid(form.password) ? "" : "Use at least 8 characters.";
      case "confirmPassword":
        if (!form.confirmPassword) return "Please confirm your password.";
        return form.password === form.confirmPassword ? "" : "Passwords must match.";
      default:
        return "";
    }
  };

  const getInputClasses = (field: keyof CandidateForm) =>
    `${inputClass} ${getFieldError(field) ? errorInputClass : ""}`.trim();

  const canSubmit = useMemo(
    () =>
      form.fullName.trim().length >= 2 &&
      /^\d{10}$/.test(form.mobile.trim()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      isPasswordValid(form.password) &&
      form.password === form.confirmPassword,
    [form.fullName, form.mobile, form.email, form.password, form.confirmPassword],
  );

  const onChange =
    (key: keyof CandidateForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value =
        key === "mobile" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError("");
    setStatusMessage("");

    if (!canSubmit) return;

    setSubmitting(true);

    try {
      setStatusMessage("Creating your account...");

      const json = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>(
        "/auth/register/candidate",
        {
          fullName: form.fullName.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
        { onRetry },
      );

      if (!json?.success || !json.data?.accessToken || !json.data.user) {
        throw new Error("Registration failed");
      }

      setSession({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        user: json.data.user,
      });

      setSubmitted(true);
      setTimeout(() => navigate("/dashboard/candidate"), 1200);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Registration failed");
      setStatusMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: "var(--brand-gradient)" }}
          >
            <span className="text-3xl font-bold text-white">OK</span>
          </div>
          <h2 className="mb-3 font-heading text-3xl font-bold">Registration Complete</h2>
          <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center pb-20 pt-28">
        <div className="container mx-auto max-w-md px-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground">
                <span style={{ color: "#69a44f" }}>●</span> Candidate Registration
              </div>
              <h1 className="mb-2 font-heading text-2xl font-bold sm:text-3xl">Join as a Candidate</h1>
              <p className="text-sm text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  className={getInputClasses("fullName")}
                  value={form.fullName}
                  onChange={onChange("fullName")}
                  placeholder="Your full name"
                />
                {getFieldError("fullName") ? <p className="mt-1.5 text-xs text-red-500">{getFieldError("fullName")}</p> : null}
              </div>

              <div>
                <label className={labelClass}>Mobile Number *</label>
                <input
                  inputMode="numeric"
                  className={getInputClasses("mobile")}
                  value={form.mobile}
                  onChange={onChange("mobile")}
                  maxLength={10}
                  placeholder="10 digit number"
                />
                {getFieldError("mobile") ? <p className="mt-1.5 text-xs text-red-500">{getFieldError("mobile")}</p> : null}
              </div>

              <div>
                <label className={labelClass}>Email ID *</label>
                <input
                  type="email"
                  className={getInputClasses("email")}
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder="your@email.com"
                />
                {getFieldError("email") ? <p className="mt-1.5 text-xs text-red-500">{getFieldError("email")}</p> : null}
              </div>

              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    className={`${getInputClasses("password")} pr-20`}
                    value={form.password}
                    onChange={onChange("password")}
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
                {getFieldError("password") ? <p className="mt-1.5 text-xs text-red-500">{getFieldError("password")}</p> : null}
              </div>

              <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    className={`${getInputClasses("confirmPassword")} pr-20`}
                    value={form.confirmPassword}
                    onChange={onChange("confirmPassword")}
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
                {getFieldError("confirmPassword") ? <p className="mt-1.5 text-xs text-red-500">{getFieldError("confirmPassword")}</p> : null}
              </div>

              {statusMessage ? (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
                  <span>{statusMessage}</span>
                </div>
              ) : null}
              {serverError ? <p className="text-sm text-red-500">{serverError}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient w-full rounded-xl py-3.5 text-base font-bold transition-all hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating account..." : "Create Candidate Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#264a7f" }}>
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

export default CandidateRegister;
