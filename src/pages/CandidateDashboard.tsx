import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, Building2, Filter, MapPin, Search, Sparkles, X } from "lucide-react";
import { API_BASE, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";
import { useServerEvents, type SseConnectionStatus } from "@/hooks/useServerEvents";
import { tryAutoLogin } from "@/lib/autoLogin";
import Logo from "@/assets/logo.png";

const JOBS_PAGE_LIMIT = 20;
const LIVE_REFRESH_MS = 5000;
const BRAND_PRIMARY = "#264a7f";
const BRAND_SECONDARY = "#69a44f";
const dashboardShellClass =
  "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(38,74,127,0.12),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#ffffff_28%,#f8fbff_100%)]";
const dashboardHeaderClass =
  "sticky top-0 z-30 border-b border-[#264a7f]/10 bg-white/88 backdrop-blur-xl shadow-[0_12px_40px_rgba(38,74,127,0.08)]";
const brandCardClass =
  "   border border-[#264a7f]/10 bg-white/92 shadow-[0_20px_60px_rgba(38,74,127,0.08)] backdrop-blur";
const statCardClass =
  "rounded-2xl border border-[#264a7f]/10 bg-white/95 p-5 shadow-[0_16px_40px_rgba(38,74,127,0.08)]";
const JOBS_HERO_GRADIENT = "linear-gradient(90deg, rgba(36, 70, 121, 1) 0%, rgba(105, 164, 79, 1) 100%)";

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
  mode?: "onsite" | "google-meet" | "phone" | "video" | "zoom" | "other";
  locationText?: string;
  googleMapsUrl?: string;
  meetingLink?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  reportingNotes?: string;
  documentsRequired?: string;
  additionalInstructions?: string;
};

type ApplicationResponseSnapshot = {
  statusNote?: string;
  interviewDetails?: InterviewDetails;
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
  zoom: "Zoom",
  other: "Other",
};

const LIVE_STATUS_META: Record<SseConnectionStatus, { label: string; className: string }> = {
  connecting: { label: "Live connecting", className: "border-amber-200 bg-amber-50 text-amber-700" },
  connected: { label: "Live connected", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  reconnecting: { label: "Live reconnecting", className: "border-sky-200 bg-sky-50 text-sky-700" },
  disconnected: { label: "Live disconnected", className: "border-slate-200 bg-slate-100 text-slate-600" },
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

const parseApplicationScheduledAt = (application: Record<string, any>) => {
  const nested = application?.interviewDetails?.scheduledAt;
  if (nested) return nested;

  const dateText = String(application?.interviewDate || "").trim();
  const timeText = String(application?.interviewTime || "").trim();
  if (!dateText) return "";
  if (!timeText) return dateText;

  const direct = new Date(`${dateText} ${timeText}`);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const dateMatch = dateText.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!dateMatch || !timeMatch) return `${dateText} ${timeText}`;

  const day = Number(dateMatch[1]);
  const monthIndex = Number(dateMatch[2]) - 1;
  const year = Number(dateMatch[3]);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const composed = new Date(year, monthIndex, day, hour, minute, 0, 0);
  return Number.isNaN(composed.getTime()) ? `${dateText} ${timeText}` : composed.toISOString();
};

const getApplicationResponseSnapshot = (application: Record<string, any>): ApplicationResponseSnapshot => {
  const nested = application?.interviewDetails || {};
  const scheduledAt = parseApplicationScheduledAt(application);

  return {
    statusNote:
      application?.statusNote ||
      application?.candidateResponse ||
      application?.clientNote ||
      application?.note ||
      application?.notes ||
      "",
    interviewDetails: {
      scheduledAt,
      timezone: nested?.timezone || application?.timezone || "",
      mode: nested?.mode || application?.interviewMode || application?.mode || "",
      locationText: nested?.locationText || application?.interviewLocation || application?.locationText || "",
      googleMapsUrl:
        nested?.googleMapsUrl || application?.googleMapLocation || application?.googleMapsUrl || "",
      meetingLink: nested?.meetingLink || application?.meetingLink || "",
      contactPerson: nested?.contactPerson || application?.contactPerson || "",
      contactEmail: nested?.contactEmail || application?.contactEmail || "",
      contactPhone: nested?.contactPhone || application?.contactPhone || "",
      notes: nested?.notes || "",
      reportingNotes: nested?.reportingNotes || application?.reportingNotes || "",
      documentsRequired: nested?.documentsRequired || application?.documentsRequired || "",
      additionalInstructions:
        nested?.additionalInstructions || application?.additionalInstructions || "",
    },
  };
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
      fullName?: string;
      email?: string;
      phone?: string;
      qualification?: string;
      currentCity?: string;
      appliedFor?: string;
      experience?: Array<{ jobProfile?: string }>;
      statusNote?: string;
      statusUpdatedAt?: string;
      interviewDetails?: InterviewDetails;
      timeline?: ApplicationTimelineItem[];
      jobId?: {
        _id: string;
        jobTitle?: string;
        jobLocation?: string;
        employmentType?: string;
        sourceCollection?: string;
        sourceLabel?: string;
      };
    }>;
    profile?: CandidateProfileResponse["data"];
  };
};

type CandidateApplicationsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    status: ApplicationStatus;
    createdAt: string;
    fullName?: string;
    email?: string;
    phone?: string;
    qualification?: string;
    currentCity?: string;
    appliedFor?: string;
    experience?: Array<{ jobProfile?: string }>;
    statusNote?: string;
    statusUpdatedAt?: string;
    interviewDetails?: InterviewDetails;
    timeline?: ApplicationTimelineItem[];
    jobId?: {
      _id: string;
      jobTitle?: string;
      jobLocation?: string;
      employmentType?: string;
      sourceCollection?: string;
      sourceLabel?: string;
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
    sourceCollection?: string;
    sourceLabel?: string;
    ownerRole?: "admin" | "client";
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
  const [tab, setTab] = useState<"overview" | "jobs" | "applications" | "resume" | "profile">("jobs");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<CandidateDashboardResponse["data"] | null>(null);
  const [profile, setProfile] = useState<CandidateProfileResponse["data"] | null>(null);
  const [applications, setApplications] = useState<CandidateApplicationsResponse["data"]>([]);
  const [jobs, setJobs] = useState<JobsResponse["data"]>([]);
  const [jobsMeta, setJobsMeta] = useState<JobsResponse["meta"] | null>(null);
  const [currentJobsPage, setCurrentJobsPage] = useState(1);
  const [jobSearch, setJobSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [jobLocationFilter, setJobLocationFilter] = useState("all");
  const [jobReadinessFilter, setJobReadinessFilter] = useState<"all" | "ready">("all");
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

  const fetchJobsPage = async (page: number) => {
    const jobsRes = await apiGet<JobsResponse>(`/jobs?page=${page}&limit=${JOBS_PAGE_LIMIT}`);
    setJobsMeta(jobsRes.meta);
    setJobs(jobsRes.data);
  };

  const syncResumeFormFromProfile = (profileData?: CandidateProfileResponse["data"] | null) => {
    if (!profileData) return;

    setResumeForm({
      highestQualification: profileData?.highestQualification || "",
      experienceStatus: profileData?.experienceStatus || "fresher",
      experienceDetails: {
        currentCompany: profileData?.experienceDetails?.currentCompany || "",
        designation: profileData?.experienceDetails?.designation || "",
        totalExperience: profileData?.experienceDetails?.totalExperience || "",
        industry: profileData?.experienceDetails?.industry || "",
      },
      preferences: {
        preferredRole: profileData?.preferences?.preferredRole || "",
        preferredLocation: profileData?.preferences?.preferredLocation || "",
        preferredIndustry: profileData?.preferences?.preferredIndustry || "",
        workModes: profileData?.preferences?.workModes || [],
      },
      summary: profileData?.summary || "",
      skillsText: (profileData?.skills || []).join(", "),
      projects: (profileData?.projects || []).map((p) => ({
        name: p?.name || "",
        description: p?.description || "",
      })),
      certifications: (profileData?.certifications || []).map((c) => ({
        name: c?.name || "",
        institute: c?.institute || "",
      })),
      referral: profileData?.referral || "",
    });
  };

  const refreshLiveData = useCallback(async () => {
    try {
      const [dashboardRes, appsRes, jobsRes, profileRes] = await Promise.all([
        apiGet<CandidateDashboardResponse>("/dashboards/candidate", true),
        apiGet<CandidateApplicationsResponse>("/jobs/applications/mine", true),
        apiGet<JobsResponse>(`/jobs?page=${currentJobsPage}&limit=${JOBS_PAGE_LIMIT}`),
        apiGet<CandidateProfileResponse>("/users/candidate/me", true).catch(() => null),
      ]);

      setDashboard(dashboardRes.data);
      setApplications(appsRes.data);
      setJobsMeta(jobsRes.meta);
      setJobs(jobsRes.data);
      const nextProfile = profileRes?.data || dashboardRes.data?.profile || null;
      if (nextProfile) {
        setProfile(nextProfile);
        syncResumeFormFromProfile(nextProfile);
      }
    } catch {
      // Keep the current UI stable if a background refresh fails.
    }
  }, [currentJobsPage]);

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, profileRes] = await Promise.all([
        apiGet<CandidateDashboardResponse>("/dashboards/candidate", true),
        apiGet<CandidateProfileResponse>("/users/candidate/me", true).catch(() => null),
      ]);

      setDashboard(dashboardRes.data);
      const nextProfile = profileRes?.data || dashboardRes.data?.profile || null;
      setProfile(nextProfile);
      syncResumeFormFromProfile(nextProfile);

      await Promise.all([refreshApplications(), fetchJobsPage(1)]);
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

  useEffect(() => {
    const session = getSession();
    if (!session?.accessToken || session.user.role !== "candidate") return;

    const handleWindowFocus = () => {
      void refreshLiveData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshLiveData();
      }
    };

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void refreshLiveData();
      }
    }, LIVE_REFRESH_MS);

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshLiveData, sessionState?.accessToken]);

  const { status: liveStatus } = useServerEvents({
    enabled: Boolean(sessionState?.accessToken && sessionState.user.role === "candidate"),
    onEvent: ({ type }) => {
      if (type === "application-created" || type === "application-updated" || type === "message") {
        void refreshLiveData();
      }
    },
  });

  const applicationJobIds = useMemo(
    () => new Set((applications || []).map((a) => a.jobId?._id).filter(Boolean)),
    [applications],
  );

  const jobTypeOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.employmentType).filter(Boolean))).sort(),
    [jobs],
  );

  const jobLocationOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.jobLocation).filter(Boolean))).sort(),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery =
        !query ||
        [
          job.jobTitle,
          job.companyName,
          job.department,
          job.jobLocation,
          job.description,
          ...(job.skills || []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesType = jobTypeFilter === "all" || job.employmentType === jobTypeFilter;
      const matchesLocation = jobLocationFilter === "all" || job.jobLocation === jobLocationFilter;
      const isApplied = applicationJobIds.has(job._id);
      if (isApplied) return false;
      const matchesReadiness =
        jobReadinessFilter === "all" ||
        (jobReadinessFilter === "ready" && job.canApply !== false);

      return matchesQuery && matchesType && matchesLocation && matchesReadiness;
    });
  }, [applicationJobIds, jobLocationFilter, jobReadinessFilter, jobSearch, jobTypeFilter, jobs]);

  const readyToApplyCount = useMemo(
    () => jobs.filter((job) => job.canApply !== false && !applicationJobIds.has(job._id)).length,
    [applicationJobIds, jobs],
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
      return null;
    });
  }, [applications]);

  const activeApplicationId = expandedApplicationId || applications[0]?._id || null;
  const mobileApplicationOpen = Boolean(expandedApplicationId);

  const selectedApplication = useMemo(
    () =>
      applications.find((application) => application._id === activeApplicationId) ||
      applications[0] ||
      null,
    [activeApplicationId, applications],
  );

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
        const payload = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Failed to download resume";
        throw new Error(message);
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

      if (res.status === 204) {
        setProfilePhotoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }

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

  const goToJobsPage = async (page: number) => {
    if (page < 1) return;
    if (jobsLoadingMore) return;
    setJobsLoadingMore(true);
    setError("");
    try {
      await fetchJobsPage(page);
      setCurrentJobsPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change jobs page");
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
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
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

            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`hidden rounded-full border px-3 py-1 text-[11px] font-semibold sm:inline-flex ${LIVE_STATUS_META[liveStatus].className}`}>
                {LIVE_STATUS_META[liveStatus].label}
              </span>
              <button
                className="rounded-xl border border-[#264a7f]/15 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:hidden"
                onClick={logout}
              >
                Logout
              </button>
            </div>
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
                        ? { background: "var(--brand-gradient)" }
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
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setTab("jobs")}
                      className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#264a7f] shadow-sm transition hover:bg-white/95"
                    >
                      Browse jobs and apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("applications")}
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                    >
                      View my applications
                    </button>
                  </div>
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
          <div className="">
            <div className="">
              

              <div className="border-t border-[#264a7f]/10 bg-white p-4 sm:p-5">
                <div className="grid gap-3 md:grid-cols-[1.4fr,1fr,1fr,auto]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={jobSearch}
                      onChange={(event) => setJobSearch(event.target.value)}
                      placeholder="Search job title or company"
                      className="w-full rounded-xl border border-[#264a7f]/12 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
                    />
                  </label>

                  <label className="relative block">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={jobLocationFilter}
                      onChange={(event) => setJobLocationFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#264a7f]/12 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
                    >
                      <option value="all">All locations</option>
                      {jobLocationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="relative block">
                    <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={jobTypeFilter}
                      onChange={(event) => setJobTypeFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#264a7f]/12 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
                    >
                      <option value="all">All job types</option>
                      {jobTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setJobSearch("");
                      setJobTypeFilter("all");
                      setJobLocationFilter("all");
                      setJobReadinessFilter("all");
                    }}
                    className="rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            
            <div className="space-y-4 my-10">
               
                <div className="grid gap-3 lg:grid-cols-2">
                  {filteredJobs.map((job) => {
                const isApplied = applicationJobIds.has(job._id);
                const isExpanded = expandedJobId === job._id;
                const applyLabel = job.canApply === false
                  ? "Apply unavailable"
                  : isApplied
                    ? "Applied"
                    : applyLoadingJobId === job._id
                      ? "Applying..."
                      : "Apply now";

                const helperText = isApplied
                  ? "You have already applied to this job. Open My Applications to track updates."
                  : job.canApply === false
                    ? job.applyDisabledReason || "Applications are not available for this opening yet."
                    : "This job is live and ready for direct application.";

                    return (
                      <div
                        key={job._id}
                        className="rounded-2xl border border-[#264a7f]/10 bg-white p-4 shadow-sm"
                      >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                            {job.jobTitle || "Job Opening"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {job.companyName || "Company not shared"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {job.jobLocation || "Location not shared"} • {job.employmentType || "Job type pending"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#264a7f]/8 px-3 py-1 text-xs font-medium text-[#264a7f]">
                          {job.minCtcLpa || 0} - {job.maxCtcLpa || 0} LPA
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {job.department || "Department pending"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {job.experienceRequired || "Experience pending"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {job.qualification || "Qualification pending"}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        <span className={isExpanded ? "" : "line-clamp-2"}>
                          {job.description || "No detailed description shared for this opening."}
                        </span>
                      </p>

                      {isExpanded && (
                        <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                          <p><span className="font-medium text-slate-800">Work mode:</span> {job.workModes?.join(", ") || "Not specified"}</p>
                          <p><span className="font-medium text-slate-800">Industry:</span> {job.preferredIndustryBackground || "Not specified"}</p>
                          <p><span className="font-medium text-slate-800">Deadline:</span> {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : "Open until filled"}</p>
                          <p><span className="font-medium text-slate-800">Skills:</span> {job.skills?.length ? job.skills.join(", ") : "Not provided"}</p>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-slate-500">
                        {helperText}
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedJobId((current) => (current === job._id ? null : job._id))}
                          className="flex-1 rounded-xl border border-[#264a7f]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#264a7f]"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void applyToJob(job._id);
                          }}
                          disabled={job.canApply === false || isApplied || applyLoadingJobId === job._id}
                          title={job.canApply === false ? job.applyDisabledReason || "Applications are not available for this opening yet." : undefined}
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ background: JOBS_HERO_GRADIENT }}
                        >
                          {applyLabel}
                        </button>
                      </div>
                  </div>
                );
                  })}
                </div>
              </div>

            {jobsMeta && jobsMeta.total > 0 && (
              <div className={`${brandCardClass} px-5 py-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900">
                      Page {currentJobsPage} is showing {filteredJobs.length} jobs
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {jobsMeta.total} total active jobs across {jobsMeta.totalPages} pages {" • "} up to {JOBS_PAGE_LIMIT} jobs per page
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => void goToJobsPage(currentJobsPage - 1)}
                      disabled={jobsLoadingMore || currentJobsPage <= 1}
                      className="rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
                    >
                      Previous page
                    </button>
                    <button
                      onClick={() => void goToJobsPage(currentJobsPage + 1)}
                      disabled={jobsLoadingMore || currentJobsPage >= jobsMeta.totalPages}
                      className="rounded-xl border border-[#264a7f]/12 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
                    >
                      {jobsLoadingMore ? "Loading..." : "Next page"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {filteredJobs.length === 0 && (
              <div className={`${brandCardClass} p-8 text-center`}>
                <p className="text-lg font-semibold text-slate-900">No jobs match these filters right now.</p>
                <p className="mt-2 text-sm text-slate-500">Try clearing the filters or loading more jobs to see additional openings.</p>
              </div>
            )}
          </div>
        )}



        {tab === "applications" && (
          <div className={`${brandCardClass} overflow-hidden`}>
            <div className="border-b border-[#264a7f]/10 bg-[linear-gradient(135deg,rgba(38,74,127,0.08),rgba(105,164,79,0.08))] px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-slate-900">My Applications</h2>
                  <p className="mt-1 text-sm text-slate-500">A mobile-friendly inbox for every client update, interview note, and hiring step.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/80 px-3 py-1.5 font-medium text-slate-700 shadow-sm">
                    Total {applications.length}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1.5 font-medium text-slate-700 shadow-sm">
                    Interviews {applications.filter((item) => item.status === "interview").length}
                  </span>
                </div>
              </div>
            </div>

            {(applications || []).length > 0 ? (
              <div className="grid gap-0 lg:grid-cols-[300px,minmax(0,1fr)]">
                <div
                  className={`border-b border-[#264a7f]/10 bg-slate-50/70 p-2 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r ${
                    mobileApplicationOpen ? "hidden lg:block" : "block"
                  }`}
                >
                  <div className="space-y-2">
                    {(applications || []).map((application) => {
                      const isActive = activeApplicationId === application._id;
                      const applicationResponse = getApplicationResponseSnapshot(application as Record<string, any>);
                      const timelineItems =
                        application.timeline && application.timeline.length
                          ? application.timeline
                          : [
                              {
                                status: application.status,
                                changedAt: application.statusUpdatedAt || application.createdAt,
                                note: application.statusNote,
                              },
                            ];

                      return (
                        <button
                          key={application._id}
                          type="button"
                          onClick={() => setExpandedApplicationId(application._id)}
                          className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                            isActive
                              ? "border-[#264a7f]/20 bg-white shadow-sm"
                              : "border-transparent bg-white/80 hover:border-[#264a7f]/10 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {application.jobId?.jobTitle || "Job"}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {application.jobId?.jobLocation || "Location not shared"} {" - "} {application.jobId?.employmentType || "Type pending"}
                              </p>
                            </div>
                            <span className="rounded-full bg-[#264a7f]/8 px-2 py-1 text-[10px] font-semibold text-[#264a7f]">
                              {formatStatusLabel(application.status)}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#69a44f]" />
                            <p className="line-clamp-1 text-[11px] leading-5 text-slate-600">
                              {applicationResponse.statusNote
                                ? applicationResponse.statusNote
                                : applicationResponse.interviewDetails?.scheduledAt
                                  ? `Interview ${formatInterviewDate(applicationResponse.interviewDetails.scheduledAt)} at ${formatInterviewTime(applicationResponse.interviewDetails.scheduledAt)}`
                                  : "Open this card to read all client updates."}
                            </p>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{timelineItems.length} updates</span>
                            <span>
                              {new Date(
                                application.statusUpdatedAt || application.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                            <span className="rounded-full bg-slate-50 px-2.5 py-1">
                              {new Date(application.createdAt).toLocaleDateString()}
                            </span>
                            <span className="rounded-full bg-slate-50 px-2.5 py-1">
                              {application.qualification || "Qualification not shared"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedApplication && (
                  <div className={`bg-white p-2 sm:p-3 ${mobileApplicationOpen ? "block" : "hidden lg:block"}`}>
                    {(() => {
                      const selectedResponse = getApplicationResponseSnapshot(
                        selectedApplication as Record<string, any>,
                      );
                      return (
                    <div className="rounded-2xl border border-[#264a7f]/10 bg-white">
                      <div className="border-b border-[#264a7f]/10 px-4 py-3 lg:hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedApplicationId(null)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Back to applications
                        </button>
                      </div>
                      <div className="border-b border-[#264a7f]/10 px-4 py-3 sm:px-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-slate-900 sm:text-lg">
                                {selectedApplication.jobId?.jobTitle || "Job"}
                              </p>
                              {(selectedApplication.jobId?.sourceLabel ||
                                selectedApplication.jobId?.sourceCollection) && (
                                <span className="hidden rounded-full border border-[#264a7f]/10 bg-[#264a7f]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#264a7f]">
                                  {selectedApplication.jobId?.sourceLabel ||
                                    (selectedApplication.jobId?.sourceCollection === "openings"
                                      ? "RecruitKr Hiring"
                                      : "Client Requirement")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {selectedApplication.jobId?.jobLocation || "Location not shared"} •{" "}
                              {selectedApplication.jobId?.employmentType || "Employment type pending"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#264a7f] px-3 py-1.5 text-xs font-semibold text-white">
                              {formatStatusLabel(selectedApplication.status)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                              Applied {new Date(selectedApplication.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Latest update
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-900">
                            {selectedApplication.statusNote || "No written note yet"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Last changed
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-900">
                            {new Date(
                              selectedApplication.statusUpdatedAt || selectedApplication.createdAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Interview state
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-900">
                            {getInterviewTimingMeta(selectedApplication.interviewDetails?.scheduledAt).label}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 px-4 py-4 sm:px-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">Latest update</p>
                          <p className="mt-1 text-sm text-slate-900">
                            {selectedResponse.statusNote || "No written update yet."}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Last changed{" "}
                            {new Date(
                              selectedApplication.statusUpdatedAt || selectedApplication.createdAt,
                            ).toLocaleString()}
                          </p>
                        </div>

                        {(() => {
                          const responseItems = [
                            {
                              label: "Status",
                              value: formatStatusLabel(selectedApplication.status),
                            },
                            selectedResponse.statusNote
                              ? {
                                  label: "Candidate message",
                                  value: selectedResponse.statusNote,
                                }
                              : null,
                            selectedResponse.interviewDetails?.mode
                              ? {
                                  label: "Interview mode",
                                  value:
                                    INTERVIEW_MODE_LABELS[selectedResponse.interviewDetails.mode],
                                }
                              : null,
                            selectedResponse.interviewDetails?.scheduledAt
                              ? {
                                  label: "Interview date",
                                  value: formatInterviewDate(
                                    selectedResponse.interviewDetails.scheduledAt,
                                  ),
                                }
                              : null,
                            selectedResponse.interviewDetails?.scheduledAt
                              ? {
                                  label: "Interview time",
                                  value: formatInterviewTime(
                                    selectedResponse.interviewDetails.scheduledAt,
                                  ),
                                }
                              : null,
                            selectedResponse.interviewDetails?.locationText
                              ? {
                                  label: "Interview location",
                                  value: selectedResponse.interviewDetails.locationText,
                                }
                              : null,
                            selectedResponse.interviewDetails?.contactPerson
                              ? {
                                  label: "Contact person",
                                  value: selectedResponse.interviewDetails.contactPerson,
                                }
                              : null,
                            selectedResponse.interviewDetails?.contactPhone
                              ? {
                                  label: "Contact phone",
                                  value: selectedResponse.interviewDetails.contactPhone,
                                }
                              : null,
                            selectedResponse.interviewDetails?.contactEmail
                              ? {
                                  label: "Contact email",
                                  value: selectedResponse.interviewDetails.contactEmail,
                                }
                              : null,
                            selectedResponse.interviewDetails?.googleMapsUrl
                              ? {
                                  label: "Google map location",
                                  value: selectedResponse.interviewDetails.googleMapsUrl,
                                  href: selectedResponse.interviewDetails.googleMapsUrl,
                                }
                              : null,
                            selectedResponse.interviewDetails?.reportingNotes
                              ? {
                                  label: "Reporting notes",
                                  value: selectedResponse.interviewDetails.reportingNotes,
                                }
                              : null,
                            selectedResponse.interviewDetails?.documentsRequired
                              ? {
                                  label: "Documents required",
                                  value: selectedResponse.interviewDetails.documentsRequired,
                                }
                              : null,
                            selectedResponse.interviewDetails?.additionalInstructions
                              ? {
                                  label: "Additional instructions",
                                  value:
                                    selectedResponse.interviewDetails.additionalInstructions,
                                }
                              : null,
                          ].filter(Boolean) as Array<{
                            label: string;
                            value: string;
                            href?: string;
                          }>;

                          return (
                            <div className="rounded-xl border border-[#264a7f]/10 bg-[#f8fbff] p-3">
                              <p className="text-sm font-semibold text-slate-900">Client response</p>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {responseItems.map((item) => (
                                  <div
                                    key={item.label}
                                    className={`rounded-xl bg-white p-3 ${
                                      item.label === "Contact email" ||
                                      item.label === "Google map location" ||
                                      item.label === "Reporting notes" ||
                                      item.label === "Documents required" ||
                                      item.label === "Additional instructions"
                                        ? "sm:col-span-2"
                                        : ""
                                    }`}
                                  >
                                    <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <p className="break-all text-sm text-slate-900">{item.value}</p>
                                      {item.href && (
                                        <a
                                          href={item.href}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                                        >
                                          Open map
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold text-slate-500">Applied on</p>
                            <p className="mt-1 text-sm text-slate-900">
                              {new Date(selectedApplication.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold text-slate-500">Qualification</p>
                            <p className="mt-1 text-sm text-slate-900">
                              {selectedApplication.qualification || "Not shared"}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold text-slate-500">Candidate name</p>
                            <p className="mt-1 text-sm text-slate-900">
                              {selectedApplication.fullName || profile?.fullName || "Not shared"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold text-slate-500">Email</p>
                            <p className="mt-1 break-all text-sm text-slate-900">
                              {selectedApplication.email || "No email"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold text-slate-500">Phone</p>
                            <p className="mt-1 text-sm text-slate-900">
                              {selectedApplication.phone || "No phone"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold text-slate-500">Current city</p>
                            <p className="mt-1 text-sm text-slate-900">
                              {selectedApplication.currentCity || "Not shared"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="text-sm font-semibold text-slate-900">Your submitted application</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-500">Applied for</p>
                              <p className="mt-1 text-sm text-slate-900">
                                {selectedApplication.appliedFor || selectedApplication.jobId?.jobTitle || "Job"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-500">Experience</p>
                              <p className="mt-1 text-sm text-slate-900">
                                {selectedApplication.experience?.[0]?.jobProfile || "Not shared"}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-500">Applied on</p>
                              <p className="mt-1 text-sm text-slate-900">
                                {new Date(selectedApplication.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-500">Source</p>
                              <p className="mt-1 text-sm text-slate-900">
                                {selectedApplication.jobId?.sourceLabel || "RecruitKr"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {selectedResponse.interviewDetails &&
                          (selectedResponse.interviewDetails.scheduledAt ||
                            selectedResponse.interviewDetails.mode ||
                            selectedResponse.interviewDetails.locationText ||
                            selectedResponse.interviewDetails.contactPerson ||
                            selectedResponse.interviewDetails.contactEmail ||
                            selectedResponse.interviewDetails.contactPhone ||
                            selectedResponse.interviewDetails.notes ||
                            selectedResponse.interviewDetails.reportingNotes ||
                            selectedResponse.interviewDetails.documentsRequired ||
                            selectedResponse.interviewDetails.additionalInstructions) && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">Interview details shared by client</p>
                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      getInterviewTimingMeta(selectedResponse.interviewDetails.scheduledAt).tone
                                    }`}
                                  >
                                    {getInterviewTimingMeta(selectedResponse.interviewDetails.scheduledAt).label}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                  {selectedResponse.interviewDetails.scheduledAt
                                    ? `${formatInterviewDate(selectedResponse.interviewDetails.scheduledAt)} at ${formatInterviewTime(selectedResponse.interviewDetails.scheduledAt)}${selectedResponse.interviewDetails.timezone ? ` (${selectedResponse.interviewDetails.timezone})` : ""}`
                                    : "The client moved your application to interview and timing details are still pending."}
                                </p>
                              </div>

                              <div className="hidden rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Next step
                                </p>
                                <p className="mt-2">{getInterviewTimingMeta(selectedResponse.interviewDetails.scheduledAt).hint}</p>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3">
                              <div className="rounded-xl bg-white p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Meeting setup
                                </p>
                                <div className="mt-2 space-y-2 text-sm text-slate-700">
                                  <p>Mode: {selectedResponse.interviewDetails.mode ? INTERVIEW_MODE_LABELS[selectedResponse.interviewDetails.mode] : "Not shared yet"}</p>
                                  <p>Contact: {selectedResponse.interviewDetails.contactPerson || "Will be shared by client"}</p>
                                  {selectedResponse.interviewDetails.locationText && <p>{selectedResponse.interviewDetails.locationText}</p>}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {selectedResponse.interviewDetails.meetingLink && (
                                    <a
                                      href={selectedResponse.interviewDetails.meetingLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                    >
                                      Open meeting link
                                    </a>
                                  )}
                                  {selectedResponse.interviewDetails.googleMapsUrl && (
                                    <a
                                      href={selectedResponse.interviewDetails.googleMapsUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                                    >
                                      Open map
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-xl bg-white p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Notes and support
                                </p>
                                <div className="mt-2 space-y-2 text-sm text-slate-700">
                                  {selectedResponse.interviewDetails.contactEmail && (
                                    <p className="break-all">Email: {selectedResponse.interviewDetails.contactEmail}</p>
                                  )}
                                  {selectedResponse.interviewDetails.contactPhone && (
                                    <p>Phone: {selectedResponse.interviewDetails.contactPhone}</p>
                                  )}
                                  <div className="space-y-2">
                                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                                      <p className="text-xs font-semibold text-slate-500">Candidate message</p>
                                      <p className="mt-1">
                                        {selectedResponse.interviewDetails.notes || "No extra note shared yet."}
                                      </p>
                                    </div>

                                    {selectedResponse.interviewDetails.reportingNotes && (
                                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                                        <p className="text-xs font-semibold text-slate-500">Reporting notes</p>
                                        <p className="mt-1">{selectedResponse.interviewDetails.reportingNotes}</p>
                                      </div>
                                    )}

                                    {selectedResponse.interviewDetails.documentsRequired && (
                                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                                        <p className="text-xs font-semibold text-slate-500">Documents required</p>
                                        <p className="mt-1">{selectedResponse.interviewDetails.documentsRequired}</p>
                                      </div>
                                    )}

                                    {selectedResponse.interviewDetails.additionalInstructions && (
                                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                                        <p className="text-xs font-semibold text-slate-500">Additional instructions</p>
                                        <p className="mt-1">{selectedResponse.interviewDetails.additionalInstructions}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Status history</p>
                              <p className="mt-1 text-xs text-slate-500">Simple list of all updates.</p>
                            </div>
                            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 sm:inline-flex">
                              Live thread
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {(selectedApplication.timeline && selectedApplication.timeline.length
                              ? selectedApplication.timeline
                              : [
                                  {
                                    status: selectedApplication.status,
                                    changedAt:
                                      selectedApplication.statusUpdatedAt || selectedApplication.createdAt,
                                    note: selectedResponse.statusNote,
                                  },
                                ]
                            ).map((item, index) => {
                              const isCandidate = item.changedByRole === "candidate";
                              const isClient = item.changedByRole === "client";

                              return (
                                <div
                                  key={`${selectedApplication._id}-${item.status}-${index}`}
                                  className="rounded-xl border border-slate-200 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {formatStatusLabel(item.status)}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {isClient
                                          ? "Client / RecruitKr"
                                          : isCandidate
                                            ? "You"
                                            : "System"}
                                      </p>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      {item.changedAt
                                        ? new Date(item.changedAt).toLocaleDateString()
                                        : "Recently updated"}
                                    </p>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {item.note ||
                                      (item.status === "applied"
                                        ? "Your application was submitted."
                                        : "Status changed with no extra note yet.")}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
                No applications yet.
              </div>
            )}
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
