import { describe, expect, it } from "vitest";
import { findRoute } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

/**
 * This page exists to be quoted, not just found — so the properties that make
 * it quotable are the ones worth pinning. They are all easy to lose to a
 * well-meant tidy-up, and none of them show up in a screenshot.
 */
describe("estimating copy", () => {
  it.each(Object.entries(CATALOGS))("%s asks the question in its title", (_locale, catalog) => {
    const page = (catalog as typeof en).devEstimating;
    // A title phrased as a question is the whole reason for the page's shape:
    // it is what an extracted answer gets attributed to. Turning it into a
    // noun phrase ("Estimation method") costs nothing visually and everything
    // here.
    expect(page.metaTitle.trim().endsWith("?")).toBe(true);
    expect(page.title.trim().endsWith("?")).toBe(true);
  });

  it.each(Object.entries(CATALOGS))("%s keeps the description quotable", (_locale, catalog) => {
    const page = (catalog as typeof en).devEstimating;
    // Long enough to carry the claim, short enough to survive a result snippet.
    expect(page.metaDescription.length).toBeGreaterThan(80);
    expect(page.metaDescription.length).toBeLessThanOrEqual(165);
  });

  it.each(Object.entries(CATALOGS))("%s states the claim before the story", (_locale, catalog) => {
    const page = (catalog as typeof en).devEstimating;
    // The first paragraph of the first section has to be the claim itself.
    // Anything shorter is a lead-in, and a lead-in is what gets extracted
    // instead of the argument.
    expect(page.answer1.length).toBeGreaterThan(120);
    for (const key of ["answer1", "answer2", "origin1", "practice1", "limits1"] as const) {
      expect(page[key].trim().length, `empty devEstimating.${key}`).toBeGreaterThan(0);
    }
  });

  /**
   * An argument does not change monthly the way a project list does, and a
   * `lastmod` that moves without the content moving is a signal worth nothing.
   */
  it("declares itself a slow-changing page under the dev hub", () => {
    const route = findRoute("dev/estimating");
    expect(route?.parent).toBe("dev");
    expect(route?.facet).toBe("dev");
    expect(route?.changeFrequency).toBe("yearly");
  });
});
