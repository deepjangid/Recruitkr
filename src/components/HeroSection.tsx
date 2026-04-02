import { ArrowRight, Briefcase } from "lucide-react";

const stats = [
  { value: "500+", label: "Placements" },
  { value: "11+", label: "Sectors" },
  { value: "E2E", label: "HR Solutions" },
];

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20">
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-fade-up mx-auto max-w-4xl">
       <h1 className="font-heading mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-7xl">
            Your Hiring Partner. <span className="text-gradient-teal"><br></br>End to End.</span>
          </h1>

          <p className="animate-fade-up-delay-1 mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
            Recruitment, Payroll, Staffing, Gig Solutions — Serving Startups, Small Business MSMEs  and Corporates.
          </p>

          <div className="animate-fade-up-delay-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#cta"
              className="btn-gradient group inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-bold transition-transform hover:scale-105 sm:w-auto sm:px-8"
            >
              <Briefcase size={20} />
              Hire Talent
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#cta"
              className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-bold transition-transform hover:scale-105 sm:w-auto sm:px-8"
            >
              Find a Job
            </a>
          </div>
        </div>

        <div className="animate-fade-up-delay-3 mx-auto mt-16 grid max-w-3xl grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card/60 backdrop-blur-sm sm:mt-20 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-5 text-center sm:px-6 sm:py-6">
              <div className="text-2xl font-extrabold text-primary sm:text-3xl md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
};

export default HeroSection;
