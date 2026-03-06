import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  items: FaqItem[];
};

const faqCategories: FaqCategory[] = [
  {
    title: "General Questions About RecruitKr",
    items: [
      {
        question: "What is RecruitKr?",
        answer:
          "RecruitKr is a recruitment and HR solutions platform that helps companies hire skilled professionals and helps job seekers find employment opportunities. Services include recruitment, staffing solutions, workforce outsourcing, payroll management, and gig worker supply.",
      },
      {
        question: "Who owns RecruitKr?",
        answer:
          "RecruitKr is operated by Anaagat Humanpower Private Limited, a company providing manpower consultancy and HR services to startups, SMEs, and corporate organizations in India.",
      },
      {
        question: "What services does RecruitKr offer?",
        answer:
          "RecruitKr offers recruitment services, temporary staffing solutions, permanent staffing solutions, workforce outsourcing, payroll management, gig worker supply, and HR consulting services.",
      },
      {
        question: "Is RecruitKr a recruitment agency or a job portal?",
        answer:
          "RecruitKr functions as both a recruitment consultancy and hiring platform, providing companies with screened candidates rather than only listing job openings.",
      },
      {
        question: "What is the mission of RecruitKr?",
        answer:
          "RecruitKr aims to simplify hiring for businesses and provide organizations with trained professionals while reducing hiring costs and time.",
      },
      {
        question: "Where is RecruitKr located?",
        answer:
          "RecruitKr operates from Rajasthan, India and provides recruitment and staffing services to companies across India.",
      },
      {
        question: "Does RecruitKr provide nationwide hiring services?",
        answer: "Yes, RecruitKr supports recruitment and staffing services for companies across India.",
      },
      {
        question: "What industries does RecruitKr support for recruitment?",
        answer:
          "RecruitKr supports hiring across IT and technology, retail and e-commerce, manufacturing, logistics and supply chain, BPO and customer support, and sales and marketing.",
      },
      {
        question: "Why should companies use RecruitKr for hiring?",
        answer:
          "RecruitKr helps businesses reduce hiring time, access trained candidates, simplify recruitment processes, and scale workforce quickly.",
      },
      {
        question: "How does RecruitKr help businesses grow?",
        answer:
          "By providing efficient hiring solutions and workforce management services, RecruitKr allows businesses to focus on operations while professionals handle recruitment.",
      },
    ],
  },
  {
    title: "FAQs for Employers / Companies",
    items: [
      {
        question: "How can my company hire employees through RecruitKr?",
        answer:
          "Companies can submit hiring requirements through the website or contact the RecruitKr team directly to start the recruitment process.",
      },
      {
        question: "What is the recruitment process followed by RecruitKr?",
        answer:
          "The recruitment process generally includes requirement analysis, candidate sourcing, resume screening, candidate interviews, and shortlisting and selection.",
      },
      {
        question: "How long does the hiring process take?",
        answer:
          "The hiring timeline depends on the role and experience level, but RecruitKr aims to provide shortlisted candidates quickly.",
      },
      {
        question: "Does RecruitKr provide bulk hiring services?",
        answer:
          "Yes, RecruitKr supports bulk hiring for companies expanding operations or requiring large workforces.",
      },
      {
        question: "Does RecruitKr help startups with hiring?",
        answer: "Yes. RecruitKr specializes in helping startups hire trained professionals quickly and cost-effectively.",
      },
      {
        question: "Can RecruitKr help hire remote employees?",
        answer: "Yes, RecruitKr can assist companies in finding remote professionals depending on the job role.",
      },
      {
        question: "Does RecruitKr provide contract staffing?",
        answer:
          "Yes, RecruitKr provides contract and temporary staffing solutions for project-based or short-term requirements.",
      },
      {
        question: "What is temporary staffing?",
        answer:
          "Temporary staffing involves hiring employees for a limited time period to support business needs.",
      },
      {
        question: "What is permanent staffing?",
        answer:
          "Permanent staffing involves hiring employees for full-time long-term roles within an organization.",
      },
      {
        question: "What is workforce outsourcing?",
        answer:
          "Workforce outsourcing means delegating hiring and workforce management responsibilities to a specialized HR service provider like RecruitKr.",
      },
      {
        question: "Can RecruitKr help with seasonal workforce requirements?",
        answer: "Yes, companies can hire temporary workers during peak seasons or special projects.",
      },
      {
        question: "Does RecruitKr provide payroll management services?",
        answer: "Yes, RecruitKr can assist businesses with payroll management and workforce compliance support.",
      },
      {
        question: "How does RecruitKr screen candidates?",
        answer: "RecruitKr screens candidates based on qualifications, experience, and job role requirements.",
      },
      {
        question: "Can RecruitKr handle large workforce deployments?",
        answer: "Yes, RecruitKr can support large workforce hiring for companies with large manpower needs.",
      },
      {
        question: "Can RecruitKr recruit for specialized roles?",
        answer: "Yes, RecruitKr can assist in recruiting for specialized roles depending on the client's requirements.",
      },
    ],
  },
  {
    title: "FAQs for Job Seekers",
    items: [
      {
        question: "How can I apply for jobs through RecruitKr?",
        answer:
          "Job seekers can upload their resume and apply for available job opportunities through the RecruitKr platform.",
      },
      {
        question: "Do job seekers need to pay any fees?",
        answer: "No. Job seekers can apply for jobs through RecruitKr without paying registration fees.",
      },
      {
        question: "Does RecruitKr guarantee job placement?",
        answer: "RecruitKr connects candidates with employers but cannot guarantee employment.",
      },
      {
        question: "What types of jobs are available on RecruitKr?",
        answer:
          "RecruitKr offers full-time jobs, contract jobs, temporary jobs, and entry-level positions.",
      },
      {
        question: "Can freshers apply through RecruitKr?",
        answer: "Yes, freshers can apply for entry-level positions available through the platform.",
      },
      {
        question: "How will I know if my application is selected?",
        answer: "If shortlisted, you may receive communication from RecruitKr or the hiring company.",
      },
      {
        question: "Can I update my resume on RecruitKr?",
        answer: "Yes, candidates can update their resumes anytime to improve job matching.",
      },
      {
        question: "What industries offer jobs through RecruitKr?",
        answer:
          "Jobs are available across industries including IT, retail, logistics, sales, and customer support.",
      },
      {
        question: "Can RecruitKr help me prepare for interviews?",
        answer: "RecruitKr may provide guidance on interview preparation depending on the hiring process.",
      },
      {
        question: "Does RecruitKr offer gig work opportunities?",
        answer: "Yes, RecruitKr supports gig worker placements depending on company requirements.",
      },
    ],
  },
  {
    title: "Website and Platform Questions",
    items: [
      {
        question: "Is my data safe on RecruitKr?",
        answer: "RecruitKr takes appropriate steps to protect user data and maintain confidentiality.",
      },
      {
        question: "Can employers directly contact candidates?",
        answer:
          "Yes, employers may contact candidates through the platform if their profiles match the job requirement.",
      },
      {
        question: "Can I delete my account from RecruitKr?",
        answer: "Yes, users can request account deletion by contacting the support team.",
      },
      {
        question: "Can companies post job openings on RecruitKr?",
        answer: "Yes, employers can share job requirements with the RecruitKr team.",
      },
      {
        question: "Does RecruitKr operate internationally?",
        answer: "Currently RecruitKr focuses on recruitment services within India.",
      },
    ],
  },
  {
    title: "Partnership & Collaboration Questions",
    items: [
      {
        question: "Can recruitment agencies partner with RecruitKr?",
        answer: "Yes, RecruitKr welcomes partnerships with recruitment agencies.",
      },
      {
        question: "Can HR consultants collaborate with RecruitKr?",
        answer: "Yes, HR consultants can collaborate with RecruitKr for recruitment projects.",
      },
      {
        question: "Can training institutes partner with RecruitKr?",
        answer: "Yes, training institutes can collaborate to provide trained candidates.",
      },
      {
        question: "How can I become a hiring partner?",
        answer: "Interested partners can contact RecruitKr through the website or official email.",
      },
      {
        question: "Does RecruitKr work with gig workforce providers?",
        answer: "Yes, RecruitKr collaborates with gig workforce suppliers.",
      },
    ],
  },
  {
    title: "Service and Pricing Questions",
    items: [
      {
        question: "How much do RecruitKr recruitment services cost?",
        answer:
          "Pricing varies depending on hiring requirements, number of positions, and type of recruitment service.",
      },
      {
        question: "Do companies need to sign service agreements?",
        answer: "Yes, service agreements may be used for recruitment or staffing projects.",
      },
      {
        question: "Are RecruitKr services suitable for small businesses?",
        answer:
          "Yes, RecruitKr services are designed for startups and SMEs as well as large organizations.",
      },
      {
        question: "Can companies hire part-time employees through RecruitKr?",
        answer: "Yes, part-time hiring solutions may be available depending on business requirements.",
      },
      {
        question: "Does RecruitKr support HR consulting services?",
        answer: "Yes, RecruitKr provides HR consulting and workforce planning support.",
      },
    ],
  },
  {
    title: "Additional Common Questions",
    items: [
      {
        question: "What is a manpower consultancy?",
        answer:
          "A manpower consultancy helps organizations recruit skilled employees and manage workforce requirements.",
      },
      {
        question: "Why is recruitment outsourcing beneficial?",
        answer:
          "Recruitment outsourcing saves time, reduces hiring costs, and improves hiring efficiency.",
      },
      {
        question: "How does RecruitKr help reduce hiring costs?",
        answer:
          "By providing screened candidates and efficient hiring processes, RecruitKr reduces recruitment expenses.",
      },
      {
        question: "Can RecruitKr support rapid hiring needs?",
        answer:
          "Yes, RecruitKr helps businesses hire employees quickly during expansion or urgent workforce requirements.",
      },
      {
        question: "Does RecruitKr support campus hiring?",
        answer:
          "RecruitKr may assist companies with campus hiring initiatives depending on hiring requirements.",
      },
      {
        question: "What is gig workforce supply?",
        answer:
          "Gig workforce supply involves providing temporary or freelance workers for short-term assignments.",
      },
      {
        question: "Does RecruitKr provide workforce management services?",
        answer:
          "Yes, RecruitKr supports workforce management including hiring coordination and staffing support.",
      },
      {
        question: "Can businesses outsource HR functions to RecruitKr?",
        answer:
          "Yes, RecruitKr can support businesses in managing recruitment and HR-related processes.",
      },
      {
        question: "What documents are required to start recruitment services?",
        answer:
          "Companies usually provide job descriptions, hiring requirements, and company details to begin recruitment.",
      },
      {
        question: "Does RecruitKr work with corporate clients?",
        answer: "Yes, RecruitKr works with corporate clients, startups, and small businesses.",
      },
      {
        question: "How does RecruitKr maintain candidate quality?",
        answer:
          "RecruitKr follows screening and verification processes before sharing candidate profiles.",
      },
      {
        question: "Does RecruitKr help with workforce scaling?",
        answer: "Yes, RecruitKr helps companies scale their workforce efficiently.",
      },
      {
        question: "Can RecruitKr help with urgent hiring requirements?",
        answer: "Yes, RecruitKr can assist companies with urgent hiring needs.",
      },
      {
        question: "What are the benefits of using staffing services?",
        answer:
          "Staffing services allow companies to hire workers quickly while reducing HR management efforts.",
      },
      {
        question: "Can RecruitKr help companies entering new markets?",
        answer: "Yes, RecruitKr can support workforce hiring for companies expanding operations.",
      },
      {
        question: "Does RecruitKr provide HR advisory services?",
        answer: "RecruitKr can provide HR consulting and advisory support.",
      },
      {
        question: "How can I contact RecruitKr for hiring services?",
        answer: "You can contact RecruitKr through the website or official email.",
      },
      {
        question: "How can job seekers get updates about job openings?",
        answer: "Candidates can receive job alerts after registering on the platform.",
      },
      {
        question: "What makes RecruitKr a reliable hiring partner?",
        answer:
          "RecruitKr focuses on trained resources, efficient hiring processes, and strong employer support.",
      },
      {
        question: "How can I get started with RecruitKr?",
        answer:
          "Visit recruitkr.com and connect with the RecruitKr team to start hiring or applying for jobs.",
      },
    ],
  },
];

const FAQSection = () => {
  const allFaqItems = faqCategories.flatMap((category) => category.items);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faqs" className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">FAQs</p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Common questions from employers, job seekers, and partners about RecruitKr services.
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={category.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-xl font-bold">{category.title}</h3>
              <Accordion type="single" collapsible>
                {category.items.map((item, itemIndex) => {
                  const faqNumber = faqCategories
                    .slice(0, categoryIndex)
                    .reduce((total, currentCategory) => total + currentCategory.items.length, 0)
                    + itemIndex
                    + 1;

                  return (
                    <AccordionItem key={item.question} value={`faq-${faqNumber}`}>
                      <AccordionTrigger className="text-left text-base">
                        {faqNumber}. {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
};

export default FAQSection;
