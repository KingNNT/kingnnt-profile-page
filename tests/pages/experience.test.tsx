import { describe, expect, it } from "vitest";
import { EXPERIENCE } from "@/lib/profile";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

/**
 * `/experience` builds its timeline by mapping over `EXPERIENCE` and reading
 * `experience.entries.${id}` from the active catalog. This does NOT guard
 * the page's own JSX — it is an async Server Component Testing Library
 * cannot render, so a `.slice`/`.filter` added to the page's `.map` would
 * not turn this red (checked manually instead: the mapping is unconditional,
 * no `.slice`, `.filter`, or index cap). What this guards is the data it
 * would read: that `EXPERIENCE` still has all six entries, each with a
 * non-empty summary in both catalogs — coverage neither TypeScript nor
 * id-coverage.test.ts provides on their own.
 */
describe("experience page wiring", () => {
  it("renders all six roles", () => {
    expect(EXPERIENCE).toHaveLength(6);
  });

  it.each(
    Object.entries(CATALOGS),
  )("%s has a summary for every experience entry", (_locale, catalog) => {
    const entries = (catalog as typeof en).devExperience.entries;
    for (const item of EXPERIENCE) {
      const summary = (entries as Record<string, string>)[item.id];
      expect(summary, `missing experience.entries.${item.id}`).toBeTruthy();
      expect(summary.length).toBeGreaterThan(0);
    }
  });
});
