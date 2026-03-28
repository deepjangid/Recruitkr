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
    <footer className="border-t border-border bg-navy-deep py-10 text-white sm:py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-12">
          <div className="flex flex-col items-center text-center sm:col-span-2 sm:items-start sm:text-left md:col-span-4">
            <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
              <a href="/" className="inline-flex items-center">
                <span className="flex h-20 max-w-[260px] shrink-0 items-center sm:h-24">
                  <img
                    src={Logo}
                    alt="RecruitKr"
                    className="h-full w-auto origin-left scale-[1.2] object-contain sm:scale-[1.25]"
                  />
                </span>
              </a>
              <div className="flex justify-center gap-3 sm:justify-start">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-primary/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/85">
              Your End-to-End Hiring and HR Partner from recruitment to retention.
            </p>
          </div>

          <div className="sm:col-span-1 md:col-span-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Services</h4>
            <nav className="grid gap-2 text-sm">
              <Link
                to="/"
                className="text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
              >
                Home
              </Link>
              <Link
                to="/why-us"
                className="text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
              >
                About Us
              </Link>
              {["Recruitment", "Payroll", "Staffing", "Gig Placement", "HR Solutions", "Career Counselling"].map((s) => (
                <a
                  key={s}
                  href="#services"
                  className="text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  {s}
                </a>
              ))}
              <Link
                to="/faqs"
                className="text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
              >
                FAQs
              </Link>
              <Link
                to="/blog"
                className="text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
              >
                Blog
              </Link>
            </nav>
          </div>

          <div className="sm:col-span-1 md:col-span-2">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Sectors</h4>
            <nav className="grid gap-2 text-sm">
              {["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"].map((s) => (
                <a
                  key={s}
                  href="#sectors"
                  className="text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  {s}
                </a>
              ))}
            </nav>
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Contact</h4>
            <div className="grid gap-2 text-sm">
              {contactEmails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex min-w-0 items-start gap-2 text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                  <span className="min-w-0 break-words">{email}</span>
                </a>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-medium text-white/80">Recruiters / Employers</p>
                <a
                  href="tel:+919001965072"
                  className="mt-1 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  <Phone size={16} className="shrink-0 opacity-90" /> +91 90019 65072
                </a>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-medium text-white/80">Candidates / Job Seekers</p>
                <a
                  href="tel:+919636315150"
                  className="mt-1 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  <Phone size={16} className="shrink-0 opacity-90" /> +91 96363 15150
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/75">
          &copy; {new Date().getFullYear()} RecruitKr. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
