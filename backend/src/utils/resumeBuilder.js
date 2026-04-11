import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const injectFontSizeOverrides = (html) => {
  const overrides = `
  <style>
    body { font-size: 13px; }
  </style>
`;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${overrides}</head>`);
  }

  return `${html}${overrides}`;
};

const formatDateDMY = (value) => {
  if (value == null) return '';

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    const yyyy = value.getUTCFullYear();
    const mm = String(value.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(value.getUTCDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  if (typeof value === 'string') {
    const v = clean(value);
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return `${v.slice(8, 10)}-${v.slice(5, 7)}-${v.slice(0, 4)}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(v)) return v;

    const parsed = new Date(v);
    if (Number.isFinite(parsed.getTime())) {
      const yyyy = parsed.getUTCFullYear();
      const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getUTCDate()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy}`;
    }

    return v;
  }

  return clean(value);
};

const buildSection = (title, innerHtml) => {
  if (!clean(innerHtml)) return '';
  return `
    <div class="mb-3 break-inside-avoid">
      <h2 class="mb-1.5 border-b-2 border-slate-900 pb-0.5 text-[12.5px] font-extrabold tracking-[0.16em] text-slate-900">${escapeHtml(title)}</h2>
      ${innerHtml}
    </div>
  `;
};

const buildKvSection = (pairs) => {
  const filtered = pairs
    .map(([k, v]) => [clean(k), clean(v)])
    .filter(([, v]) => v);

  if (!filtered.length) return '';

  return `
    <div class="kv">
      ${filtered
        .map(
          ([k, v]) =>
            `<div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div>`,
        )
        .join('')}
    </div>
  `;
};

export const generateResumeHTML = (profile = {}) => {
  const templatePath = path.join(__dirname, '../../templates/resume.html');
  let template = injectFontSizeOverrides(fs.readFileSync(templatePath, 'utf-8'));

  const fullName = clean(profile.fullName) || clean(profile.email) || 'Candidate';
  const jobTitle = clean(profile.preferences?.preferredRole) || '';

  const summary = clean(profile.summary)
    ? clean(profile.summary)
    : [
        jobTitle ? `Seeking ${jobTitle} opportunities.` : '',
        profile.experienceStatus === 'experienced'
          ? 'Experienced candidate.'
          : profile.experienceStatus === 'fresher'
            ? 'Fresher candidate.'
            : '',
      ]
        .filter(Boolean)
        .join(' ');

  const phoneIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 10.8c1.4 2.7 3.9 5.1 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1 .3 2 .5 3 .5.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C11 21.2 2.8 13 2.8 2.4c0-.7.5-1.2 1.2-1.2H7.8c.7 0 1.2.5 1.2 1.2 0 1 .2 2 .5 3 .1.4 0 .9-.2 1.2l-2.7 2.2z" fill="currentColor"/></svg>`;
  const mailIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11z" stroke="currentColor" stroke-width="1.7"/><path d="m6.5 7.5 5.5 4 5.5-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const pinIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z" stroke="currentColor" stroke-width="1.7"/><path d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/></svg>`;

  const contactLinesCompact = (() => {
    const lines = [];
    const mobile = clean(profile.mobile);
    const email = clean(profile.email);
    const address = clean(profile.address);

    const baseLineClass =
      'm-0 flex items-start gap-2 text-[12.5px] leading-[1.35] text-slate-900 break-words';
    const iconClass = 'mt-0.5 h-[14px] w-[14px] shrink-0 text-slate-900';

    const withIconClass = (svg) => svg.replace('<svg ', `<svg class="${iconClass}" `);

    if (mobile) lines.push(`<p class="${baseLineClass}">${withIconClass(phoneIcon)}<span>${escapeHtml(mobile)}</span></p>`);
    if (email) lines.push(`<p class="${baseLineClass}">${withIconClass(mailIcon)}<span>${escapeHtml(email)}</span></p>`);
    if (address) lines.push(`<p class="${baseLineClass}">${withIconClass(pinIcon)}<span>${escapeHtml(address)}</span></p>`);

    return lines.join('\n');
  })();

  const contactLinesLabeled = (() => {
    const lines = [];
    const mobile = clean(profile.mobile);
    const email = clean(profile.email);
    const address = clean(profile.address);
    const pincode = clean(profile.pincode);
    const linkedinUrl = clean(profile.linkedinUrl);
    const portfolioUrl = clean(profile.portfolioUrl);
    const dateOfBirth = formatDateDMY(profile.dateOfBirth);
    const gender = clean(profile.gender);

    if (mobile) lines.push(`<p class="contact-line"><strong>Mobile:</strong> ${escapeHtml(mobile)}</p>`);
    if (email) lines.push(`<p class="contact-line"><strong>Email:</strong> ${escapeHtml(email)}</p>`);
    if (address) lines.push(`<p class="contact-line"><strong>Address:</strong> ${escapeHtml(address)}</p>`);
    if (pincode) lines.push(`<p class="contact-line"><strong>Pincode:</strong> ${escapeHtml(pincode)}</p>`);
    if (dateOfBirth) lines.push(`<p class="contact-line"><strong>DOB:</strong> ${escapeHtml(dateOfBirth)}</p>`);
    if (gender) lines.push(`<p class="contact-line"><strong>Gender:</strong> ${escapeHtml(gender)}</p>`);
    if (linkedinUrl)
      lines.push(`<p class="contact-line"><strong>LinkedIn:</strong> ${escapeHtml(linkedinUrl)}</p>`);
    if (portfolioUrl)
      lines.push(`<p class="contact-line"><strong>Portfolio:</strong> ${escapeHtml(portfolioUrl)}</p>`);

    return lines.join('\n');
  })();

  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const replaceAll = (token, value) => {
    const rx = new RegExp(`\\{\\{${escapeRegex(token)}\\}\\}`, 'g');
    template = template.replace(rx, value ?? '');
  };

  const removeSectionByPlaceholder = (commentTitle, token) => {
    // Matches the specific section block used in the current template:
    // <!-- TITLE -->
    // <div> ... {{token}} ... </div>
    const rx = new RegExp(
      `<!--\\s*${escapeRegex(commentTitle)}\\s*-->\\s*\\r?\\n\\s*<div>[\\s\\S]*?\\{\\{${escapeRegex(
        token,
      )}\\}\\}[\\s\\S]*?<\\/div>\\s*`,
      'g',
    );
    template = template.replace(rx, '');
  };

  const educationSection = (() => {
    const highestQualification = clean(profile.highestQualification);
    if (!highestQualification) return '';
    return `
      <ul class="m-0 list-disc space-y-1 pl-4 text-[12px] leading-[1.35] text-slate-800">
        <li><strong>${escapeHtml(highestQualification)}</strong></li>
      </ul>
    `;
  })();

  const experienceSection = (() => {
    if (profile.experienceStatus === 'experienced' && profile.experienceDetails) {
      const designation = clean(profile.experienceDetails.designation);
      const currentCompany = clean(profile.experienceDetails.currentCompany);
      const industry = clean(profile.experienceDetails.industry);
      const totalExperience = clean(profile.experienceDetails.totalExperience);

      const lines = [
        designation ? `<strong>${escapeHtml(designation)}</strong>` : '',
        currentCompany ? escapeHtml(currentCompany) : '',
        industry ? `<span class="text-slate-500">${escapeHtml(industry)}</span>` : '',
        totalExperience ? `<span class="text-slate-500">Total: ${escapeHtml(totalExperience)}</span>` : '',
      ].filter(Boolean);

      if (!lines.length) return '';
      return `
        <ul class="m-0 list-disc space-y-1 pl-4 text-[12px] leading-[1.35] text-slate-800">
          <li>${lines.join('<br/>')}</li>
        </ul>
      `;
    }

    if (profile.experienceStatus === 'fresher') {
      return `
        <ul class="m-0 list-disc space-y-1 pl-4 text-[12px] leading-[1.35] text-slate-800">
          <li>Fresher</li>
        </ul>
      `;
    }

    return '';
  })();

  const projectsSection = (() => {
    if (!Array.isArray(profile.projects) || !profile.projects.length) return '';
    const items = profile.projects
      .map((p) => ({
        name: clean(p?.name),
        description: clean(p?.description),
      }))
      .filter((p) => p.name || p.description)
      .map(
        (p) =>
          `<li>${p.name ? `<strong>${escapeHtml(p.name)}</strong>` : ''}${p.description ? `<br/>${escapeHtml(p.description)}` : ''}</li>`,
      );
    if (!items.length) return '';
    return `<ul class="m-0 list-disc space-y-1 pl-4 text-[12px] leading-[1.35] text-slate-800">${items.join('')}</ul>`;
  })();

  const certificationsSection = (() => {
    if (!Array.isArray(profile.certifications) || !profile.certifications.length) return '';
    const items = profile.certifications
      .map((c) => ({
        name: clean(c?.name),
        institute: clean(c?.institute),
      }))
      .filter((c) => c.name || c.institute)
      .map(
        (c) =>
          `<li>${c.name ? `<strong>${escapeHtml(c.name)}</strong>` : ''}${c.institute ? `<br/>${escapeHtml(c.institute)}` : ''}</li>`,
      );
    if (!items.length) return '';
    return `<ul class="m-0 list-disc space-y-1 pl-4 text-[12px] leading-[1.35] text-slate-800">${items.join('')}</ul>`;
  })();

  const preferencesSection = (() => {
    const preferredRole = clean(profile.preferences?.preferredRole);
    const preferredLocation = clean(profile.preferences?.preferredLocation);
    const preferredIndustry = clean(profile.preferences?.preferredIndustry);
    const workModes = Array.isArray(profile.preferences?.workModes)
      ? profile.preferences.workModes.map((mode) => clean(mode)).filter(Boolean)
      : Array.isArray(profile.workModes)
        ? profile.workModes.map((mode) => clean(mode)).filter(Boolean)
        : [];

    const items = [
      ['Preferred Role', preferredRole],
      ['Preferred Location', preferredLocation],
      ['Preferred Industry', preferredIndustry],
      ['Work Mode', workModes.join(', ')],
    ].filter(([, value]) => clean(value));

    if (!items.length) return '';

    return `
      <div class="grid grid-cols-1 gap-1.5">
        ${items
          .map(
            ([label, value]) => `
              <div class="flex flex-col gap-0.5">
                <div class="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">${escapeHtml(label)}</div>
                <div class="break-words text-xs text-slate-900">${escapeHtml(value)}</div>
              </div>
            `,
          )
          .join('')}
      </div>
    `;
  })();

  const skillsSection = (() => {
    if (!Array.isArray(profile.skills) || !profile.skills.length) return '';
    const items = profile.skills
      .map((s) => clean(s))
      .filter(Boolean)
      .map((s) => `<li>${escapeHtml(s)}</li>`);
    if (!items.length) return '';
    return `<ul class="m-0 list-disc space-y-1 pl-4 text-[12px] leading-[1.35] text-slate-800">${items.join('')}</ul>`;
  })();

  const referralSection = (() => {
    const referral = clean(profile.referral);
    if (!referral) return '';
    return `<p class="text-[12px] leading-[1.35] text-slate-700">${escapeHtml(referral)}</p>`;
  })();

  const generatedAt = new Date().toISOString().slice(0, 10);

  // Support both template variants:
  // - New (token-per-section): {{education}}, {{experience}}, ...
  // - Older (section blocks): {{leftSections}}, {{rightSections}}, ...
  const usesTokenSections =
    template.includes('{{education}}') ||
    template.includes('{{experience}}') ||
    template.includes('{{projects}}') ||
    template.includes('{{certifications}}') ||
    template.includes('{{preferences}}') ||
    template.includes('{{skills}}') ||
    template.includes('{{referral}}');

  if (usesTokenSections) {
    const profilePhotoDataUrl = clean(profile.profilePhotoDataUrl);
    const heroBlock = profilePhotoDataUrl
      ? `<div class="h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[10px] border border-slate-200 bg-slate-100"><img src="${escapeHtml(profilePhotoDataUrl)}" alt="Profile photo" class="block h-full w-full object-cover" /></div>`
      : '';

    if (!educationSection) removeSectionByPlaceholder('EDUCATION', 'education');
    if (!experienceSection) removeSectionByPlaceholder('EXPERIENCE', 'experience');
    if (!projectsSection) removeSectionByPlaceholder('PROJECTS', 'projects');
    if (!certificationsSection) removeSectionByPlaceholder('CERTIFICATION', 'certifications');
    if (!preferencesSection) removeSectionByPlaceholder('PREFERENCES', 'preferences');
    if (!skillsSection) removeSectionByPlaceholder('SKILLS', 'skills');
    if (!referralSection) removeSectionByPlaceholder('REFERRAL', 'referral');

    replaceAll('fullName', escapeHtml(fullName));
    replaceAll('jobTitle', escapeHtml(jobTitle));
    replaceAll('summary', escapeHtml(summary));
    replaceAll('heroBlock', heroBlock);
    replaceAll('contactLines', contactLinesCompact);

    replaceAll('education', educationSection);
    replaceAll('experience', experienceSection);
    replaceAll('projects', projectsSection);
    replaceAll('certifications', certificationsSection);
    replaceAll('preferences', preferencesSection);
    replaceAll('skills', skillsSection);
    replaceAll('referral', referralSection);

    return template;
  }

  // Older template path (kept for compatibility)
  const preferencesSectionLegacy = (() => {
    const preferredRole = clean(profile.preferences?.preferredRole);
    const preferredLocation = clean(profile.preferences?.preferredLocation);
    const preferredIndustry = clean(profile.preferences?.preferredIndustry);
    const workModes = Array.isArray(profile.preferences?.workModes)
      ? profile.preferences.workModes.map((m) => clean(m)).filter(Boolean)
      : Array.isArray(profile.workModes)
        ? profile.workModes.map((m) => clean(m)).filter(Boolean)
        : [];

    return buildKvSection([
      ['Preferred Role', preferredRole],
      ['Preferred Location', preferredLocation],
      ['Preferred Industry', preferredIndustry],
      ['Work Mode', workModes.length ? workModes.join(', ') : ''],
    ]);
  })();

  const personalSection = buildKvSection([
    ['Date of Birth', formatDateDMY(profile.dateOfBirth)],
    ['Gender', clean(profile.gender)],
  ]);

  const leftSections = [
    buildSection('INTERNSHIP / EXPERIENCE', experienceSection),
    buildSection('EDUCATION', educationSection),
  ]
    .filter(Boolean)
    .join('\n');

  const rightSections = [
    buildSection('PREFERENCES', preferencesSectionLegacy),
    buildSection('PERSONAL DETAILS', personalSection),
  ]
    .filter(Boolean)
    .join('\n');

  return template
    .replace(/{{fullName}}/g, escapeHtml(fullName))
    .replace(/{{jobTitle}}/g, escapeHtml(jobTitle))
    .replace(/{{summary}}/g, escapeHtml(summary))
    .replace(/{{contactLines}}/g, contactLinesLabeled)
    .replace(/{{leftSections}}/g, leftSections)
    .replace(/{{rightSections}}/g, rightSections)
    .replace(/{{generatedAt}}/g, escapeHtml(generatedAt));
};
