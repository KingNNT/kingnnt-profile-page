import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists every route in every locale", () => {
    expect(entries).toHaveLength(ROUTES.length * routing.locales.length);
  });

  it("gives every entry a language alternate map", () => {
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual(["en", "vi"]);
    }
  });

  it("emits the home url without a trailing path segment", () => {
    expect(entries.map((e) => e.url)).toContain(`${SITE_URL}/en`);
  });

  it("never emits a url with a double slash after the origin", () => {
    for (const entry of entries) {
      expect(entry.url.replace(`${SITE_URL}/`, ""), entry.url).not.toContain("//");
    }
  });

  it("dates entries from the content constant", () => {
    for (const entry of entries) {
      expect(String(entry.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
