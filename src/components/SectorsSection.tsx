const sectors = [
  "Power", "BPO", "Retail", "Hospitality", "Insurance",
  "Banking", "IT", "Manufacturing", "Logistics", "Healthcare", "FMCG",
];

const SectorsSection = () => {
  const doubled = [...sectors, ...sectors];

  return (
    <section id="sectors" className="overflow-hidden border-y border-border py-16">
      <div className="container mx-auto mb-10 px-4 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
          Industries
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Sectors We Serve
        </h2>
      </div>

      <div className="relative">
        <div className="flex animate-ticker gap-4">
          {doubled.map((sector, i) => (
            <span
              key={`${sector}-${i}`}
              className="inline-flex shrink-0 items-center rounded-full border border-border bg-secondary px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {sector}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectorsSection;
