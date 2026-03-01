import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CandidateRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isExperienced, setIsExperienced] = useState<boolean | null>(null);
  const [servingNotice, setServingNotice] = useState(false);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 8;

  const toggleWorkMode = (mode: string) => {
    setWorkModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate("/login"), 2500);
  };

  const inputClass = "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "block mb-1.5 text-sm font-medium text-foreground";
  const sectionHeader = (n: number, title: string, icon: string) => (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
        {n}
      </div>
      <span className="text-lg font-display font-semibold text-foreground">{icon} {title}</span>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
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
              <span style={{ color: "#69a44f" }}>●</span> Candidate Registration
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">Join as a Candidate</h1>
            <p className="text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Details */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(1, "Basic Details", "👤")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Full Name (As per PAN/Aadhaar) *</label>
                  <input type="text" required className={inputClass} placeholder="Enter your full name" />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Gender *</label>
                  <select required className={inputClass}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer Not to Say</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Current Address *</label>
                  <textarea required rows={3} className={inputClass} placeholder="Enter your full address" />
                </div>
                <div>
                  <label className={labelClass}>PINCODE *</label>
                  <input type="number" required pattern="\d{6}" maxLength={6} className={inputClass} placeholder="6-digit pincode" />
                </div>
                <div>
                  <label className={labelClass}>Mobile Number (WhatsApp preferred) *</label>
                  <input type="tel" required maxLength={10} className={inputClass} placeholder="10-digit mobile number" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Email ID *</label>
                  <input type="email" required className={inputClass} placeholder="your@email.com" />
                </div>
              </div>
            </div>

            {/* Section 2: Professional Links */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(2, "Professional Profile Links", "🔗")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>LinkedIn / Social Media Profile</label>
                  <input type="url" className={inputClass} placeholder="https://linkedin.com/in/yourprofile" />
                </div>
                <div>
                  <label className={labelClass}>Portfolio / Website</label>
                  <input type="url" className={inputClass} placeholder="https://yourportfolio.com" />
                </div>
              </div>
            </div>

            {/* Section 3: Education */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(3, "Education", "🎓")}
              <div>
                <label className={labelClass}>Highest Qualification *</label>
                <select required className={inputClass}>
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
              </div>
            </div>

            {/* Section 4: Experience Status */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(4, "Experience Status", "💼")}
              <div>
                <label className={labelClass}>Are You a Fresher or Experienced? *</label>
                <div className="flex gap-4 mt-2">
                  {["Fresher", "Experienced"].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isExperienced === (opt === "Experienced") ? "border-primary" : "border-border"}`}
                        style={isExperienced === (opt === "Experienced") ? { borderColor: "#264a7f" } : {}}>
                        {isExperienced === (opt === "Experienced") && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#264a7f" }} />}
                      </div>
                      <input
                        type="radio"
                        name="experience_status"
                        value={opt}
                        className="hidden"
                        required
                        onChange={() => setIsExperienced(opt === "Experienced")}
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 5: Experience Details (conditional) */}
            {isExperienced && (
              <div className="rounded-2xl border bg-card p-6 md:p-8" style={{ borderColor: "#264a7f50" }}>
                {sectionHeader(5, "Experience Details", "📋")}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Current Company *</label>
                    <input type="text" required className={inputClass} placeholder="Company name" />
                  </div>
                  <div>
                    <label className={labelClass}>Current Designation *</label>
                    <input type="text" required className={inputClass} placeholder="Your designation" />
                  </div>
                  <div>
                    <label className={labelClass}>Total Experience *</label>
                    <input type="text" required className={inputClass} placeholder="e.g. 3 Years 6 Months" />
                  </div>
                  <div>
                    <label className={labelClass}>Industry *</label>
                    <input type="text" required className={inputClass} placeholder="e.g. IT, Healthcare, Finance" />
                  </div>
                  <div>
                    <label className={labelClass}>Current CTC (Fixed + Variable) *</label>
                    <input type="number" required className={inputClass} placeholder="Annual CTC in LPA" />
                  </div>
                  <div>
                    <label className={labelClass}>Expected CTC *</label>
                    <input type="number" required className={inputClass} placeholder="Expected annual CTC in LPA" />
                  </div>
                  <div>
                    <label className={labelClass}>Minimum Acceptable CTC *</label>
                    <input type="number" required className={inputClass} placeholder="Minimum CTC in LPA" />
                  </div>
                  <div>
                    <label className={labelClass}>Notice Period *</label>
                    <select required className={inputClass} onChange={e => setServingNotice(e.target.value === "Serving Notice Period")}>
                      <option value="">Select notice period</option>
                      <option>Immediate Joiner</option>
                      <option>15 Days</option>
                      <option>30 Days</option>
                      <option>60 Days</option>
                      <option>90 Days</option>
                      <option>Serving Notice Period</option>
                    </select>
                  </div>
                  {servingNotice && (
                    <div>
                      <label className={labelClass}>Last Working Day *</label>
                      <input type="date" required className={inputClass} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 6: Job Preferences */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(6, "Job Preferences", "🎯")}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Preferred Location *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. Mumbai, Delhi, Remote" />
                </div>
                <div>
                  <label className={labelClass}>Preferred Industry *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. IT, Healthcare" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Preferred Role *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. Software Engineer, Marketing Manager" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Work Mode * (Select at least one)</label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["On-site", "Hybrid", "Remote"].map(mode => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
                          style={workModes.includes(mode) ? { background: "#264a7f", borderColor: "#264a7f" } : { borderColor: "hsl(var(--border))" }}
                          onClick={() => toggleWorkMode(mode)}
                        >
                          {workModes.includes(mode) && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm font-medium">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7: Declaration */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(7, "Declaration", "📜")}
              <div className="rounded-xl bg-secondary/50 p-4 mb-4 text-sm text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground mb-2">DECLARATION BY CANDIDATE</p>
                <p>I hereby declare that:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All information provided by me is true and accurate.</li>
                  <li>I have not withheld any material facts.</li>
                  <li>I understand that any false information may lead to disqualification or termination of employment.</li>
                  <li>I authorize ANAAGAT HUMANPOWER PRIVATE LIMITED to verify my credentials.</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1 w-4 h-4 accent-primary" style={{ accentColor: "#264a7f" }} />
                <span className="text-sm font-medium">I Agree to the above declaration *</span>
              </label>
            </div>

            {/* Section 8: Representation Authorization */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {sectionHeader(8, "Representation Authorization", "🤝")}
              <div className="rounded-xl bg-secondary/50 p-4 mb-4 text-sm text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground mb-2">REPRESENTATION AUTHORIZATION</p>
                <p>I hereby authorize ANAAGAT HUMANPOWER PRIVATE LIMITED to:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Represent my professional profile to potential employers.</li>
                  <li>Share my resume and relevant details with prospective organizations.</li>
                  <li>Schedule interviews on my behalf.</li>
                  <li>Negotiate salary and offer terms on my behalf (with my prior approval).</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1 w-4 h-4" style={{ accentColor: "#264a7f" }} />
                <span className="text-sm font-medium">I Authorize the above *</span>
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
              style={{ background: "linear-gradient(135deg, #264a7f 0%, #69a44f 100%)" }}
            >
              Submit Candidate Registration
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
