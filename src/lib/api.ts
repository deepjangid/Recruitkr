import { getSession, updateSessionTokens } from "@/lib/auth";
import {
  buildApiError,
  DEFAULT_API_ERROR_MESSAGE,
  getFriendlyApiMessage,
  isAbortError,
} from "@/lib/apiError";

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");
const API_TIMEOUT_MS = 15000;

const getApiBase = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000/api/v1";
  }

  return `${window.location.origin}/api/v1`;
};

const API_BASE = getApiBase();
const API_ROOT = API_BASE.replace(/\/api\/v\d+$/, "").replace(/\/$/, "");

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

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  retryOn401?: boolean;
  timeoutMs?: number;
};

const parseJsonSafe = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = API_TIMEOUT_MS) => {
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

    const json = await parseJsonSafe<{ success?: boolean; data?: { accessToken?: string; refreshToken?: string } }>(res);
    if (!res.ok || !json?.success || !json.data?.accessToken) {
      return null;
    }

    updateSessionTokens(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
  } catch (error) {
    console.error("[api] token refresh failed", { url: `${API_BASE}/auth/refresh`, error });
    return null;
  }
};

export const apiRequest = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const {
    method = "GET",
    body,
    headers = {},
    auth = false,
    retryOn401 = true,
    timeoutMs = API_TIMEOUT_MS,
  } = options;

  const session = getSession();
  const authHeader = auth && session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isAbsoluteApiPath = path.startsWith("/api/");
  const url = isAbsoluteApiPath ? `${API_ROOT}${path}` : `${API_BASE}${path}`;
  const isBlogRequest = path.startsWith("/blogs") || path.startsWith("/api/blogposts");

  if (isBlogRequest) {
    console.info("[apiRequest] sending request", {
      method,
      url,
      auth,
    });
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
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
    );
  } catch (error) {
    throw buildApiError({
      context: isAbortError(error) ? "request timed out" : "request failed before response",
      method,
      url,
      error,
      timeout: isAbortError(error),
      fallbackMessage: DEFAULT_API_ERROR_MESSAGE,
    });
  }

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
        timeoutMs,
      });
    }
  }

  const json = await parseJsonSafe<T & ApiErrorPayload>(res);
  if (isBlogRequest) {
    console.info("[apiRequest] received response", {
      method,
      url,
      ok: res.ok,
      status: res.status,
      hasJson: Boolean(json),
    });
  }
  if (!res.ok) {
    const detailsMessage = (json as ApiErrorPayload | null)?.details
      ?.map((detail) => {
        const path = detail.path?.length ? `${detail.path.join(".")}: ` : "";
        return `${path}${detail.message || "Invalid value"}`;
      })
      .filter(Boolean)
      .join("; ");
    const serverMessage =
      detailsMessage ||
      (json as ApiErrorPayload | null)?.message ||
      (json as ApiErrorPayload | null)?.error?.message ||
      null;
    throw buildApiError({
      context: "request returned an error response",
      method,
      url,
      status: res.status,
      serverMessage,
      payload: json ?? null,
      fallbackMessage: getFriendlyApiMessage(res.status, null, DEFAULT_API_ERROR_MESSAGE),
    });
  }

  return json as T;
};

export const apiGet = <T>(path: string, auth = false) =>
  apiRequest<T>(path, { method: "GET", auth });

export const apiPost = <T>(path: string, body?: unknown, auth = false) =>
  apiRequest<T>(path, { method: "POST", body, auth });

export const apiPatch = <T>(path: string, body?: unknown, auth = false) =>
  apiRequest<T>(path, { method: "PATCH", body, auth });

export const apiPut = <T>(path: string, body?: unknown, auth = false) =>
  apiRequest<T>(path, { method: "PUT", body, auth });

export const apiDelete = <T>(path: string, auth = false) =>
  apiRequest<T>(path, { method: "DELETE", auth });

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
    const res = await fetchWithTimeout(`${API_BASE}/health`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw buildApiError({
        context: "health check failed",
        method: "GET",
        url: `${API_BASE}/health`,
        status: res.status,
      });
    }

    return parseJsonSafe<{ success?: boolean; message?: string }>(res);
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
    });
  }
};

export { API_BASE, API_ROOT };
