import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";

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

type CandidateProfileResponse = {
  success: boolean;
  data: {
    fullName?: string;
    preferences?: {
      preferredRole?: string;
    };
  };
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
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "jobs" | "applications">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<CandidateDashboardResponse["data"] | null>(null);
  const [profile, setProfile] = useState<CandidateProfileResponse["data"] | null>(null);
  const [jobs, setJobs] = useState<JobsResponse["data"]>([]);
  const [applyLoadingJobId, setApplyLoadingJobId] = useState<string | null>(null);

  const session = getSession();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, profileRes, jobsRes] = await Promise.all([
        apiGet<CandidateDashboardResponse>("/dashboards/candidate", true),
        apiGet<CandidateProfileResponse>("/users/candidate/me", true),
        apiGet<JobsResponse>("/jobs"),
      ]);

      setDashboard(dashboardRes.data);
      setProfile(profileRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.accessToken || session.user.role !== "candidate") {
      navigate("/login");
      return;
    }
    void loadData();
  }, []);

  const applicationJobIds = useMemo(
    () => new Set((dashboard?.applications || []).map((a) => a.jobId?._id).filter(Boolean)),
    [dashboard?.applications],
  );

  const applyToJob = async (jobId: string) => {
    setApplyLoadingJobId(jobId);
    setError("");
    try {
      await apiPost("/jobs/apply", { jobId }, true);
      await loadData();
      setTab("applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyLoadingJobId(null);
    }
  };

  const logout = async () => {
    try {
      await apiPost("/auth/logout", { refreshToken: getSession()?.refreshToken });
    } catch {
      // No-op
    }
    clearSession();
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-8">Loading candidate dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="font-heading text-2xl font-bold">
            Recruit<span style={{ color: "#264a7f" }}>kr</span>
          </Link>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("overview")}>Overview</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("jobs")}>Browse Jobs</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={() => setTab("applications")}>My Applications</button>
            <button className="rounded-lg border border-border px-3 py-2 text-xs sm:text-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {tab === "overview" && (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Welcome, {profile?.fullName || session?.user.email}</h1>
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
            {jobs.length === 0 && <p className="text-sm text-muted-foreground">No active jobs available.</p>}
          </div>
        )}

        {tab === "applications" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-4 border-b border-border sm:px-6">
              <h2 className="font-heading font-semibold">My Applications</h2>
            </div>
            <div className="divide-y divide-border">
              {(dashboard?.applications || []).map((application) => (
                <div key={application._id} className="px-4 py-4 sm:px-6">
                  <p className="font-medium">{application.jobId?.jobTitle || "Job"}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {application.status} - {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {(dashboard?.applications || []).length === 0 && (
                <div className="px-4 py-4 text-sm text-muted-foreground sm:px-6">No applications yet.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;
