import { Linkedin, Facebook, Instagram, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";

const Footer = () => {
  const socialLinks = [
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/company/recruitkr/",
      label: "LinkedIn",
    },
    {
      icon: Facebook,
      href: "https://www.facebook.com/share/183yc8uvDV/",
      label: "Facebook",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/recruitkr_official?igsh=MWUweW1sNjB0ejk1MA==",
      label: "Instagram",
    },
  ];

  const contactEmails = ["support@recruitkr.com", "connect@recruitkr.com", "careers@recruitkr.com"];

  return (
    <footer className="border-t border-border bg-navy-deep py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 text-center md:grid-cols-4 md:text-left">
          <div className="md:col-span-1">
            <a href="/" className="inline-flex items-center justify-center md:justify-start">
              <span className="block h-14 w-14 shrink-0 overflow-hidden sm:h-16 sm:w-16">
                <img
                  src={Logo}
                  alt="RecruitKr"
                  className="h-full w-full scale-[1.4] object-contain"
                />
              </span>
            </a>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white md:mx-0">
              Your End-to-End Hiring and HR Partner from recruitment to retention.
            </p>
            <div className="mt-5 flex justify-center gap-3 md:justify-start">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="rounded-lg border border-border p-2 text-white transition-colors hover:border-primary"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest">Services</h4>
            <Link to="/" className="mb-2 block text-sm text-white">
              Home
            </Link>
            <Link to="/why-us" className="mb-2 block text-sm text-white">
              About Us
            </Link>
            {["Recruitment", "Payroll", "Staffing", "Gig Placement", "HR Solutions", "Career Counselling"].map((s) => (
              <a key={s} href="#services" className="mb-2 block text-sm text-white">
                {s}
              </a>
            ))}
            <Link to="/faqs" className="mb-2 block text-sm text-white">
              FAQs
            </Link>
            <Link to="/blog" className="mb-2 block text-sm text-white">
              Blog
            </Link>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest">Sectors</h4>
            {["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"].map((s) => (
              <a key={s} href="#sectors" className="mb-2 block text-sm text-white">
                {s}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest">Contact</h4>
            <div className="mb-3 space-y-2">
              {contactEmails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white md:justify-start break-all"
                >
                  <Mail size={16} className="shrink-0" /> {email}
                </a>
              ))}
            </div>
            <div className="space-y-2">
              <div>
                <p className="mb-0.5 text-xs text-white">Recruiters / Employers</p>
                <a
                  href="tel:+919001965072"
                  className="flex items-center justify-center gap-2 text-sm text-white md:justify-start"
                >
                  <Phone size={16} className="shrink-0" /> +91 90019 65072
                </a>
              </div>
              <div>
                <p className="mb-0.5 text-xs text-white">Candidates / Job Seekers</p>
                <a
                  href="tel:+919636315150"
                  className="flex items-center justify-center gap-2 text-sm text-white md:justify-start"
                >
                  <Phone size={16} className="shrink-0" /> +91 96363 15150
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-white">
          &copy; {new Date().getFullYear()} RecruitKr. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
