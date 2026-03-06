import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";

type CandidateForm = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  pincode: string;
  mobile: string;
  email: string;
  linkedinUrl: string;
  portfolioUrl: string;
  highestQualification: string;
  experienceStatus: "fresher" | "experienced";
  currentCompany: string;
  designation: string;
  totalExperience: string;
  industry: string;
  currentCtcLpa: string;
  expectedCtcLpa: string;
  minimumCtcLpa: string;
  noticePeriod: string;
  lastWorkingDay: string;
  preferredLocation: string;
  preferredIndustry: string;
  preferredRole: string;
  password: string;
  confirmPassword: string;
};

const initialForm: CandidateForm = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  pincode: "",
  mobile: "",
  email: "",
  linkedinUrl: "",
  portfolioUrl: "",
  highestQualification: "",
  experienceStatus: "fresher",
  currentCompany: "",
  designation: "",
  totalExperience: "",
  industry: "",
  currentCtcLpa: "",
  expectedCtcLpa: "",
  minimumCtcLpa: "",
  noticePeriod: "",
  lastWorkingDay: "",
  preferredLocation: "",
  preferredIndustry: "",
  preferredRole: "",
  password: "",
  confirmPassword: "",
};

const CandidateRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CandidateForm>(initialForm);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [representationAuthorized, setRepresentationAuthorized] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsingResume, setParsingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const servingNotice = form.noticePeriod === "Serving Notice Period";
  const isExperienced = form.experienceStatus === "experienced";

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "block mb-1.5 text-sm font-medium text-foreground";

  const sectionHeader = (n: number, title: string, icon: string) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}
      >
        {n}
      </div>
      <span className="text-lg font-display font-semibold text-foreground">
        {icon} {title}
      </span>
    </div>
  );

  const canSubmit = useMemo(
    () =>
      declarationAccepted &&
      representationAuthorized &&
      workModes.length > 0 &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.password) &&
      form.password === form.confirmPassword,
    [declarationAccepted, representationAuthorized, workModes.length, form.password, form.confirmPassword],
  );

  const onChange = (key: keyof CandidateForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const toggleWorkMode = (mode: string) => {
    setWorkModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleResumeParse = async (file: File) => {
    setParsingResume(true);
    setServerError("");
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const json = await apiPost<{
        success: boolean;
        data?: {
          parsed?: {
            fullName?: string;
            dateOfBirth?: string;
            gender?: string;
            address?: string;
            pincode?: string;
            email?: string;
            mobile?: string;
            linkedinUrl?: string;
            portfolioUrl?: string;
            highestQualification?: string;
            experienceStatus?: "fresher" | "experienced";
            currentCompany?: string;
            designation?: string;
            totalExperience?: string;
            industry?: string;
            currentCtcLpa?: string;
            expectedCtcLpa?: string;
            minimumCtcLpa?: string;
            noticePeriod?: string;
            lastWorkingDay?: string;
            preferredLocation?: string;
            preferredIndustry?: string;
            preferredRole?: string;
            workModes?: Array<"On-site" | "Hybrid" | "Remote">;
          };
        };
      }>(
        "/resumes/parse",
        fd,
      );
      if (!json?.success) throw new Error("Resume parsing failed");

      const parsed = json.data?.parsed || {};
      setForm((prev) => ({
        ...prev,
        fullName: parsed.fullName || prev.fullName,
        dateOfBirth: parsed.dateOfBirth || prev.dateOfBirth,
        gender: parsed.gender || prev.gender,
        address: parsed.address || prev.address,
        pincode: parsed.pincode || prev.pincode,
        email: parsed.email || prev.email,
        mobile: parsed.mobile || prev.mobile,
        linkedinUrl: parsed.linkedinUrl || prev.linkedinUrl,
        portfolioUrl: parsed.portfolioUrl || prev.portfolioUrl,
        highestQualification: parsed.highestQualification || prev.highestQualification,
        experienceStatus:
          parsed.experienceStatus === "experienced" || parsed.experienceStatus === "fresher"
            ? parsed.experienceStatus
            : prev.experienceStatus,
        currentCompany: parsed.currentCompany || prev.currentCompany,
        designation: parsed.designation || prev.designation,
        totalExperience: parsed.totalExperience || prev.totalExperience,
        industry: parsed.industry || prev.industry,
        currentCtcLpa: parsed.currentCtcLpa || prev.currentCtcLpa,
        expectedCtcLpa: parsed.expectedCtcLpa || prev.expectedCtcLpa,
        minimumCtcLpa: parsed.minimumCtcLpa || prev.minimumCtcLpa,
        noticePeriod: parsed.noticePeriod || prev.noticePeriod,
        lastWorkingDay: parsed.lastWorkingDay || prev.lastWorkingDay,
        preferredLocation: parsed.preferredLocation || prev.preferredLocation,
        preferredIndustry: parsed.preferredIndustry || prev.preferredIndustry,
        preferredRole: parsed.preferredRole || prev.preferredRole,
      }));
      if (parsed.workModes?.length) {
        setWorkModes((prev) =>
          [...new Set([...prev, ...parsed.workModes])].filter((m) =>
            ["On-site", "Hybrid", "Remote"].includes(m),
          ),
        );
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Resume parsing failed");
    } finally {
      setParsingResume(false);
    }
  };

  const downloadBase64File = (base64: string, fileName: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) byteNumbers[i] = byteCharacters.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        portfolioUrl: form.portfolioUrl.trim(),
        highestQualification: form.highestQualification,
        experienceStatus: form.experienceStatus,
        preferences: {
          preferredLocation: form.preferredLocation.trim(),
          preferredIndustry: form.preferredIndustry.trim(),
          preferredRole: form.preferredRole.trim(),
          workModes,
        },
        declarationAccepted,
        representationAuthorized,
      };

      if (isExperienced) {
        payload.experienceDetails = {
          currentCompany: form.currentCompany.trim(),
          designation: form.designation.trim(),
          totalExperience: form.totalExperience.trim(),
          industry: form.industry.trim(),
          currentCtcLpa: Number(form.currentCtcLpa || 0),
          expectedCtcLpa: Number(form.expectedCtcLpa || 0),
          minimumCtcLpa: Number(form.minimumCtcLpa || 0),
          noticePeriod: form.noticePeriod,
          lastWorkingDay: form.lastWorkingDay || undefined,
        };
      }

      if (resumeFile) {
        payload.resume = {
          fileName: resumeFile.name,
          mimeType: resumeFile.type,
          dataBase64: await toBase64(resumeFile),
        };
      }

      const json = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
          generatedResume?: { dataBase64?: string; fileName?: string; mimeType?: string };
        };
      }>("/auth/register/candidate", payload);
      if (!json?.success || !json.data?.accessToken || !json.data.user) throw new Error("Registration failed");

      if (!resumeFile && json?.data?.generatedResume?.dataBase64) {
        downloadBase64File(
          json.data.generatedResume.dataBase64,
          json.data.generatedResume.fileName || "RecruitKr_Resume.pdf",
          json.data.generatedResume.mimeType || "application/pdf",
        );
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
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}
          >
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">Registration Submitted!</h2>
          <p className="text-muted-foreground">Redirecting you to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground mb-4">
              <span style={{ color: "#69a44f" }}>●</span> Candidate Registration
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">Join as a Candidate</h1>
            <p className="text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(0, "Resume Upload (Auto Fill)", "📄")}
              <p className="text-sm text-muted-foreground mb-4">
                Upload PDF/DOCX resume to auto-fill matching fields. Remaining fields can be entered manually.
              </p>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className={inputClass}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setResumeFile(file);
                  if (file) handleResumeParse(file);
                }}
              />
              {parsingResume && <p className="mt-3 text-sm text-muted-foreground">Parsing resume and filling fields...</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(1, "Basic Details", "👤")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><label className={labelClass}>Full Name *</label><input required className={inputClass} value={form.fullName} onChange={onChange("fullName")} /></div>
                <div><label className={labelClass}>Date of Birth *</label><input type="date" required className={inputClass} value={form.dateOfBirth} onChange={onChange("dateOfBirth")} /></div>
                <div><label className={labelClass}>Gender *</label><select required className={inputClass} value={form.gender} onChange={onChange("gender")}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer Not to Say</option></select></div>
                <div className="md:col-span-2"><label className={labelClass}>Current Address *</label><textarea required rows={3} className={inputClass} value={form.address} onChange={onChange("address")} /></div>
                <div><label className={labelClass}>PINCODE *</label><input required className={inputClass} value={form.pincode} onChange={onChange("pincode")} /></div>
                <div><label className={labelClass}>Mobile Number *</label><input required className={inputClass} value={form.mobile} onChange={onChange("mobile")} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Email ID *</label><input type="email" required className={inputClass} value={form.email} onChange={onChange("email")} /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(2, "Professional Profile Links", "🔗")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>LinkedIn</label><input type="url" className={inputClass} value={form.linkedinUrl} onChange={onChange("linkedinUrl")} /></div>
                <div><label className={labelClass}>Portfolio</label><input type="url" className={inputClass} value={form.portfolioUrl} onChange={onChange("portfolioUrl")} /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(3, "Education", "🎓")}
              <label className={labelClass}>Highest Qualification *</label>
              <select required className={inputClass} value={form.highestQualification} onChange={onChange("highestQualification")}>
                <option value="">Select qualification</option>
                <option>10th Pass</option><option>12th Pass</option><option>Diploma</option><option>ITI</option>
                <option>Graduate (BA/BCom/BSc/BBA/BCA etc.)</option><option>B.Tech / BE</option><option>MBA / PGDM</option>
                <option>Postgraduate (MA/MCom/MSc etc.)</option><option>M.Tech</option><option>Doctorate / PhD</option><option>Other</option>
              </select>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(4, "Experience Status", "💼")}
              <div className="flex gap-4 mt-2">
                {["fresher", "experienced"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={form.experienceStatus === opt} onChange={() => setForm((p) => ({ ...p, experienceStatus: opt as "fresher" | "experienced" }))} />
                    <span className="text-sm font-medium">{opt === "fresher" ? "Fresher" : "Experienced"}</span>
                  </label>
                ))}
              </div>
            </div>

            {isExperienced && (
              <div className="rounded-2xl border bg-card p-6 md:p-8" style={{ borderColor: "#264a7f50" }}>
                {sectionHeader(5, "Experience Details", "📋")}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Current Company *</label><input required={isExperienced} className={inputClass} value={form.currentCompany} onChange={onChange("currentCompany")} /></div>
                  <div><label className={labelClass}>Current Designation *</label><input required={isExperienced} className={inputClass} value={form.designation} onChange={onChange("designation")} /></div>
                  <div><label className={labelClass}>Total Experience *</label><input required={isExperienced} className={inputClass} value={form.totalExperience} onChange={onChange("totalExperience")} /></div>
                  <div><label className={labelClass}>Industry *</label><input required={isExperienced} className={inputClass} value={form.industry} onChange={onChange("industry")} /></div>
                  <div><label className={labelClass}>Current CTC *</label><input type="number" required={isExperienced} className={inputClass} value={form.currentCtcLpa} onChange={onChange("currentCtcLpa")} /></div>
                  <div><label className={labelClass}>Expected CTC *</label><input type="number" required={isExperienced} className={inputClass} value={form.expectedCtcLpa} onChange={onChange("expectedCtcLpa")} /></div>
                  <div><label className={labelClass}>Minimum Acceptable CTC *</label><input type="number" required={isExperienced} className={inputClass} value={form.minimumCtcLpa} onChange={onChange("minimumCtcLpa")} /></div>
                  <div>
                    <label className={labelClass}>Notice Period *</label>
                    <select required={isExperienced} className={inputClass} value={form.noticePeriod} onChange={onChange("noticePeriod")}>
                      <option value="">Select notice period</option>
                      <option>Immediate Joiner</option><option>15 Days</option><option>30 Days</option><option>60 Days</option><option>90 Days</option><option>Serving Notice Period</option>
                    </select>
                  </div>
                  {servingNotice && <div><label className={labelClass}>Last Working Day *</label><input type="date" required className={inputClass} value={form.lastWorkingDay} onChange={onChange("lastWorkingDay")} /></div>}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(6, "Job Preferences", "🎯")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Preferred Location *</label><input required className={inputClass} value={form.preferredLocation} onChange={onChange("preferredLocation")} /></div>
                <div><label className={labelClass}>Preferred Industry *</label><input required className={inputClass} value={form.preferredIndustry} onChange={onChange("preferredIndustry")} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Preferred Role *</label><input required className={inputClass} value={form.preferredRole} onChange={onChange("preferredRole")} /></div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Work Mode * (Select at least one)</label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["On-site", "Hybrid", "Remote"].map((mode) => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={workModes.includes(mode)} onChange={() => toggleWorkMode(mode)} />
                        <span className="text-sm font-medium">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(7, "Declaration", "📜")}
              <label className="flex items-start gap-3 cursor-pointer mb-4">
                <input type="checkbox" checked={declarationAccepted} onChange={(e) => setDeclarationAccepted(e.target.checked)} className="mt-1 w-4 h-4" />
                <span className="text-sm font-medium">I Agree to the declaration *</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={representationAuthorized} onChange={(e) => setRepresentationAuthorized(e.target.checked)} className="mt-1 w-4 h-4" />
                <span className="text-sm font-medium">I Authorize representation *</span>
              </label>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-display font-semibold mb-5">🔐 Create Account Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Password *</label><input type="password" required minLength={8} className={inputClass} value={form.password} onChange={onChange("password")} /></div>
                <div><label className={labelClass}>Confirm Password *</label><input type="password" required minLength={8} className={inputClass} value={form.confirmPassword} onChange={onChange("confirmPassword")} /></div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Use at least 8 chars with uppercase, lowercase, number, and special character.</p>
              {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-3 text-sm text-red-500">Passwords do not match.</p>
              )}
            </div>

            {serverError && <p className="text-sm text-red-500 text-center">{serverError}</p>}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full rounded-xl py-4 text-base font-bold text-white transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #264a7f 0%, #69a44f 100%)" }}
            >
              {submitting ? "Submitting..." : "Submit Candidate Registration"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#264a7f" }}>
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CandidateRegister;
