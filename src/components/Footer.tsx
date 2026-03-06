import { Linkedin, Twitter, Instagram, Mail, Phone } from "lucide-react";
import Logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-navy-deep py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 text-center md:grid-cols-4 md:text-left">
          <div className="md:col-span-1">
            <a href="/" className="inline-flex items-center justify-center md:justify-start">
              <span className="block h-12 w-[190px] overflow-hidden sm:w-[210px] md:w-[230px] lg:w-[250px]">
                <img
                  src={Logo}
                  alt="RecruitKr"
                  className="h-full w-full scale-[1.55] object-contain md:object-center"
                />
              </span>
            </a>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white md:mx-0">
              Your End-to-End Hiring and HR Partner from recruitment to retention.
            </p>
            <div className="mt-5 flex justify-center gap-3 md:justify-start">
              {[Linkedin, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-lg border border-border p-2 text-white transition-colors hover:border-primary"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Services</h4>
            {["Recruitment", "Payroll", "Staffing", "Gig Placement", "HR Solutions", "Career Counselling"].map((s) => (
              <a key={s} href="#services" className="mb-2 block text-sm text-white">
                {s}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Sectors</h4>
            {["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"].map((s) => (
              <a key={s} href="#sectors" className="mb-2 block text-sm text-white">
                {s}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Contact</h4>
            <a
              href="mailto:hello@recruitkr.com"
              className="mb-3 flex items-center justify-center gap-2 text-sm text-white md:justify-start"
            >
              <Mail size={16} /> hello@recruitkr.com
            </a>
            <div className="space-y-2">
              <div>
                <p className="mb-0.5 text-xs text-white">Recruiters / Employers</p>
                <a
                  href="tel:+919001965072"
                  className="flex items-center justify-center gap-2 text-sm text-white md:justify-start"
                >
                  <Phone size={16} /> +91 90019 65072
                </a>
              </div>
              <div>
                <p className="mb-0.5 text-xs text-white">Candidates / Job Seekers</p>
                <a
                  href="tel:+919636315150"
                  className="flex items-center justify-center gap-2 text-sm text-white md:justify-start"
                >
                  <Phone size={16} /> +91 96363 15150
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
