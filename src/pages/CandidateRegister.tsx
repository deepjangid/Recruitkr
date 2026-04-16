import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { normalizeOptionalHttpUrl, normalizeOptionalLinkedinUrl } from "@/lib/url";

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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const servingNotice = form.noticePeriod === "Serving Notice Period";
  const isExperienced = form.experienceStatus === "experienced";

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "block mb-1.5 text-sm font-medium text-foreground";
  const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500";
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

  const getFieldError = (
    field:
      | keyof CandidateForm
      | "workModes"
      | "declarationAccepted"
      | "representationAuthorized",
  ) => {
    if (!submitAttempted) return "";

    switch (field) {
      case "fullName":
      case "dateOfBirth":
      case "gender":
      case "address":
      case "highestQualification":
      case "preferredLocation":
      case "preferredIndustry":
      case "preferredRole":
        return form[field].trim() ? "" : "This field is required.";
      case "pincode":
        if (!form.pincode.trim()) return "Pincode is required.";
        return /^\d{6}$/.test(form.pincode.trim()) ? "" : "Enter a valid 6 digit pincode.";
      case "mobile":
        if (!form.mobile.trim()) return "Mobile number is required.";
        return /^\d{10}$/.test(form.mobile.trim()) ? "" : "Enter a valid 10 digit mobile number.";
      case "email":
        if (!form.email.trim()) return "Email is required.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "" : "Enter a valid email address.";
      case "linkedinUrl":
        if (!form.linkedinUrl.trim()) return "";
        return normalizeOptionalLinkedinUrl(form.linkedinUrl) ? "" : "Enter a valid LinkedIn URL.";
      case "portfolioUrl":
        if (!form.portfolioUrl.trim()) return "";
        return normalizeOptionalHttpUrl(form.portfolioUrl) ? "" : "Enter a valid portfolio URL.";
      case "currentCompany":
      case "designation":
      case "totalExperience":
      case "industry":
      case "currentCtcLpa":
      case "expectedCtcLpa":
      case "minimumCtcLpa":
      case "noticePeriod":
        if (!isExperienced) return "";
        return form[field].trim() ? "" : "This field is required for experienced candidates.";
      case "lastWorkingDay":
        if (!isExperienced || !servingNotice) return "";
        return form.lastWorkingDay ? "" : "Please select your last working day.";
      case "workModes":
        return workModes.length > 0 ? "" : "Select at least one work mode.";
      case "declarationAccepted":
        return declarationAccepted ? "" : "Please accept the declaration.";
      case "representationAuthorized":
        return representationAuthorized ? "" : "Please authorize representation.";
      case "password":
        if (!form.password) return "Password is required.";
        return passwordRegex.test(form.password)
          ? ""
          : "Use 8+ characters with uppercase, lowercase, number, and special character.";
      case "confirmPassword":
        if (!form.confirmPassword) return "Please confirm your password.";
        return form.password === form.confirmPassword ? "" : "Passwords must match and include special characters (@ # $ %).";
      default:
        return "";
    }
  };

  const getInputClasses = (field: Parameters<typeof getFieldError>[0]) =>
    `${inputClass} ${getFieldError(field) ? errorInputClass : ""}`.trim();

  const sectionHeader = (n: number, title: string, icon: string) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
        style={{ background: "var(--brand-gradient)" }}
      >
        {n}
      </div>
      <span className="text-lg font-heading font-semibold text-foreground">
        {icon} {title}
      </span>
    </div>
  );

  const canSubmit = useMemo(
    () =>
      declarationAccepted &&
      representationAuthorized &&
      workModes.length > 0 &&
      passwordRegex.test(form.password) &&
      form.password === form.confirmPassword,
    [declarationAccepted, representationAuthorized, workModes.length, form.password, form.confirmPassword],
  );

  const onChange = (key: keyof CandidateForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const normalizeProfileLink = (key: "linkedinUrl" | "portfolioUrl") => () => {
    const normalizer = key === "linkedinUrl" ? normalizeOptionalLinkedinUrl : normalizeOptionalHttpUrl;
    const normalized = normalizer(form[key]);
    if (normalized === null) return;

    setForm((prev) => ({
      ...prev,
      [key]: normalized,
    }));
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
    setSubmitAttempted(true);
    setServerError("");
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const linkedinUrl = normalizeOptionalLinkedinUrl(form.linkedinUrl);
      const portfolioUrl = normalizeOptionalHttpUrl(form.portfolioUrl);

      if (linkedinUrl === null || portfolioUrl === null) {
        return;
      }

      const payload: Record<string, unknown> = {
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: form.address.trim(),
        pincode: form.pincode.trim(),
        linkedinUrl,
        portfolioUrl,
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
            style={{ background: "var(--brand-gradient)" }}
          >
            <span className="text-3xl sm:text-4xl">✓</span>
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3">Registration Submitted!</h2>
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
            <h1 className="font-heading text-3xl font-bold mb-3 sm:text-4xl">Join as a Candidate</h1>
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
                <div className="md:col-span-2"><label className={labelClass}>Full Name *</label><input required className={getInputClasses("fullName")} value={form.fullName} onChange={onChange("fullName")} />{getFieldError("fullName") && <p className="mt-2 text-xs text-red-500">{getFieldError("fullName")}</p>}</div>
                <div><label className={labelClass}>Date of Birth *</label><input type="date" required className={getInputClasses("dateOfBirth")} value={form.dateOfBirth} onChange={onChange("dateOfBirth")} />{getFieldError("dateOfBirth") && <p className="mt-2 text-xs text-red-500">{getFieldError("dateOfBirth")}</p>}</div>
                <div><label className={labelClass}>Gender *</label><select required className={getInputClasses("gender")} value={form.gender} onChange={onChange("gender")}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option><option>Prefer Not to Say</option></select>{getFieldError("gender") && <p className="mt-2 text-xs text-red-500">{getFieldError("gender")}</p>}</div>
                <div className="md:col-span-2"><label className={labelClass}>Current Address *</label><textarea required rows={3} className={getInputClasses("address")} value={form.address} onChange={onChange("address")} />{getFieldError("address") && <p className="mt-2 text-xs text-red-500">{getFieldError("address")}</p>}</div>
                <div><label className={labelClass}>PINCODE *</label><input required className={getInputClasses("pincode")} value={form.pincode} onChange={onChange("pincode")} />{getFieldError("pincode") && <p className="mt-2 text-xs text-red-500">{getFieldError("pincode")}</p>}</div>
                <div><label className={labelClass}>Mobile Number *</label><input required className={getInputClasses("mobile")} value={form.mobile} onChange={onChange("mobile")} />{getFieldError("mobile") && <p className="mt-2 text-xs text-red-500">{getFieldError("mobile")}</p>}</div>
                <div className="md:col-span-2"><label className={labelClass}>Email ID *</label><input type="email" required className={getInputClasses("email")} value={form.email} onChange={onChange("email")} />{getFieldError("email") && <p className="mt-2 text-xs text-red-500">{getFieldError("email")}</p>}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(2, "Professional Profile Links", "🔗")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>LinkedIn</label>
                  <input
                    type="text"
                    inputMode="url"
                    placeholder="linkedin.com/in/your-profile"
                    className={getInputClasses("linkedinUrl")}
                    value={form.linkedinUrl}
                    onChange={onChange("linkedinUrl")}
                    onBlur={normalizeProfileLink("linkedinUrl")}
                  />
                  {getFieldError("linkedinUrl") && <p className="mt-2 text-xs text-red-500">{getFieldError("linkedinUrl")}</p>}
                </div>
                <div>
                  <label className={labelClass}>Portfolio</label>
                  <input
                    type="text"
                    inputMode="url"
                    placeholder="yourportfolio.com"
                    className={getInputClasses("portfolioUrl")}
                    value={form.portfolioUrl}
                    onChange={onChange("portfolioUrl")}
                    onBlur={normalizeProfileLink("portfolioUrl")}
                  />
                  {getFieldError("portfolioUrl") && <p className="mt-2 text-xs text-red-500">{getFieldError("portfolioUrl")}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(3, "Education", "🎓")}
              <label className={labelClass}>Highest Qualification *</label>
              <select required className={getInputClasses("highestQualification")} value={form.highestQualification} onChange={onChange("highestQualification")}>
                <option value="">Select qualification</option>
                <option>10th Pass</option><option>12th Pass</option><option>Diploma</option><option>ITI</option>
                <option>Graduate (BA/BCom/BSc/BBA/BCA etc.)</option><option>B.Tech / BE</option><option>MBA / PGDM</option>
                <option>Postgraduate (MA/MCom/MSc etc.)</option><option>M.Tech</option><option>Doctorate / PhD</option><option>Other</option>
              </select>
              {getFieldError("highestQualification") && <p className="mt-2 text-xs text-red-500">{getFieldError("highestQualification")}</p>}
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
                  <div><label className={labelClass}>Current Company *</label><input required={isExperienced} className={getInputClasses("currentCompany")} value={form.currentCompany} onChange={onChange("currentCompany")} />{getFieldError("currentCompany") && <p className="mt-2 text-xs text-red-500">{getFieldError("currentCompany")}</p>}</div>
                  <div><label className={labelClass}>Current Designation *</label><input required={isExperienced} className={getInputClasses("designation")} value={form.designation} onChange={onChange("designation")} />{getFieldError("designation") && <p className="mt-2 text-xs text-red-500">{getFieldError("designation")}</p>}</div>
                  <div><label className={labelClass}>Total Experience *</label><input required={isExperienced} className={getInputClasses("totalExperience")} value={form.totalExperience} onChange={onChange("totalExperience")} />{getFieldError("totalExperience") && <p className="mt-2 text-xs text-red-500">{getFieldError("totalExperience")}</p>}</div>
                  <div><label className={labelClass}>Industry *</label><input required={isExperienced} className={getInputClasses("industry")} value={form.industry} onChange={onChange("industry")} />{getFieldError("industry") && <p className="mt-2 text-xs text-red-500">{getFieldError("industry")}</p>}</div>
                  <div><label className={labelClass}>Current CTC *</label><input type="number" required={isExperienced} className={inputClass} value={form.currentCtcLpa} onChange={onChange("currentCtcLpa")} /></div>
                  <div><label className={labelClass}>Expected CTC *</label><input type="number" required={isExperienced} className={inputClass} value={form.expectedCtcLpa} onChange={onChange("expectedCtcLpa")} /></div>
                  <div><label className={labelClass}>Minimum Acceptable CTC *</label><input type="number" required={isExperienced} className={inputClass} value={form.minimumCtcLpa} onChange={onChange("minimumCtcLpa")} /></div>
                  <div>
                    <label className={labelClass}>Notice Period *</label>
                    <select required={isExperienced} className={getInputClasses("noticePeriod")} value={form.noticePeriod} onChange={onChange("noticePeriod")}>
                      <option value="">Select notice period</option>
                      <option>Immediate Joiner</option><option>15 Days</option><option>30 Days</option><option>60 Days</option><option>90 Days</option><option>Serving Notice Period</option>
                    </select>
                    {getFieldError("noticePeriod") && <p className="mt-2 text-xs text-red-500">{getFieldError("noticePeriod")}</p>}
                  </div>
                  {servingNotice && <div><label className={labelClass}>Last Working Day *</label><input type="date" required className={getInputClasses("lastWorkingDay")} value={form.lastWorkingDay} onChange={onChange("lastWorkingDay")} />{getFieldError("lastWorkingDay") && <p className="mt-2 text-xs text-red-500">{getFieldError("lastWorkingDay")}</p>}</div>}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(6, "Job Preferences", "🎯")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Preferred Location *</label><input required className={getInputClasses("preferredLocation")} value={form.preferredLocation} onChange={onChange("preferredLocation")} />{getFieldError("preferredLocation") && <p className="mt-2 text-xs text-red-500">{getFieldError("preferredLocation")}</p>}</div>
                <div><label className={labelClass}>Preferred Industry *</label><input required className={getInputClasses("preferredIndustry")} value={form.preferredIndustry} onChange={onChange("preferredIndustry")} />{getFieldError("preferredIndustry") && <p className="mt-2 text-xs text-red-500">{getFieldError("preferredIndustry")}</p>}</div>
                <div className="md:col-span-2"><label className={labelClass}>Preferred Role *</label><input required className={getInputClasses("preferredRole")} value={form.preferredRole} onChange={onChange("preferredRole")} />{getFieldError("preferredRole") && <p className="mt-2 text-xs text-red-500">{getFieldError("preferredRole")}</p>}</div>
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
                  {getFieldError("workModes") && <p className="mt-2 text-xs text-red-500">{getFieldError("workModes")}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(7, "Declaration", "📜")}
              <label className="flex items-start gap-3 cursor-pointer mb-4">
                <input type="checkbox" checked={declarationAccepted} onChange={(e) => setDeclarationAccepted(e.target.checked)} className="mt-1 w-4 h-4" />
                <span className="text-sm font-medium">I Agree to the declaration *</span>
              </label>
              {getFieldError("declarationAccepted") && <p className="mb-3 text-xs text-red-500">{getFieldError("declarationAccepted")}</p>}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={representationAuthorized} onChange={(e) => setRepresentationAuthorized(e.target.checked)} className="mt-1 w-4 h-4" />
                <span className="text-sm font-medium">I Authorize representation *</span>
              </label>
              {getFieldError("representationAuthorized") && <p className="mt-3 text-xs text-red-500">{getFieldError("representationAuthorized")}</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold mb-5">🔐 Create Account Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className={`${getInputClasses("password")} pr-20`}
                      value={form.password}
                      onChange={onChange("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className={`${getInputClasses("confirmPassword")} pr-20`}
                      value={form.confirmPassword}
                      onChange={onChange("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Use at least 8 chars with uppercase, lowercase, number, and special character.</p>
              {getFieldError("password") && <p className="mt-3 text-sm text-red-500">{getFieldError("password")}</p>}
              {getFieldError("confirmPassword") && <p className="mt-3 text-sm text-red-500">{getFieldError("confirmPassword")}</p>}
              {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient w-full rounded-xl py-4 text-base font-bold transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed"
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
