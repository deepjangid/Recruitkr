import { Building2, GraduationCap, Heart } from "lucide-react";

const panels = [
  {
    icon: Building2,
    title: "Employers",
    description: "Startups, SMBs, and corporates looking for the right talent — fast.",
    accent: "border-primary text-primary bg-primary/10",
  },
  {
    icon: GraduationCap,
    title: "Job Seekers & Students",
    description: "Career counselling, placement support, and resume building for aspirants.",
    accent: "border-accent text-accent bg-accent/10",
  },
  {
    icon: Heart,
    title: "Institutions & NGOs",
    description: "Skill development centers, livelihood NGOs, and placement drives for batches.",
    accent: "border-teal text-teal bg-teal/10",
  },
];

const WhoWeHelpSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Our Audience
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Who We Help
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {panels.map((panel) => (
            <div
              key={panel.title}
              className={`card-hover rounded-xl border-2 ${panel.accent} p-8 text-center`}
            >
              <div className="mx-auto mb-5 inline-flex rounded-full p-4">
                <panel.icon size={40} />
              </div>
              <h3 className="mb-3 text-2xl font-bold">{panel.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {panel.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoWeHelpSection;
