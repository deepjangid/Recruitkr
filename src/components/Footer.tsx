import { Linkedin, Facebook, Instagram, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const serviceLinks = [
    { label: "Home", to: "/", type: "route" as const },
    { label: "About Us", to: "/why-us", type: "route" as const },
    { label: "Recruitment", to: "/services", type: "route" as const },
    { label: "Payroll", to: "/services", type: "route" as const },
    { label: "Staffing", to: "/services", type: "route" as const },
    { label: "Gig Placement", to: "/services", type: "route" as const },
    { label: "HR Solutions", to: "/services", type: "route" as const },
    { label: "Career Counselling", to: "/services", type: "route" as const },
    { label: "FAQs", to: "/faqs", type: "route" as const },
    { label: "Blog", to: "/blog", type: "route" as const },
  ];
  const sectorLinks = ["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"];

  const footerLinkClass =
    "flex min-w-0 items-center rounded-xl px-3 py-2.5 text-sm text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep";
  const mobileSectionTriggerClass =
    "rounded-2xl px-4 text-left text-sm font-semibold uppercase tracking-[0.16em] text-white/80 no-underline hover:no-underline";
  const contactLinkClass =
    "flex min-w-0 items-start gap-3 rounded-xl px-3 py-2.5 text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep";

  return (
    <footer className="border-t border-border bg-navy-deep py-10 text-white sm:py-14">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] sm:p-6">
          <div className="flex flex-col items-center gap-5 text-center sm:items-center md:flex-row md:justify-between md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <span className="flex h-16 w-[180px] items-center rounded-2xl bg-white/5 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:h-[72px] sm:w-[210px]">
                <img
                  src={Logo}
                  alt="RecruitKr"
                  className="h-full w-full object-contain object-left drop-shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                />
              </span>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
                Your End-to-End Hiring and HR Partner from recruitment to retention.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:justify-end">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition duration-200 hover:bg-white/10 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 md:hidden">
            <Accordion type="single" collapsible className="grid gap-3">
              <AccordionItem value="services" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0">
                <AccordionTrigger className={mobileSectionTriggerClass}>Services</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <nav className="grid gap-2">
                    {serviceLinks.map((item) =>
                      item.type === "route" ? (
                        <Link key={item.label} to={item.to} className={footerLinkClass}>
                          <span>{item.label}</span>
                        </Link>
                      ) : null,
                    )}
                  </nav>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sectors" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0">
                <AccordionTrigger className={mobileSectionTriggerClass}>Sectors</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <nav className="grid gap-2">
                    {sectorLinks.map((s) => (
                      <a key={s} href="/sectors" className={footerLinkClass}>
                        <span>{s}</span>
                      </a>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contact" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0">
                <AccordionTrigger className={mobileSectionTriggerClass}>Contact</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <div className="grid gap-2 text-sm">
                    {contactEmails.map((email) => (
                      <a
                        key={email}
                        href={`mailto:${email}`}
                        className={contactLinkClass}
                      >
                        <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                        <span className="min-w-0 break-words">{email}</span>
                      </a>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/70">
                        Recruiters / Employers
                      </p>
                      <a
                        href="tel:+919001965072"
                        className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                      >
                        <Phone size={16} className="shrink-0 opacity-90" /> +91 90019 65072
                      </a>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/70">
                        Candidates / Job Seekers
                      </p>
                      <a
                        href="tel:+919636315150"
                        className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                      >
                        <Phone size={16} className="shrink-0 opacity-90" /> +91 96363 15150
                      </a>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-8 hidden grid-cols-1 gap-6 sm:grid-cols-2 md:grid md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Services</h4>
              <nav className="grid gap-2">
                {serviceLinks.map((item) =>
                  item.type === "route" ? (
                    <Link key={item.label} to={item.to} className={footerLinkClass}>
                      <span>{item.label}</span>
                    </Link>
                  ) : null,
                )}
              </nav>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Sectors</h4>
              <nav className="grid gap-2">
                {sectorLinks.map((s) => (
                  <a
                    key={s}
                    href="/sectors"
                    className={footerLinkClass}
                  >
                    <span>{s}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Contact</h4>
              <div className="grid gap-2 text-sm">
                {contactEmails.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className={contactLinkClass}
                  >
                    <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                    <span className="min-w-0 break-words">{email}</span>
                  </a>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/70">
                    Recruiters / Employers
                  </p>
                  <a
                    href="tel:+919001965072"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                  >
                    <Phone size={16} className="shrink-0 opacity-90" /> +91 90019 65072
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/70">
                    Candidates / Job Seekers
                  </p>
                  <a
                    href="tel:+919636315150"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                  >
                    <Phone size={16} className="shrink-0 opacity-90" /> +91 96363 15150
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-white/70">
            &copy; {new Date().getFullYear()} RecruitKr. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
