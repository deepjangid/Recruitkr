import { useState } from "react";
import { Link } from "react-router-dom";
import { Building, Users, Bell, Settings, LogOut, FileText, TrendingUp, Clock, CheckCircle, Search, Plus } from "lucide-react";

const stats = [
  { label: "Active Requirements", value: "5", icon: FileText, color: "#264a7f" },
  { label: "Candidates Sourced", value: "34", icon: Users, color: "#69a44f" },
  { label: "Interviews Scheduled", value: "8", icon: Clock, color: "#e59f56" },
  { label: "Positions Filled", value: "3", icon: CheckCircle, color: "#69a44f" },
];

const requirements = [
  { role: "Senior Developer", dept: "Engineering", openings: 2, sourced: 12, status: "Active", urgency: "Immediate", urgencyColor: "#ef4444" },
  { role: "HR Manager", dept: "Human Resources", openings: 1, sourced: 7, status: "Active", urgency: "15 Days", urgencyColor: "#e59f56" },
  { role: "Sales Executive", dept: "Sales", openings: 3, sourced: 15, status: "On Hold", urgency: "30 Days", urgencyColor: "#264a7f" },
];

const candidates = [
  { name: "Rahul Sharma", role: "Senior Developer", exp: "4 Yrs", ctc: "8 LPA", stage: "Interview", stageColor: "#e59f56" },
  { name: "Priya Patel", role: "HR Manager", exp: "6 Yrs", ctc: "10 LPA", stage: "Offer", stageColor: "#69a44f" },
  { name: "Amit Kumar", role: "Sales Executive", exp: "2 Yrs", ctc: "4 LPA", stage: "Screening", stageColor: "#264a7f" },
];

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const navItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "requirements", label: "Job Requirements", icon: FileText },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "company", label: "Company Profile", icon: Building },
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
          <p className="text-xs text-muted-foreground mt-1">Employer Portal</p>
        </div>

        {/* Company info */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }}>
              TC
            </div>
            <div>
              <p className="text-sm font-semibold">TechCorp India</p>
              <p className="text-xs text-muted-foreground">Private Limited • 200+ Employees</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#69a44f20", color: "#69a44f" }}>Verified</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#264a7f20", color: "#264a7f" }}>Premium</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={activeTab === item.id ? { background: "linear-gradient(135deg, #e59f5620, #264a7f20)", color: "#e59f56", borderLeft: "3px solid #e59f56" } : { color: "hsl(var(--muted-foreground))" }}
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
        <header className="border-b border-border bg-card/50 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">
              {activeTab === "overview" && "Employer Dashboard"}
              {activeTab === "requirements" && "Job Requirements"}
              {activeTab === "candidates" && "Candidate Pipeline"}
              {activeTab === "company" && "Company Profile"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">ANAAGAT HUMANPOWER PRIVATE LIMITED — Employer Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg border border-border hover:border-primary transition-colors">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ background: "#e59f56" }}>5</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }}>
              TC
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
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

              {/* Active Requirements Summary */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h2 className="font-display font-semibold">Active Requirements</h2>
                  <button className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }} onClick={() => setActiveTab("requirements")}>
                    <Plus size={13} /> Add Requirement
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {requirements.map((r, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.role}</p>
                        <p className="text-xs text-muted-foreground">{r.dept} · {r.openings} opening{r.openings > 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{r.sourced} sourced</span>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: r.urgencyColor + "20", color: r.urgencyColor }}>
                          {r.urgency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Candidate Pipeline */}
              <div className="rounded-xl border border-border bg-card">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h2 className="font-display font-semibold">Candidate Pipeline</h2>
                  <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setActiveTab("candidates")}>View All →</button>
                </div>
                <div className="divide-y divide-border">
                  {candidates.map((c, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.role} · {c.exp} · {c.ctc}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: c.stageColor + "20", color: c.stageColor }}>
                        {c.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{requirements.length} requirements posted</p>
                <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }}>
                  <Plus size={15} /> Add New Requirement
                </button>
              </div>
              {requirements.map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-semibold">{r.role}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{r.dept} · {r.openings} position{r.openings > 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: r.urgencyColor + "20", color: r.urgencyColor }}>{r.urgency}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: r.status === "Active" ? "#69a44f20" : "#e59f5620", color: r.status === "Active" ? "#69a44f" : "#e59f56" }}>{r.status}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-secondary/50 p-2">
                      <p className="text-lg font-bold" style={{ color: "#264a7f" }}>{r.sourced}</p>
                      <p className="text-xs text-muted-foreground">Sourced</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2">
                      <p className="text-lg font-bold" style={{ color: "#e59f56" }}>3</p>
                      <p className="text-xs text-muted-foreground">Interviewing</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2">
                      <p className="text-lg font-bold" style={{ color: "#69a44f" }}>1</p>
                      <p className="text-xs text-muted-foreground">Offered</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search candidates by name, role..." className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border">
                  {candidates.map((c, i) => (
                    <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.role} · {c.exp} experience · Current: {c.ctc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: c.stageColor + "20", color: c.stageColor }}>{c.stage}</span>
                        <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors">View Profile</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "company" && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-5">Company Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[["Company Name", "TechCorp India"], ["Industry", "Information Technology"], ["Company Type", "Private Limited"], ["Company Size", "201–500 Employees"], ["Website", "www.techcorp.in"], ["GST Number", "27AAECT1234F1Z5"]].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-display font-semibold mb-5">SPOC Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[["Contact Person", "Anita Mehra"], ["Designation", "HR Director"], ["Mobile", "+91 90019 65072"], ["Email", "hr@techcorp.in"]].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full rounded-xl py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }}>
                Edit Company Profile
              </button>
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
                <button className="w-full py-3 rounded-lg text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }}>Update Password</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
