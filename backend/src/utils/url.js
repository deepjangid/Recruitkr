const withDefaultScheme = (value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`);

export const normalizeOptionalHttpUrl = (value) => {
  if (value === undefined || value === null) return value;

  const trimmed = String(value).trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(withDefaultScheme(trimmed));
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    parsed.hash = '';
    return parsed.toString();
  } catch {
    return null;
  }
};

export const normalizeOptionalLinkedinUrl = (value) => {
  const normalized = normalizeOptionalHttpUrl(value);
  if (normalized === null || normalized === '' || normalized === undefined) return normalized;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com') ? normalized : null;
  } catch {
    return null;
  }
};
