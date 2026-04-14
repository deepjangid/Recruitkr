import { ArrowRight, Linkedin, Facebook, Instagram, Mail, Phone } from "lucide-react";
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
    "group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 transition hover:border-primary/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep";
  const mobileSectionTriggerClass =
    "rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-sm font-semibold uppercase tracking-[0.16em] text-white/80 no-underline hover:no-underline";

  return (
    <footer className="border-t border-border bg-navy-deep py-10 text-white sm:py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-12 md:gap-10">
          <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-5 text-center sm:col-span-2 sm:items-start sm:p-6 sm:text-left md:col-span-4">
            <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
              <a href="/" className="inline-flex items-center">
                <span className="flex h-20 max-w-[250px] shrink-0 items-center sm:h-24">
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
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">
              Your End-to-End Hiring and HR Partner from recruitment to retention.
            </p>
          </div>

          <div className="md:hidden sm:col-span-2">
            <Accordion type="single" collapsible className="grid gap-3">
              <AccordionItem value="services" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0">
                <AccordionTrigger className={mobileSectionTriggerClass}>Services</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <nav className="grid gap-2">
                    {serviceLinks.map((item) =>
                      item.type === "route" ? (
                        <Link key={item.label} to={item.to} className={footerLinkClass}>
                          <span>{item.label}</span>
                          <ArrowRight size={16} className="shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
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
                        <ArrowRight size={16} className="shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </a>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contact" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0">
                <AccordionTrigger className={mobileSectionTriggerClass}>Contact</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <div className="grid gap-3 text-sm">
                    {contactEmails.map((email) => (
                      <a
                        key={email}
                        href={`mailto:${email}`}
                        className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 transition hover:border-primary/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                      >
                        <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                        <span className="min-w-0 break-words">{email}</span>
                      </a>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-medium text-white/80">Recruiters / Employers</p>
                      <a
                        href="tel:+919001965072"
                        className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                      >
                        <Phone size={16} className="shrink-0 opacity-90" /> +91 90019 65072
                      </a>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-medium text-white/80">Candidates / Job Seekers</p>
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

          <div className="hidden md:block md:col-span-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Services</h4>
            <nav className="grid gap-2">
              {serviceLinks.map((item) =>
                item.type === "route" ? (
                  <Link key={item.label} to={item.to} className={footerLinkClass}>
                    <span>{item.label}</span>
                    <ArrowRight size={16} className="shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                ) : null,
              )}
            </nav>
          </div>

          <div className="hidden md:block md:col-span-2">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Sectors</h4>
            <nav className="grid gap-2">
              {sectorLinks.map((s) => (
                <a
                  key={s}
                  href="/sectors"
                  className={footerLinkClass}
                >
                  <span>{s}</span>
                  <ArrowRight size={16} className="shrink-0 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden md:block md:col-span-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/70">Contact</h4>
            <div className="grid gap-3 text-sm">
              {contactEmails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 transition hover:border-primary/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                  <span className="min-w-0 break-words">{email}</span>
                </a>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium text-white/80">Recruiters / Employers</p>
                <a
                  href="tel:+919001965072"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
                >
                  <Phone size={16} className="shrink-0 opacity-90" /> +91 90019 65072
                </a>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-medium text-white/80">Candidates / Job Seekers</p>
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

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/75">
          &copy; {new Date().getFullYear()} RecruitKr. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
