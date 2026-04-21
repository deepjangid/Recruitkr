const sectors = [
  "Power", "BPO", "Retail", "Hospitality", "Insurance",
  "Banking", "IT", "Manufacturing", "Logistics", "Healthcare", "FMCG",
];

const SectorsSection = () => {
  const doubled = [...sectors, ...sectors];

  return (
    <section id="sectors" className="content-auto overflow-hidden border-y border-border py-16">
      <div className="container mx-auto mb-10 px-4 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
          Industries
        </p>
        <h2 className="bg-[linear-gradient(90deg,rgba(36,70,121,1)_0%,rgba(105,164,79,1)_100%)] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
          Sectors We Serve
        </h2>
      </div>

      <div className="relative hidden md:block">
        <div className="flex animate-ticker gap-4 will-change-transform">
          {doubled.map((sector, i) => (
            <span
              key={`${sector}-${i}`}
              className="inline-flex shrink-0 items-center  px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {sector}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-2 gap-3 px-4 md:hidden">
        {sectors.map((sector) => (
          <span
            key={sector}
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
          >
            {sector}
          </span>
        ))}
      </div>
    </section>
  );
};

export default SectorsSection;
