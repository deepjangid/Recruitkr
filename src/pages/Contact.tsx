import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DualCtaSection from "@/components/DualCtaSection";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <DualCtaSection />
    </div>
    <Footer />
  </div>
);

export default Contact;
