import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DualCtaSection from "@/components/DualCtaSection";
import { getService } from "@/lib/services";
import { Link, useParams } from "react-router-dom";

const toKebab = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ServiceDetails = () => {
  const { id } = useParams();
  const service = id ? getService(id) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          {!service ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
              <h1 className="text-3xl font-bold">Service not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The service you're looking for doesn't exist.
              </p>
              <Link
                to="/services"
                className="btn-gradient mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
              >
                Back to Services
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl">
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Link to="/services" className="hover:text-foreground">
                    Services
                  </Link>
                  <span>/</span>
                  <span className="text-foreground">{service.cardTitle}</span>
                </div>

                <div className="mt-4 flex items-start gap-4">
                  <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <service.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{service.title}</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                      {service.subtitle}
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link
                        to="/contact"
                        className="btn-gradient inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
                      >
                        Talk to us
                      </Link>
                      <Link
                        to="/services"
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        Explore other services
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                <article className="space-y-8">
                  <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
                    <div className="space-y-4">
                      {service.intro.map((p) => (
                        <p key={p} className="text-sm leading-relaxed text-muted-foreground md:text-base">
                          {p}
                        </p>
                      ))}
                    </div>
                  </section>

                  {service.blocks.map((block) => {
                    const sectionId = toKebab(block.title);
                    return (
                      <section
                        key={block.title}
                        id={sectionId}
                        className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 md:p-8"
                      >
                        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{block.title}</h2>

                        {block.kind === "paragraphs" && (
                          <div className="mt-4 space-y-4">
                            {block.paragraphs.map((p) => (
                              <p key={p} className="text-sm leading-relaxed text-muted-foreground md:text-base">
                                {p}
                              </p>
                            ))}
                          </div>
                        )}

                        {block.kind === "labeled" && (
                          <dl className="mt-5 grid gap-4 md:grid-cols-2">
                            {block.items.map((item) => (
                              <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-4">
                                <dt className="text-sm font-semibold text-foreground">{item.label}</dt>
                                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</dd>
                              </div>
                            ))}
                          </dl>
                        )}

                        {block.kind === "bullets" && (
                          <ul className="mt-5 grid gap-3 md:grid-cols-2">
                            {block.items.map((item) => (
                              <li
                                key={item}
                                className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        {block.kind === "steps" && (
                          <ol className="mt-5 space-y-3">
                            {block.items.map((item, index) => (
                              <li
                                key={item}
                                className="flex gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
                              >
                                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {index + 1}
                                </span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </section>
                    );
                  })}

                  {service.closing && (
                    <section className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
                      <div className="space-y-4">
                        {service.closing.map((p) => (
                          <p key={p} className="text-sm leading-relaxed text-muted-foreground md:text-base">
                            {p}
                          </p>
                        ))}
                      </div>
                    </section>
                  )}
                </article>

                <aside className="hidden lg:block">
                  <div className="sticky top-28 rounded-2xl border border-border bg-card p-6">
                    <p className="text-sm font-semibold text-foreground">On this page</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {service.blocks.map((block) => (
                        <li key={block.title}>
                          <a
                            href={`#${toKebab(block.title)}`}
                            className="block rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {block.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>

      <DualCtaSection />
      <Footer />
    </div>
  );
};

export default ServiceDetails;
