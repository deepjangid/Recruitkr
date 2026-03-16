import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesSection from "@/components/ServicesSection";
import DualCtaSection from "@/components/DualCtaSection";

const Services = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <section className="border-b border-border bg-muted/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            What We Do
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Services</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
            Explore our recruitment and HR solutions designed for startups, SMBs, and corporates.
          </p>
        </div>
      </section>

      <ServicesSection showHeading={false} />
      <DualCtaSection />
    </div>
    <Footer />
  </div>
);

export default Services;
