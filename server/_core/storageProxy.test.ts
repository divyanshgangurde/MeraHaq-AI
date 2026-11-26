import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { createServeStorageObject } from "./storageProxy";

function mockResponse() {
  const res = {
    statusCode: 200,
    headers: new Map<string, string>(),
    body: undefined as unknown,
    redirectArgs: undefined as [number, string] | undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
    set(name: string, value: string) {
      this.headers.set(name, value);
      return this;
    },
    redirect(code: number, url: string) {
      this.statusCode = code;
      this.redirectArgs = [code, url];
      return this;
    },
  };
  return res;
}

describe("storageProxy fallback redirect", () => {
  it("redirects with 302 to the official sourceUrl when local file is missing", async () => {
    const lookup = vi
      .fn()
      .mockResolvedValue("https://pmkisan.gov.in/Documents/guideline.pdf");
    const handler = createServeStorageObject(lookup);
    const req = {
      params: { 0: "dhruv/nonexistent-guideline.pdf" },
    } as unknown as Request;
    const res = mockResponse();

    await handler(req, res as unknown as Response);

    expect(lookup).toHaveBeenCalledWith("dhruv/nonexistent-guideline.pdf");
    expect(res.redirectArgs).toEqual([
      302,
      "https://pmkisan.gov.in/Documents/guideline.pdf",
    ]);
  });

  it("returns 404 when local file is missing and no document matches", async () => {
    const lookup = vi.fn().mockResolvedValue(null);
    const handler = createServeStorageObject(lookup);
    const req = {
      params: { 0: "dhruv/unknown-key.pdf" },
    } as unknown as Request;
    const res = mockResponse();

    await handler(req, res as unknown as Response);

    expect(lookup).toHaveBeenCalledWith("dhruv/unknown-key.pdf");
    expect(res.statusCode).toBe(404);
    expect(res.body).toBe("Storage object not found");
  });

  it("returns 404 instead of redirecting when fallback URL is not http(s)", async () => {
    const lookup = vi.fn().mockResolvedValue("javascript:alert(1)");
    const handler = createServeStorageObject(lookup);
    const req = {
      params: { 0: "dhruv/unsafe-url.pdf" },
    } as unknown as Request;
    const res = mockResponse();

    await handler(req, res as unknown as Response);

    expect(res.redirectArgs).toBeUndefined();
    expect(res.statusCode).toBe(404);
  });
});
