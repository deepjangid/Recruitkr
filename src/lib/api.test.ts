import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(() => null),
  updateSessionTokens: vi.fn(),
}));

import { apiGet, apiRequest } from "@/lib/api";
import {
  DEFAULT_API_ERROR_MESSAGE,
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
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("shows a friendly message when the backend is unreachable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(apiGet("/blogs")).rejects.toThrow(DEFAULT_API_ERROR_MESSAGE);
    expect(console.error).toHaveBeenCalledWith(
      "[api] request failed before response",
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/blogs"),
        error: expect.any(TypeError),
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

    const request = apiRequest("/blogs", { timeoutMs: 25 });
    await vi.advanceTimersByTimeAsync(25);

    await expect(request).rejects.toThrow(TIMEOUT_API_ERROR_MESSAGE);
    expect(console.error).toHaveBeenCalledWith(
      "[api] request timed out",
      expect.objectContaining({
        timeout: true,
        method: "GET",
      }),
    );
  });

  it("hides technical server messages from users", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Check VITE_API_URL and CORS_ORIGIN" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiGet("/blogs")).rejects.toThrow("We're having trouble on our side. Please try again in a moment.");
    expect(console.error).toHaveBeenCalledWith(
      "[api] request returned an error response",
      expect.objectContaining({
        status: 503,
        serverMessage: "Check VITE_API_URL and CORS_ORIGIN",
      }),
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
