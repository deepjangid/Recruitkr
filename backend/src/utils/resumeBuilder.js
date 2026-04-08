import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateResumeHTML = (profile) => {
  const templatePath = path.join(__dirname, "../../templates/resume.html");

  let template = fs.readFileSync(templatePath, "utf-8");

  // ✅ EDUCATION (UL clean)
  let educationHTML = "";
  if (profile.highestQualification) {
    educationHTML = `
      <ul class="pl-4 text-[13px] list-disc space-y-1">
        <li><strong>${profile.highestQualification}</strong></li>
      </ul>
    `;
  }

  // ✅ EXPERIENCE
  let experienceHTML = "";
  if (profile.experienceStatus === "experienced" && profile.experienceDetails) {
    experienceHTML = `
      <ul class="pl-4 text-[13px] list-disc space-y-1">
        <li>
          <strong>${profile.experienceDetails.designation || ""}</strong><br/>
          ${profile.experienceDetails.industry || ""}<br/>
          ${profile.experienceDetails.currentCompany || ""} 
          (${profile.experienceDetails.totalExperience || ""})
        </li>
      </ul>
    `;
  } else if (profile.experienceStatus === "fresher") {
    experienceHTML = `
      <ul class="pl-4 text-[13px] list-disc">
        <li>Fresher</li>
      </ul>
    `;
  }

  // ✅ PROJECTS
  let projectHTML = "";
  if (profile.projects?.length) {
    projectHTML = `
      <ul class="pl-4 text-[13px] list-disc space-y-1">
        ${profile.projects.map(p => `
          <li>
            <strong>${p.name || ""}</strong><br/>
            ${p.description || ""}
          </li>
        `).join("")}
      </ul>
    `;
  }

  // ✅ CERTIFICATIONS (only <li> because ul already in HTML)
  let certHTML = "";
  if (profile.certifications?.length) {
    certHTML = profile.certifications.map(c => `
      <li>
        <strong>${c.name || ""}</strong><br/>
        ${c.institute || ""}
      </li>
    `).join("");
  }

  // ✅ SKILLS
  let skillsHTML = "";
  if (profile.skills?.length) {
    skillsHTML = profile.skills.map(s => `<li>${s}</li>`).join("");
  }

  // ✅ REFERRAL
  const referralHTML = profile.referral || "";

  // 🔥 REMOVE EMPTY SECTIONS (very important)
  const removeSection = (title) => {
    const regex = new RegExp(
      `<div class="mb-5[\\s\\S]*?>\\s*<div class="font-bold[\\s\\S]*?>\\s*${title}[\\s\\S]*?<\\/div>[\\s\\S]*?<\\/div>`,
      "g"
    );
    template = template.replace(regex, "");
  };

  if (!educationHTML) removeSection("EDUCATION");
  if (!experienceHTML) removeSection("INTERNSHIP / EXPERIENCE");
  if (!projectHTML) removeSection("PROJECTS");
  if (!certHTML) removeSection("CERTIFICATION");
  if (!skillsHTML) removeSection("SKILLS");
  if (!referralHTML) removeSection("REFERRAL");

  // ✅ FINAL REPLACE
  const finalHTML = template
    .replace(/{{fullName}}/g, profile.fullName || "")
    .replace(/{{jobTitle}}/g, profile.preferences?.preferredRole || "")
    .replace(/{{summary}}/g, profile.summary || "")
    .replace(/{{mobile}}/g, profile.mobile || "")
    .replace(/{{email}}/g, profile.email || "")
    .replace(/{{location}}/g, profile.address || "")

    .replace(/{{educationSection}}/g, educationHTML)
    .replace(/{{experienceSection}}/g, experienceHTML)
    .replace(/{{projectsSection}}/g, projectHTML)
    .replace(/{{certificationList}}/g, certHTML)
    .replace(/{{skills}}/g, skillsHTML)
    .replace(/{{referral}}/g, referralHTML);

  return finalHTML;
};