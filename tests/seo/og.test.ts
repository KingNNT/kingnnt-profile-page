import { describe, expect, it, vi } from "vitest";

// `next/og` là module dành cho runtime của Next và không nạp sạch trong jsdom.
// Test này chỉ kiểm phần khai báo tĩnh của route, nên stub luôn ImageResponse.
vi.mock("next/og", () => ({ ImageResponse: class {} }));

import { alt, contentType, size } from "@/app/[locale]/opengraph-image";
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
