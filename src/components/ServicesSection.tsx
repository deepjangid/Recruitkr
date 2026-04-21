import { cn } from "@/lib/utils";
import { services } from "@/lib/services";
import { Link } from "react-router-dom";

type ServicesSectionProps = {
  showHeading?: boolean;
  className?: string;
};

const ServicesSection = ({ showHeading = true, className }: ServicesSectionProps) => {
  return (
    <section id="services" className={cn("content-auto py-24", className)}>
      <div className="container mx-auto px-4">
        {showHeading && (
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">What We Do</p>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Our Services</h2>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.id}`}
              className="card-hover group rounded-xl border border-border bg-card p-8 text-center transition-colors hover:border-transparent hover:gradient-teal sm:text-left"
              aria-label={`View details for ${service.cardTitle}`}
            >
              <div className="mb-5 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-white/15 group-hover:text-white">
                <service.icon size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold group-hover:text-white">{service.cardTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-white/90">{service.cardDescription}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
