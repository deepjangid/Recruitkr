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
  const template = fs.readFileSync(templatePath, 'utf-8');

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

  const contactLines = (() => {
    const lines = [];
    const mobile = clean(profile.mobile);
    const email = clean(profile.email);
    const address = clean(profile.address);
    const pincode = clean(profile.pincode);
    const linkedinUrl = clean(profile.linkedinUrl);
    const portfolioUrl = clean(profile.portfolioUrl);

    if (mobile) lines.push(`<p class="contact-line"><strong>Mobile:</strong> ${escapeHtml(mobile)}</p>`);
    if (email) lines.push(`<p class="contact-line"><strong>Email:</strong> ${escapeHtml(email)}</p>`);
    if (address) lines.push(`<p class="contact-line"><strong>Address:</strong> ${escapeHtml(address)}</p>`);
    if (pincode) lines.push(`<p class="contact-line"><strong>Pincode:</strong> ${escapeHtml(pincode)}</p>`);
    if (linkedinUrl)
      lines.push(`<p class="contact-line"><strong>LinkedIn:</strong> ${escapeHtml(linkedinUrl)}</p>`);
    if (portfolioUrl)
      lines.push(`<p class="contact-line"><strong>Portfolio:</strong> ${escapeHtml(portfolioUrl)}</p>`);

    return lines.join('\n');
  })();

  const educationSection = (() => {
    const highestQualification = clean(profile.highestQualification);
    if (!highestQualification) return '';
    return `<ul><li><strong>${escapeHtml(highestQualification)}</strong></li></ul>`;
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
      return `<ul><li>${lines.join('<br/>')}</li></ul>`;
    }

    if (profile.experienceStatus === 'fresher') {
      return `<ul><li>Fresher</li></ul>`;
    }

    return '';
  })();

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

  const generatedAt = new Date().toISOString().slice(0, 10);

  return template
    .replace(/{{fullName}}/g, escapeHtml(fullName))
    .replace(/{{jobTitle}}/g, escapeHtml(jobTitle))
    .replace(/{{summary}}/g, escapeHtml(summary))
    .replace(/{{contactLines}}/g, contactLines)
    .replace(/{{leftSections}}/g, leftSections)
    .replace(/{{rightSections}}/g, rightSections)
    .replace(/{{generatedAt}}/g, escapeHtml(generatedAt));
};
