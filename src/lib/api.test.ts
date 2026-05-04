import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(() => null),
  updateSessionTokens: vi.fn(),
}));

import { apiGet, apiRequest } from "@/lib/api";
import {
  API_MISCONFIGURED_MESSAGE,
  DEFAULT_API_ERROR_MESSAGE,
  SERVER_API_ERROR_MESSAGE,
  TIMEOUT_API_ERROR_MESSAGE,
  getErrorMessage,
  getFriendlyApiMessage,
} from "@/lib/apiError";

describe("api error handling", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("shows a friendly message when the backend is unreachable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiGet("/blogs", { retries: 0 })).rejects.toThrow(SERVER_API_ERROR_MESSAGE);
    expect(console.error).toHaveBeenCalledWith(
      "API ERROR:",
      "Failed to fetch",
      expect.stringContaining("/blogs"),
    );
  });

  it("retries twice before failing on a network issue", async () => {
    const onRetry = vi.fn();
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiRequest("/blogs", { onRetry })).rejects.toThrow(SERVER_API_ERROR_MESSAGE);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        maxAttempts: 3,
        reason: "network",
      }),
    );
  });

  it("shows a timeout message when the request takes too long", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation((_url, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal | undefined;

      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const request = apiRequest("/blogs", { timeoutMs: 25, retries: 0 });
    const expectation = expect(request).rejects.toThrow(TIMEOUT_API_ERROR_MESSAGE);
    await vi.advanceTimersByTimeAsync(25);

    await expectation;
    expect(console.error).toHaveBeenCalledWith(
      "API ERROR:",
      expect.anything(),
      expect.stringContaining("/blogs"),
    );
  });

  it("hides technical server messages from users", async () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "Check VITE_API_URL and CORS_ORIGIN" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
        ),
    );

    await expect(apiGet("/blogs")).rejects.toThrow(SERVER_API_ERROR_MESSAGE);
    expect(console.error).toHaveBeenCalledWith(
      "API ERROR:",
      "Check VITE_API_URL and CORS_ORIGIN",
      expect.stringContaining("/blogs"),
    );
  });

  it("treats unexpected HTML responses as an API deployment problem", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("<!doctype html><html><body>App shell</body></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    await expect(apiGet("/blogs")).rejects.toThrow(API_MISCONFIGURED_MESSAGE);
    expect(console.error).toHaveBeenCalledWith(
      "API ERROR:",
      API_MISCONFIGURED_MESSAGE,
      expect.stringContaining("/blogs"),
    );
  });

  it("keeps safe, user-facing validation messages when appropriate", () => {
    expect(
      getFriendlyApiMessage(422, "Please enter a valid email address."),
    ).toBe("Please enter a valid email address.");
  });

  it("sanitizes technical messages returned outside the API client", () => {
    expect(getErrorMessage(new Error("Backend server is not reachable at localhost"))).toBe(
      DEFAULT_API_ERROR_MESSAGE,
    );
  });
});
