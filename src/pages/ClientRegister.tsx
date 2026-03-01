import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ClientRegister = () => {
  const navigate = useNavigate();
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleWorkMode = (mode: string) => {
    setWorkModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate("/login"), 2500);
  };

  const inputClass = "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors";
  const labelClass = "block mb-1.5 text-sm font-medium text-foreground";
  const sectionHeader = (n: number, title: string, icon: string) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #e59f56, #f0b870)" }}>
        {n}
      </div>
      <span className="text-lg font-display font-semibold text-foreground">{icon} {title}</span>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #e59f56, #264a7f)" }}>
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-3">Registration Submitted!</h2>
          <p className="text-muted-foreground">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto max-w-3xl px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground mb-4">
              <span style={{ color: "#e59f56" }}>●</span> Employer / Client Registration
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">Post Your Hiring Requirements</h1>
            <p className="text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED — Client Hiring Requirement Form</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Company Details */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(1, "Company Details", "🏢")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Company Name *</label>
                  <input type="text" required className={inputClass} placeholder="Your company name" />
                </div>
                <div>
                  <label className={labelClass}>Industry *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. IT, Healthcare, Finance" />
                </div>
                <div>
                  <label className={labelClass}>Company Website</label>
                  <input type="url" className={inputClass} placeholder="https://yourcompany.com" />
                </div>
                <div>
                  <label className={labelClass}>Company Size *</label>
                  <select required className={inputClass}>
                    <option value="">Select size</option>
                    <option>1–10 Employees</option>
                    <option>11–50 Employees</option>
                    <option>51–200 Employees</option>
                    <option>201–500 Employees</option>
                    <option>500+</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Company Type *</label>
                  <select required className={inputClass}>
                    <option value="">Select type</option>
                    <option>Startup</option>
                    <option>MSME</option>
                    <option>Private Limited</option>
                    <option>LLP</option>
                    <option>Partnership</option>
                    <option>MNC</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: SPOC */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(2, "SPOC – Hiring Contact Person", "👤")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>SPOC Name *</label>
                  <input type="text" required className={inputClass} placeholder="Contact person name" />
                </div>
                <div>
                  <label className={labelClass}>Designation *</label>
                  <input type="text" required className={inputClass} placeholder="HR Manager, Director, etc." />
                </div>
                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <input type="tel" required maxLength={10} className={inputClass} placeholder="10-digit number" />
                </div>
                <div>
                  <label className={labelClass}>Email ID *</label>
                  <input type="email" required className={inputClass} placeholder="contact@company.com" />
                </div>
              </div>
            </div>

            {/* Section 3: Job Requirement */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(3, "Job Requirement Details", "📋")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Job Title *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <label className={labelClass}>Number of Openings *</label>
                  <input type="number" required min={1} className={inputClass} placeholder="No. of positions" />
                </div>
                <div>
                  <label className={labelClass}>Department *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. Engineering, Sales" />
                </div>
                <div>
                  <label className={labelClass}>Job Location *</label>
                  <input type="text" required className={inputClass} placeholder="City, State" />
                </div>
                <div>
                  <label className={labelClass}>Employment Type *</label>
                  <select required className={inputClass}>
                    <option value="">Select type</option>
                    <option>Full-Time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Consultant</option>
                    <option>Temporary</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Experience Required *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. 2-5 Years" />
                </div>
                <div>
                  <label className={labelClass}>Budgeted CTC (Min – LPA) *</label>
                  <input type="number" required className={inputClass} placeholder="Minimum CTC" />
                </div>
                <div>
                  <label className={labelClass}>Budgeted CTC (Max – LPA) *</label>
                  <input type="number" required className={inputClass} placeholder="Maximum CTC" />
                </div>
                <div>
                  <label className={labelClass}>Preferred Industry Background</label>
                  <input type="text" className={inputClass} placeholder="Optional" />
                </div>
                <div>
                  <label className={labelClass}>Gender Preference</label>
                  <select className={inputClass}>
                    <option value="">No Preference</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Work Mode * (Select at least one)</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {["On-site", "Hybrid", "Remote"].map(mode => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
                          style={workModes.includes(mode) ? { background: "#e59f56", borderColor: "#e59f56" } : { borderColor: "hsl(var(--border))" }}
                          onClick={() => toggleWorkMode(mode)}
                        >
                          {workModes.includes(mode) && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm font-medium">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Job Description *</label>
                  <textarea required rows={5} className={inputClass} placeholder="Describe the role, responsibilities, and requirements..." />
                </div>
              </div>
            </div>

            {/* Section 4: Hiring Timeline */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(4, "Hiring Timeline", "📅")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Urgency Level *</label>
                  <select required className={inputClass}>
                    <option value="">Select urgency</option>
                    <option>Immediate (Within 7 Days)</option>
                    <option>15 Days</option>
                    <option>30 Days</option>
                    <option>45+ Days</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Expected Joining Date</label>
                  <input type="date" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Section 5: Commercial Agreement */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(5, "Commercial Agreement", "💰")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Agreed Recruitment Model *</label>
                  <select required className={inputClass}>
                    <option value="">Select model</option>
                    <option>Success-Based</option>
                    <option>Retainer Model</option>
                    <option>Dedicated Hiring</option>
                    <option>Bulk Hiring</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Replacement Period Required *</label>
                  <select required className={inputClass}>
                    <option value="">Select period</option>
                    <option>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days</option>
                    <option>Not Required</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Payment Terms *</label>
                  <select required className={inputClass}>
                    <option value="">Select payment terms</option>
                    <option>15 Days from Joining</option>
                    <option>30 Days from Joining</option>
                    <option>Advance + Balance</option>
                    <option>As per Agreement</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 6: Billing Details */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(6, "Billing Details", "🧾")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Billing Company Name *</label>
                  <input type="text" required className={inputClass} placeholder="As per GST registration" />
                </div>
                <div>
                  <label className={labelClass}>GST Number *</label>
                  <input type="text" required maxLength={15} minLength={15} className={inputClass} placeholder="15-digit GST number" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Billing Address *</label>
                  <textarea required rows={3} className={inputClass} placeholder="Complete billing address" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Billing Email ID *</label>
                  <input type="email" required className={inputClass} placeholder="billing@company.com" />
                </div>
              </div>
            </div>

            {/* Section 7: Declaration */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(7, "Client Declaration", "📜")}
              <div className="rounded-xl bg-secondary/50 p-4 mb-4">
                <p className="font-semibold text-foreground mb-2">CLIENT DECLARATION</p>
                <p className="text-sm text-muted-foreground">We confirm that:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-1">
                  <li>The above information is accurate.</li>
                  <li>We agree to engage ANAAGAT HUMANPOWER PRIVATE LIMITED for recruitment support.</li>
                  <li>Final hiring decision rests with our organization.</li>
                  <li>Recruitment fees shall be payable as per mutually agreed commercial terms.</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1 w-4 h-4" style={{ accentColor: "#e59f56" }} />
                <span className="text-sm font-medium">I Agree to the above declaration *</span>
              </label>
            </div>

            {/* Password */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-display font-semibold mb-5">🔐 Create Account Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Password *</label>
                  <input type="password" required minLength={8} className={inputClass} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <input type="password" required minLength={8} className={inputClass} placeholder="Re-enter password" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-4 text-base font-bold text-white transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg, #e59f56 0%, #264a7f 100%)" }}
            >
              Submit Hiring Requirement
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#e59f56" }}>
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

export default ClientRegister;
