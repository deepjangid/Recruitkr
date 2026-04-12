declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

let analyticsLoaded = false;

const injectAnalyticsScript = () => {
  if (!GA_MEASUREMENT_ID || analyticsLoaded || typeof document === "undefined") return;

  const existingScript = document.querySelector(`script[data-ga-id="${GA_MEASUREMENT_ID}"]`);
  if (existingScript) {
    analyticsLoaded = true;
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.setAttribute("data-ga-id", GA_MEASUREMENT_ID);
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  analyticsLoaded = true;
};

export const initializeAnalytics = () => {
  injectAnalyticsScript();
};

export const trackPageView = (path: string) => {
  if (!GA_MEASUREMENT_ID) return;

  injectAnalyticsScript();

  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const analyticsEnabled = Boolean(GA_MEASUREMENT_ID);
