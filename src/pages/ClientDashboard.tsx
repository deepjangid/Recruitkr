import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";
import { useServerEvents, type SseConnectionStatus } from "@/hooks/useServerEvents";
import { tryAutoLogin } from "@/lib/autoLogin";
import Logo from "@/assets/logo.png";

type ApplicationStatus =
  | "applied"
  | "under-review"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

const LIVE_REFRESH_MS = 5000;

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

type ApplicationTimelineItem = {
  status: "applied" | ApplicationStatus;
  note?: string;
  changedByRole?: "candidate" | "client" | "system";
  changedAt?: string;
};

const STATUS_LABELS: Record<ApplicationTimelineItem["status"], string> = {
  applied: "Applied successfully",
  "under-review": "Client reviewed",
  screening: "Shortlisted / screening",
  interview: "Interview scheduled",
  offer: "Offer shared",
  hired: "Hired",
  rejected: "Rejected",
};

const formatStatusLabel = (status?: string) =>
  (status && STATUS_LABELS[status as ApplicationTimelineItem["status"]]) ||
  (status ? status.replace(/-/g, " ") : "Status pending");

const INTERVIEW_MODE_OPTIONS: Array<{ value: NonNullable<InterviewDetails["mode"]>; label: string }> = [
  { value: "onsite", label: "On-site" },
  { value: "google-meet", label: "Google Meet" },
  { value: "phone", label: "Phone call" },
  { value: "video", label: "Video call" },
  { value: "zoom", label: "Zoom" },
  { value: "other", label: "Other" },
];

const LIVE_STATUS_META: Record<SseConnectionStatus, { label: string; className: string }> = {
  connecting: { label: "Live connecting", className: "border-amber-200 bg-amber-50 text-amber-700" },
  connected: { label: "Live connected", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  reconnecting: { label: "Live reconnecting", className: "border-sky-200 bg-sky-50 text-sky-700" },
  disconnected: { label: "Live disconnected", className: "border-slate-200 bg-slate-100 text-slate-600" },
};

type ClientDashboardResponse = {
  success: boolean;
  data: {
    stats: {
      activeRequirements: number;
      candidatesSourced: number;
      interviewsScheduled: number;
      positionsFilled: number;
    };
    requirements: Array<{
      _id: string;
      jobTitle: string;
      department: string;
      openings: number;
      status: "active" | "on-hold" | "closed";
      urgencyLevel: string;
      createdAt: string;
    }>;
  };
};

type ClientMyJobsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    jobTitle: string;
    category?: string;
    company?: string;
    openings: number;
    department: string;
    jobLocation: string;
    employmentType: string;
    experienceRequired: string;
    qualification?: string;
    minCtcLpa: number;
    maxCtcLpa: number;
    fixedPrice?: number;
    ageRequirement?: string;
    contactEmail?: string;
    salary?: {
      currency?: string;
    };
    preferredIndustryBackground?: string;
    genderPreference?: string;
    workModes?: Array<"On-site" | "Hybrid" | "Remote">;
    jobDescription: string;
    requirements?: string[];
    responsibilities?: string[];
    skills?: string[];
    urgencyLevel: string;
    expectedJoiningDate?: string;
    status: "active" | "on-hold" | "closed";
    createdAt: string;
  }>;
};

type ClientProfileResponse = {
  success: boolean;
  data: {
    companyName?: string;
    industry?: string;
    companyType?: string;
    companySize?: string;
    companyWebsite?: string;
    mobile?: string;
    email?: string;
    spoc?: {
      name?: string;
      designation?: string;
      mobile?: string;
      email?: string;
    };
    profileImage?: {
      fileName?: string;
      mimeType?: string;
      size?: number;
    };
  };
};

type ClientApplicationsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    fullName?: string;
    status: ApplicationStatus;
    createdAt: string;
    statusNote?: string;
    statusUpdatedAt?: string;
    interviewDetails?: InterviewDetails;
    timeline?: ApplicationTimelineItem[];
    jobId?: {
      jobTitle?: string;
    };
    candidateId?: {
      email?: string;
      mobile?: string;
    };
  }>;
};

type ClientApplicationDetailsResponse = {
  success: boolean;
  data: {
    application: ClientApplicationsResponse["data"][number];
    candidateProfile?: {
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
        currentCtcLpa?: number;
        expectedCtcLpa?: number;
        minimumCtcLpa?: number;
        noticePeriod?: string;
        lastWorkingDay?: string;
      };
      preferences?: {
        preferredLocation?: string;
        preferredIndustry?: string;
        preferredRole?: string;
        workModes?: Array<"On-site" | "Hybrid" | "Remote">;
      };
      summary?: string;
      skills?: string[];
      projects?: Array<{ name?: string; description?: string }>;
      certifications?: Array<{ name?: string; institute?: string }>;
      referral?: string;
    };
    resume?: {
      _id: string;
      fileName?: string;
      mimeType?: string;
      source?: string;
      updatedAt?: string;
    };
  };
};

type ClientResumesResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    applicationId: string;
    candidateName: string;
    candidateEmail?: string;
    jobTitle?: string;
    fileName?: string;
    mimeType?: string;
    source?: string;
    updatedAt?: string;
    isLegacy?: boolean;
  }>;
};

type JobRequirementForm = {
  jobTitle: string;
  category: string;
  company: string;
  openings: string;
  department: string;
  jobLocation: string;
  employmentType: string;
  experienceRequired: string;
  qualification: string;
  minCtcLpa: string;
  maxCtcLpa: string;
  fixedPrice: string;
  ageRequirement: string;
  contactEmail: string;
  salaryCurrency: string;
  preferredIndustryBackground: string;
  genderPreference: string;
  jobDescription: string;
  requirementsText: string;
  responsibilitiesText: string;
  skillsText: string;
  urgencyLevel: string;
  expectedJoiningDate: string;
};

const initialJobRequirementForm: JobRequirementForm = {
  jobTitle: "",
  category: "",
  company: "",
  openings: "1",
  department: "",
  jobLocation: "",
  employmentType: "",
  experienceRequired: "",
  qualification: "",
  minCtcLpa: "",
  maxCtcLpa: "",
  fixedPrice: "",
  ageRequirement: "",
  contactEmail: "",
  salaryCurrency: "INR",
  preferredIndustryBackground: "",
  genderPreference: "",
  jobDescription: "",
  requirementsText: "",
  responsibilitiesText: "",
  skillsText: "",
  urgencyLevel: "",
  expectedJoiningDate: "",
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState(() => getSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<ClientDashboardResponse["data"] | null>(null);
  const [profile, setProfile] = useState<ClientProfileResponse["data"] | null>(null);
  const [applications, setApplications] = useState<ClientApplicationsResponse["data"]>([]);
  const [resumes, setResumes] = useState<ClientResumesResponse["data"]>([]);
  const [requirements, setRequirements] = useState<ClientMyJobsResponse["data"]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedApplicationDetails, setSelectedApplicationDetails] =
    useState<ClientApplicationDetailsResponse["data"] | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsFormVisible, setDetailsFormVisible] = useState(false);
  const [savingApplicationId, setSavingApplicationId] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "requirements" | "applications" | "resumes" | "profile">("overview");
  const [showCreateRequirementForm, setShowCreateRequirementForm] = useState(false);
  const [creatingRequirement, setCreatingRequirement] = useState(false);
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [deletingRequirementId, setDeletingRequirementId] = useState<string | null>(null);
  const [newRequirementForm, setNewRequirementForm] = useState<JobRequirementForm>(initialJobRequirementForm);
  const [newRequirementWorkModes, setNewRequirementWorkModes] = useState<Array<"On-site" | "Hybrid" | "Remote">>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const companyInitial = (profile?.companyName || sessionState?.user.email || "C").trim().charAt(0).toUpperCase();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, profileRes, applicationsRes, resumesRes, jobsRes] = await Promise.all([
        apiGet<ClientDashboardResponse>("/dashboards/client", true),
        apiGet<ClientProfileResponse>("/users/client/me", true),
        apiGet<ClientApplicationsResponse>("/jobs/applications", true),
        apiGet<ClientResumesResponse>("/resumes/client", true),
        apiGet<ClientMyJobsResponse>("/jobs/mine", true),
      ]);
      setDashboard(dashboardRes.data);
      setProfile(profileRes.data);
      setApplications(applicationsRes.data);
      setResumes(resumesRes.data);
      setRequirements(jobsRes.data);
      setNewRequirementForm((prev) => ({
        ...prev,
        company: profileRes.data?.companyName || prev.company,
        contactEmail: profileRes.data?.spoc?.email || profileRes.data?.email || prev.contactEmail,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const refreshLiveData = useCallback(async () => {
    try {
      const [dashboardRes, applicationsRes, resumesRes] = await Promise.all([
        apiGet<ClientDashboardResponse>("/dashboards/client", true),
        apiGet<ClientApplicationsResponse>("/jobs/applications", true),
        apiGet<ClientResumesResponse>("/resumes/client", true),
      ]);

      setDashboard(dashboardRes.data);
      setApplications(applicationsRes.data);
      setResumes(resumesRes.data);

      if (selectedApplicationId) {
        const detailsRes = await apiGet<ClientApplicationDetailsResponse>(
          `/jobs/applications/${selectedApplicationId}`,
          true,
        );
        setSelectedApplicationDetails(detailsRes.data);
      }
    } catch {
      // Avoid breaking the current screen if a background refresh misses once.
    }
  }, [selectedApplicationId]);

  const loadProfileImage = async () => {
    setProfileImageLoading(true);
    try {
      const session = getSession();
      if (!session?.accessToken) {
        setProfileImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }

      const res = await fetch(`${API_BASE}/users/client/profile-image`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) {
        setProfileImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setProfileImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } finally {
      setProfileImageLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      let session = getSession();
      if (!session?.accessToken) {
        session = await tryAutoLogin();
      }

      setSessionState(session);

      if (!session?.accessToken || session.user.role !== "client") {
        navigate("/login?role=client");
        return;
      }

      await loadData();
      void loadProfileImage();
    };

    void boot();
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session?.accessToken || session.user.role !== "client") return;

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
  }, [refreshLiveData, selectedApplicationId, sessionState?.accessToken]);

  const { status: liveStatus } = useServerEvents({
    enabled: Boolean(sessionState?.accessToken && sessionState.user.role === "client"),
    onEvent: ({ type }) => {
      if (type === "application-created" || type === "application-updated" || type === "message") {
        void refreshLiveData();
      }
    },
  });

  useEffect(() => () => {
    setProfileImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const updateRequirementStatus = async (jobId: string, status: "active" | "on-hold" | "closed") => {
    setError("");
    try {
      await apiPatch(`/jobs/${jobId}/status`, { status }, true);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const updateNewRequirementField =
    (field: keyof JobRequirementForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setNewRequirementForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const toggleNewRequirementWorkMode = (mode: "On-site" | "Hybrid" | "Remote") => {
    setNewRequirementWorkModes((prev) =>
      prev.includes(mode) ? prev.filter((item) => item !== mode) : [...prev, mode],
    );
  };

  const createRequirement = async () => {
    setError("");

    const normalizedDepartment = newRequirementForm.department.trim() || newRequirementForm.category.trim();
    const missingFields: string[] = [];

    if (!newRequirementForm.jobTitle.trim()) missingFields.push("Job Title");
    if (!newRequirementForm.category.trim()) missingFields.push("Category");
    if (!normalizedDepartment) missingFields.push("Department");
    if (!newRequirementForm.jobLocation.trim()) missingFields.push("Job Location");
    if (!newRequirementForm.employmentType) missingFields.push("Job Type");
    if (!newRequirementForm.experienceRequired.trim()) missingFields.push("Experience Level");
    if (!newRequirementForm.minCtcLpa.trim()) missingFields.push("Min CTC");
    if (!newRequirementForm.maxCtcLpa.trim()) missingFields.push("Max CTC");
    if (!newRequirementForm.jobDescription.trim() || newRequirementForm.jobDescription.trim().length < 10) {
      missingFields.push("Job Description");
    }
    if (!newRequirementForm.urgencyLevel) missingFields.push("Urgency Level");
    if (Number(newRequirementForm.openings) < 1) missingFields.push("Openings");
    if (newRequirementWorkModes.length === 0) missingFields.push("Work Mode");

    if (missingFields.length > 0) {
      setError(`Please complete these required fields: ${missingFields.join(", ")}.`);
      return;
    }

    if (Number(newRequirementForm.maxCtcLpa) < Number(newRequirementForm.minCtcLpa)) {
      setError("Max CTC should be greater than or equal to Min CTC.");
      return;
    }

    setCreatingRequirement(true);
    try {
      const parseLines = (value: string) =>
        value
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);

      const payload = {
        jobTitle: newRequirementForm.jobTitle.trim(),
        category: newRequirementForm.category.trim(),
        company: newRequirementForm.company.trim() || undefined,
        openings: Number(newRequirementForm.openings),
        department: normalizedDepartment,
        jobLocation: newRequirementForm.jobLocation.trim(),
        employmentType: newRequirementForm.employmentType,
        experienceRequired: newRequirementForm.experienceRequired.trim(),
        qualification: newRequirementForm.qualification.trim() || undefined,
        minCtcLpa: Number(newRequirementForm.minCtcLpa),
        maxCtcLpa: Number(newRequirementForm.maxCtcLpa),
        fixedPrice: newRequirementForm.fixedPrice.trim() ? Number(newRequirementForm.fixedPrice) : undefined,
        ageRequirement: newRequirementForm.ageRequirement.trim() || undefined,
        contactEmail: newRequirementForm.contactEmail.trim() || undefined,
        salaryCurrency: newRequirementForm.salaryCurrency.trim() || "INR",
        preferredIndustryBackground: newRequirementForm.preferredIndustryBackground.trim() || undefined,
        genderPreference:
          newRequirementForm.genderPreference &&
          newRequirementForm.genderPreference !== "No Preference"
            ? newRequirementForm.genderPreference
            : undefined,
        workModes: newRequirementWorkModes,
        jobDescription: newRequirementForm.jobDescription.trim(),
        requirements: parseLines(newRequirementForm.requirementsText),
        responsibilities: parseLines(newRequirementForm.responsibilitiesText),
        skills: parseLines(newRequirementForm.skillsText),
        urgencyLevel: newRequirementForm.urgencyLevel,
        expectedJoiningDate: newRequirementForm.expectedJoiningDate || undefined,
      };

      if (editingRequirementId) {
        await apiPatch(`/jobs/${editingRequirementId}`, payload, true);
      } else {
        await apiPost(
          "/jobs",
          payload,
          true,
        );
      }

      setNewRequirementForm(initialJobRequirementForm);
      setNewRequirementWorkModes([]);
      setShowCreateRequirementForm(false);
      setEditingRequirementId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingRequirementId ? "Failed to update hiring requirement" : "Failed to post hiring requirement");
    } finally {
      setCreatingRequirement(false);
    }
  };

  const editRequirement = (requirement: ClientMyJobsResponse["data"][number]) => {
    setEditingRequirementId(requirement._id);
    setNewRequirementForm({
      jobTitle: requirement.jobTitle || "",
      category: requirement.category || requirement.department || "",
      company: requirement.company || profile?.companyName || "",
      openings: String(requirement.openings || 1),
      department: requirement.department || "",
      jobLocation: requirement.jobLocation || "",
      employmentType: requirement.employmentType || "",
      experienceRequired: requirement.experienceRequired || "",
      qualification: requirement.qualification || "",
      minCtcLpa: String(requirement.minCtcLpa ?? ""),
      maxCtcLpa: String(requirement.maxCtcLpa ?? ""),
      fixedPrice: String(requirement.fixedPrice ?? ""),
      ageRequirement: requirement.ageRequirement || "",
      contactEmail: requirement.contactEmail || profile?.spoc?.email || profile?.email || "",
      salaryCurrency: requirement.salary?.currency || "INR",
      preferredIndustryBackground: requirement.preferredIndustryBackground || "",
      genderPreference: requirement.genderPreference || "",
      jobDescription: requirement.jobDescription || "",
      requirementsText: requirement.requirements?.join("\n") || "",
      responsibilitiesText: requirement.responsibilities?.join("\n") || "",
      skillsText: requirement.skills?.join("\n") || "",
      urgencyLevel: requirement.urgencyLevel || "",
      expectedJoiningDate: requirement.expectedJoiningDate ? requirement.expectedJoiningDate.slice(0, 10) : "",
    });
    setNewRequirementWorkModes(requirement.workModes || []);
    setShowCreateRequirementForm(true);
  };

  const resetRequirementForm = () => {
    setEditingRequirementId(null);
    setNewRequirementForm({
      ...initialJobRequirementForm,
      company: profile?.companyName || "",
      contactEmail: profile?.spoc?.email || profile?.email || "",
    });
    setNewRequirementWorkModes([]);
    setShowCreateRequirementForm(false);
  };

  const deleteRequirement = async (jobId: string) => {
    setDeletingRequirementId(jobId);
    setError("");
    try {
      await apiDelete(`/jobs/${jobId}`, true);
      if (editingRequirementId === jobId) {
        resetRequirementForm();
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete requirement");
    } finally {
      setDeletingRequirementId(null);
    }
  };

  const openApplicationDetails = async (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setDetailsLoading(true);
    setDetailsFormVisible(false);
    setError("");

    try {
      const response = await apiGet<ClientApplicationDetailsResponse>(`/jobs/applications/${applicationId}`, true);
      setSelectedApplicationDetails(response.data);
    } catch (err) {
      setSelectedApplicationDetails(null);
      setError(err instanceof Error ? err.message : "Failed to load candidate details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateApplicationDraft = (
    applicationId: string,
    updater: (
      application: ClientApplicationsResponse["data"][number],
    ) => ClientApplicationsResponse["data"][number],
  ) => {
    setApplications((prev) => prev.map((application) => (application._id === applicationId ? updater(application) : application)));
    setSelectedApplicationDetails((prev) =>
      prev && prev.application._id === applicationId
        ? {
            ...prev,
            application: updater(prev.application),
          }
        : prev,
    );
  };

  const updateApplicationField = (
    applicationId: string,
    field: keyof ClientApplicationsResponse["data"][number],
    value: unknown,
  ) => {
    updateApplicationDraft(applicationId, (application) => ({ ...application, [field]: value }));
  };

  const updateInterviewField = (
    applicationId: string,
    field: keyof InterviewDetails,
    value: string,
  ) => {
    updateApplicationDraft(applicationId, (application) => ({
      ...application,
      interviewDetails: {
        ...(application.interviewDetails || {}),
        [field]: value,
      },
    }));
  };

  const saveApplicationUpdate = async (applicationId: string) => {
    const application = applications.find((item) => item._id === applicationId);
    if (!application) return;

    setSavingApplicationId(applicationId);
    setError("");

    try {
      const rawInterviewDetails = application.interviewDetails || {};
      const sanitizedInterviewDetails = Object.fromEntries(
        Object.entries({
          ...(rawInterviewDetails.scheduledAt
            ? { scheduledAt: new Date(rawInterviewDetails.scheduledAt).toISOString() }
            : {}),
          ...(rawInterviewDetails.timezone?.trim() ? { timezone: rawInterviewDetails.timezone.trim() } : {}),
          ...(rawInterviewDetails.mode ? { mode: rawInterviewDetails.mode } : {}),
          ...(rawInterviewDetails.locationText?.trim()
            ? { locationText: rawInterviewDetails.locationText.trim() }
            : {}),
          ...(rawInterviewDetails.googleMapsUrl?.trim()
            ? { googleMapsUrl: rawInterviewDetails.googleMapsUrl.trim() }
            : {}),
          ...(rawInterviewDetails.meetingLink?.trim()
            ? { meetingLink: rawInterviewDetails.meetingLink.trim() }
            : {}),
          ...(rawInterviewDetails.contactPerson?.trim()
            ? { contactPerson: rawInterviewDetails.contactPerson.trim() }
            : {}),
          ...(rawInterviewDetails.contactEmail?.trim()
            ? { contactEmail: rawInterviewDetails.contactEmail.trim() }
            : {}),
          ...(rawInterviewDetails.contactPhone?.trim()
            ? { contactPhone: rawInterviewDetails.contactPhone.trim() }
            : {}),
          ...(rawInterviewDetails.notes?.trim() ? { notes: rawInterviewDetails.notes.trim() } : {}),
          ...(rawInterviewDetails.reportingNotes?.trim()
            ? { reportingNotes: rawInterviewDetails.reportingNotes.trim() }
            : {}),
          ...(rawInterviewDetails.documentsRequired?.trim()
            ? { documentsRequired: rawInterviewDetails.documentsRequired.trim() }
            : {}),
          ...(rawInterviewDetails.additionalInstructions?.trim()
            ? { additionalInstructions: rawInterviewDetails.additionalInstructions.trim() }
            : {}),
        }).filter(([, value]) => value !== undefined && value !== ""),
      );

      await apiPatch(
        `/jobs/applications/${applicationId}/status`,
        {
          status: application.status,
          ...(application.statusNote?.trim()
            ? {
                note: application.statusNote.trim(),
                candidateResponse: application.statusNote.trim(),
                clientNote: application.statusNote.trim(),
              }
            : {}),
          ...(rawInterviewDetails.scheduledAt
            ? {
                interviewDate: new Date(rawInterviewDetails.scheduledAt).toLocaleDateString("en-GB"),
                interviewTime: new Date(rawInterviewDetails.scheduledAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                }),
              }
            : {}),
          ...(rawInterviewDetails.mode ? { interviewMode: rawInterviewDetails.mode } : {}),
          ...(rawInterviewDetails.locationText?.trim()
            ? { interviewLocation: rawInterviewDetails.locationText.trim() }
            : {}),
          ...(rawInterviewDetails.googleMapsUrl?.trim()
            ? { googleMapLocation: rawInterviewDetails.googleMapsUrl.trim() }
            : {}),
          ...(rawInterviewDetails.contactPerson?.trim()
            ? { contactPerson: rawInterviewDetails.contactPerson.trim() }
            : {}),
          ...(rawInterviewDetails.contactEmail?.trim()
            ? { contactEmail: rawInterviewDetails.contactEmail.trim() }
            : {}),
          ...(rawInterviewDetails.contactPhone?.trim()
            ? { contactPhone: rawInterviewDetails.contactPhone.trim() }
            : {}),
          ...(rawInterviewDetails.reportingNotes?.trim()
            ? { reportingNotes: rawInterviewDetails.reportingNotes.trim() }
            : {}),
          ...(rawInterviewDetails.documentsRequired?.trim()
            ? { documentsRequired: rawInterviewDetails.documentsRequired.trim() }
            : {}),
          ...(rawInterviewDetails.additionalInstructions?.trim()
            ? { additionalInstructions: rawInterviewDetails.additionalInstructions.trim() }
            : {}),
          ...(Object.keys(sanitizedInterviewDetails).length
            ? { interviewDetails: sanitizedInterviewDetails }
            : {}),
        },
        true,
      );

      await loadData();
      await openApplicationDetails(applicationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setSavingApplicationId(null);
    }
  };

  const rejectApplication = async (applicationId: string) => {
    setSavingApplicationId(applicationId);
    setError("");

    try {
      await apiPatch(
        `/jobs/applications/${applicationId}/status`,
        {
          status: "rejected",
          note: "Application rejected by client.",
        },
        true,
      );

      setDetailsFormVisible(false);
      await loadData();
      await openApplicationDetails(applicationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setSavingApplicationId(null);
    }
  };

  const downloadResume = async (applicationId: string, fileName?: string) => {
    try {
      const session = getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/jobs/applications/${applicationId}/resume`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!res.ok) throw new Error("Failed to download resume");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "candidate_resume";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download resume");
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

  const uploadProfileImage = async (file: File) => {
    setError("");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await apiPost("/users/client/profile-image", fd, true);
      await loadData();
      await loadProfileImage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload profile image");
    }
  };

  const removeProfileImage = async () => {
    setError("");
    try {
      await apiDelete("/users/client/profile-image", true);
      setProfileImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove profile image");
    }
  };

  const dashboardTabs: Array<{ key: typeof tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "requirements", label: "Requirements" },
    { key: "applications", label: "Applications" },
    { key: "resumes", label: "Resumes" },
    { key: "profile", label: "Profile" },
  ];

  const renderResumesTab = () => (
    <div className="space-y-6">
      <div className={brandCardClass}>
        <div className="border-b border-[#264a7f]/10 px-4 py-5 sm:px-6">
          <h2 className="font-heading font-semibold text-slate-900">All Candidate Resumes</h2>
          <p className="mt-1 text-sm text-slate-500">See every resume linked to your applications in one place.</p>
        </div>

        <div className="divide-y divide-border">
          {resumes.map((resume) => (
            <div key={`${resume.applicationId}-${resume.fileName}`} className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{resume.candidateName || "Candidate"}</p>
                <p className="text-sm text-slate-500">{resume.jobTitle || "Job"}</p>
                <p className="mt-1 break-all text-sm text-slate-500">{resume.fileName || "candidate_resume.pdf"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {resume.source === "uploaded" ? "Uploaded resume" : "Generated resume"}
                  {resume.updatedAt ? ` • Updated ${new Date(resume.updatedAt).toLocaleDateString()}` : ""}
                  {resume.isLegacy ? " • Legacy record" : ""}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void downloadResume(resume.applicationId, resume.fileName)}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Download Resume
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("applications");
                    void openApplicationDetails(resume.applicationId);
                  }}
                  className="rounded-lg bg-[#264a7f] px-4 py-2 text-sm font-medium text-white"
                >
                  View Application
                </button>
              </div>
            </div>
          ))}

          {resumes.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
              No resumes available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      <div className={`${brandCardClass} overflow-hidden`}>
        <div className="border-b border-[#264a7f]/10 px-4 py-5 sm:px-6">
          <h2 className="font-heading font-semibold text-slate-900">Candidate Applications</h2>
          <p className="mt-1 text-sm text-slate-500">Review every applicant with status, resume, and form details side by side.</p>
        </div>
        <div className="divide-y divide-border">
          {applications.map((application) => (
            <button
              key={application._id}
              type="button"
              className={`w-full px-4 py-4 text-left transition sm:px-6 ${
                selectedApplicationId === application._id ? "bg-[#264a7f]/5" : "hover:bg-[#264a7f]/[0.03]"
              }`}
              onClick={() => void openApplicationDetails(application._id)}
            >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{application.jobId?.jobTitle || "Job"}</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {application.fullName?.trim() || application.candidateId?.email || "Candidate"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Applied on {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-full border border-[#264a7f]/12 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                  {formatStatusLabel(application.status)}
                </div>
              </div>
            </button>
          ))}
          {applications.length === 0 && (
            <div className="px-4 py-4 text-sm text-muted-foreground sm:px-6">No applications yet.</div>
          )}
        </div>
      </div>

      <div className={`${brandCardClass} p-6`}>
        {!selectedApplicationId && !detailsLoading && (
          <p className="text-sm text-muted-foreground">
            Click any application to see the candidate form, mobile number, and resume.
          </p>
        )}

        {detailsLoading && <p className="text-sm text-muted-foreground">Loading candidate details...</p>}

        {!detailsLoading && selectedApplicationDetails && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-heading text-xl font-semibold">
                  {selectedApplicationDetails.candidateProfile?.fullName ||
                    selectedApplicationDetails.application.candidateId?.email ||
                    "Candidate"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Applied for {selectedApplicationDetails.application.jobId?.jobTitle || "Job"}
                </p>
              </div>
              <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                {formatStatusLabel(selectedApplicationDetails.application.status)}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Contact</p>
                <p className="mt-2 text-sm text-muted-foreground break-all">
                  Email: {selectedApplicationDetails.application.candidateId?.email || "-"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mobile: {selectedApplicationDetails.application.candidateId?.mobile || "-"}
                </p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Resume</p>
                {selectedApplicationDetails.resume ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground break-all">
                      {selectedApplicationDetails.resume.fileName || "Candidate resume"}
                    </p>
                    <button
                      className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-sm"
                      onClick={() =>
                        void downloadResume(
                          selectedApplicationDetails.application._id,
                          selectedApplicationDetails.resume?.fileName,
                        )
                      }
                    >
                      Download Resume
                    </button>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Resume not available.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <h4 className="font-medium">Candidate Form</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Full name</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.fullName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Qualification</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.highestQualification || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of birth</p>
                  <p className="text-sm">
                    {selectedApplicationDetails.candidateProfile?.dateOfBirth
                      ? new Date(selectedApplicationDetails.candidateProfile.dateOfBirth).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience status</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.experienceStatus || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Preferred role</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.preferences?.preferredRole || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Preferred location</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.preferences?.preferredLocation || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Preferred industry</p>
                  <p className="text-sm">{selectedApplicationDetails.candidateProfile?.preferences?.preferredIndustry || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm">
                  {selectedApplicationDetails.candidateProfile?.address || "-"}
                  {selectedApplicationDetails.candidateProfile?.pincode
                    ? ` - ${selectedApplicationDetails.candidateProfile.pincode}`
                    : ""}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Summary</p>
                <p className="text-sm text-muted-foreground">
                  {selectedApplicationDetails.candidateProfile?.summary || "No summary added."}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Skills</p>
                <p className="text-sm">
                  {selectedApplicationDetails.candidateProfile?.skills?.length
                    ? selectedApplicationDetails.candidateProfile.skills.join(", ")
                    : "-"}
                </p>
              </div>

              {selectedApplicationDetails.candidateProfile?.experienceDetails && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Current company</p>
                    <p className="text-sm">
                      {selectedApplicationDetails.candidateProfile.experienceDetails.currentCompany || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Designation</p>
                    <p className="text-sm">
                      {selectedApplicationDetails.candidateProfile.experienceDetails.designation || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total experience</p>
                    <p className="text-sm">
                      {selectedApplicationDetails.candidateProfile.experienceDetails.totalExperience || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="text-sm">
                      {selectedApplicationDetails.candidateProfile.experienceDetails.industry || "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm"
                onClick={() => {
                  setDetailsFormVisible(true);
                  updateApplicationField(selectedApplicationDetails.application._id, "status", "under-review");
                }}
              >
                Accept
              </button>
              <button
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-red-600"
                onClick={() => void rejectApplication(selectedApplicationDetails.application._id)}
                disabled={savingApplicationId === selectedApplicationDetails.application._id}
              >
                {savingApplicationId === selectedApplicationDetails.application._id ? "Rejecting..." : "Reject"}
              </button>
            </div>

            {detailsFormVisible && (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div>
                  <h4 className="font-medium">Status and interview form</h4>
                  <p className="text-sm text-muted-foreground">
                    This form only opens after Accept. Reject does not open it.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Application status</label>
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={selectedApplicationDetails.application.status}
                      onChange={(e) =>
                        updateApplicationField(
                          selectedApplicationDetails.application._id,
                          "status",
                          e.target.value as ClientApplicationsResponse["data"][number]["status"],
                        )
                      }
                    >
                      <option value="under-review">Client reviewed</option>
                      <option value="screening">Shortlisted / screening</option>
                      <option value="interview">Interview scheduled</option>
                      <option value="offer">Offer shared</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client note</label>
                    <textarea
                      value={selectedApplicationDetails.application.statusNote || ""}
                      onChange={(e) =>
                        updateApplicationField(
                          selectedApplicationDetails.application._id,
                          "statusNote",
                          e.target.value,
                        )
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Write what the candidate should know."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date and time</label>
                    <input
                      type="datetime-local"
                      value={
                        selectedApplicationDetails.application.interviewDetails?.scheduledAt
                          ? selectedApplicationDetails.application.interviewDetails.scheduledAt.slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "scheduledAt",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.timezone || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "timezone",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Asia/Kolkata"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interview mode</label>
                    <select
                      value={selectedApplicationDetails.application.interviewDetails?.mode || ""}
                      onChange={(e) =>
                        updateInterviewField(selectedApplicationDetails.application._id, "mode", e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select mode</option>
                      {INTERVIEW_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.locationText || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "locationText",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Office address"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Google Maps link</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.googleMapsUrl || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "googleMapsUrl",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting link</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.meetingLink || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "meetingLink",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact person</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.contactPerson || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "contactPerson",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="HR or interviewer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact email</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.contactEmail || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "contactEmail",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="hr@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact phone</label>
                    <input
                      value={selectedApplicationDetails.application.interviewDetails?.contactPhone || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "contactPhone",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="+91..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interview notes</label>
                    <textarea
                      value={selectedApplicationDetails.application.interviewDetails?.notes || ""}
                      onChange={(e) =>
                        updateInterviewField(selectedApplicationDetails.application._id, "notes", e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Documents, reporting instructions, rounds, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reporting notes</label>
                    <textarea
                      value={selectedApplicationDetails.application.interviewDetails?.reportingNotes || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "reportingNotes",
                          e.target.value,
                        )
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Where to report, floor, gate, timing instructions"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Documents required</label>
                    <textarea
                      value={selectedApplicationDetails.application.interviewDetails?.documentsRequired || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "documentsRequired",
                          e.target.value,
                        )
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Resume, Aadhaar, certificates, photos, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional instructions</label>
                    <textarea
                      value={selectedApplicationDetails.application.interviewDetails?.additionalInstructions || ""}
                      onChange={(e) =>
                        updateInterviewField(
                          selectedApplicationDetails.application._id,
                          "additionalInstructions",
                          e.target.value,
                        )
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Any extra details the candidate should know"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
                    onClick={() => void saveApplicationUpdate(selectedApplicationDetails.application._id)}
                    disabled={savingApplicationId === selectedApplicationDetails.application._id}
                  >
                    {savingApplicationId === selectedApplicationDetails.application._id ? "Saving..." : "Save update"}
                  </button>
                </div>
              </div>
            )}

            {selectedApplicationDetails.application.timeline &&
              selectedApplicationDetails.application.timeline.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status history</p>
                  {selectedApplicationDetails.application.timeline.map((item, index) => (
                    <div
                      key={`${selectedApplicationDetails.application._id}-${item.status}-${index}`}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">{formatStatusLabel(item.status)}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.changedAt ? new Date(item.changedAt).toLocaleString() : "Recently updated"}
                        </p>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Updated by {item.changedByRole || "system"}
                      </p>
                      {item.note && <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );

  if (!sessionState?.accessToken) {
    return <div className="min-h-screen bg-background p-8">Checking your session...</div>;
  }

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Loading employer dashboard...</div>;
  }

  return (
    <div className={dashboardShellClass}>
      <header className={dashboardHeaderClass}>
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4" aria-label="RecruitKr home">
              <span className="flex h-11 w-[136px] shrink-0 items-center sm:h-12 sm:w-[152px] md:h-14 md:w-[186px]">
                <img
                  src={Logo}
                  alt="RecruitKr"
                  className="h-full w-full object-contain object-left"
                />
              </span>
              <div className="hidden min-w-0 md:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#264a7f]">
                  Employer Dashboard
                </p>
                <p className="truncate text-sm text-slate-500">Manage hiring requirements, candidate pipelines, and company details.</p>
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
              {dashboardTabs.map((item) => {
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">RecruitKr Employer Space</p>
                  <h1 className="mt-3 break-words font-heading text-3xl font-bold text-white md:text-4xl">
                    {profile?.companyName || sessionState?.user.email}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                    Build your hiring pipeline, review candidate details faster, and keep every opening on track.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Company Snapshot</p>
                  <div className="mt-4 space-y-3 text-sm text-white/90">
                    <p>Industry: {profile?.industry || "Not added yet"}</p>
                    <p>Type: {profile?.companyType || "Not added yet"}</p>
                    <p>Size: {profile?.companySize || "Not added yet"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#264a7f]">Active Roles</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.activeRequirements || 0}</p><p className="mt-1 text-sm text-slate-500">Open requirements currently live</p></div>
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#264a7f]">Candidates</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.candidatesSourced || 0}</p><p className="mt-1 text-sm text-slate-500">Profiles now in your hiring funnel</p></div>
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#69a44f]">Interviews</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.interviewsScheduled || 0}</p><p className="mt-1 text-sm text-slate-500">Scheduled interactions with shortlisted talent</p></div>
              <div className={statCardClass}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#69a44f]">Filled</p><p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.positionsFilled || 0}</p><p className="mt-1 text-sm text-slate-500">Roles successfully closed</p></div>
            </div>
          </>
        )}

        {tab === "requirements" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold">Your Job Requirements</h2>
                <p className="text-sm text-muted-foreground">
                  Add another role whenever you want to post a new hiring requirement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (showCreateRequirementForm) {
                    resetRequirementForm();
                    return;
                  }
                  setShowCreateRequirementForm(true);
                }}
                className="rounded-lg bg-[#264a7f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f3b66]"
              >
                {showCreateRequirementForm ? "Close Form" : "Post More Hiring"}
              </button>
            </div>

            {showCreateRequirementForm && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                <div>
                  <h3 className="font-heading text-lg font-semibold">
                    {editingRequirementId ? "Edit Hiring Requirement" : "Post New Hiring Requirement"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {editingRequirementId
                      ? "Update the role details here without leaving the dashboard."
                      : "Create another job requirement here without leaving the dashboard."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <input value={newRequirementForm.jobTitle} onChange={updateNewRequirementField("jobTitle")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Sales Executive" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <input value={newRequirementForm.category} onChange={updateNewRequirementField("category")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. IT" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <input value={newRequirementForm.company} onChange={updateNewRequirementField("company")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. RecruitKr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Openings</label>
                    <input type="number" min={1} value={newRequirementForm.openings} onChange={updateNewRequirementField("openings")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <input value={newRequirementForm.department} onChange={updateNewRequirementField("department")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Sales" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Location</label>
                    <input value={newRequirementForm.jobLocation} onChange={updateNewRequirementField("jobLocation")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Jaipur" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employment Type</label>
                    <select value={newRequirementForm.employmentType} onChange={updateNewRequirementField("employmentType")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option>Full-Time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                      <option>Consultant</option>
                      <option>Temporary</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Experience Level</label>
                    <input value={newRequirementForm.experienceRequired} onChange={updateNewRequirementField("experienceRequired")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 1-4" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Qualification</label>
                    <input value={newRequirementForm.qualification} onChange={updateNewRequirementField("qualification")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 12th" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min CTC (LPA)</label>
                    <input type="number" min={0} value={newRequirementForm.minCtcLpa} onChange={updateNewRequirementField("minCtcLpa")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max CTC (LPA)</label>
                    <input type="number" min={0} value={newRequirementForm.maxCtcLpa} onChange={updateNewRequirementField("maxCtcLpa")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fixed Price</label>
                    <input type="number" min={0} value={newRequirementForm.fixedPrice} onChange={updateNewRequirementField("fixedPrice")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 1500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Salary Currency</label>
                    <input value={newRequirementForm.salaryCurrency} onChange={updateNewRequirementField("salaryCurrency")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="INR / USD" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Industry Background</label>
                    <input value={newRequirementForm.preferredIndustryBackground} onChange={updateNewRequirementField("preferredIndustryBackground")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender Requirement</label>
                    <select value={newRequirementForm.genderPreference} onChange={updateNewRequirementField("genderPreference")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option>No Preference</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Age Requirement</label>
                    <input value={newRequirementForm.ageRequirement} onChange={updateNewRequirementField("ageRequirement")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 18-35" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <input type="email" value={newRequirementForm.contactEmail} onChange={updateNewRequirementField("contactEmail")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="careers@recruitkr.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Urgency Level</label>
                    <select value={newRequirementForm.urgencyLevel} onChange={updateNewRequirementField("urgencyLevel")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option>Immediate (Within 7 Days)</option>
                      <option>15 Days</option>
                      <option>30 Days</option>
                      <option>45+ Days</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Joining Date</label>
                    <input type="date" value={newRequirementForm.expectedJoiningDate} onChange={updateNewRequirementField("expectedJoiningDate")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Work Mode</label>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {(["On-site", "Hybrid", "Remote"] as const).map((mode) => (
                        <label key={mode} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newRequirementWorkModes.includes(mode)}
                            onChange={() => toggleNewRequirementWorkMode(mode)}
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Job Description</label>
                    <textarea value={newRequirementForm.jobDescription} onChange={updateNewRequirementField("jobDescription")} rows={5} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Add role details, responsibilities, and must-have skills" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Requirements (one per line)</label>
                    <textarea value={newRequirementForm.requirementsText} onChange={updateNewRequirementField("requirementsText")} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={"e.g.\nBasic knowledge of wiring\nCCTV installation"} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Responsibilities (one per line)</label>
                    <textarea value={newRequirementForm.responsibilitiesText} onChange={updateNewRequirementField("responsibilitiesText")} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={"e.g.\nInstall devices\nVisit client sites"} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Skills (one per line)</label>
                    <textarea value={newRequirementForm.skillsText} onChange={updateNewRequirementField("skillsText")} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder={"e.g.\nJava\nCamera setup"} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetRequirementForm}
                    className="mr-3 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void createRequirement()}
                    disabled={creatingRequirement}
                    className="rounded-lg bg-[#264a7f] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {creatingRequirement
                      ? editingRequirementId
                        ? "Saving..."
                        : "Posting..."
                      : editingRequirementId
                        ? "Save Changes"
                        : "Post Requirement"}
                  </button>
                </div>
              </div>
            )}

            {requirements.map((requirement) => (
              <div key={requirement._id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                   
                    <h3 className="font-semibold">{requirement.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {requirement.department} - {requirement.openings} openings
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Urgency: {requirement.urgencyLevel} - Posted {new Date(requirement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-auto"
                      value={requirement.status}
                      onChange={(e) => updateRequirementStatus(requirement._id, e.target.value as "active" | "on-hold" | "closed")}
                    >
                      <option value="active">active</option>
                      <option value="on-hold">on-hold</option>
                      <option value="closed">closed</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editRequirement(requirement)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteRequirement(requirement._id)}
                        disabled={deletingRequirementId === requirement._id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 disabled:opacity-60"
                      >
                        {deletingRequirementId === requirement._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {requirements.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
                <p className="text-sm text-muted-foreground">No job requirements yet.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateRequirementForm(true)}
                  className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium"
                >
                  Add Your First Job
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "applications" && renderApplicationsTab()}
        {tab === "resumes" && renderResumesTab()}

        {tab === "profile" && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold">Company Profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Your recruiter-facing company information in one place.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/register/client")}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm"
                >
                  Update via form
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                    className="group relative overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#264a7f]"
                    disabled={profileImageLoading}
                  >
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={profile?.companyName || "Company profile"}
                        className="h-20 w-20 rounded-2xl border border-border object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                        style={{ background: "var(--brand-gradient)" }}
                      >
                        {companyInitial}
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-end justify-center bg-black/0 p-2 text-[11px] font-medium text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                      {profileImageLoading ? "Uploading..." : "Upload image"}
                    </span>
                  </button>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadProfileImage(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company avatar</p>
                  <p className="mt-1 text-base font-semibold">{profile?.companyName || "Client company"}</p>
                  <p className="text-sm text-muted-foreground">
                    {profileImageUrl ? "Click the image to change it." : "Click the avatar to upload a company image."}
                  </p>
                </div>
                <div className="sm:ml-auto">
                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
                    disabled={!profileImageUrl}
                  >
                    Remove image
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company name</p>
                  <p className="mt-2 text-base font-semibold">{profile?.companyName || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Industry</p>
                  <p className="mt-2 text-base font-semibold">{profile?.industry || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company type</p>
                  <p className="mt-2 text-base font-semibold">{profile?.companyType || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company size</p>
                  <p className="mt-2 text-base font-semibold">{profile?.companySize || "Not added"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Website</p>
                  <p className="mt-2 text-base font-semibold break-all">{profile?.companyWebsite || "Not added"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Primary Contact</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Contact person</p>
                    <p className="mt-1 text-sm font-medium">{profile?.spoc?.name || "Not added"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Designation</p>
                    <p className="mt-1 text-sm font-medium">{profile?.spoc?.designation || "Not added"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                    <p className="mt-1 text-sm font-medium break-all">
                      {profile?.spoc?.email || profile?.email || sessionState?.user.email || "Not added"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mobile</p>
                    <p className="mt-1 text-sm font-medium">{profile?.spoc?.mobile || profile?.mobile || "Not added"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Quick Summary</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-2xl font-bold">{dashboard?.stats.activeRequirements || 0}</p>
                    <p className="text-xs text-muted-foreground">Active requirements</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/70 p-4">
                    <p className="text-2xl font-bold">{dashboard?.stats.positionsFilled || 0}</p>
                    <p className="text-xs text-muted-foreground">Positions filled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
