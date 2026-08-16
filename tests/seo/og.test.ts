import { afterEach, describe, expect, it, vi } from "vitest";

// `next/og` là module dành cho runtime của Next và không nạp sạch trong jsdom.
// Test này chỉ kiểm phần khai báo tĩnh của route, nên stub luôn ImageResponse.
vi.mock("next/og", () => ({ ImageResponse: class {} }));

import { alt, contentType, portraitDataUrl, size } from "@/app/[locale]/opengraph-image";
import { IDENTITY } from "@/lib/profile";

describe("opengraph image", () => {
  it("uses the 1200x630 card format every platform crops from", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares png", () => {
    expect(contentType).toBe("image/png");
  });

  it("names the person in the alt text", () => {
    expect(alt).toContain(IDENTITY.fullName);
  });
});

describe("portraitDataUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(portraitDataUrl()).resolves.toBeNull();
  });

  it("returns null on a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        headers: new Headers(),
        arrayBuffer: vi.fn(),
      }),
    );

    await expect(portraitDataUrl()).resolves.toBeNull();
  });

  it("returns null when the response is not image data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/html" }),
        arrayBuffer: vi.fn(),
      }),
    );

    await expect(portraitDataUrl()).resolves.toBeNull();
  });

  it("returns null when the body is correctly labelled but not a JPEG", async () => {
    const notAJpeg = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: vi.fn().mockResolvedValue(notAJpeg),
      }),
    );

    await expect(portraitDataUrl()).resolves.toBeNull();
  });
});
