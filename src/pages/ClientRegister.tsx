import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";

type ClientForm = {
  companyName: string;
  industry: string;
  companyWebsite: string;
  companySize: string;
  companyType: string;
  spocName: string;
  spocDesignation: string;
  mobile: string;
  email: string;
  jobTitle: string;
  openings: string;
  department: string;
  jobLocation: string;
  employmentType: string;
  experienceRequired: string;
  minCtcLpa: string;
  maxCtcLpa: string;
  preferredIndustryBackground: string;
  genderPreference: string;
  jobDescription: string;
  urgencyLevel: string;
  expectedJoiningDate: string;
  recruitmentModel: string;
  replacementPeriod: string;
  paymentTerms: string;
  billingCompanyName: string;
  gstNumber: string;
  billingAddress: string;
  billingEmail: string;
  password: string;
  confirmPassword: string;
};

const initialForm: ClientForm = {
  companyName: "",
  industry: "",
  companyWebsite: "",
  companySize: "",
  companyType: "",
  spocName: "",
  spocDesignation: "",
  mobile: "",
  email: "",
  jobTitle: "",
  openings: "1",
  department: "",
  jobLocation: "",
  employmentType: "",
  experienceRequired: "",
  minCtcLpa: "",
  maxCtcLpa: "",
  preferredIndustryBackground: "",
  genderPreference: "",
  jobDescription: "",
  urgencyLevel: "",
  expectedJoiningDate: "",
  recruitmentModel: "",
  replacementPeriod: "",
  paymentTerms: "",
  billingCompanyName: "",
  gstNumber: "",
  billingAddress: "",
  billingEmail: "",
  password: "",
  confirmPassword: "",
};

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const ClientRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleWorkMode = (mode: string) => {
    setWorkModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  };

  const canSubmit =
    declarationAccepted &&
    workModes.length > 0 &&
    form.password === form.confirmPassword &&
    strongPasswordRegex.test(form.password);

  const handleChange =
    (key: keyof ClientForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please complete required fields and ensure password meets policy.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const registerResponse = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>("/auth/register/client", {
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
        industry: form.industry.trim(),
        companyWebsite: form.companyWebsite.trim(),
        companySize: form.companySize,
        companyType: form.companyType,
        spoc: {
          name: form.spocName.trim(),
          designation: form.spocDesignation.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim().toLowerCase(),
        },
        commercial: {
          recruitmentModel: form.recruitmentModel,
          replacementPeriod: form.replacementPeriod,
          paymentTerms: form.paymentTerms,
        },
        billing: {
          billingCompanyName: form.billingCompanyName.trim(),
          gstNumber: form.gstNumber.trim().toUpperCase(),
          billingAddress: form.billingAddress.trim(),
          billingEmail: form.billingEmail.trim().toLowerCase(),
        },
        declarationAccepted,
      });

      if (!registerResponse.success || !registerResponse.data?.accessToken || !registerResponse.data.user) {
        throw new Error("Registration failed");
      }

      setSession({
        accessToken: registerResponse.data.accessToken,
        refreshToken: registerResponse.data.refreshToken,
        user: registerResponse.data.user,
      });

      await apiPost(
        "/jobs",
        {
          jobTitle: form.jobTitle.trim(),
          openings: Number(form.openings),
          department: form.department.trim(),
          jobLocation: form.jobLocation.trim(),
          employmentType: form.employmentType,
          experienceRequired: form.experienceRequired.trim(),
          minCtcLpa: Number(form.minCtcLpa),
          maxCtcLpa: Number(form.maxCtcLpa),
          preferredIndustryBackground: form.preferredIndustryBackground.trim() || undefined,
          genderPreference: form.genderPreference && form.genderPreference !== "No Preference" ? form.genderPreference : undefined,
          workModes,
          jobDescription: form.jobDescription.trim(),
          urgencyLevel: form.urgencyLevel,
          expectedJoiningDate: form.expectedJoiningDate || undefined,
        },
        true,
      );

      setSubmitted(true);
      setTimeout(() => navigate("/dashboard/client"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
  const labelClass = "block mb-1.5 text-sm font-medium text-foreground";

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #264a7f, #69a44f)" }}>
            <span className="text-3xl sm:text-4xl">✓</span>
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3">Registration Submitted!</h2>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground mb-4">
              <span style={{ color: "#69a44f" }}>●</span> Employer / Client Registration
            </div>
            <h1 className="font-heading text-3xl font-bold mb-3 sm:text-4xl">Post Your Hiring Requirements</h1>
            <p className="text-muted-foreground">ANAAGAT HUMANPOWER PRIVATE LIMITED - Client Hiring Requirement Form</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold mb-5">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Company Name *</label><input required className={inputClass} value={form.companyName} onChange={handleChange("companyName")} /></div>
                <div><label className={labelClass}>Industry *</label><input required className={inputClass} value={form.industry} onChange={handleChange("industry")} /></div>
                <div><label className={labelClass}>Company Website</label><input type="url" className={inputClass} value={form.companyWebsite} onChange={handleChange("companyWebsite")} /></div>
                <div>
                  <label className={labelClass}>Company Size *</label>
                  <select required className={inputClass} value={form.companySize} onChange={handleChange("companySize")}>
                    <option value="">Select</option>
                    <option>1–10 Employees</option>
                    <option>11–50 Employees</option>
                    <option>51–200 Employees</option>
                    <option>201–500 Employees</option>
                    <option>500+</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Company Type *</label>
                  <select required className={inputClass} value={form.companyType} onChange={handleChange("companyType")}>
                    <option value="">Select</option>
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

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold mb-5">SPOC / Hiring Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Name *</label><input required className={inputClass} value={form.spocName} onChange={handleChange("spocName")} /></div>
                <div><label className={labelClass}>Designation *</label><input required className={inputClass} value={form.spocDesignation} onChange={handleChange("spocDesignation")} /></div>
                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <input
                    required
                    inputMode="numeric"
                    pattern="^[0-9]{10}$"
                    title="Enter a 10 digit mobile number"
                    className={inputClass}
                    value={form.mobile}
                    onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    maxLength={10}
                    placeholder="10 digit number"
                  />
                </div>
                <div><label className={labelClass}>Email *</label><input required type="email" className={inputClass} value={form.email} onChange={handleChange("email")} /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold mb-5">Job Requirement Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Job Title *</label><input required className={inputClass} value={form.jobTitle} onChange={handleChange("jobTitle")} /></div>
                <div><label className={labelClass}>Openings *</label><input required min={1} type="number" className={inputClass} value={form.openings} onChange={handleChange("openings")} /></div>
                <div><label className={labelClass}>Department *</label><input required className={inputClass} value={form.department} onChange={handleChange("department")} /></div>
                <div><label className={labelClass}>Job Location *</label><input required className={inputClass} value={form.jobLocation} onChange={handleChange("jobLocation")} /></div>
                <div>
                  <label className={labelClass}>Employment Type *</label>
                  <select required className={inputClass} value={form.employmentType} onChange={handleChange("employmentType")}>
                    <option value="">Select</option>
                    <option>Full-Time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Consultant</option>
                    <option>Temporary</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Experience Required (Years) *</label>
                  <input required type="number" min={0} step="0.5" className={inputClass} value={form.experienceRequired} onChange={handleChange("experienceRequired")} placeholder="e.g. 3" />
                </div>
                <div><label className={labelClass}>Budgeted CTC Range (Min) *</label><input required type="number" min={0} className={inputClass} value={form.minCtcLpa} onChange={handleChange("minCtcLpa")} /></div>
                <div><label className={labelClass}>Budgeted CTC Range (Max) *</label><input required type="number" min={0} className={inputClass} value={form.maxCtcLpa} onChange={handleChange("maxCtcLpa")} /></div>
                <div><label className={labelClass}>Preferred Industry Background</label><input className={inputClass} value={form.preferredIndustryBackground} onChange={handleChange("preferredIndustryBackground")} /></div>
                <div>
                  <label className={labelClass}>Gender Preference (if any)</label>
                  <select className={inputClass} value={form.genderPreference} onChange={handleChange("genderPreference")}>
                    <option value="">Select</option>
                    <option>No Preference</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Urgency Level *</label>
                  <select required className={inputClass} value={form.urgencyLevel} onChange={handleChange("urgencyLevel")}>
                    <option value="">Select</option>
                    <option>Immediate (Within 7 Days)</option>
                    <option>15 Days</option>
                    <option>30 Days</option>
                    <option>45+ Days</option>
                  </select>
                </div>
                <div><label className={labelClass}>Expected Joining Date</label><input type="date" className={inputClass} value={form.expectedJoiningDate} onChange={handleChange("expectedJoiningDate")} /></div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Work Mode * (Select at least one)</label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["On-site", "Hybrid", "Remote"].map((mode) => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={workModes.includes(mode)} onChange={() => toggleWorkMode(mode)} />
                        <span className="text-sm font-medium">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2"><label className={labelClass}>Job Description *</label><textarea required rows={5} className={inputClass} value={form.jobDescription} onChange={handleChange("jobDescription")} /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold mb-5">Commercial + Billing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Agreed Recruitment Model *</label>
                  <select required className={inputClass} value={form.recruitmentModel} onChange={handleChange("recruitmentModel")}>
                    <option value="">Select</option>
                    <option>Success-Based</option>
                    <option>Retainer Model</option>
                    <option>Dedicated Hiring</option>
                    <option>Bulk Hiring</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Replacement Period Required *</label>
                  <select required className={inputClass} value={form.replacementPeriod} onChange={handleChange("replacementPeriod")}>
                    <option value="">Select</option>
                    <option>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days</option>
                    <option>Not Required</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Payment Terms *</label>
                  <select required className={inputClass} value={form.paymentTerms} onChange={handleChange("paymentTerms")}>
                    <option value="">Select</option>
                    <option>15 Days from Joining</option>
                    <option>30 Days from Joining</option>
                    <option>Advance + Balance</option>
                    <option>As per Agreement</option>
                  </select>
                </div>
                <div><label className={labelClass}>Billing Company Name *</label><input required className={inputClass} value={form.billingCompanyName} onChange={handleChange("billingCompanyName")} /></div>
                <div>
                  <label className={labelClass}>GST Number *</label>
                  <input
                    required
                    className={inputClass}
                    value={form.gstNumber}
                    onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 15) }))}
                    maxLength={15}
                    minLength={15}
                    pattern="^[0-9A-Z]{15}$"
                    title="GST should be 15 characters (A-Z, 0-9)"
                  />
                </div>
                <div className="md:col-span-2"><label className={labelClass}>Billing Address *</label><textarea required rows={3} className={inputClass} value={form.billingAddress} onChange={handleChange("billingAddress")} /></div>
                <div className="md:col-span-2"><label className={labelClass}>Billing Email *</label><input required type="email" className={inputClass} value={form.billingEmail} onChange={handleChange("billingEmail")} /></div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold mb-5">Create Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelClass}>Password *</label><input required type="password" className={inputClass} value={form.password} onChange={handleChange("password")} /></div>
                <div><label className={labelClass}>Confirm Password *</label><input required type="password" className={inputClass} value={form.confirmPassword} onChange={handleChange("confirmPassword")} /></div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Use at least 8 chars with uppercase, lowercase, number, and special character.</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={declarationAccepted} onChange={(e) => setDeclarationAccepted(e.target.checked)} className="mt-1 w-4 h-4" />
                <span className="text-sm font-medium">
                  <span className="block">CLIENT DECLARATION</span>
                  <span className="mt-2 block text-sm text-muted-foreground">
                    We confirm that the above information is accurate. We agree to engage ANAAGAT HUMANPOWER PRIVATE LIMITED for recruitment support. Final hiring decision rests with our organization. Recruitment fees shall be payable as per mutually agreed commercial terms.
                  </span>
                  <span className="mt-2 block">☐ I Agree</span>
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient w-full rounded-xl py-4 text-base font-bold transition-all hover:scale-[1.02] hover:shadow-2xl disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Hiring Requirement"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-medium hover:underline" style={{ color: "#69a44f" }}>
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
