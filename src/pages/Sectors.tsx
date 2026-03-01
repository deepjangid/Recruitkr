import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectorsSection from "@/components/SectorsSection";
import WhoWeHelpSection from "@/components/WhoWeHelpSection";

const Sectors = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <SectorsSection />
      <WhoWeHelpSection />
    </div>
    <Footer />
  </div>
);

export default Sectors;
