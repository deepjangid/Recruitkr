import { ShieldCheck, RefreshCcw, Globe, UserCog, Layers } from "lucide-react";

const usps = [
  { icon: ShieldCheck, title: "End-to-End HR Partner", desc: "Not just a job board — a complete HR ecosystem." },
  { icon: RefreshCcw, title: "Replacement Guarantee", desc: "We stand behind every placement with a guarantee." },
  { icon: Globe, title: "Multi-Sector Expertise", desc: "Deep knowledge across 12+ industries." },
  { icon: UserCog, title: "Dedicated Account Manager", desc: "A single point of contact for all your needs." },
  { icon: Layers, title: "Gig + Full-Time + Contract", desc: "Flexible staffing models for every business stage." },
];

const WhyRecruitkrSection = () => {
  return (
    <section id="why-us" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Our Edge
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Why Recruitkr
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {usps.map((usp) => (
            <div
              key={usp.title}
              className="card-hover flex items-start gap-4 rounded-xl border border-border bg-card p-6"
            >
              <div className="shrink-0 rounded-lg bg-accent/10 p-3 text-accent">
                <usp.icon size={24} />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold">{usp.title}</h3>
                <p className="text-sm text-muted-foreground">{usp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRecruitkrSection;
