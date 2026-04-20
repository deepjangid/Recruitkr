import { getSession, updateSessionTokens } from "@/lib/auth";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
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
};

const parseJsonSafe = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const session = getSession();
  if (!session?.refreshToken) return null;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  const json = await parseJsonSafe<{ success?: boolean; data?: { accessToken?: string; refreshToken?: string } }>(res);
  if (!res.ok || !json?.success || !json.data?.accessToken) {
    return null;
  }

  updateSessionTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
};

export const apiRequest = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const {
    method = "GET",
    body,
    headers = {},
    auth = false,
    retryOn401 = true,
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
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...authHeader,
        ...headers,
      },
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch (error) {
    if (isBlogRequest) {
      console.error("[apiRequest] network failure", {
        method,
        url,
        error,
      });
    }
    throw new Error("Backend server is not reachable. Please start the API server and try again.");
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
    const message =
      detailsMessage ||
      (json as ApiErrorPayload | null)?.message ||
      (json as ApiErrorPayload | null)?.error?.message ||
      "Request failed";
    if (isBlogRequest) {
      console.error("[apiRequest] blog request failed", {
        method,
        url,
        status: res.status,
        message,
        payload: json ?? null,
      });
    }
    throw new Error(message);
  }

  return json as T;
};

export const apiGet = <T>(path: string, auth = false) =>
  apiRequest<T>(path, { method: "GET", auth });

export const apiPost = <T>(path: string, body?: unknown, auth = false) =>
  apiRequest<T>(path, { method: "POST", body, auth });

export const apiPatch = <T>(path: string, body?: unknown, auth = false) =>
  apiRequest<T>(path, { method: "PATCH", body, auth });

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

export { API_BASE, API_ROOT };
