import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";
import { tryAutoLogin } from "@/lib/autoLogin";
import Logo from "@/assets/logo.png";

const JOBS_PAGE_LIMIT = 20;

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
      status: string;
      createdAt: string;
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
    status: string;
    createdAt: string;
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
  const [tab, setTab] = useState<"overview" | "jobs" | "applications" | "resume">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<CandidateDashboardResponse["data"] | null>(null);
  const [profile, setProfile] = useState<CandidateProfileResponse["data"] | null>(null);
  const [applications, setApplications] = useState<CandidateApplicationsResponse["data"]>([]);
  const [jobs, setJobs] = useState<JobsResponse["data"]>([]);
  const [jobsMeta, setJobsMeta] = useState<JobsResponse["meta"] | null>(null);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [applyLoadingJobId, setApplyLoadingJobId] = useState<string | null>(null);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div  className="flex items-center">
              <span className="flex h-12 max-w-[180px] shrink-0 items-center sm:h-14">
                <img
                  src={Logo}
                  alt="RecruitKr"
                  className="h-full w-auto origin-left scale-[1.7] object-contain"
                />
              </span>
            </div>
          
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("overview")}>Overview</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("jobs")}>Browse Jobs</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("applications")}>My Applications</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("resume")}>My Resume</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {tab === "overview" && (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Welcome, {profile?.fullName || sessionState?.user.email}</h1>
              <p className="text-sm text-muted-foreground">Preferred Role: {profile?.preferences?.preferredRole || "Not set"}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.applicationsSent || 0}</p><p className="text-xs text-muted-foreground">Applications Sent</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.interviewCalls || 0}</p><p className="text-xs text-muted-foreground">Interview Calls</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.offersReceived || 0}</p><p className="text-xs text-muted-foreground">Offers Received</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.profileCompletion || 0}%</p><p className="text-xs text-muted-foreground">Profile Completion</p></div>
            </div>
          </>
        )}

        {tab === "jobs" && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{job.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">{job.jobLocation} - {job.employmentType}</p>
                    <p className="text-sm text-muted-foreground mt-1">CTC: {job.minCtcLpa || 0} - {job.maxCtcLpa || 0} LPA</p>
                  </div>
                  <button
                    onClick={() => applyToJob(job._id)}
                    disabled={applicationJobIds.has(job._id) || applyLoadingJobId === job._id}
                    className="btn-gradient w-full rounded-lg px-4 py-2 text-sm disabled:opacity-60 sm:w-auto"
                  >
                    {applicationJobIds.has(job._id) ? "Applied" : applyLoadingJobId === job._id ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>
            ))}

            {jobsMeta && jobsMeta.total > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {jobs.length} of {jobsMeta.total} active jobs
              </p>
            )}

            {jobsMeta && jobsMeta.page < jobsMeta.totalPages && (
              <button
                onClick={loadMoreJobs}
                disabled={jobsLoadingMore}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
              >
                {jobsLoadingMore ? "Loading..." : "Load more"}
              </button>
            )}
            {jobs.length === 0 && <p className="text-sm text-muted-foreground">No  active jobs available.</p>}
          </div>
        )}

        {tab === "applications" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-4 border-b border-border sm:px-6">
              <h2 className="font-heading font-semibold">My Applications</h2>
            </div>
            <div className="divide-y divide-border">
              {(applications || []).map((application) => (
                <div key={application._id} className="px-4 py-4 sm:px-6">
                  <p className="font-medium">{application.jobId?.jobTitle || "Job"}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {application.status} - {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {(applications || []).length === 0 && (
                <div className="px-4 py-4 text-sm text-muted-foreground sm:px-6">No applications yet.</div>
              )}
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
