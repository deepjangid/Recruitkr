import {
  Users,
  Wallet,
  UserCheck,
  Briefcase,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

const services = [
  {
    icon: Users,
    title: "Recruitment",
    description: "Tailored hiring for startups, SMBs, and corporates across 12+ sectors.",
  },
  {
    icon: Wallet,
    title: "Payroll Management",
    description: "Accurate, compliant payroll processing so you focus on growth.",
  },
  {
    icon: UserCheck,
    title: "Staffing Solutions",
    description: "Flexible workforce on demand — scale up or down as needed.",
  },
  {
    icon: Briefcase,
    title: "Gig Worker Placement",
    description: "Contract and freelance talent pool for project-based needs.",
  },
  {
    icon: ShieldCheck,
    title: "End-to-End HR",
    description: "From recruitment to retention to replacement — we cover it all.",
  },
  {
    icon: GraduationCap,
    title: "Career Counselling",
    description: "Guidance for job seekers, aspirants, and college students.",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            What We Do
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Our Services
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="card-hover group rounded-xl border border-border bg-card p-8 transition-colors hover:border-primary/40"
            >
              <div className="mb-5 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:gradient-teal group-hover:text-primary-foreground">
                <service.icon size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold">{service.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
