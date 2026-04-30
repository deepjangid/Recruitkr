import { useEffect, useState } from "react";
import { BriefcaseBusiness, Linkedin, Mail } from "lucide-react";

import { fetchTeamMembers, type TeamMember } from "@/lib/team";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim()[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const TeamSection = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetchTeamMembers();
        setTeamMembers(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load team members";
        console.error("[TeamSection] failed to load team members", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadTeamMembers();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f9ff_0%,#eef4fb_44%,#ffffff_100%)] py-24">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl">
          <div className="inline-flex items-center rounded-sm bg-navy-deep px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-lg">
            RecruitKr Team
          </div>
          <h2 className="mt-6 max-w-3xl text-5xl font-black uppercase leading-none sm:text-6xl md:text-7xl">
            Meet The
            <span className="block text-gradient-teal">People Behind</span>
            <span className="block text-[hsl(var(--navy-deep))]">Your Hiring Growth</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our team works across recruitment, employer support, and candidate success to make every hiring
            journey feel faster, clearer, and more dependable.
          </p>
        </div>

        {error && (
          <div className="mt-10 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`team-loading-${index}`}
                className="rounded-[28px] border border-slate-100 bg-white p-6 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]"
              >
                <div className="flex flex-col items-center">
                  <div className="h-28 w-28 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-5 h-7 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                  <div className="mt-6 flex gap-3">
                    {Array.from({ length: 3 }).map((__, iconIndex) => (
                      <div key={iconIndex} className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
                    ))}
                  </div>
                </div>
              </article>
            ))}

          {!loading &&
            teamMembers.map((member) => {
              const initials = getInitials(member.name);
              const hasImage = Boolean(member.image);
              const actions = [
                member.linkedin
                  ? {
                      label: "LinkedIn",
                      icon: Linkedin,
                      href: member.linkedin,
                    }
                  : null,
                member.email
                  ? {
                      label: "Email",
                      icon: Mail,
                      href: `mailto:${member.email}`,
                    }
                  : null,
              ].filter(Boolean) as Array<{
                label: string;
                icon: typeof Linkedin;
                href: string;
              }>;

              return (
                <article
                  key={member._id}
                  className="group flex h-full flex-col rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-2xl font-black uppercase tracking-[0.18em] ${
                        hasImage
                          ? "bg-slate-100"
                          : "bg-[linear-gradient(135deg,#0f766e_0%,#0ea5e9_100%)] text-white"
                      }`}
                    >
                      {hasImage ? (
                        <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        initials || "TM"
                      )}
                    </div>

                    <div className="mt-5 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Team Member
                    </div>

                    <h3 className="mt-4 text-2xl font-black uppercase text-[hsl(var(--navy-deep))]">
                      {member.name}
                    </h3>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                      {member.role || "RecruitKr Team"}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {member.summary || "Helping candidates and employers move forward with confidence."}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {actions.length > 0 ? actions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <a
                          key={`${member._id}-${action.label}`}
                          href={action.href}
                          target={action.href.startsWith("http") ? "_blank" : undefined}
                          rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                          aria-label={`${member.name} ${action.label}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-teal-300 hover:text-teal-700"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    }) : (
                      <a
                        href="/contact"
                        aria-label={`${member.name} contact`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-teal-300 hover:text-teal-700"
                      >
                        <BriefcaseBusiness className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}

          {!loading && teamMembers.length === 0 && (
            <div className="md:col-span-2 xl:col-span-4 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
              <p className="text-lg font-semibold text-[hsl(var(--navy-deep))]">No team members available right now</p>
              <p className="mt-2 text-sm text-slate-600">Please check back soon for updates from the RecruitKr team.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
