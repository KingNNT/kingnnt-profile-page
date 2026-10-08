import { describe, expect, it, vi } from "vitest";
import { LocaleSupport } from "@/enums";
import { pageMetadata } from "@/lib/metadata";
import { languageAlternates, pageUrl, SITE_URL } from "@/lib/site";

describe("site urls", () => {
  it("has no trailing slash on the origin", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("puts the locale first and the path after it", () => {
    expect(pageUrl(LocaleSupport.EN, "skills")).toBe(`${SITE_URL}/en/skills`);
  });

  it("renders the home page as the bare locale root", () => {
    expect(pageUrl(LocaleSupport.VI, "")).toBe(`${SITE_URL}/vi`);
  });

  it("offers an alternate for every routed locale", () => {
    expect(languageAlternates("about")).toEqual({
      en: `${SITE_URL}/en/about`,
      vi: `${SITE_URL}/vi/about`,
    });
  });

  it("strips a trailing slash from an overridden origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.com/");
    vi.resetModules();
    const { SITE_URL: overridden } = await import("@/lib/site");
    expect(overridden).toBe("https://preview.example.com");
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("falls back to the production origin when the env vars are set but empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_PROTOCOL", "");
    vi.resetModules();
    const { SITE_URL: fallback } = await import("@/lib/site");
    expect(fallback).toBe("https://kingnnt.org");
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the overridden origin for page urls", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.com/");
    vi.resetModules();
    const { pageUrl: overriddenPageUrl } = await import("@/lib/site");
    expect(overriddenPageUrl("en", "skills")).toBe("https://preview.example.com/en/skills");
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({
    locale: LocaleSupport.EN,
    path: "projects",
    title: "Projects",
    description: "Selected work.",
  });

  it("sets the canonical to this page, not the site root", () => {
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en/projects`);
  });

  it("declares an x-default alternate pointing at the default locale", () => {
    expect(meta.alternates?.languages?.["x-default"]).toBe(`${SITE_URL}/en/projects`);
  });

  /**
   * Khai báo `openGraph` trong `generateMetadata` khiến Next ngừng gộp file
   * convention `opengraph-image`. Không tham chiếu tường minh thì og:image biến
   * mất mà không có lỗi nào.
   */
  it("references the og image explicitly", () => {
    const images = meta.openGraph?.images;
    expect(Array.isArray(images) && images.length).toBeTruthy();
  });

  it("lists the other locale as an alternate og locale", () => {
    expect(meta.openGraph?.alternateLocale).toEqual(["vi_VN"]);
  });
});
