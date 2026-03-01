import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";

const Process = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <ProcessSection />
    </div>
    <Footer />
  </div>
);

export default Process;
