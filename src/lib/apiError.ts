export const DEFAULT_API_ERROR_MESSAGE = "We're having trouble connecting. Please try again.";
export const TIMEOUT_API_ERROR_MESSAGE = "This is taking longer than expected. Please try again.";

const TECHNICAL_MESSAGE_PATTERNS = [
  /vite_api_url/i,
  /cors_origin/i,
  /localhost/i,
  /failed to fetch/i,
  /networkerror/i,
  /fetch/i,
  /timeout/i,
  /abort/i,
  /ecconn/i,
  /stack/i,
];

export class ApiClientError extends Error {
  status?: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "ApiClientError";
    this.status = options?.status;
  }
}

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError";

const isTechnicalMessage = (message: string) =>
  TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));

export const getFriendlyApiMessage = (
  status?: number,
  serverMessage?: string | null,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE,
) => {
  const cleanedServerMessage = serverMessage?.trim();
  const safeServerMessage =
    cleanedServerMessage && !isTechnicalMessage(cleanedServerMessage)
      ? cleanedServerMessage
      : null;

  if (status === 400 || status === 404 || status === 409 || status === 422) {
    return safeServerMessage || "We couldn't complete that request. Please review the details and try again.";
  }

  if (status === 401) {
    return safeServerMessage || "Your session has expired. Please sign in and try again.";
  }

  if (status === 403) {
    return safeServerMessage || "You don't have permission to do that.";
  }

  if (status === 429) {
    return "You're doing that a little too quickly. Please wait a moment and try again.";
  }

  if (typeof status === "number" && status >= 500) {
    return "We're having trouble on our side. Please try again in a moment.";
  }

  return safeServerMessage || fallbackMessage;
};

type BuildApiErrorOptions = {
  context: string;
  method: string;
  url: string;
  error?: unknown;
  status?: number;
  serverMessage?: string | null;
  payload?: unknown;
  fallbackMessage?: string;
  timeout?: boolean;
};

export const buildApiError = ({
  context,
  method,
  url,
  error,
  status,
  serverMessage,
  payload,
  fallbackMessage,
  timeout = false,
}: BuildApiErrorOptions) => {
  const userMessage = timeout
    ? TIMEOUT_API_ERROR_MESSAGE
    : getFriendlyApiMessage(status, serverMessage, fallbackMessage);

  console.error(`[api] ${context}`, {
    method,
    url,
    status,
    timeout,
    serverMessage,
    payload,
    error,
  });

  return new ApiClientError(userMessage, {
    status,
    cause: error,
  });
};

export const getErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE,
) => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (isAbortError(error)) {
    return TIMEOUT_API_ERROR_MESSAGE;
  }

  if (error instanceof Error) {
    const safeMessage = error.message.trim();
    if (safeMessage && !isTechnicalMessage(safeMessage)) {
      return safeMessage;
    }
  }

  return fallbackMessage;
};

export { isAbortError };
