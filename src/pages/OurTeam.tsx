import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TeamSection from "@/components/TeamSection";

const OurTeam = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <TeamSection />
    </div>
    <Footer />
  </div>
);

export default OurTeam;
