import DeferredSection from "@/components/DeferredSection";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import { lazy, Suspense } from "react";

const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const SectorsSection = lazy(() => import("@/components/SectorsSection"));
const WhoWeHelpSection = lazy(() => import("@/components/WhoWeHelpSection"));
const ProcessSection = lazy(() => import("@/components/ProcessSection"));
const WhyRecruitkrSection = lazy(() => import("@/components/WhyRecruitkrSection"));
const DualCtaSection = lazy(() => import("@/components/DualCtaSection"));
const Footer = lazy(() => import("@/components/Footer"));

const sectionFallback = <div className="min-h-[360px]" aria-hidden="true" />;

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <Suspense fallback={sectionFallback}>
        <DeferredSection fallback={sectionFallback}>
          <ServicesSection />
        </DeferredSection>
        <DeferredSection fallback={<div className="min-h-[220px]" aria-hidden="true" />}>
          <SectorsSection />
        </DeferredSection>
        <DeferredSection fallback={sectionFallback}>
          <WhoWeHelpSection />
        </DeferredSection>
        <DeferredSection fallback={<div className="min-h-[280px]" aria-hidden="true" />}>
          <ProcessSection />
        </DeferredSection>
        <DeferredSection fallback={sectionFallback}>
          <WhyRecruitkrSection />
        </DeferredSection>
        <DeferredSection fallback={<div className="min-h-[320px]" aria-hidden="true" />}>
          <DualCtaSection />
        </DeferredSection>
        <DeferredSection fallback={<div className="min-h-[260px]" aria-hidden="true" />}>
          <Footer />
        </DeferredSection>
      </Suspense>
    </div>
  );
};

export default Index;
