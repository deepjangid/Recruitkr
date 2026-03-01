import { Linkedin, Twitter, Instagram, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-navy-deep py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#" className="font-display text-2xl font-bold">
              Recruit<span className="text-primary">kr</span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your End-to-End Hiring & HR Partner — from recruitment to retention.
            </p>
            <div className="mt-5 flex gap-3">
              {[Linkedin, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">Services</h4>
            {["Recruitment", "Payroll", "Staffing", "Gig Placement", "HR Solutions", "Career Counselling"].map((s) => (
              <a key={s} href="#services" className="mb-2 block text-sm text-muted-foreground hover:text-primary">
                {s}
              </a>
            ))}
          </div>

          {/* Sectors */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">Sectors</h4>
            {["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"].map((s) => (
              <a key={s} href="#sectors" className="mb-2 block text-sm text-muted-foreground hover:text-primary">
                {s}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">Contact</h4>
            <a href="mailto:hello@recruitkr.com" className="mb-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Mail size={16} /> hello@recruitkr.com
            </a>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Recruiters / Employers</p>
                <a href="tel:+919001965072" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Phone size={16} /> +91 90019 65072
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Candidates / Job Seekers</p>
                <a href="tel:+919636315150" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Phone size={16} /> +91 96363 15150
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Recruitkr. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
