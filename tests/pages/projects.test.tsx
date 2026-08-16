import { describe, expect, it } from "vitest";
import { earlierProjects, featuredProjects, PROJECTS } from "@/lib/profile";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

/**
 * `/projects` splits `PROJECTS` into two sections via `featuredProjects()`
 * and `earlierProjects()`, each mapped to a `ProjectCard` reading
 * `projects.entries.${id}`. Unlike the experience/skills page tests, this
 * one calls those two functions directly — real production code, not just
 * the data array — so a project excluded from both partitions is actually
 * caught, not just assumed unconditional. What it still can't see is the
 * page's own JSX: the `.map(card)` calls on each list (checked manually
 * instead: both are unconditional, no `.slice`/`.filter` on top).
 */
describe("projects page wiring", () => {
  it("renders all nine projects across the two sections", () => {
    expect(PROJECTS).toHaveLength(9);
    expect(featuredProjects().length + earlierProjects().length).toBe(PROJECTS.length);
  });

  it("partitions every project into exactly one section", () => {
    const featuredIds = new Set(featuredProjects().map((project) => project.id));
    const earlierIds = new Set(earlierProjects().map((project) => project.id));
    for (const project of PROJECTS) {
      const inFeatured = featuredIds.has(project.id);
      const inEarlier = earlierIds.has(project.id);
      expect(inFeatured !== inEarlier, `${project.id} must be in exactly one section`).toBe(true);
    }
  });

  it.each(
    Object.entries(CATALOGS),
  )("%s has a description for every project", (_locale, catalog) => {
    const entries = (catalog as typeof en).devProjects.entries;
    for (const project of PROJECTS) {
      const description = (entries as Record<string, string>)[project.id];
      expect(description, `missing projects.entries.${project.id}`).toBeTruthy();
      expect(description.length).toBeGreaterThan(0);
    }
  });
});
