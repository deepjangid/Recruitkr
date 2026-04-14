const hasHttpScheme = (value: string) => /^https?:\/\//i.test(value);

const toNormalizedHttpUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const candidate = hasHttpScheme(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

export const normalizeOptionalHttpUrl = (value: string): string | null => toNormalizedHttpUrl(value);

export const normalizeOptionalLinkedinUrl = (value: string): string | null => {
  const normalized = toNormalizedHttpUrl(value);
  if (normalized === null || normalized === "") return normalized;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com") ? normalized : null;
  } catch {
    return null;
  }
};
