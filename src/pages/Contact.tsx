import { useState, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      await apiPost("/contact", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        message: message.trim(),
      });
      setSuccess("Message submitted successfully.");
      setName("");
      setEmail("");
      setMobile("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-sm text-muted-foreground mb-6">Send your requirement or message and our team will reach you.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium">Name *</label>
                <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium">Email *</label>
                <input required type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium">Mobile</label>
                <input className={inputClass} value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium">Message *</label>
                <textarea required rows={5} className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>

              {success && <p className="text-sm text-green-600">{success}</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
