import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import PDFDocument from 'pdfkit';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/;
const MOBILE_REGEX = /(?:\+91[-\s]?)?([6-9]\d{9})/;
const URL_REGEX = /https?:\/\/[^\s)]+/gi;

const clean = (value) => value?.replace(/\s+/g, ' ').trim() || '';

export const extractResumeText = async ({ mimeType, buffer }) => {
  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    return clean(parsed.text);
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return clean(parsed.value);
  }

  throw new Error('Unsupported resume file type');
};

const extractCandidateName = (text) => {
  const firstLine = clean(text.split('\n')[0]);
  if (firstLine && /^[a-zA-Z][a-zA-Z\s.'-]{2,60}$/.test(firstLine)) {
    return firstLine;
  }
  return '';
};

const extractQualification = (text) => {
  const t = text.toLowerCase();
  if (t.includes('b.tech') || t.includes('be ')) return 'B.Tech / BE';
  if (t.includes('mba') || t.includes('pgdm')) return 'MBA / PGDM';
  if (t.includes('m.tech')) return 'M.Tech';
  if (t.includes('phd')) return 'Doctorate / PhD';
  if (t.includes('bca') || t.includes('bsc') || t.includes('b.com') || t.includes('ba ')) {
    return 'Graduate (BA/BCom/BSc/BBA/BCA etc.)';
  }
  return '';
};

const extractExperienceStatus = (text) => {
  const t = text.toLowerCase();
  const hasYears = /\b\d+(\.\d+)?\s*(years|yrs|year)\b/.test(t);
  return hasYears ? 'experienced' : 'fresher';
};

export const parseResumeToCandidateHints = (text) => {
  const emailMatch = text.match(EMAIL_REGEX);
  const mobileMatch = text.match(MOBILE_REGEX);
  const urls = [...(text.match(URL_REGEX) || [])];
  const linkedin = urls.find((u) => u.toLowerCase().includes('linkedin.com')) || '';
  const portfolio = urls.find((u) => u !== linkedin) || '';

  return {
    fullName: extractCandidateName(text),
    email: emailMatch ? emailMatch[0].toLowerCase() : '',
    mobile: mobileMatch ? mobileMatch[1] : '',
    linkedinUrl: linkedin,
    portfolioUrl: portfolio,
    highestQualification: extractQualification(text),
    experienceStatus: extractExperienceStatus(text),
  };
};

export const generateResumePdfBuffer = async (profile) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(profile.fullName || 'Candidate Resume', { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(`${profile.email || ''} | ${profile.mobile || ''}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).text('Profile');
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(
        `Qualification: ${profile.highestQualification || 'N/A'}\nPreferred Role: ${profile.preferences?.preferredRole || 'N/A'}\nPreferred Location: ${profile.preferences?.preferredLocation || 'N/A'}\nPreferred Industry: ${profile.preferences?.preferredIndustry || 'N/A'}`,
      );

    doc.moveDown(1);
    doc.fontSize(14).text('Professional Links');
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(
        `LinkedIn: ${profile.linkedinUrl || 'N/A'}\nPortfolio: ${profile.portfolioUrl || 'N/A'}`,
      );

    if (profile.experienceStatus === 'experienced' && profile.experienceDetails) {
      doc.moveDown(1);
      doc.fontSize(14).text('Experience');
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .text(
          `Company: ${profile.experienceDetails.currentCompany || 'N/A'}\nDesignation: ${profile.experienceDetails.designation || 'N/A'}\nExperience: ${profile.experienceDetails.totalExperience || 'N/A'}\nCurrent CTC: ${profile.experienceDetails.currentCtcLpa || 'N/A'} LPA\nExpected CTC: ${profile.experienceDetails.expectedCtcLpa || 'N/A'} LPA`,
        );
    }

    doc.moveDown(2);
    doc.fillColor('gray').fontSize(9).text('Created by RecruitKr', { align: 'center' });
    doc.end();
  });
