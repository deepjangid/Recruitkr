import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { services } from "@/lib/services";

const ServicesDetailsSection = () => {
  return (
    <section className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Details</p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Service Details</h2>
          <p className="mt-4 text-base text-muted-foreground">
            Explore what's included in each service and how RecruitKr supports your business or career journey.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <Accordion type="single" collapsible>
            {services.map((service) => (
              <AccordionItem key={service.id} value={service.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex w-full items-start gap-3">
                    <span className="mt-0.5 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                      <service.icon size={20} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-base font-bold">{service.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{service.subtitle}</span>
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-2 text-sm leading-relaxed text-muted-foreground">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      {service.intro.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>

                    {service.blocks.map((block) => (
                      <div key={block.title} className="space-y-3">
                        <h3 className="text-base font-bold text-foreground">{block.title}</h3>

                        {block.kind === "paragraphs" && (
                          <div className="space-y-3">
                            {block.paragraphs.map((p) => (
                              <p key={p}>{p}</p>
                            ))}
                          </div>
                        )}

                        {block.kind === "labeled" && (
                          <ul className="space-y-3">
                            {block.items.map((item) => (
                              <li key={item.label}>
                                <span className="font-semibold text-foreground">{item.label}: </span>
                                <span>{item.description}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {block.kind === "bullets" && (
                          <ul className="ml-5 list-disc space-y-2">
                            {block.items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}

                        {block.kind === "steps" && (
                          <ol className="ml-5 list-decimal space-y-2">
                            {block.items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}

                    {service.closing && (
                      <div className="space-y-3 border-t border-border pt-6">
                        {service.closing.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default ServicesDetailsSection;

