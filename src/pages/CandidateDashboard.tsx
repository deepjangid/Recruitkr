import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Briefcase, Bell, Settings, LogOut, FileText, TrendingUp, Clock, CheckCircle, Search } from "lucide-react";

const stats = [
  { label: "Applications Sent", value: "12", icon: FileText, color: "#264a7f" },
  { label: "Interview Calls", value: "3", icon: Bell, color: "#69a44f" },
  { label: "Profile Views", value: "47", icon: TrendingUp, color: "#e59f56" },
  { label: "Offers Received", value: "1", icon: CheckCircle, color: "#69a44f" },
];

const applications = [
  { company: "TechCorp India", role: "Senior Developer", status: "Interview Scheduled", date: "20 Feb 2026", statusColor: "#69a44f" },
  { company: "FinServ Ltd", role: "Product Manager", status: "Under Review", date: "18 Feb 2026", statusColor: "#e59f56" },
  { company: "HealthFirst", role: "Business Analyst", status: "Applied", date: "15 Feb 2026", statusColor: "#264a7f" },
  { company: "LogiPro Systems", role: "Operations Lead", status: "Rejected", date: "10 Feb 2026", statusColor: "#ef4444" },
];

const CandidateDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "applications", label: "My Applications", icon: FileText },
    { id: "profile", label: "My Profile", icon: User },
    { id: "jobs", label: "Browse Jobs", icon: Search },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="font-display text-xl font-bold">
            Recruit<span style={{ color: "#264a7f" }}>kr</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Candidate Portal</p>
        </div>

        {/* User info */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
              RS
            </div>
            <div>
              <p className="text-sm font-semibold">Rahul Sharma</p>
              <p className="text-xs text-muted-foreground">Software Engineer</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Profile Completion</span>
              <span>72%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "72%", background: "linear-gradient(90deg, #264a7f, #69a44f)" }} />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={activeTab === item.id ? { background: "linear-gradient(135deg, #264a7f20, #69a44f20)", color: "#264a7f", borderLeft: "3px solid #264a7f" } : { color: "hsl(var(--muted-foreground))" }}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={17} />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="border-b border-border bg-card/50 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "applications" && "My Applications"}
              {activeTab === "profile" && "My Profile"}
              {activeTab === "jobs" && "Browse Jobs"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Rahul!</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg border border-border hover:border-primary transition-colors">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ background: "#264a7f" }}>3</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
              RS
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {stats.map(s => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: s.color + "20" }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <p className="font-display text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Applications */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h2 className="font-display font-semibold">Recent Applications</h2>
                  <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setActiveTab("applications")}>View All →</button>
                </div>
                <div className="divide-y divide-border">
                  {applications.slice(0,3).map((app, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{app.role}</p>
                        <p className="text-xs text-muted-foreground">{app.company}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: app.statusColor + "20", color: app.statusColor }}>
                          {app.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{app.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button onClick={() => setActiveTab("profile")} className="rounded-xl border border-border bg-card p-5 text-left hover:border-primary transition-colors group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#264a7f20" }}>
                    <User size={20} style={{ color: "#264a7f" }} />
                  </div>
                  <p className="font-semibold text-sm">Complete Profile</p>
                  <p className="text-xs text-muted-foreground mt-1">Improve your visibility to employers</p>
                </button>
                <button onClick={() => setActiveTab("jobs")} className="rounded-xl border border-border bg-card p-5 text-left hover:border-primary transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#69a44f20" }}>
                    <Search size={20} style={{ color: "#69a44f" }} />
                  </div>
                  <p className="font-semibold text-sm">Browse New Jobs</p>
                  <p className="text-xs text-muted-foreground mt-1">Explore matching opportunities</p>
                </button>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#e59f5620" }}>
                    <Clock size={20} style={{ color: "#e59f56" }} />
                  </div>
                  <p className="font-semibold text-sm">Interview Today</p>
                  <p className="text-xs text-muted-foreground mt-1">TechCorp India – 3:00 PM</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-semibold">All Applications</h2>
              </div>
              <div className="divide-y divide-border">
                {applications.map((app, i) => (
                  <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
                        {app.company.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{app.role}</p>
                        <p className="text-xs text-muted-foreground">{app.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: app.statusColor + "20", color: app.statusColor }}>
                        {app.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{app.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-5">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[["Full Name", "Rahul Sharma"], ["Date of Birth", "15 Jan 1995"], ["Gender", "Male"], ["Mobile", "+91 98765 43210"], ["Email", "rahul@email.com"], ["Pincode", "302001"]].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-5">Professional Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[["Current Company", "TechCorp India"], ["Designation", "Software Engineer"], ["Experience", "4 Years"], ["Current CTC", "8 LPA"], ["Expected CTC", "12 LPA"], ["Notice Period", "30 Days"]].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full rounded-xl py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
                Edit Profile
              </button>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search jobs, roles, companies..." className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-primary" />
                </div>
                <button className="px-5 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>Search</button>
              </div>
              {[
                { role: "Senior Software Engineer", company: "InnovateTech", location: "Jaipur", ctc: "12-18 LPA", type: "Full-Time" },
                { role: "Product Manager", company: "GrowthCo", location: "Remote", ctc: "15-22 LPA", type: "Full-Time" },
                { role: "Data Analyst", company: "AnalyticsPro", location: "Mumbai", ctc: "8-12 LPA", type: "Contract" },
              ].map((job, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-semibold">{job.role}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{job.company} · {job.location}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#264a7f20", color: "#264a7f" }}>{job.type}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-medium" style={{ color: "#69a44f" }}>💰 {job.ctc}</span>
                    <button className="text-xs px-4 py-2 rounded-lg text-white font-medium" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>Apply Now</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-lg space-y-5">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-display font-semibold">Account Settings</h2>
                {[["Current Password", "password"], ["New Password", "password"], ["Confirm New Password", "password"]].map(([label, type]) => (
                  <div key={label}>
                    <label className="block mb-1.5 text-sm font-medium">{label}</label>
                    <input type={type} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder="••••••••" />
                  </div>
                ))}
                <button className="w-full py-3 rounded-lg text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>Update Password</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
