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
    body { font-size: 13.5px; }
    .name { font-size: 31px; }
    .title { font-size: 16px; }
    .summary { font-size: 13px; }
    .contact { font-size: 14px; }
    .section-title { font-size: 12px; }
    .footer { font-size: 11px; }
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
    <div class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>
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
    const preferredLocation = clean(profile.preferences?.preferredLocation) || clean(profile.address);

    if (mobile) lines.push(`<p class="contact-line">${escapeHtml(mobile)} ${phoneIcon}</p>`);
    if (email) lines.push(`<p class="contact-line">${escapeHtml(email)} ${mailIcon}</p>`);
    if (preferredLocation) lines.push(`<p class="contact-line">${escapeHtml(preferredLocation)} ${pinIcon}</p>`);

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
      <ul class="pl-4 text-sm list-disc space-y-1">
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
        industry ? `<span class="muted">${escapeHtml(industry)}</span>` : '',
        totalExperience ? `<span class="muted">Total: ${escapeHtml(totalExperience)}</span>` : '',
      ].filter(Boolean);

      if (!lines.length) return '';
      return `
        <ul class="pl-4 text-sm list-disc space-y-1">
          <li>${lines.join('<br/>')}</li>
        </ul>
      `;
    }

    if (profile.experienceStatus === 'fresher') {
      return `
        <ul class="pl-4 text-sm list-disc space-y-1">
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
    return `<ul class="pl-4 text-sm list-disc space-y-1">${items.join('')}</ul>`;
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
    return `<ul class="pl-4 text-sm list-disc space-y-1">${items.join('')}</ul>`;
  })();

  const skillsSection = (() => {
    if (!Array.isArray(profile.skills) || !profile.skills.length) return '';
    const items = profile.skills
      .map((s) => clean(s))
      .filter(Boolean)
      .map((s) => `<li>${escapeHtml(s)}</li>`);
    if (!items.length) return '';
    return `<ul class="pl-4 text-sm list-disc space-y-1">${items.join('')}</ul>`;
  })();

  const referralSection = (() => {
    const referral = clean(profile.referral);
    if (!referral) return '';
    return `<p class="text-sm text-gray-700">${escapeHtml(referral)}</p>`;
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
    template.includes('{{skills}}') ||
    template.includes('{{referral}}');

  if (usesTokenSections) {
    const profilePhotoDataUrl = clean(profile.profilePhotoDataUrl);
    const heroBlock = profilePhotoDataUrl
      ? `<div class="avatar-only"><img src="${escapeHtml(profilePhotoDataUrl)}" alt="Profile photo" /></div>`
      : '';

    if (!educationSection) removeSectionByPlaceholder('EDUCATION', 'education');
    if (!experienceSection) removeSectionByPlaceholder('EXPERIENCE', 'experience');
    if (!projectsSection) removeSectionByPlaceholder('PROJECTS', 'projects');
    if (!certificationsSection) removeSectionByPlaceholder('CERTIFICATION', 'certifications');
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
    replaceAll('skills', skillsSection);
    replaceAll('referral', referralSection);

    return template;
  }

  // Older template path (kept for compatibility)
  const preferencesSection = (() => {
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
    buildSection('PREFERENCES', preferencesSection),
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
