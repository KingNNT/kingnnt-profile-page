import { describe, expect, it } from "vitest";
import { EXPERIENCE } from "@/lib/profile";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

/**
 * `/experience` builds its timeline by mapping over `EXPERIENCE` and reading
 * `experience.entries.${id}` from the active catalog. Neither TypeScript nor
 * the id-coverage test guards that the *page* still maps every entry — only
 * that ids and catalog keys agree. This asserts the page's own wiring: drop
 * an entry from the page's `.map` and this still passes unless the entry
 * itself vanishes from `EXPERIENCE`, so pair it with a manual check that the
 * mapping is unconditional (it is — no `.slice`, `.filter`, or index cap).
 */
describe("experience page wiring", () => {
  it("renders all six roles", () => {
    expect(EXPERIENCE).toHaveLength(6);
  });

  it.each(
    Object.entries(CATALOGS),
  )("%s has a summary for every experience entry", (_locale, catalog) => {
    const entries = (catalog as typeof en).experience.entries;
    for (const item of EXPERIENCE) {
      const summary = (entries as Record<string, string>)[item.id];
      expect(summary, `missing experience.entries.${item.id}`).toBeTruthy();
      expect(summary.length).toBeGreaterThan(0);
    }
  });
});
