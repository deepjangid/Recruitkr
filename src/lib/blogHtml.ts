const base64ImagePattern = /<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi;

const decodeHtmlEntities = (html: string) =>
  html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");

export const stripBase64Images = (html: string) => html.replace(base64ImagePattern, "");

export const cleanBlogHtml = (html: string) =>
  stripBase64Images(decodeHtmlEntities(html))
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sid="[^"]*"/gi, "")
    .replace(/<span>(.*?)<\/span>/gi, "$1")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export const paragraphsToHtml = (paragraphs: string[] = []) =>
  paragraphs
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

export const normalizeBlogImageUrls = (html: string, assetBaseUrl = "") =>
  html.replace(/<img([^>]*?)src=(["'])([^"']+)\2([^>]*)>/gi, (_match, beforeSrc, quote, rawSrc, afterSrc) => {
    const trimmedSrc = rawSrc.trim();

    if (!trimmedSrc || trimmedSrc.startsWith("data:image/") || trimmedSrc.startsWith("blob:")) {
      return "";
    }

    let normalizedSrc = trimmedSrc;

    if (trimmedSrc.startsWith("/api/blogposts/images/") && assetBaseUrl) {
      normalizedSrc = `${assetBaseUrl.replace(/\/$/, "")}${trimmedSrc}`;
    } else {
      try {
        const parsed = new URL(trimmedSrc);
        if (parsed.pathname.startsWith("/api/blogposts/images/") && assetBaseUrl) {
          normalizedSrc = `${assetBaseUrl.replace(/\/$/, "")}${parsed.pathname}`;
        }
      } catch {
        normalizedSrc = trimmedSrc;
      }
    }

    const normalizedAttributes = `${beforeSrc}${afterSrc}`
      .replace(/\sloading=(["']).*?\1/gi, "")
      .replace(/\sdecoding=(["']).*?\1/gi, "")
      .replace(/\sfetchpriority=(["']).*?\1/gi, "")
      .replace(/\swidth=(["']).*?\1/gi, "")
      .replace(/\sheight=(["']).*?\1/gi, "");

    return `<img${normalizedAttributes} src=${quote}${normalizedSrc}${quote} loading="lazy" decoding="async" width="1200" height="675">`;
  });

export const getRenderableBlogHtml = (contentHtml?: string, content: string[] = [], assetBaseUrl = "") =>
  normalizeBlogImageUrls(cleanBlogHtml(contentHtml?.trim() || "") || paragraphsToHtml(content), assetBaseUrl);

export const getPlainTextFromHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
