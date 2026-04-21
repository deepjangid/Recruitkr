import { useIsMobile } from "@/hooks/use-mobile";

const steps = [
  { num: "01", title: "Understand Requirement" },
  { num: "02", title: "Source Talent" },
  { num: "03", title: "Screen & Interview" },
  { num: "04", title: "Place & Onboard" },
  { num: "05", title: "Retain & Replace" },
];

const ProcessSection = () => {
  const isMobile = useIsMobile();

  return (
    <section id="process" className="content-auto border-y border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Our Process
          </h2>
        </div>

        {isMobile ? (
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xl font-extrabold text-primary">
                  {step.num}
                </div>
                <h3 className="text-base font-bold">{step.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-start justify-between">
            {steps.map((step, i) => (
              <div key={step.num} className="flex flex-1 flex-col items-center text-center">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-2xl font-extrabold text-primary">
                  {step.num}
                  {i < steps.length - 1 && (
                    <div className="absolute left-full top-1/2 h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-primary/60 to-transparent" />
                  )}
                </div>
                <h3 className="text-sm font-bold">{step.title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProcessSection;
