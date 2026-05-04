import { getSession, updateSessionTokens } from "@/lib/auth";
import {
  API_MISCONFIGURED_MESSAGE,
  buildApiError,
  DEFAULT_API_ERROR_MESSAGE,
  getFriendlyApiMessage,
  isAbortError,
  SERVER_API_ERROR_MESSAGE,
} from "@/lib/apiError";

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

const API_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1500;
const DEFAULT_RETRIES = 2;

const baseURL = import.meta.env.VITE_API_URL || `${window.location.origin}/api/v1`;
const API_BASE = trimTrailingSlash(baseURL);
const API_ROOT = API_BASE.replace(/\/api\/v\d+$/, "").replace(/\/$/, "");
const IS_SAME_ORIGIN_PROD_API =
  !import.meta.env.DEV &&
  typeof window !== "undefined" &&
  API_BASE === `${window.location.origin}/api/v1`;

type ApiErrorPayload = {
  message?: string;
  error?: {
    message?: string;
  };
  details?: Array<{
    path?: Array<string | number>;
    message?: string;
  }>;
};

type RetryReason = "network" | "timeout" | "server";

type ApiRetryContext = {
  attempt: number;
  maxAttempts: number;
  reason: RetryReason;
};

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  retryOn401?: boolean;
  timeoutMs?: number;
  retries?: number;
  onRetry?: (context: ApiRetryContext) => void;
};

type ApiHelperOptions = boolean | Omit<ApiOptions, "method" | "body">;

type ParsedResponse<T> = {
  contentType: string;
  json: (T & ApiErrorPayload) | null;
  text: string | null;
};

const normalizeHelperOptions = (options?: ApiHelperOptions): Omit<ApiOptions, "method" | "body"> => {
  if (typeof options === "boolean") {
    return { auth: options };
  }

  return options || {};
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const parseResponse = async <T>(res: Response): Promise<ParsedResponse<T>> => {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const json = (await res.json()) as T & ApiErrorPayload;
      return { contentType, json, text: null };
    } catch {
      return { contentType, json: null, text: null };
    }
  }

  try {
    const text = await res.text();
    const trimmed = text.trim();

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const json = JSON.parse(trimmed) as T & ApiErrorPayload;
        return { contentType, json, text };
      } catch {
        return { contentType, json: null, text };
      }
    }

    return { contentType, json: null, text };
  } catch {
    return { contentType, json: null, text: null };
  }
};

const isHtmlResponse = (contentType: string, text: string | null) =>
  contentType.includes("text/html") || Boolean(text && /<!doctype html>/i.test(text));

const logProbableDeploymentHint = (url: string) => {
  if (!IS_SAME_ORIGIN_PROD_API) return;

  console.warn("[api] probable deployment issue", {
    url,
    hint: "Frontend is using the same-origin /api/v1 fallback. If backend is deployed separately, set VITE_API_URL to the backend public /api/v1 URL and allow the frontend origin in CORS_ORIGIN.",
  });
};

const buildRetryableServerMessage = (json: ApiErrorPayload | null) =>
  json?.message || json?.error?.message || null;

const refreshAccessToken = async (): Promise<string | null> => {
  const session = getSession();
  if (!session?.refreshToken) return null;

  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      },
      API_TIMEOUT_MS,
    );

    const parsed = await parseResponse<{ success?: boolean; data?: { accessToken?: string; refreshToken?: string } }>(res);
    if (!res.ok || !parsed.json?.success || !parsed.json.data?.accessToken) {
      return null;
    }

    updateSessionTokens(parsed.json.data.accessToken, parsed.json.data.refreshToken);
    return parsed.json.data.accessToken;
  } catch (error) {
    console.error("API ERROR:", error instanceof Error ? error.message : error, `${API_BASE}/auth/refresh`);
    return null;
  }
};

type RetryableResult<T> =
  | { ok: true; response: Response; attempt: number; maxAttempts: number }
  | { ok: false; error: unknown; reason: RetryReason; url: string; attempt: number; maxAttempts: number };

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  retries = DEFAULT_RETRIES,
  onRetry?: (context: ApiRetryContext) => void,
): Promise<RetryableResult<Response>> {
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);

      if (response.status >= 500) {
        if (attempt <= retries) {
          onRetry?.({ attempt, maxAttempts, reason: "server" });
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        return { ok: true, response, attempt, maxAttempts };
      }

      return { ok: true, response, attempt, maxAttempts };
    } catch (error) {
      const reason: RetryReason = isAbortError(error) ? "timeout" : "network";

      if (attempt <= retries) {
        onRetry?.({ attempt, maxAttempts, reason });
        console.error("API ERROR:", error instanceof Error ? error.message : error, url);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      console.error("API ERROR:", error instanceof Error ? error.message : error, url);
      return { ok: false, error, reason, url, attempt, maxAttempts };
    }
  }

  return {
    ok: false,
    error: new Error("Request retry state exhausted"),
    reason: "network",
    url,
    attempt: retries + 1,
    maxAttempts: retries + 1,
  };
}

export const apiRequest = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const {
    method = "GET",
    body,
    headers = {},
    auth = false,
    retryOn401 = true,
    timeoutMs = API_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    onRetry,
  } = options;

  const session = getSession();
  const authHeader = auth && session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isAbsoluteApiPath = path.startsWith("/api/");
  const url = isAbsoluteApiPath ? `${API_ROOT}${path}` : `${API_BASE}${path}`;

  const retryResult = await fetchWithRetry(
    url,
    {
      method,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...authHeader,
        ...headers,
      },
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    },
    timeoutMs,
    retries,
    onRetry,
  );

  if (!retryResult.ok) {
    logProbableDeploymentHint(url);
    throw buildApiError({
      context: retryResult.reason === "timeout" ? "request timed out after retries" : "request failed after retries",
      method,
      url,
      error: retryResult.error,
      timeout: retryResult.reason === "timeout",
      fallbackMessage: SERVER_API_ERROR_MESSAGE,
    });
  }

  const res = retryResult.response;

  if (res.status === 401 && auth && retryOn401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
        retryOn401: false,
        retries,
      });
    }
  }

  const parsed = await parseResponse<T>(res);

  if (isHtmlResponse(parsed.contentType, parsed.text)) {
    logProbableDeploymentHint(url);
    console.error("API ERROR:", API_MISCONFIGURED_MESSAGE, url);
    throw buildApiError({
      context: "request received HTML instead of API JSON",
      method,
      url,
      status: res.status,
      payload: { contentType: parsed.contentType },
      fallbackMessage: API_MISCONFIGURED_MESSAGE,
    });
  }

  if (!res.ok) {
    const detailsMessage = parsed.json?.details
      ?.map((detail) => {
        const detailPath = detail.path?.length ? `${detail.path.join(".")}: ` : "";
        return `${detailPath}${detail.message || "Invalid value"}`;
      })
      .filter(Boolean)
      .join("; ");
    const serverMessage = detailsMessage || buildRetryableServerMessage(parsed.json) || null;

    console.error("API ERROR:", serverMessage || `HTTP ${res.status}`, url);
    throw buildApiError({
      context: "request returned an error response",
      method,
      url,
      status: res.status,
      serverMessage,
      payload: parsed.json ?? parsed.text ?? null,
      fallbackMessage:
        res.status >= 500
          ? SERVER_API_ERROR_MESSAGE
          : getFriendlyApiMessage(res.status, null, DEFAULT_API_ERROR_MESSAGE),
    });
  }

  return parsed.json as T;
};

export const apiGet = <T>(path: string, options?: ApiHelperOptions) =>
  apiRequest<T>(path, { method: "GET", ...normalizeHelperOptions(options) });

export const apiPost = <T>(path: string, body?: unknown, options?: ApiHelperOptions) =>
  apiRequest<T>(path, { method: "POST", body, ...normalizeHelperOptions(options) });

export const apiPatch = <T>(path: string, body?: unknown, options?: ApiHelperOptions) =>
  apiRequest<T>(path, { method: "PATCH", body, ...normalizeHelperOptions(options) });

export const apiPut = <T>(path: string, body?: unknown, options?: ApiHelperOptions) =>
  apiRequest<T>(path, { method: "PUT", body, ...normalizeHelperOptions(options) });

export const apiDelete = <T>(path: string, options?: ApiHelperOptions) =>
  apiRequest<T>(path, { method: "DELETE", ...normalizeHelperOptions(options) });

export const createSseUrl = (path: string) => {
  const session = getSession();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = path.startsWith("/api/") ? `${API_ROOT}${path}` : `${API_BASE}${path}`;
  return `${url}${separator}token=${encodeURIComponent(session.accessToken)}`;
};

export const checkApiHealth = async () => {
  try {
    return await apiGet<{ success?: boolean; message?: string }>("/health", { retries: 1 });
  } catch (error) {
    if (error instanceof Error && error.name === "ApiClientError") {
      throw error;
    }

    throw buildApiError({
      context: "health check request failed",
      method: "GET",
      url: `${API_BASE}/health`,
      error,
      timeout: isAbortError(error),
      fallbackMessage: SERVER_API_ERROR_MESSAGE,
    });
  }
};

export const pingApi = async () => {
  try {
    return await apiGet<{ success?: boolean; message?: string }>("/ping", { retries: 1 });
  } catch (error) {
    console.error("API ERROR:", error instanceof Error ? error.message : error, `${API_BASE}/ping`);
    return null;
  }
};

export { API_BASE, API_ROOT };
