import { ArrowRight, Briefcase } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { value: "500+", label: "Placements" },
  { value: "12+", label: "Sectors" },
  { value: "E2E", label: "HR Solutions" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="animate-fade-up mx-auto max-w-4xl">
          <p className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Full-Stack Hiring & HR Solutions
          </p>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Your Hiring Partner.{" "}
            <span className="text-gradient-teal">End to End.</span>
          </h1>

          <p className="animate-fade-up-delay-1 mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Recruitment, Payroll, Staffing, Gig Solutions — Serving Startups, SMBs and Corporates.
          </p>

          <div className="animate-fade-up-delay-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#cta"
              className="gradient-teal group inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              <Briefcase size={20} />
              Hire Talent
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-primary/50 px-8 py-4 text-base font-bold text-primary transition-all hover:border-primary hover:bg-primary/10"
            >
              Find a Job
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div className="animate-fade-up-delay-3 mx-auto mt-20 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card/60 backdrop-blur-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-6 text-center">
              <div className="text-3xl font-extrabold text-primary md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
