import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { env } from '../config/env.js';
import puppeteer from 'puppeteer';
import { generateResumeHTML } from '../utils/resumeBuilder.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/;
const MOBILE_REGEX = /(?:\+?91[-\s]?)?([6-9](?:[\s-]?\d){9})/;
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}[^\s)]*/gi;
const PINCODE_REGEX = /\b\d{6}\b/;
const EXPERIENCE_REGEX = /\b(\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?|year|yr)\b/i;
const MONTHS = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

const normalizeCommonUnicode = (value = '') =>
  String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    // common mojibake seen in some PDF extractors
    .replace(/â€™/g, "'")
    .replace(/â€“|â€”/g, '-');

const clean = (value) => normalizeCommonUnicode(value)?.replace(/[ \t]+/g, ' ').trim() || '';
const normalizeInline = (value) => normalizeCommonUnicode(value)?.replace(/\s+/g, ' ').trim() || '';
const normalizeLines = (value) =>
  normalizeCommonUnicode(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .join('\n');

const hasSalaryMarker = (value = '') =>
  /\b(?:ctc|salary|compensation|lpa|l\.p\.a|lakh|lakhs|lac|annual package|per annum|p\.a\.)\b/i.test(
    value,
  );

const normalizeLpaValue = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const normalized = raw.replace(/,/g, '');
  const m = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!m) return '';

  const num = Number(m[1]);
  if (!Number.isFinite(num) || num <= 0 || num > 200) return '';
  return `${num}`.replace(/\.0$/, '');
};

const parseMonthYear = (monthStr = '', yearStr = '') => {
  const month = MONTHS[String(monthStr || '').toLowerCase().replace(/\./g, '')];
  if (!month) return null;
  const yy = String(yearStr || '').replace(/[^\d]/g, '');
  if (!yy) return null;
  const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
  if (!Number.isFinite(year) || year < 1950 || year > 2100) return null;
  return { year, month: Number(month) };
};

const estimateExperienceFromDateRanges = (text) => {
  const rx =
    /\b(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\.?\s*['’]?\s*(\d{2,4})\s*(?:-|–|—|to)\s*(Present|Current|Till Date|Now|[A-Za-z]{3,9}\.?\s*['’]?\s*\d{2,4})\b/gi;
  const now = new Date();
  let bestMonths = 0;
  let m;
  while ((m = rx.exec(text)) !== null) {
    const start = parseMonthYear(m[1], m[2]);
    if (!start) continue;

    let endYear = now.getFullYear();
    let endMonth = now.getMonth() + 1;
    if (!/present|current|till date|now/i.test(m[3])) {
      const compact = m[3].replace(/\./g, '').trim();
      const merged = compact.match(/^([A-Za-z]{3,9})['’]?\s*(\d{2,4})$/);
      if (merged) {
        const parsed = parseMonthYear(merged[1], merged[2]);
        if (!parsed) continue;
        endYear = parsed.year;
        endMonth = parsed.month;
      } else {
        const parts = compact.split(/\s+/);
        if (parts.length < 2) continue;
        const parsed = parseMonthYear(parts[0], parts[1]);
        if (!parsed) continue;
        endYear = parsed.year;
        endMonth = parsed.month;
      }
    }

    const months = (endYear - start.year) * 12 + (endMonth - start.month);
    if (months > bestMonths) bestMonths = months;
  }

  if (bestMonths < 6) return '';
  const years = (bestMonths / 12).toFixed(1).replace(/\.0$/, '');
  return `${years} years`;
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractByLabel = (text, labels = []) => {
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const label of labels) {
      const key = label.toLowerCase();
      if (!lower.includes(key)) continue;

      const rx = new RegExp(`\\b${escapeRegex(key)}\\b\\s*[:\\-]*\\s*(.+)$`, 'i');
      const m = line.match(rx);
      const out = clean(m?.[1] || '');
      if (out) return out;
    }
  }
  return '';
};

const normalizeDateToInput = (value = '') => {
  const v = value.trim().replace(/\./g, ' ');
  if (!v) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const toFourDigitYear = (yy) => {
    const raw = String(yy || '').replace(/[^\d]/g, '');
    if (!raw) return '';
    if (raw.length === 4) return raw;
    if (raw.length !== 2) return '';
    const now = new Date();
    const pivot = now.getFullYear() % 100;
    const num = Number(raw);
    if (!Number.isFinite(num)) return '';
    return `${num <= pivot ? 2000 + num : 1900 + num}`;
  };

  let m = v.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yy = toFourDigitYear(m[3]);
    if (!yy) return '';
    return `${yy}-${mm}-${dd}`;
  }

  m = v.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
  if (m) {
    const yy = m[1];
    const mm = m[2].padStart(2, '0');
    const dd = m[3].padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  m = v.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})[,\s]+(\d{2,4})\b/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const monthKey = m[2].toLowerCase();
    const mm = MONTHS[monthKey];
    const yy = toFourDigitYear(m[3]);
    if (mm && yy) return `${yy}-${mm}-${dd}`;
  }

  m = v.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})[,\s]+(\d{2,4})\b/);
  if (m) {
    const monthKey = m[1].toLowerCase();
    const mm = MONTHS[monthKey];
    const dd = m[2].padStart(2, '0');
    const yy = toFourDigitYear(m[3]);
    if (mm && yy) return `${yy}-${mm}-${dd}`;
  }

  return '';
};

const extractDateOfBirth = (text) => {
  const fromLabel = extractByLabel(text, ['date of birth', 'dob', 'd.o.b', 'birth date']);
  const normalized = normalizeDateToInput(fromLabel);
  if (normalized) return normalized;

  const line = normalizeInline(text);
  const m = line.match(
    /\b(?:date of birth|dob|d\.o\.b|birth date)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2}[,\s]+\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}[,\s]+\d{2,4}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/i,
  );
  return normalizeDateToInput(m?.[1] || '');
};

const extractCandidateName = (text, email = '') => {
  const lines = text.split('\n').slice(0, 15);
  const stopWords = ['resume', 'curriculum vitae', 'cv', 'profile', 'summary'];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!line) continue;

    const candidate = clean(
      line
        .replace(EMAIL_REGEX, ' ')
        .replace(MOBILE_REGEX, ' ')
        .replace(/\b(?:mobile|mob|phone|contact)\b\s*[:\-]?\s*/gi, ' ')
        .replace(/\s*\(.*?\)\s*/g, ' ')
        .trim(),
    );

    if (!candidate) continue;
    if (candidate.length > 60) continue;

    let left = candidate;
    if (left.includes('|')) left = clean(left.split('|')[0]);
    if (left.includes(' - ')) left = clean(left.split(' - ')[0]);

    if (/\d|@|https?:\/\//i.test(left)) continue;
    if (stopWords.some((w) => lower.includes(w))) continue;
    if (/^[A-Za-z][A-Za-z\s.'-]{2,60}$/.test(left)) return left;
  }

  if (email) {
    const local = email.split('@')[0] || '';
    const tokens = local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((t) => t[0]?.toUpperCase() + t.slice(1).toLowerCase());
    if (tokens.length >= 2) return tokens.join(' ');
  }

  return '';
};

const extractGender = (text) => {
  const label = extractByLabel(text, ['gender', 'sex']);
  const value = label || normalizeInline(text);
  if (/\bmale\b/i.test(value)) return 'Male';
  if (/\bfemale\b/i.test(value)) return 'Female';
  if (/\bother\b/i.test(value)) return 'Other';
  return '';
};

const extractQualification = (text) => {
  const t = text.toLowerCase();
  if (/\bphd\b|\bdoctorate\b/.test(t)) return 'Doctorate / PhD';
  if (/\bm\.?\s?e\b|\bmaster of engineering\b/.test(t)) return 'M.E';
  if (/\bms\b|\bm\.?\s?s\.?\b|\bmaster of science\b/.test(t)) return 'MS';
  if (/\bm\.?\s?tech\b|\bmaster of technology\b/.test(t)) return 'M.Tech';
  if (/\bmba\b|\bpgdm\b/.test(t)) return 'MBA / PGDM';
  if (
    /\bmca\b|\bm\.?\s?ca\.?\b|\bm\.?\s?a\.?\b|\bm\.?\s?com\.?\b|\bm\.?\s?sc\.?\b|\bpost ?graduate\b/.test(
      t,
    )
  ) {
    return 'Postgraduate (MA/MCom/MSc etc.)';
  }
  if (
    /\bb\.?\s?tech\b|\bbachelor of technology\b|\bb\.?\s?e\b|\bbachelor of engineering\b/.test(
      t,
    )
  ) {
    return 'B.Tech / BE';
  }
  if (
    /\bb\.?\s?ca\.?\b|\bb\.?\s?sc\.?\b|\bb\.?\s?com\.?\b|\bb\.?\s?a\.?\b|\bb\.?\s?ba\.?\b/.test(
      t,
    )
  ) {
    return 'Graduate (BA/BCom/BSc/BBA/BCA etc.)';
  }
  if (/\bdiploma\b/.test(t)) return 'Diploma';
  if (/\biti\b/.test(t)) return 'ITI';
  if (/\b12th\b|\bhsc\b/.test(t)) return '12th Pass';
  if (/\b10th\b|\bssc\b/.test(t)) return '10th Pass';
  return '';
};

const extractExperienceStatus = (text) => {
  const t = text.toLowerCase();
  if (/\bfresh(?:er)?\b/.test(t)) return 'fresher';
  if (/\bexperienced\b/.test(t)) return 'experienced';
  if (EXPERIENCE_REGEX.test(t)) return 'experienced';
  if (/\bwork experience\b|\bprofessional experience\b/.test(t)) return 'experienced';
  return 'fresher';
};

const extractExperienceDetails = (text) => {
  const line = normalizeInline(text);
  const yearsMatch = line.match(EXPERIENCE_REGEX);
  let totalExperience = yearsMatch ? `${yearsMatch[1]} years` : '';

  if (!totalExperience) {
    const fromLabel = extractByLabel(text, ['total experience', 'experience']);
    const m = fromLabel.match(EXPERIENCE_REGEX);
    if (m) totalExperience = `${m[1]} years`;
  }
  if (!totalExperience) {
    totalExperience = estimateExperienceFromDateRanges(text);
  }

  let currentCompany = extractByLabel(text, ['current company', 'company']);
  let designation = extractByLabel(text, ['designation', 'current designation', 'role']);
  const industry = extractByLabel(text, ['industry', 'domain']);

  if (!currentCompany || !designation) {
    const lines = text
      .split('\n')
      .map((l) => clean(l))
      .filter(Boolean);
    const expIdx = lines.findIndex((l) =>
      /\b(professional experience|work experience|experience)\b/i.test(l),
    );
    if (expIdx >= 0) {
      const next = lines.slice(expIdx + 1, expIdx + 6);
      if (!currentCompany) {
        currentCompany =
          next.find(
            (l) =>
              /\b(pvt\.?\s*ltd|private limited|limited|ltd|inc|llp|technologies|solutions|services)\b/i.test(
                l,
              ) && l.length <= 90,
          ) || '';
      }
      if (!designation) {
        designation =
          next.find((l) => /\b(manager|executive|specialist|analyst|lead|engineer|officer)\b/i.test(l)) ||
          next.find((l) => l.includes('|')) ||
          '';
      }
    }
  }

  return {
    totalExperience,
    currentCompany,
    designation,
    industry,
  };
};

const extractAddress = (text) => extractByLabel(text, ['address', 'current address']);

const extractNoticePeriod = (text) => {
  const raw = extractByLabel(text, ['notice period']);
  const v = raw || '';
  if (/immediate/i.test(v)) return 'Immediate Joiner';
  if (/serving/i.test(v)) return 'Serving Notice Period';
  if (/\b15\b/.test(v)) return '15 Days';
  if (/\b30\b/.test(v)) return '30 Days';
  if (/\b60\b/.test(v)) return '60 Days';
  if (/\b90\b/.test(v)) return '90 Days';

  const plain = normalizeInline(text);
  if (/\bimmediate(?:ly)? join(?:er)?\b/i.test(plain)) return 'Immediate Joiner';
  if (/\bserving notice\b/i.test(plain)) return 'Serving Notice Period';
  return '';
};

const extractAddressHeuristic = (text) => {
  const labeled = extractByLabel(text, ['address', 'current address']);
  if (labeled) return labeled;

  const lines = text
    .split('\n')
    .map((l) => clean(l))
    .filter(Boolean);

  const emailIdx = lines.findIndex((l) => /\bemail\b|@/i.test(l));
  if (emailIdx <= 0) return '';

  const addressLines = [];
  for (let i = Math.max(0, emailIdx - 4); i < emailIdx; i += 1) {
    let line = lines[i];
    if (!line) continue;
    if (/\|/.test(line)) continue;
    if (/\b(resume|curriculum vitae|career objective|professional summary)\b/i.test(line)) continue;
    if (/@|\bmob\b|\bphone\b|\bemail\b/i.test(line)) continue;
    if (/^[A-Z\s.]{2,40}$/.test(line) && i < 2) continue;
    if (/^\w+\/\w+/.test(line)) continue;
    line = clean(line.replace(/(?<!\d)[6-9]\d{9}(?!\d)/g, ''));
    if (!line) continue;
    addressLines.push(line);
  }

  if (!addressLines.length) return '';
  const candidate = addressLines.join(', ').slice(0, 240);
  if (
    !/\b(road|rd|street|st|lane|ln|nagar|village|vill|mohalla|district|rajasthan|gujarat|delhi|jaipur|pincode|\d{6})\b/i.test(
      candidate,
    )
  ) {
    return '';
  }

  return candidate;
};

const extractCtc = (text, labels) => {
  const lines = text
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean);
  const keywords = labels.map((l) => l.toLowerCase());

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!keywords.some((key) => lower.includes(key))) continue;

    if (!hasSalaryMarker(line)) continue;
    const normalized = normalizeLpaValue(line);
    if (normalized) return normalized;
  }

  return '';
};

const extractWorkModes = (text) => {
  const t = text.toLowerCase();
  const modes = [];
  if (/\bon[-\s]?site\b/.test(t)) modes.push('On-site');
  if (/\bhybrid\b/.test(t)) modes.push('Hybrid');
  if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(t)) modes.push('Remote');
  return modes;
};

const coerceHints = (parsed = {}) => {
  const safe = (v) => (typeof v === 'string' ? v.trim() : '');
  const toMode = (v) => {
    if (v === 'On-site' || v === 'Hybrid' || v === 'Remote') return v;
    return '';
  };

  const normalizeSalaryHint = (value) => {
    const normalized = normalizeLpaValue(safe(value));
    return normalized;
  };

  const modeInput = Array.isArray(parsed.workModes)
    ? parsed.workModes
    : typeof parsed.workModes === 'string'
      ? parsed.workModes.split(',').map((v) => v.trim())
      : [];

  const workModes = [...new Set(modeInput.map(toMode).filter(Boolean))];

  const experienceStatus =
    parsed.experienceStatus === 'experienced' || parsed.experienceStatus === 'fresher'
      ? parsed.experienceStatus
      : 'fresher';

  return {
    fullName: safe(parsed.fullName),
    dateOfBirth: normalizeDateToInput(safe(parsed.dateOfBirth)),
    gender: safe(parsed.gender),
    address: safe(parsed.address),
    pincode: safe(parsed.pincode).replace(/\D/g, '').slice(0, 6),
    mobile: safe(parsed.mobile).replace(/\D/g, '').slice(-10),
    email: safe(parsed.email).toLowerCase(),
    linkedinUrl: safe(parsed.linkedinUrl),
    portfolioUrl: safe(parsed.portfolioUrl),
    highestQualification: safe(parsed.highestQualification),
    experienceStatus,
    currentCompany: safe(parsed.currentCompany),
    designation: safe(parsed.designation),
    totalExperience: safe(parsed.totalExperience),
    industry: safe(parsed.industry),
    currentCtcLpa: normalizeSalaryHint(parsed.currentCtcLpa),
    expectedCtcLpa: normalizeSalaryHint(parsed.expectedCtcLpa),
    minimumCtcLpa: normalizeSalaryHint(parsed.minimumCtcLpa),
    noticePeriod: safe(parsed.noticePeriod),
    lastWorkingDay: normalizeDateToInput(safe(parsed.lastWorkingDay)),
    preferredLocation: safe(parsed.preferredLocation),
    preferredIndustry: safe(parsed.preferredIndustry),
    preferredRole: safe(parsed.preferredRole),
    workModes,
  };
};

const clearCompensationIfNoEvidence = (hints, text) => {
  const plain = normalizeInline(text);
  if (hasSalaryMarker(plain)) return hints;

  return {
    ...hints,
    currentCtcLpa: '',
    expectedCtcLpa: '',
    minimumCtcLpa: '',
  };
};

const parseResumeToCandidateHintsHeuristic = (text) => {
  const plain = normalizeInline(text);
  const emailMatch = plain.match(EMAIL_REGEX);
  const mobileMatch = plain.match(MOBILE_REGEX);
  const mobile = mobileMatch ? mobileMatch[1].replace(/\D/g, '').slice(-10) : '';
  const normalizeUrl = (u) => (u.startsWith('http://') || u.startsWith('https://') ? u : `https://${u}`);
  const linkedinMatch = plain.match(/\b(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)]+/i);
  const linkedin = linkedinMatch ? normalizeUrl(linkedinMatch[0]) : '';
  const urlMatches = [...(plain.match(URL_REGEX) || [])]
    .map((u) => u.replace(/[),.;]+$/g, ''))
    .filter((u) => !u.includes('@'))
    .filter((u) => /\//.test(u))
    .filter((u) => !/linkedin\.com/i.test(u));
  const portfolio = urlMatches[0] ? normalizeUrl(urlMatches[0]) : '';
  const experienceDetails = extractExperienceDetails(text);
  const pincode = (plain.match(PINCODE_REGEX) || [])[0] || '';

  return {
    fullName: extractCandidateName(text, emailMatch ? emailMatch[0].toLowerCase() : ''),
    dateOfBirth: extractDateOfBirth(text),
    gender: extractGender(text),
    address: extractAddressHeuristic(text),
    pincode,
    email: emailMatch ? emailMatch[0].toLowerCase() : '',
    mobile,
    linkedinUrl: linkedin,
    portfolioUrl: portfolio ? normalizeUrl(portfolio) : '',
    highestQualification: extractQualification(plain),
    experienceStatus: extractExperienceStatus(text),
    currentCtcLpa: extractCtc(text, ['current ctc', 'current salary', 'ctc']),
    expectedCtcLpa: extractCtc(text, ['expected ctc', 'expected salary']),
    minimumCtcLpa: extractCtc(text, ['minimum ctc', 'minimum salary']),
    noticePeriod: extractNoticePeriod(text),
    lastWorkingDay: normalizeDateToInput(extractByLabel(text, ['last working day', 'lwd'])),
    preferredLocation: extractByLabel(text, ['preferred location', 'location preference']),
    preferredIndustry: extractByLabel(text, ['preferred industry']),
    preferredRole: extractByLabel(text, ['preferred role', 'desired role']),
    workModes: extractWorkModes(text),
    ...experienceDetails,
  };
};

const parseResumeToCandidateHintsWithOpenAi = async (text) => {
  if (!env.OPENAI_API_KEY) return null;

  const prompt = `Extract candidate details from resume text into JSON with exactly these keys:
fullName, dateOfBirth, gender, address, pincode, mobile, email, linkedinUrl, portfolioUrl, highestQualification, experienceStatus, currentCompany, designation, totalExperience, industry, currentCtcLpa, expectedCtcLpa, minimumCtcLpa, noticePeriod, lastWorkingDay, preferredLocation, preferredIndustry, preferredRole, workModes.
Rules:
- return string values for all fields except workModes, which must be an array
- date fields must be yyyy-mm-dd when available
- experienceStatus must be "fresher" or "experienced"
- workModes values can only be "On-site", "Hybrid", "Remote"
- if unknown use empty string or empty array
- do not include extra keys`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a strict JSON extractor.' },
          { role: 'user', content: `${prompt}\n\nResume Text:\n${text.slice(0, 12000)}` },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    return coerceHints(JSON.parse(content));
  } catch {
    return null;
  }
};

export const parseResumeToCandidateHints = async (text) => {
  const heuristic = coerceHints(parseResumeToCandidateHintsHeuristic(text));
  const ai = await parseResumeToCandidateHintsWithOpenAi(text);
  if (!ai) return clearCompensationIfNoEvidence(heuristic, text);

  const merged = {
    ...heuristic,
    ...Object.fromEntries(Object.entries(ai).map(([k, v]) => [k, v || heuristic[k]])),
    workModes: ai.workModes?.length ? ai.workModes : heuristic.workModes,
    experienceStatus:
      ai.experienceStatus === 'experienced' || ai.experienceStatus === 'fresher'
        ? ai.experienceStatus
        : heuristic.experienceStatus,
  };

  return clearCompensationIfNoEvidence(merged, text);
};

export const extractResumeText = async ({ mimeType, buffer }) => {
  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    const out = normalizeLines(parsed.text);
    if (out.length < 40) {
      throw new Error(
        'Could not extract text from this PDF. If this is a scanned/image-based resume, please upload a text-based PDF or a DOCX.',
      );
    }
    return out;
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    const out = normalizeLines(parsed.value);
    if (out.length < 40) {
      throw new Error('Could not extract text from this DOCX. Please try another file.');
    }
    return out;
  }

  throw new Error('Unsupported resume file type');
};

const generateBasicResumePdfBuffer = (profile = {}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42 });
    const chunks = [];

    const pushSection = (title, lines = []) => {
      const safeLines = lines.map((line) => clean(line)).filter(Boolean);
      if (!safeLines.length) return;

      doc.moveDown(0.7);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text(title);
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(10.5).fillColor('#334155');
      safeLines.forEach((line) => {
        doc.text(line, { lineGap: 2 });
      });
    };

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fullName = clean(profile.fullName) || 'Candidate Resume';
    const summary = clean(profile.summary);
    const skills = Array.isArray(profile.skills) ? profile.skills.map((item) => clean(item)).filter(Boolean) : [];
    const projects = Array.isArray(profile.projects)
      ? profile.projects
          .map((item) => [clean(item?.name), clean(item?.description)].filter(Boolean).join(' - '))
          .filter(Boolean)
      : [];
    const certifications = Array.isArray(profile.certifications)
      ? profile.certifications
          .map((item) => [clean(item?.name), clean(item?.institute)].filter(Boolean).join(' - '))
          .filter(Boolean)
      : [];
    const workModes = Array.isArray(profile.preferences?.workModes)
      ? profile.preferences.workModes.map((mode) => clean(mode)).filter(Boolean)
      : Array.isArray(profile.workModes)
        ? profile.workModes.map((mode) => clean(mode)).filter(Boolean)
        : [];

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text(fullName, { align: 'center' });

    const contactLine = [clean(profile.email), clean(profile.mobile), clean(profile.address)]
      .filter(Boolean)
      .join(' | ');
    if (contactLine) {
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10.5).fillColor('#475569').text(contactLine, { align: 'center' });
    }

    pushSection('Profile', [
      clean(profile.highestQualification) && `Qualification: ${profile.highestQualification}`,
      clean(profile.preferences?.preferredRole) && `Preferred Role: ${profile.preferences.preferredRole}`,
      clean(profile.preferences?.preferredLocation) &&
        `Preferred Location: ${profile.preferences.preferredLocation}`,
      clean(profile.preferences?.preferredIndustry) &&
        `Preferred Industry: ${profile.preferences.preferredIndustry}`,
      workModes.length && `Work Mode: ${workModes.join(', ')}`,
    ]);

    if (summary) {
      pushSection('Summary', [summary]);
    }

    if (profile.experienceStatus === 'experienced') {
      pushSection('Experience', [
        clean(profile.experienceDetails?.designation) &&
          `Designation: ${profile.experienceDetails.designation}`,
        clean(profile.experienceDetails?.currentCompany) &&
          `Company: ${profile.experienceDetails.currentCompany}`,
        clean(profile.experienceDetails?.totalExperience) &&
          `Total Experience: ${profile.experienceDetails.totalExperience}`,
        clean(profile.experienceDetails?.industry) && `Industry: ${profile.experienceDetails.industry}`,
      ]);
    }

    pushSection('Skills', skills);
    pushSection('Projects', projects);
    pushSection('Certifications', certifications);
    pushSection('Referral', [clean(profile.referral)]);

    doc.moveDown(1.5);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text('Powered by RecruitKr', {
      align: 'center',
    });
    doc.end();
  });



export const generateResumePdfBuffer = async (profile) => {
  const enhancedProfile = profile;
  const html = generateResumeHTML(enhancedProfile);

  const isLinux = process.platform === 'linux';
  const isRootUser = typeof process.getuid === 'function' && process.getuid() === 0;
  const shouldDisableSandbox =
    isLinux ||
    isRootUser ||
    process.env.NODE_ENV === 'production' ||
    process.env.PUPPETEER_NO_SANDBOX === 'true' ||
    process.env.DISABLE_CHROME_SANDBOX === 'true';

  const configuredUserDataDir = String(process.env.PUPPETEER_USER_DATA_DIR || '').trim();
  const resolvedUserDataDir =
    configuredUserDataDir || fs.mkdtempSync(path.join(os.tmpdir(), 'recruitkr-puppeteer-'));
  const launchArgs = [
    '--disable-dev-shm-usage',
    '--font-render-hinting=none',
    '--hide-scrollbars',
  ];

  if (shouldDisableSandbox) {
    launchArgs.push('--no-sandbox', '--disable-setuid-sandbox');
  }

  const launchOptions = {
    headless: true,
    userDataDir: resolvedUserDataDir,
    args: launchArgs,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
  };

  if (launchOptions.userDataDir) {
    fs.mkdirSync(launchOptions.userDataDir, { recursive: true });
  }

  let browser;

  try {
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    await page.emulateMediaType('screen');

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page
      .waitForNetworkIdle({
        idleTime: 800,
        timeout: 5000,
      })
      .catch(() => null);
    await delay(600);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Resume template PDF generation failed:', error?.message || error);
    throw new Error('Unable to generate the resume PDF right now. Please try again.');
  } finally {
    if (browser) {
      await browser.close();
    }
    if (!configuredUserDataDir && resolvedUserDataDir) {
      fs.rmSync(resolvedUserDataDir, { recursive: true, force: true });
    }
  }
};
