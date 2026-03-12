export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // YYYY-MM-DD
  readingTime: string;
  tags: string[];
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-we-help-you-hire-faster",
    title: "How RecruitKr Helps You Hire Faster (Without Compromising Quality)",
    excerpt:
      "A practical overview of our sourcing, screening, and coordination process that reduces time-to-hire while improving fit.",
    publishedAt: "2026-03-12",
    readingTime: "4 min read",
    tags: ["Hiring", "Recruitment", "Process"],
    content: [
      "Hiring speed matters, but quality matters more. Our approach focuses on defining role success criteria early, aligning stakeholders, and keeping the pipeline clean.",
      "We combine targeted sourcing with structured shortlisting so you only review candidates who match the must-haves and the role context.",
      "Once interviews start, we coordinate tightly, collect feedback quickly, and keep candidates engaged until closure.",
    ],
  },
  {
    slug: "resume-tips-that-improve-shortlisting",
    title: "Resume Tips That Improve Shortlisting",
    excerpt:
      "Simple, high-impact changes candidates can make to improve visibility and increase interview callbacks.",
    publishedAt: "2026-03-12",
    readingTime: "3 min read",
    tags: ["Career", "Resume", "Job Search"],
    content: [
      "Recruiters skim fast. Your resume should make role fit obvious in the first 10 seconds: headline, skills, and recent impact.",
      "Use measurable outcomes where possible and tailor keywords to the job description—without keyword stuffing.",
      "Keep formatting clean, avoid dense paragraphs, and add links (LinkedIn/portfolio) when relevant.",
    ],
  },
];

export const getBlogPost = (slug: string) => blogPosts.find((p) => p.slug === slug);
