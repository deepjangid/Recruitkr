import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { setSession } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { normalizeOptionalHttpUrl, normalizeOptionalLinkedinUrl } from "@/lib/url";
import {
  uploadFile,
  uploadRules,
  validateUploadFile,
} from "@/lib/uploadFile";

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
  resumeSkillsText: string;
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
  resumeSkillsText: "",
  password: "",
  confirmPassword: "",
};

const retryMessage = "Connection issue, retrying...";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CandidateForm>(initialForm);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [representationAuthorized, setRepresentationAuthorized] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const servingNotice = form.noticePeriod === "Serving Notice Period";
  const isExperienced = form.experienceStatus === "experienced";

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";
  const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500";
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

  const onRetry = () => setStatusMessage(retryMessage);

  const getFieldError = (
    field:
      | keyof CandidateForm
      | "workModes"
      | "declarationAccepted"
      | "representationAuthorized"
      | "resumeFile",
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
      case "resumeFile":
        return "";
      case "password":
        if (!form.password) return "Password is required.";
        return passwordRegex.test(form.password)
          ? ""
          : "Use 8+ characters with uppercase, lowercase, number, and special character.";
      case "confirmPassword":
        if (!form.confirmPassword) return "Please confirm your password.";
        return form.password === form.confirmPassword ? "" : "Passwords must match.";
      default:
        return "";
    }
  };

  const getInputClasses = (field: Parameters<typeof getFieldError>[0]) =>
    `${inputClass} ${getFieldError(field) ? errorInputClass : ""}`.trim();

  const sectionHeader = (n: number, title: string) => (
    <div className="mb-6 flex items-center gap-3 border-b border-border pb-3">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ background: "var(--brand-gradient)" }}
      >
        {n}
      </div>
      <span className="font-heading text-lg font-semibold text-foreground">{title}</span>
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
  const showApiSpinner = uploadingResume || submitting;

  const onChange =
    (key: keyof CandidateForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const buildGeneratedResumeData = () => {
    const skills = form.resumeSkillsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const education = [
      {
        degree: form.highestQualification.trim(),
        institution: "",
        year: "",
        description: "",
      },
    ].filter((item) => item.degree);

    const experience =
      form.experienceStatus === "experienced"
        ? [
            {
              title: form.designation.trim(),
              company: form.currentCompany.trim(),
              duration: form.totalExperience.trim(),
              description: form.industry.trim(),
            },
          ].filter((item) => item.title || item.company || item.duration || item.description)
        : [];

    return {
      name: form.fullName.trim(),
      skills,
      education,
      experience,
    };
  };

  const handleResumeFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(null);
    setServerError("");
    setStatusMessage("");

    if (!file) return;

    try {
      validateUploadFile(file, "resumes");
      setResumeFile(file);
      setStatusMessage("Resume selected. It will upload when you submit the registration form.");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Invalid resume file");
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError("");
    setStatusMessage("");

    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const linkedinUrl = normalizeOptionalLinkedinUrl(form.linkedinUrl);
      const portfolioUrl = normalizeOptionalHttpUrl(form.portfolioUrl);

      if (linkedinUrl === null || portfolioUrl === null) {
        return;
      }

      let resumeAsset: Awaited<ReturnType<typeof uploadFile>> | null = null;

      if (resumeFile) {
        setUploadingResume(true);
        setStatusMessage("Uploading resume...");
        resumeAsset = await uploadFile(resumeFile, "resumes");
      }

      const resumeType = resumeAsset ? "uploaded" : "generated";

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
        resumeType,
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

      if (resumeType === "uploaded") {
        payload.resumeUrl = resumeAsset.url;
        payload.resumeFileId = resumeAsset.fileId;
        payload.resumeFileName = resumeFile?.name || "candidate_resume.pdf";
      } else {
        payload.resumeData = buildGeneratedResumeData();
      }

      setStatusMessage("Submitting registration...");

      const json = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>("/auth/register/candidate", payload, { onRetry });

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
      setUploadingResume(false);
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
          <h2 className="mb-3 font-heading text-3xl font-bold">Registration Submitted</h2>
          <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-20 pt-28">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground">
              <span style={{ color: "#69a44f" }}>*</span> Candidate Registration
            </div>
            <h1 className="mb-3 font-heading text-3xl font-bold sm:text-4xl">Join as a Candidate</h1>
            <p className="text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(0, "Resume")}
              <p className="mb-4 text-sm text-muted-foreground">
                Upload your resume PDF if you have one. If you skip it, the website will automatically create a resume from the form details.
              </p>
              <div className="mt-6">
                <label className={labelClass}>Resume PDF</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className={getInputClasses("resumeFile")}
                  onChange={handleResumeFileChange}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  PDF only. Maximum size {Math.round(uploadRules.resumeMaxBytes / (1024 * 1024))}MB. If you upload a file, it will be sent to ImageKit only when registration succeeds. If you skip upload, we create a resume from the form data.
                </p>
                {resumeFile ? <p className="mt-2 text-sm text-foreground">Selected: {resumeFile.name}</p> : null}
              </div>

              <div className="mt-6">
                <label className={labelClass}>Skills for Auto-Generated Resume</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Example: React, TypeScript, Sales, Operations"
                  value={form.resumeSkillsText}
                  onChange={onChange("resumeSkillsText")}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Add comma-separated skills. These details are used only when no PDF resume is uploaded.
                </p>
              </div>

              {uploadingResume ? <p className="mt-3 text-sm text-muted-foreground">Uploading resume to ImageKit...</p> : null}
              {statusMessage ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                  {showApiSpinner ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
                  <span>{statusMessage}</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(1, "Basic Details")}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Full Name *</label>
                  <input required className={getInputClasses("fullName")} value={form.fullName} onChange={onChange("fullName")} />
                  {getFieldError("fullName") ? <p className="mt-2 text-xs text-red-500">{getFieldError("fullName")}</p> : null}
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" required className={getInputClasses("dateOfBirth")} value={form.dateOfBirth} onChange={onChange("dateOfBirth")} />
                  {getFieldError("dateOfBirth") ? <p className="mt-2 text-xs text-red-500">{getFieldError("dateOfBirth")}</p> : null}
                </div>
                <div>
                  <label className={labelClass}>Gender *</label>
                  <select required className={getInputClasses("gender")} value={form.gender} onChange={onChange("gender")}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer Not to Say</option>
                  </select>
                  {getFieldError("gender") ? <p className="mt-2 text-xs text-red-500">{getFieldError("gender")}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Current Address *</label>
                  <textarea required rows={3} className={getInputClasses("address")} value={form.address} onChange={onChange("address")} />
                  {getFieldError("address") ? <p className="mt-2 text-xs text-red-500">{getFieldError("address")}</p> : null}
                </div>
                <div>
                  <label className={labelClass}>Pincode *</label>
                  <input required className={getInputClasses("pincode")} value={form.pincode} onChange={onChange("pincode")} />
                  {getFieldError("pincode") ? <p className="mt-2 text-xs text-red-500">{getFieldError("pincode")}</p> : null}
                </div>
                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <input required className={getInputClasses("mobile")} value={form.mobile} onChange={onChange("mobile")} />
                  {getFieldError("mobile") ? <p className="mt-2 text-xs text-red-500">{getFieldError("mobile")}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Email ID *</label>
                  <input type="email" required className={getInputClasses("email")} value={form.email} onChange={onChange("email")} />
                  {getFieldError("email") ? <p className="mt-2 text-xs text-red-500">{getFieldError("email")}</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(2, "Professional Profile Links")}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                  {getFieldError("linkedinUrl") ? <p className="mt-2 text-xs text-red-500">{getFieldError("linkedinUrl")}</p> : null}
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
                  {getFieldError("portfolioUrl") ? <p className="mt-2 text-xs text-red-500">{getFieldError("portfolioUrl")}</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(3, "Education")}
              <label className={labelClass}>Highest Qualification *</label>
              <select required className={getInputClasses("highestQualification")} value={form.highestQualification} onChange={onChange("highestQualification")}>
                <option value="">Select qualification</option>
                <option>10th Pass</option>
                <option>12th Pass</option>
                <option>Diploma</option>
                <option>ITI</option>
                <option>Graduate (BA/BCom/BSc/BBA/BCA etc.)</option>
                <option>B.Tech / BE</option>
                <option>MBA / PGDM</option>
                <option>Postgraduate (MA/MCom/MSc etc.)</option>
                <option>M.Tech</option>
                <option>Doctorate / PhD</option>
                <option>Other</option>
              </select>
              {getFieldError("highestQualification") ? <p className="mt-2 text-xs text-red-500">{getFieldError("highestQualification")}</p> : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(4, "Experience Status")}
              <div className="mt-2 flex gap-4">
                {["fresher", "experienced"].map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={form.experienceStatus === option}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, experienceStatus: option as "fresher" | "experienced" }))
                      }
                    />
                    <span className="text-sm font-medium">{option === "fresher" ? "Fresher" : "Experienced"}</span>
                  </label>
                ))}
              </div>
            </div>

            {isExperienced ? (
              <div className="rounded-2xl border bg-card p-6 md:p-8" style={{ borderColor: "#264a7f50" }}>
                {sectionHeader(5, "Experience Details")}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Current Company *</label>
                    <input required className={getInputClasses("currentCompany")} value={form.currentCompany} onChange={onChange("currentCompany")} />
                    {getFieldError("currentCompany") ? <p className="mt-2 text-xs text-red-500">{getFieldError("currentCompany")}</p> : null}
                  </div>
                  <div>
                    <label className={labelClass}>Current Designation *</label>
                    <input required className={getInputClasses("designation")} value={form.designation} onChange={onChange("designation")} />
                    {getFieldError("designation") ? <p className="mt-2 text-xs text-red-500">{getFieldError("designation")}</p> : null}
                  </div>
                  <div>
                    <label className={labelClass}>Total Experience *</label>
                    <input required className={getInputClasses("totalExperience")} value={form.totalExperience} onChange={onChange("totalExperience")} />
                    {getFieldError("totalExperience") ? <p className="mt-2 text-xs text-red-500">{getFieldError("totalExperience")}</p> : null}
                  </div>
                  <div>
                    <label className={labelClass}>Industry *</label>
                    <input required className={getInputClasses("industry")} value={form.industry} onChange={onChange("industry")} />
                    {getFieldError("industry") ? <p className="mt-2 text-xs text-red-500">{getFieldError("industry")}</p> : null}
                  </div>
                  <div>
                    <label className={labelClass}>Current CTC *</label>
                    <input type="number" required className={inputClass} value={form.currentCtcLpa} onChange={onChange("currentCtcLpa")} />
                  </div>
                  <div>
                    <label className={labelClass}>Expected CTC *</label>
                    <input type="number" required className={inputClass} value={form.expectedCtcLpa} onChange={onChange("expectedCtcLpa")} />
                  </div>
                  <div>
                    <label className={labelClass}>Minimum Acceptable CTC *</label>
                    <input type="number" required className={inputClass} value={form.minimumCtcLpa} onChange={onChange("minimumCtcLpa")} />
                  </div>
                  <div>
                    <label className={labelClass}>Notice Period *</label>
                    <select required className={getInputClasses("noticePeriod")} value={form.noticePeriod} onChange={onChange("noticePeriod")}>
                      <option value="">Select notice period</option>
                      <option>Immediate Joiner</option>
                      <option>15 Days</option>
                      <option>30 Days</option>
                      <option>60 Days</option>
                      <option>90 Days</option>
                      <option>Serving Notice Period</option>
                    </select>
                    {getFieldError("noticePeriod") ? <p className="mt-2 text-xs text-red-500">{getFieldError("noticePeriod")}</p> : null}
                  </div>
                  {servingNotice ? (
                    <div>
                      <label className={labelClass}>Last Working Day *</label>
                      <input type="date" required className={getInputClasses("lastWorkingDay")} value={form.lastWorkingDay} onChange={onChange("lastWorkingDay")} />
                      {getFieldError("lastWorkingDay") ? <p className="mt-2 text-xs text-red-500">{getFieldError("lastWorkingDay")}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(6, "Job Preferences")}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Preferred Location *</label>
                  <input required className={getInputClasses("preferredLocation")} value={form.preferredLocation} onChange={onChange("preferredLocation")} />
                  {getFieldError("preferredLocation") ? <p className="mt-2 text-xs text-red-500">{getFieldError("preferredLocation")}</p> : null}
                </div>
                <div>
                  <label className={labelClass}>Preferred Industry *</label>
                  <input required className={getInputClasses("preferredIndustry")} value={form.preferredIndustry} onChange={onChange("preferredIndustry")} />
                  {getFieldError("preferredIndustry") ? <p className="mt-2 text-xs text-red-500">{getFieldError("preferredIndustry")}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Preferred Role *</label>
                  <input required className={getInputClasses("preferredRole")} value={form.preferredRole} onChange={onChange("preferredRole")} />
                  {getFieldError("preferredRole") ? <p className="mt-2 text-xs text-red-500">{getFieldError("preferredRole")}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Work Mode * (Select at least one)</label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {["On-site", "Hybrid", "Remote"].map((mode) => (
                      <label key={mode} className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={workModes.includes(mode)} onChange={() => toggleWorkMode(mode)} />
                        <span className="text-sm font-medium">{mode}</span>
                      </label>
                    ))}
                  </div>
                  {getFieldError("workModes") ? <p className="mt-2 text-xs text-red-500">{getFieldError("workModes")}</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(7, "Declaration")}
              <label className="mb-4 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={declarationAccepted} onChange={(e) => setDeclarationAccepted(e.target.checked)} className="mt-1 h-4 w-4" />
                <span className="text-sm font-medium">I agree to the declaration *</span>
              </label>
              {getFieldError("declarationAccepted") ? <p className="mb-3 text-xs text-red-500">{getFieldError("declarationAccepted")}</p> : null}
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={representationAuthorized} onChange={(e) => setRepresentationAuthorized(e.target.checked)} className="mt-1 h-4 w-4" />
                <span className="text-sm font-medium">I authorize representation *</span>
              </label>
              {getFieldError("representationAuthorized") ? <p className="mt-3 text-xs text-red-500">{getFieldError("representationAuthorized")}</p> : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="mb-5 font-heading text-lg font-semibold">Create Account Password</h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
              <p className="mt-2 text-xs text-muted-foreground">Use at least 8 characters with uppercase, lowercase, number, and special character.</p>
              {getFieldError("password") ? <p className="mt-3 text-sm text-red-500">{getFieldError("password")}</p> : null}
              {getFieldError("confirmPassword") ? <p className="mt-3 text-sm text-red-500">{getFieldError("confirmPassword")}</p> : null}
              {serverError ? <p className="mt-3 text-sm text-red-500">{serverError}</p> : null}
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingResume}
              className="btn-gradient w-full rounded-xl py-4 text-base font-bold transition-all hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : uploadingResume ? "Uploading Resume..." : "Submit Candidate Registration"}
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
