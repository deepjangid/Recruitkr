import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";
import { tryAutoLogin } from "@/lib/autoLogin";
import Logo from "@/assets/logo.png";

const JOBS_PAGE_LIMIT = 20;
const BRAND_PRIMARY = "#264a7f";
const BRAND_SECONDARY = "#69a44f";
const dashboardShellClass =
  "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(38,74,127,0.12),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#ffffff_28%,#f8fbff_100%)]";
const dashboardHeaderClass =
  "sticky top-0 z-30 border-b border-[#264a7f]/10 bg-white/88 backdrop-blur-xl shadow-[0_12px_40px_rgba(38,74,127,0.08)]";
const brandCardClass =
  "rounded-[28px] border border-[#264a7f]/10 bg-white/92 shadow-[0_20px_60px_rgba(38,74,127,0.08)] backdrop-blur";
const statCardClass =
  "rounded-2xl border border-[#264a7f]/10 bg-white/95 p-5 shadow-[0_16px_40px_rgba(38,74,127,0.08)]";

type ApplicationStatus =
  | "applied"
  | "under-review"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

type InterviewDetails = {
  scheduledAt?: string;
  timezone?: string;
  mode?: "onsite" | "google-meet" | "phone" | "video" | "other";
  locationText?: string;
  googleMapsUrl?: string;
  meetingLink?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

type ApplicationTimelineItem = {
  status: ApplicationStatus;
  note?: string;
  changedByRole?: "candidate" | "client" | "system";
  changedAt?: string;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied successfully",
  "under-review": "Client reviewed",
  screening: "Shortlisted / screening",
  interview: "Interview scheduled",
  offer: "Offer shared",
  hired: "Hired",
  rejected: "Rejected",
};

const INTERVIEW_MODE_LABELS: Record<NonNullable<InterviewDetails["mode"]>, string> = {
  onsite: "On-site",
  "google-meet": "Google Meet",
  phone: "Phone call",
  video: "Video call",
  other: "Other",
};

const formatStatusLabel = (status: string) =>
  STATUS_LABELS[status as ApplicationStatus] || status.replace(/-/g, " ");

const formatInterviewDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatInterviewTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getInterviewTimingMeta = (value?: string) => {
  if (!value) {
    return {
      label: "Schedule pending",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      hint: "The client has started the interview stage. Full timing details may be shared shortly.",
    };
  }

  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime())) {
    return {
      label: "Schedule shared",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      hint: "Please review the interview information carefully.",
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfScheduled = new Date(
    scheduled.getFullYear(),
    scheduled.getMonth(),
    scheduled.getDate(),
  );
  const dayDiff = Math.round(
    (startOfScheduled.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (scheduled.getTime() < now.getTime()) {
    return {
      label: "Completed",
      tone: "bg-slate-100 text-slate-700 border-slate-200",
      hint: "This interview time has passed. Watch for the next update from the client.",
    };
  }

  if (dayDiff === 0) {
    return {
      label: "Today",
      tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
      hint: "Keep your phone and email handy, and join a few minutes early if a meeting link is shared.",
    };
  }

  if (dayDiff === 1) {
    return {
      label: "Tomorrow",
      tone: "bg-amber-100 text-amber-800 border-amber-200",
      hint: "Set a reminder now so you are ready with the required documents or meeting link.",
    };
  }

  if (dayDiff <= 7) {
    return {
      label: `In ${dayDiff} days`,
      tone: "bg-sky-100 text-sky-800 border-sky-200",
      hint: "Review the role, keep your schedule free, and check the logistics in advance.",
    };
  }

  return {
    label: "Upcoming",
    tone: "bg-sky-100 text-sky-800 border-sky-200",
    hint: "You have time to prepare. Save the schedule and review the job details before the interview.",
  };
};

type CandidateDashboardResponse = {
  success: boolean;
  data: {
    stats: {
      applicationsSent: number;
      interviewCalls: number;
      offersReceived: number;
      profileCompletion: number;
    };
    applications: Array<{
      _id: string;
      status: ApplicationStatus;
      createdAt: string;
      statusNote?: string;
      statusUpdatedAt?: string;
      interviewDetails?: InterviewDetails;
      timeline?: ApplicationTimelineItem[];
      jobId?: {
        _id: string;
        jobTitle?: string;
        jobLocation?: string;
        employmentType?: string;
      };
    }>;
  };
};

type CandidateApplicationsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    status: ApplicationStatus;
    createdAt: string;
    statusNote?: string;
    statusUpdatedAt?: string;
    interviewDetails?: InterviewDetails;
    timeline?: ApplicationTimelineItem[];
    jobId?: {
      _id: string;
      jobTitle?: string;
      jobLocation?: string;
      employmentType?: string;
    };
  }>;
};

type CandidateProfileResponse = {
  success: boolean;
  data: {
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    pincode?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    highestQualification?: string;
    experienceStatus?: "fresher" | "experienced";
    experienceDetails?: {
      currentCompany?: string;
      designation?: string;
      totalExperience?: string;
      industry?: string;
    };
    preferences?: {
      preferredRole?: string;
      preferredLocation?: string;
      preferredIndustry?: string;
      workModes?: Array<"On-site" | "Hybrid" | "Remote">;
    };
    summary?: string;
    skills?: string[];
    projects?: Array<{ name?: string; description?: string }>;
    certifications?: Array<{ name?: string; institute?: string }>;
    referral?: string;
  };
};

type CandidateCertificatesResponse = {
  success: boolean;
  data: Array<{
    id: string;
    title?: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>;
};

type JobsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    jobTitle: string;
    jobLocation: string;
    employmentType: string;
    minCtcLpa?: number;
    maxCtcLpa?: number;
    companyName?: string;
    openings?: number;
    canApply?: boolean;
    applyDisabledReason?: string;
    isLegacy?: boolean;
    description?: string;
    department?: string;
    experienceRequired?: string;
    qualification?: string;
    preferredIndustryBackground?: string;
    workModes?: Array<"On-site" | "Hybrid" | "Remote"> | string[];
    urgencyLevel?: string;
    requirements?: string[];
    responsibilities?: string[];
    skills?: string[];
    genderRequirement?: string;
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    applicationDeadline?: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "jobs" | "applications" | "resume" | "profile">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<CandidateDashboardResponse["data"] | null>(null);
  const [profile, setProfile] = useState<CandidateProfileResponse["data"] | null>(null);
  const [applications, setApplications] = useState<CandidateApplicationsResponse["data"]>([]);
  const [jobs, setJobs] = useState<JobsResponse["data"]>([]);
  const [jobsMeta, setJobsMeta] = useState<JobsResponse["meta"] | null>(null);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [applyLoadingJobId, setApplyLoadingJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [resumeSaving, setResumeSaving] = useState(false);
  const [resumeDownloading, setResumeDownloading] = useState(false);
  const [resumeNotice, setResumeNotice] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [certificates, setCertificates] = useState<CandidateCertificatesResponse["data"]>([]);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [sessionState, setSessionState] = useState(() => getSession());

  const [resumeForm, setResumeForm] = useState<{
    highestQualification: string;
    experienceStatus: "fresher" | "experienced";
    experienceDetails: {
      currentCompany: string;
      designation: string;
      totalExperience: string;
      industry: string;
    };
    preferences: {
      preferredRole: string;
      preferredLocation: string;
      preferredIndustry: string;
      workModes: Array<"On-site" | "Hybrid" | "Remote">;
    };
    summary: string;
    skillsText: string;
    projects: Array<{ name: string; description: string }>;
    certifications: Array<{ name: string; institute: string }>;
    referral: string;
  }>({
    highestQualification: "",
    experienceStatus: "fresher",
    experienceDetails: { currentCompany: "", designation: "", totalExperience: "", industry: "" },
    preferences: { preferredRole: "", preferredLocation: "", preferredIndustry: "", workModes: [] },
    summary: "",
    skillsText: "",
    projects: [],
    certifications: [],
    referral: "",
  });

  const refreshDashboard = async () => {
    const dashboardRes = await apiGet<CandidateDashboardResponse>("/dashboards/candidate", true);
    setDashboard(dashboardRes.data);
  };

  const refreshApplications = async () => {
    const appsRes = await apiGet<CandidateApplicationsResponse>("/jobs/applications/mine", true);
    setApplications(appsRes.data);
  };

  const fetchJobsPage = async (page: number, mode: "replace" | "append") => {
    const jobsRes = await apiGet<JobsResponse>(`/jobs?page=${page}&limit=${JOBS_PAGE_LIMIT}`);
    setJobsMeta(jobsRes.meta);
    setJobs((prev) => (mode === "append" ? [...prev, ...jobsRes.data] : jobsRes.data));
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, profileRes] = await Promise.all([
        apiGet<CandidateDashboardResponse>("/dashboards/candidate", true),
        apiGet<CandidateProfileResponse>("/users/candidate/me", true),
      ]);

      setDashboard(dashboardRes.data);
      setProfile(profileRes.data);
      setResumeForm({
        highestQualification: profileRes.data?.highestQualification || "",
        experienceStatus: profileRes.data?.experienceStatus || "fresher",
        experienceDetails: {
          currentCompany: profileRes.data?.experienceDetails?.currentCompany || "",
          designation: profileRes.data?.experienceDetails?.designation || "",
          totalExperience: profileRes.data?.experienceDetails?.totalExperience || "",
          industry: profileRes.data?.experienceDetails?.industry || "",
        },
        preferences: {
          preferredRole: profileRes.data?.preferences?.preferredRole || "",
          preferredLocation: profileRes.data?.preferences?.preferredLocation || "",
          preferredIndustry: profileRes.data?.preferences?.preferredIndustry || "",
          workModes: profileRes.data?.preferences?.workModes || [],
        },
        summary: profileRes.data?.summary || "",
        skillsText: (profileRes.data?.skills || []).join(", "),
        projects: (profileRes.data?.projects || []).map((p) => ({
          name: p?.name || "",
          description: p?.description || "",
        })),
        certifications: (profileRes.data?.certifications || []).map((c) => ({
          name: c?.name || "",
          institute: c?.institute || "",
        })),
        referral: profileRes.data?.referral || "",
      });

      await Promise.all([refreshApplications(), fetchJobsPage(1, "replace")]);
      void loadProfilePhoto();
      void loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      let session = getSession();
      if (!session?.accessToken) {
        session = await tryAutoLogin();
      }

      setSessionState(session);

      if (!session?.accessToken || session.user.role !== "candidate") {
        navigate("/login?role=candidate");
        return;
      }

      await loadInitialData();
    };

    void boot();
  }, []);

  const applicationJobIds = useMemo(
    () => new Set((applications || []).map((a) => a.jobId?._id).filter(Boolean)),
    [applications],
  );

  useEffect(() => {
    if (!applications.length) {
      setExpandedApplicationId(null);
      return;
    }

    setExpandedApplicationId((current) => {
      if (current && applications.some((application) => application._id === current)) {
        return current;
      }
      return applications[0]?._id || null;
    });
  }, [applications]);

  const applyToJob = async (jobId: string) => {
    setApplyLoadingJobId(jobId);
    setError("");
    try {
      await apiPost("/jobs/apply", { jobId }, true);
      await Promise.all([refreshDashboard(), refreshApplications()]);
      setTab("applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyLoadingJobId(null);
    }
  };

  const saveResume = async () => {
    setResumeSaving(true);
    setError("");
    setResumeNotice("");
    try {
      const skills = resumeForm.skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const projects = (resumeForm.projects || [])
        .map((p) => ({ name: p.name.trim(), description: p.description.trim() }))
        .filter((p) => p.name || p.description);

      const certifications = (resumeForm.certifications || [])
        .map((c) => ({ name: c.name.trim(), institute: c.institute.trim() }))
        .filter((c) => c.name || c.institute);

      const payload: Record<string, unknown> = {
        experienceStatus: resumeForm.experienceStatus,
        summary: resumeForm.summary.trim(),
        skills,
        projects,
        certifications,
        referral: resumeForm.referral.trim(),
      };

      const highestQualification = resumeForm.highestQualification.trim();
      if (highestQualification) {
        payload.highestQualification = highestQualification;
      }

      const preferredRole = resumeForm.preferences.preferredRole.trim();
      const preferredLocation = resumeForm.preferences.preferredLocation.trim();
      const preferredIndustry = resumeForm.preferences.preferredIndustry.trim();
      const workModes = resumeForm.preferences.workModes;
      if (preferredRole || preferredLocation || preferredIndustry || workModes.length) {
        payload.preferences = {
          ...(preferredRole ? { preferredRole } : {}),
          ...(preferredLocation ? { preferredLocation } : {}),
          ...(preferredIndustry ? { preferredIndustry } : {}),
          ...(workModes.length ? { workModes } : {}),
        };
      }

      if (resumeForm.experienceStatus === "experienced") {
        payload.experienceDetails = {
          currentCompany: resumeForm.experienceDetails.currentCompany.trim(),
          designation: resumeForm.experienceDetails.designation.trim(),
          totalExperience: resumeForm.experienceDetails.totalExperience.trim(),
          industry: resumeForm.experienceDetails.industry.trim(),
        };
      }

      const res = await apiPatch<CandidateProfileResponse>("/users/candidate/me", payload, true);

      setProfile(res.data);
      setResumeForm({
        highestQualification: res.data?.highestQualification || "",
        experienceStatus: res.data?.experienceStatus || "fresher",
        experienceDetails: {
          currentCompany: res.data?.experienceDetails?.currentCompany || "",
          designation: res.data?.experienceDetails?.designation || "",
          totalExperience: res.data?.experienceDetails?.totalExperience || "",
          industry: res.data?.experienceDetails?.industry || "",
        },
        preferences: {
          preferredRole: res.data?.preferences?.preferredRole || "",
          preferredLocation: res.data?.preferences?.preferredLocation || "",
          preferredIndustry: res.data?.preferences?.preferredIndustry || "",
          workModes: res.data?.preferences?.workModes || [],
        },
        summary: res.data?.summary || "",
        skillsText: (res.data?.skills || []).join(", "),
        projects: (res.data?.projects || []).map((p) => ({
          name: p?.name || "",
          description: p?.description || "",
        })),
        certifications: (res.data?.certifications || []).map((c) => ({
          name: c?.name || "",
          institute: c?.institute || "",
        })),
        referral: res.data?.referral || "",
      });
      setResumeNotice("Resume saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save resume");
    } finally {
      setResumeSaving(false);
    }
  };

  const downloadResumePdf = async () => {
    setResumeDownloading(true);
    setError("");
    try {
      const session = getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/resumes/generated`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to download resume");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile?.fullName || "Resume").replace(/\s+/g, "_")}_RecruitKr.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download resume");
    } finally {
      setResumeDownloading(false);
    }
  };

  const loadProfilePhoto = async () => {
    setProfilePhotoLoading(true);
    try {
      const session = getSession();
      if (!session?.accessToken) {
        setProfilePhotoUrl(null);
        return;
      }

      const res = await fetch(`${API_BASE}/users/candidate/profile-photo`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) {
        setProfilePhotoUrl(null);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setProfilePhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } finally {
      setProfilePhotoLoading(false);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    setError("");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await apiPost("/users/candidate/profile-photo", fd, true);
      await loadProfilePhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    }
  };

  const removeProfilePhoto = async () => {
    setError("");
    try {
      await apiDelete("/users/candidate/profile-photo", true);
      setProfilePhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo");
    }
  };

  const loadCertificates = async () => {
    try {
      const res = await apiGet<CandidateCertificatesResponse>("/users/candidate/certificates", true);
      setCertificates(res.data || []);
    } catch {
      setCertificates([]);
    }
  };

  const uploadCertificate = async (file: File, title: string) => {
    setCertificateUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      await apiPost("/users/candidate/certificates", fd, true);
      await loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload certificate");
    } finally {
      setCertificateUploading(false);
    }
  };

  const downloadCertificate = async (certificateId: string, fileName: string) => {
    setError("");
    try {
      const session = getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/users/candidate/certificates/${certificateId}`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to download certificate");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "certificate";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download certificate");
    }
  };

  const deleteCertificate = async (certificateId: string) => {
    setError("");
    try {
      await apiDelete(`/users/candidate/certificates/${certificateId}`, true);
      await loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete certificate");
    }
  };

  const loadMoreJobs = async () => {
    if (!jobsMeta) return;
    if (jobsLoadingMore) return;
    if (jobsMeta.page >= jobsMeta.totalPages) return;

    setJobsLoadingMore(true);
    setError("");
    try {
      await fetchJobsPage(jobsMeta.page + 1, "append");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more jobs");
    } finally {
      setJobsLoadingMore(false);
    }
  };

  const logout = async () => {
    try {
      await apiPost("/auth/logout", { refreshToken: getSession()?.refreshToken });
    } catch {
      // No-op
    }
    clearSession();
    setSessionState(null);
    navigate("/login");
  };

  if (!sessionState?.accessToken) {
    return <div className="min-h-screen bg-background p-8">Checking your session...</div>;
  }

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Loading candidate dashboard...</div>;
  }

  const candidateTabs: Array<{ key: typeof tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "jobs", label: "Browse Jobs" },
    { key: "applications", label: "My Applications" },
    { key: "profile", label: "Profile" },
    { key: "resume", label: "My Resume" },
  ];

  return (
    <div className={dashboardShellClass}>
      <header className={dashboardHeaderClass}>
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="flex h-11 w-[136px] shrink-0 items-center sm:h-12 sm:w-[152px] md:h-14 md:w-[186px]">
                <img
                  src={Logo}
                  alt="RecruitKr"
                  className="h-full w-full object-contain object-left"
                />
              </span>
              <div className="hidden min-w-0 md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#264a7f]">
                  Candidate Dashboard
                </p>
                <p className="truncate text-sm text-slate-500">Track jobs, applications, and profile updates.</p>
              </div>
            </div>
            <button
              className="rounded-xl border border-[#264a7f]/15 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:hidden"
              onClick={logout}
            >
              Logout
            </button>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <div className="flex min-w-max items-center gap-2 pb-1 lg:min-w-0 lg:flex-wrap lg:justify-end">
              {candidateTabs.map((item) => {
                const isActive = tab === item.key;

                return (
                  <button
                    key={item.key}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      isActive
                        ? "border-transparent text-white shadow-[0_14px_30px_rgba(38,74,127,0.24)]"
                        : "border-[#264a7f]/12 bg-white text-slate-700 hover:border-[#264a7f]/30 hover:text-[#264a7f]"
                    }`}
                    style={
                      isActive
                        ? { background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})` }
                        : undefined
                    }
                    onClick={() => setTab(item.key)}
                  >
                    {item.label}
                  </button>
                );
              })}
              <button
                className="hidden rounded-xl border border-[#264a7f]/12 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 sm:text-sm lg:inline-flex"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {tab === "overview" && (
          <>
            <div
              className={`${brandCardClass} overflow-hidden p-6 md:p-8`}
              style={{
                background: "linear-gradient(135deg, rgba(38,74,127,0.96) 0%, rgba(55,110,168,0.95) 58%, rgba(105,164,79,0.9) 100%)",
              }}
            >
              <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">RecruitKr Candidate Space</p>
                  <h1 className="mt-3 font-heading text-3xl font-bold text-white md:text-4xl">
                    Welcome, {profile?.fullName || sessionState?.user.email}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                    Keep your applications moving, stay ready for interviews, and make your profile recruiter-ready.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Quick Snapshot</p>
                  <div className="mt-4 space-y-3 text-sm text-white/90">
                    <p>Preferred Role: {profile?.preferences?.preferredRole || "Not set yet"}</p>
                    <p>Preferred Location: {profile?.preferences?.preferredLocation || "Not set yet"}</p>
                    <p>Work Mode: {profile?.preferences?.workModes?.join(", ") || "Not selected"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#264a7f]">Applications</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.applicationsSent || 0}</p><p className="mt-1 text-sm text-slate-500">Roles you have already applied for</p></div>
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#264a7f]">Interview Calls</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.interviewCalls || 0}</p><p className="mt-1 text-sm text-slate-500">Opportunities moving to discussion stage</p></div>
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#69a44f]">Offers</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.offersReceived || 0}</p><p className="mt-1 text-sm text-slate-500">Positive outcomes received so far</p></div>
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#69a44f]">Profile Strength</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.profileCompletion || 0}%</p><p className="mt-1 text-sm text-slate-500">Complete more fields to improve visibility</p></div>
            </div>
          </>
        )}

        {tab === "jobs" && (
          <div className="space-y-6">
            <div className={`${brandCardClass} overflow-hidden p-6`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#264a7f]">Browse Jobs</p>
                  <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900">Explore roles matched to your next move</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Review active openings, compare compensation and location quickly, and apply directly from your dashboard.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-auto">
                  <div className="rounded-2xl bg-[#264a7f]/6 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Visible Jobs</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{jobsMeta?.total || jobs.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#69a44f]/8 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a8d43]">Applied</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{applicationJobIds.size}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
            {jobs.map((job) => (
              <div key={job._id} className={`${brandCardClass} p-5`}>
                <div className="flex h-full flex-col gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#264a7f]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#264a7f]">Active opening</span>
                      <span className="rounded-full bg-[#69a44f]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#5a8d43]">{job.employmentType}</span>
                      {job.isLegacy && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                          Legacy opening
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{job.jobTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">{job.jobLocation}</p>
                    {job.companyName && <p className="mt-1 text-sm font-medium text-slate-700">{job.companyName}</p>}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#264a7f]/10 bg-[#264a7f]/[0.03] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Compensation</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{job.minCtcLpa || 0} - {job.maxCtcLpa || 0} LPA</p>
                      </div>
                      <div className="rounded-2xl border border-[#69a44f]/12 bg-[#69a44f]/[0.05] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a8d43]">{job.openings ? "Openings" : "Work Setup"}</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{job.openings || job.employmentType}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      {job.canApply === false
                        ? job.applyDisabledReason || "This job is visible for reference only."
                        : applicationJobIds.has(job._id)
                        ? "You have already applied to this role."
                        : "Ready to apply with your current profile and resume."}
                    </p>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setExpandedJobId((current) => (current === job._id ? null : job._id))}
                        className="w-full rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-[#264a7f] shadow-sm sm:w-auto sm:min-w-[140px]"
                      >
                        {expandedJobId === job._id ? "Hide details" : "Read more"}
                      </button>
                      <button
                        onClick={() => applyToJob(job._id)}
                        disabled={job.canApply === false || applicationJobIds.has(job._id) || applyLoadingJobId === job._id}
                        className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(38,74,127,0.22)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[140px]"
                        style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})` }}
                      >
                        {job.canApply === false
                          ? "Not available"
                          : applicationJobIds.has(job._id)
                            ? "Applied"
                            : applyLoadingJobId === job._id
                              ? "Applying..."
                              : "Apply now"}
                      </button>
                    </div>
                  </div>

                  {expandedJobId === job._id && (
                    <div className="rounded-3xl border border-[#264a7f]/10 bg-[#f8fbff] p-5">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Department</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{job.department || "Not specified"}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Experience</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{job.experienceRequired || "Not specified"}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Qualification</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{job.qualification || "Not specified"}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Deadline</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : "Open until filled"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Role Overview</p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {job.description || "No detailed description shared for this opening."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Requirement Snapshot</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-600">
                              <p>Gender: {job.genderRequirement || "No preference"}</p>
                              <p>Urgency: {job.urgencyLevel || "Not specified"}</p>
                              <p>Work Modes: {job.workModes?.length ? job.workModes.join(", ") : "Not specified"}</p>
                              <p>
                                Salary: {job.salary?.min ?? job.minCtcLpa ?? 0} - {job.salary?.max ?? job.maxCtcLpa ?? 0} {job.salary?.currency || "INR"}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#264a7f]">Must-have Details</p>
                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                              <div>
                                <p className="font-medium text-slate-800">Requirements</p>
                                <p>{job.requirements?.length ? job.requirements.join(", ") : "Not provided"}</p>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">Skills</p>
                                <p>{job.skills?.length ? job.skills.join(", ") : "Not provided"}</p>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">Responsibilities</p>
                                <p>{job.responsibilities?.length ? job.responsibilities.join(", ") : "Not provided"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>

            {jobsMeta && jobsMeta.total > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Showing {jobs.length} of {jobsMeta.total} active jobs
              </p>
            )}

            {jobsMeta && jobsMeta.page < jobsMeta.totalPages && (
              <button
                onClick={loadMoreJobs}
                disabled={jobsLoadingMore}
                className="mx-auto block rounded-xl border border-[#264a7f]/12 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
              >
                {jobsLoadingMore ? "Loading..." : "Load more"}
              </button>
            )}
            {jobs.length === 0 && (
              <div className={`${brandCardClass} p-8 text-center`}>
                <p className="text-lg font-semibold text-slate-900">No active jobs available right now.</p>
                <p className="mt-2 text-sm text-slate-500">New openings will appear here as soon as employers publish them.</p>
              </div>
            )}
          </div>
        )}

        {tab === "applications" && (
          <div className={`${brandCardClass} overflow-hidden`}>
            <div className="border-b border-[#264a7f]/10 px-4 py-5 sm:px-6">
              <h2 className="font-heading font-semibold text-slate-900">My Applications</h2>
              <p className="mt-1 text-sm text-slate-500">Track progress, interview schedules, and recruiter notes in one place.</p>
            </div>
            <div className="divide-y divide-border">
              {(applications || []).map((application) => (
                <div key={application._id} className="px-4 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedApplicationId((current) =>
                        current === application._id ? null : application._id,
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      expandedApplicationId === application._id
                        ? "border-sky-200 bg-sky-50/60"
                        : "border-border bg-background/60 hover:border-sky-100 hover:bg-background"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{application.jobId?.jobTitle || "Job"}</p>
                          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium capitalize">
                            {formatStatusLabel(application.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {application.jobId?.jobLocation || "Location not shared"} -{" "}
                          {application.jobId?.employmentType || "Employment type pending"}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                          {application.statusUpdatedAt && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                              Updated {new Date(application.statusUpdatedAt).toLocaleDateString()}
                            </span>
                          )}
                          {application.interviewDetails?.scheduledAt && (
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
                              Interview {getInterviewTimingMeta(application.interviewDetails.scheduledAt).label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {application.statusNote
                            ? application.statusNote
                            : application.interviewDetails?.scheduledAt
                              ? `${formatInterviewDate(application.interviewDetails.scheduledAt)} at ${formatInterviewTime(application.interviewDetails.scheduledAt)}`
                              : "Open to see full job and application details."}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-sky-700">
                        <span>{expandedApplicationId === application._id ? "Hide details" : "View details"}</span>
                        <span aria-hidden="true">{expandedApplicationId === application._id ? '-' : '+'}</span>
                      </div>
                    </div>
                  </button>

                  {expandedApplicationId === application._id && (
                    <div className="space-y-4 pt-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-border bg-background/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Application status
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {formatStatusLabel(application.status)}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Your latest position in the hiring process.
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Job location
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {application.jobId?.jobLocation || "Location not shared"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {application.jobId?.employmentType || "Employment type pending"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/70 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Application date
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {new Date(application.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Added to your dashboard on this date.
                          </p>
                        </div>
                      </div>

                      {application.statusNote && (
                        <div className="rounded-lg border border-border bg-background/70 p-3 text-sm">
                          <p className="font-medium">Latest update</p>
                          <p className="mt-1 text-muted-foreground">{application.statusNote}</p>
                          {application.statusUpdatedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Updated on {new Date(application.statusUpdatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {application.interviewDetails && (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900">Interview schedule</p>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    getInterviewTimingMeta(application.interviewDetails.scheduledAt).tone
                                  }`}
                                >
                                  {getInterviewTimingMeta(application.interviewDetails.scheduledAt).label}
                                </span>
                              </div>

                              {application.interviewDetails.scheduledAt ? (
                                <div className="rounded-xl bg-white/80 p-3 shadow-sm ring-1 ring-sky-100">
                                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
                                    Scheduled for
                                  </p>
                                  <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {formatInterviewDate(application.interviewDetails.scheduledAt)}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {formatInterviewTime(application.interviewDetails.scheduledAt)}
                                    {application.interviewDetails.timezone
                                      ? ` (${application.interviewDetails.timezone})`
                                      : ''}
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-xl bg-white/80 p-3 shadow-sm ring-1 ring-sky-100">
                                  <p className="text-sm text-slate-600">
                                    The client moved your application to the interview stage. Timing details are still
                                    pending.
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                              <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                  Mode
                                </p>
                                <p className="mt-1 font-medium text-slate-800">
                                  {application.interviewDetails.mode
                                    ? INTERVIEW_MODE_LABELS[application.interviewDetails.mode]
                                    : "Not shared yet"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-white/70 bg-white/80 p-3">
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                  Contact person
                                </p>
                                <p className="mt-1 font-medium text-slate-800">
                                  {application.interviewDetails.contactPerson || "Will be shared by recruiter"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {(application.interviewDetails.locationText ||
                              application.interviewDetails.googleMapsUrl ||
                              application.interviewDetails.meetingLink) && (
                              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                  Joining details
                                </p>
                                {application.interviewDetails.locationText && (
                                  <p className="mt-2 text-sm text-slate-700">
                                    {application.interviewDetails.locationText}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {application.interviewDetails.meetingLink && (
                                    <a
                                      href={application.interviewDetails.meetingLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                                    >
                                      Open meeting link
                                    </a>
                                  )}
                                  {application.interviewDetails.googleMapsUrl && (
                                    <a
                                      href={application.interviewDetails.googleMapsUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                                    >
                                      Open map
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {(application.interviewDetails.contactEmail ||
                              application.interviewDetails.contactPhone ||
                              application.interviewDetails.notes) && (
                              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                  Notes and support
                                </p>
                                <div className="mt-2 space-y-2 text-sm text-slate-700">
                                  {application.interviewDetails.contactEmail && (
                                    <p className="break-all">
                                      Email: {application.interviewDetails.contactEmail}
                                    </p>
                                  )}
                                  {application.interviewDetails.contactPhone && (
                                    <p>Phone: {application.interviewDetails.contactPhone}</p>
                                  )}
                                  {application.interviewDetails.notes && (
                                    <p className="rounded-lg bg-slate-50 p-3 text-slate-600">
                                      {application.interviewDetails.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 rounded-xl border border-dashed border-sky-200 bg-white/70 p-3">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
                              What to do next
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {getInterviewTimingMeta(application.interviewDetails.scheduledAt).hint}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="mb-2 text-sm font-medium">RecruitKr updates</p>
                        <div className="space-y-3">
                          {(application.timeline && application.timeline.length
                            ? application.timeline
                            : [
                                {
                                  status: application.status,
                                  changedAt: application.statusUpdatedAt || application.createdAt,
                                  note: application.statusNote,
                                },
                              ]
                          ).map((item, index) => (
                            <div
                              key={`${application._id}-${item.status}-${index}`}
                              className={`flex ${item.changedByRole === 'candidate' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="max-w-2xl rounded-2xl border border-border bg-background px-4 py-3">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm font-medium">{formatStatusLabel(item.status)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.changedAt ? new Date(item.changedAt).toLocaleString() : 'Recently updated'}
                                  </p>
                                </div>
                                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                                  {item.changedByRole === 'client'
                                    ? 'RecruitKr / Client update'
                                    : item.changedByRole === 'candidate'
                                      ? 'You'
                                      : 'System'}
                                </p>
                                {item.note && <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(applications || []).length === 0 && (
                <div className="px-4 py-4 text-sm text-muted-foreground sm:px-6">No applications yet.</div>
              )}
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold">Candidate Profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Your basic profile details and job preferences in one place.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("resume")}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm"
                >
                  Edit profile
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-background/70 p-4">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={profile?.fullName || "Candidate profile"}
                    className="h-20 w-20 rounded-2xl border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border bg-background text-2xl font-bold text-muted-foreground">
                    {(profile?.fullName || sessionState?.user.email || "C").trim().charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Profile image</p>
                  <p className="mt-1 text-base font-semibold">{profile?.fullName || "Candidate"}</p>
                  <p className="text-sm text-muted-foreground">
                    {profilePhotoUrl ? "Your uploaded profile photo." : "Upload a profile photo from the Resume tab."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/70 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Full name</p>
                  <p className="mt-2 text-base font-semibold">{profile?.fullName || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Qualification</p>
                  <p className="mt-2 text-base font-semibold">{profile?.highestQualification || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Experience</p>
                  <p className="mt-2 text-base font-semibold capitalize">{profile?.experienceStatus || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Preferred role</p>
                  <p className="mt-2 text-base font-semibold">{profile?.preferences?.preferredRole || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Preferred location</p>
                  <p className="mt-2 text-base font-semibold">{profile?.preferences?.preferredLocation || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Professional summary</p>
                  <p className="mt-2 text-sm text-slate-700">{profile?.summary || "No summary added yet."}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Contact and Links</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                    <p className="mt-1 text-sm font-medium break-all">{sessionState?.user.email || "Not added"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">LinkedIn</p>
                    <p className="mt-1 text-sm font-medium break-all">{profile?.linkedinUrl || "Not added"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Portfolio</p>
                    <p className="mt-1 text-sm font-medium break-all">{profile?.portfolioUrl || "Not added"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Work modes</p>
                    <p className="mt-1 text-sm font-medium">
                      {profile?.preferences?.workModes?.length
                        ? profile.preferences.workModes.join(", ")
                        : "Not added"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Quick Snapshot</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-2xl font-bold">{dashboard?.stats.applicationsSent || 0}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-2xl font-bold">{dashboard?.stats.profileCompletion || 0}%</p>
                    <p className="text-xs text-muted-foreground">Profile completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "resume" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-xl font-bold">Resume Editor</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill only what you have; empty sections will be hidden in the PDF.
                  </p>
                  {resumeNotice && <p className="mt-2 text-sm text-green-600">{resumeNotice}</p>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={saveResume}
                    disabled={resumeSaving}
                    className="btn-gradient rounded-lg px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {resumeSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={downloadResumePdf}
                    disabled={resumeDownloading}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {resumeDownloading ? "Preparing..." : "Download PDF"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Highest Qualification</label>
                  <input
                    value={resumeForm.highestQualification}
                    onChange={(e) => setResumeForm((p) => ({ ...p, highestQualification: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. B.Tech / MBA / Diploma"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Experience Status</label>
                  <select
                    value={resumeForm.experienceStatus}
                    onChange={(e) =>
                      setResumeForm((p) => ({
                        ...p,
                        experienceStatus: e.target.value === "experienced" ? "experienced" : "fresher",
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="fresher">Fresher</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Summary</label>
                  <textarea
                    value={resumeForm.summary}
                    onChange={(e) => setResumeForm((p) => ({ ...p, summary: e.target.value }))}
                    rows={5}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Write a short professional summary (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Skills</label>
                  <input
                    value={resumeForm.skillsText}
                    onChange={(e) => setResumeForm((p) => ({ ...p, skillsText: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. JavaScript, Node.js, React, MongoDB"
                  />
                  <p className="text-xs text-muted-foreground">Comma separated</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Role</label>
                  <input
                    value={resumeForm.preferences.preferredRole}
                    onChange={(e) =>
                      setResumeForm((p) => ({ ...p, preferences: { ...p.preferences, preferredRole: e.target.value } }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Backend Developer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Location</label>
                  <input
                    value={resumeForm.preferences.preferredLocation}
                    onChange={(e) =>
                      setResumeForm((p) => ({
                        ...p,
                        preferences: { ...p.preferences, preferredLocation: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Delhi / Bengaluru"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Industry</label>
                  <input
                    value={resumeForm.preferences.preferredIndustry}
                    onChange={(e) =>
                      setResumeForm((p) => ({
                        ...p,
                        preferences: { ...p.preferences, preferredIndustry: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g. IT / FinTech"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Mode</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(["On-site", "Hybrid", "Remote"] as const).map((mode) => {
                      const checked = resumeForm.preferences.workModes.includes(mode);
                      return (
                        <label key={mode} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setResumeForm((p) => ({
                                ...p,
                                preferences: {
                                  ...p.preferences,
                                  workModes: checked
                                    ? p.preferences.workModes.filter((m) => m !== mode)
                                    : [...p.preferences.workModes, mode],
                                },
                              }))
                            }
                          />
                          {mode}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {resumeForm.experienceStatus === "experienced" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Company</label>
                    <input
                      value={resumeForm.experienceDetails.currentCompany}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          experienceDetails: { ...p.experienceDetails, currentCompany: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Designation</label>
                    <input
                      value={resumeForm.experienceDetails.designation}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          experienceDetails: { ...p.experienceDetails, designation: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Experience</label>
                    <input
                      value={resumeForm.experienceDetails.totalExperience}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          experienceDetails: { ...p.experienceDetails, totalExperience: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. 2 years"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <input
                      value={resumeForm.experienceDetails.industry}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          experienceDetails: { ...p.experienceDetails, industry: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. IT"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading font-semibold">Profile Photo</h3>
                  <p className="text-sm text-muted-foreground">JPG/PNG/WEBP (max 2MB)</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadProfilePhoto(file);
                      e.currentTarget.value = "";
                    }}
                    className="text-sm"
                    disabled={profilePhotoLoading}
                  />
                  <button
                    onClick={removeProfilePhoto}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
                    disabled={!profilePhotoUrl}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {profilePhotoLoading && <p className="text-sm text-muted-foreground">Loading photo...</p>}
              {!profilePhotoLoading && !profilePhotoUrl && (
                <p className="text-sm text-muted-foreground">No profile photo uploaded.</p>
              )}
              {!profilePhotoLoading && profilePhotoUrl && (
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="h-28 w-28 rounded-lg border border-border object-cover"
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading font-semibold">Certificates (Files)</h3>
                  <p className="text-sm text-muted-foreground">Upload PDF or image (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const title = window.prompt("Certificate title (optional)") || "";
                      void uploadCertificate(file, title);
                    }
                    e.currentTarget.value = "";
                  }}
                  className="text-sm"
                  disabled={certificateUploading}
                />
              </div>

              {certificateUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}

              {certificates.length === 0 && !certificateUploading && (
                <p className="text-sm text-muted-foreground">No certificates uploaded.</p>
              )}

              {certificates.length > 0 && (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {certificates.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{c.title || c.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.mimeType} • {(c.size / 1024).toFixed(0)} KB •{" "}
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                          onClick={() => void downloadCertificate(c.id, c.fileName)}
                        >
                          Download
                        </button>
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-red-500"
                          onClick={() => void deleteCertificate(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold">Projects</h3>
                <button
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  onClick={() =>
                    setResumeForm((p) => ({
                      ...p,
                      projects: [...p.projects, { name: "", description: "" }],
                    }))
                  }
                >
                  Add Project
                </button>
              </div>

              {(resumeForm.projects || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No projects added.</p>
              )}

              <div className="space-y-3">
                {(resumeForm.projects || []).map((project, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Project #{idx + 1}</p>
                      <button
                        className="text-sm text-red-500"
                        onClick={() =>
                          setResumeForm((p) => ({
                            ...p,
                            projects: p.projects.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={project.name}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          projects: p.projects.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Project name"
                    />
                    <textarea
                      value={project.description}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          projects: p.projects.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="What you built, tech stack, impact (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold">Certifications</h3>
                <button
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  onClick={() =>
                    setResumeForm((p) => ({
                      ...p,
                      certifications: [...p.certifications, { name: "", institute: "" }],
                    }))
                  }
                >
                  Add Certification
                </button>
              </div>

              {(resumeForm.certifications || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No certifications added.</p>
              )}

              <div className="space-y-3">
                {(resumeForm.certifications || []).map((cert, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Certification #{idx + 1}</p>
                      <button
                        className="text-sm text-red-500"
                        onClick={() =>
                          setResumeForm((p) => ({
                            ...p,
                            certifications: p.certifications.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={cert.name}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          certifications: p.certifications.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Certification name"
                    />
                    <input
                      value={cert.institute}
                      onChange={(e) =>
                        setResumeForm((p) => ({
                          ...p,
                          certifications: p.certifications.map((x, i) => (i === idx ? { ...x, institute: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Institute / Platform (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-2">
              <label className="text-sm font-medium">Referral</label>
              <input
                value={resumeForm.referral}
                onChange={(e) => setResumeForm((p) => ({ ...p, referral: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Optional referral info"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;
