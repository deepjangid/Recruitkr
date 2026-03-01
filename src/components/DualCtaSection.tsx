import { Briefcase, Upload } from "lucide-react";

const DualCtaSection = () => {
  return (
    <section id="cta" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Employers */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full bg-primary/20 p-4 text-primary">
              <Briefcase size={32} />
            </div>
            <h3 className="mb-2 text-2xl font-extrabold">For Employers</h3>
            <p className="mb-6 text-muted-foreground">
              Share your requirements and let us find the perfect fit.
            </p>
            <a
              href="mailto:hire@recruitkr.com"
              className="gradient-teal inline-flex items-center gap-2 rounded-lg px-8 py-3.5 font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              Post a Requirement
            </a>
          </div>

          {/* Job Seekers */}
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full bg-accent/20 p-4 text-accent">
              <Upload size={32} />
            </div>
            <h3 className="mb-2 text-2xl font-extrabold">For Job Seekers</h3>
            <p className="mb-6 text-muted-foreground">
              Upload your resume and let opportunities find you.
            </p>
            <a
              href="mailto:jobs@recruitkr.com"
              className="gradient-amber inline-flex items-center gap-2 rounded-lg px-8 py-3.5 font-bold text-accent-foreground transition-transform hover:scale-105"
            >
              Upload Your Resume
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualCtaSection;
