import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesSection from "@/components/ServicesSection";
import DualCtaSection from "@/components/DualCtaSection";

const Services = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <ServicesSection />
      <DualCtaSection />
    </div>
    <Footer />
  </div>
);

export default Services;
