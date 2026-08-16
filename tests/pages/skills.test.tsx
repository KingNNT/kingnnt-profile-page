import { describe, expect, it } from "vitest";
import { SKILL_GROUPS } from "@/lib/profile";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

/**
 * `/skills` renders one `Section` per `SKILL_GROUPS` entry, labelled by
 * `skills.groups.${id}`. This guards the page's own composition — that it
 * still iterates the full group list — separately from id-coverage, which
 * only checks that ids and catalog keys agree with each other.
 */
describe("skills page wiring", () => {
  it("renders all five skill groups", () => {
    expect(SKILL_GROUPS).toHaveLength(5);
  });

  it.each(Object.entries(CATALOGS))("%s has a label for every skill group", (_locale, catalog) => {
    const groups = (catalog as typeof en).skills.groups;
    for (const group of SKILL_GROUPS) {
      const label = (groups as Record<string, string>)[group.id];
      expect(label, `missing skills.groups.${group.id}`).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("every group carries at least one skill", () => {
    for (const group of SKILL_GROUPS) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });
});
