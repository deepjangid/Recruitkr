import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";

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

type ClientProfileResponse = {
  success: boolean;
  data: {
    companyName?: string;
    industry?: string;
    companyType?: string;
    companySize?: string;
  };
};

type ClientApplicationsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    status: string;
    createdAt: string;
    jobId?: {
      jobTitle?: string;
    };
    candidateId?: {
      email?: string;
      mobile?: string;
    };
  }>;
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<ClientDashboardResponse["data"] | null>(null);
  const [profile, setProfile] = useState<ClientProfileResponse["data"] | null>(null);
  const [applications, setApplications] = useState<ClientApplicationsResponse["data"]>([]);
  const [tab, setTab] = useState<"overview" | "requirements" | "applications">("overview");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardRes, profileRes, applicationsRes] = await Promise.all([
        apiGet<ClientDashboardResponse>("/dashboards/client", true),
        apiGet<ClientProfileResponse>("/users/client/me", true),
        apiGet<ClientApplicationsResponse>("/jobs/applications", true),
      ]);
      setDashboard(dashboardRes.data);
      setProfile(profileRes.data);
      setApplications(applicationsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.accessToken || session.user.role !== "client") {
      navigate("/login");
      return;
    }
    void loadData();
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
    return <div className="min-h-screen bg-background p-8">Loading employer dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-bold">
            Recruit<span style={{ color: "#264a7f" }}>kr</span>
          </Link>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg border border-border text-sm" onClick={() => setTab("overview")}>Overview</button>
            <button className="px-3 py-2 rounded-lg border border-border text-sm" onClick={() => setTab("requirements")}>Requirements</button>
            <button className="px-3 py-2 rounded-lg border border-border text-sm" onClick={() => setTab("applications")}>Applications</button>
            <button className="px-3 py-2 rounded-lg border border-border text-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {tab === "overview" && (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <h1 className="font-display text-2xl font-bold mb-2">{profile?.companyName || session?.user.email}</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.industry || "Industry"} - {profile?.companyType || "Company Type"} - {profile?.companySize || "Company Size"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.activeRequirements || 0}</p><p className="text-xs text-muted-foreground">Active Requirements</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.candidatesSourced || 0}</p><p className="text-xs text-muted-foreground">Candidates Sourced</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.interviewsScheduled || 0}</p><p className="text-xs text-muted-foreground">Interviews Scheduled</p></div>
              <div className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{dashboard?.stats.positionsFilled || 0}</p><p className="text-xs text-muted-foreground">Positions Filled</p></div>
            </div>
          </>
        )}

        {tab === "requirements" && (
          <div className="space-y-4">
            {(dashboard?.requirements || []).map((requirement) => (
              <div key={requirement._id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{requirement.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {requirement.department} - {requirement.openings} openings
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Urgency: {requirement.urgencyLevel} - Posted {new Date(requirement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={requirement.status}
                      onChange={(e) => updateRequirementStatus(requirement._id, e.target.value as "active" | "on-hold" | "closed")}
                    >
                      <option value="active">active</option>
                      <option value="on-hold">on-hold</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {(dashboard?.requirements || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No job requirements yet.</p>
            )}
          </div>
        )}

        {tab === "applications" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold">Candidate Applications</h2>
            </div>
            <div className="divide-y divide-border">
              {applications.map((application) => (
                <div key={application._id} className="px-6 py-4">
                  <p className="font-medium">{application.jobId?.jobTitle || "Job"}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.candidateId?.email || "Candidate"} - {application.status}
                  </p>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="px-6 py-4 text-sm text-muted-foreground">No applications yet.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
