import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhyRecruitkrSection from "@/components/WhyRecruitkrSection";

const WhyUs = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <WhyRecruitkrSection />
    </div>
    <Footer />
  </div>
);

export default WhyUs;
