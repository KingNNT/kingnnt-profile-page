import { describe, expect, it } from "vitest";
import { earlierProjects, featuredProjects, PROJECTS } from "@/lib/profile";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

/**
 * `/projects` splits `PROJECTS` into two sections via `featuredProjects()`
 * and `earlierProjects()`, each mapped to a `ProjectCard` reading
 * `projects.entries.${id}`. This guards that the split still covers every
 * project — a project excluded from both partitions would silently vanish
 * from the page while every other test (id-coverage, anonymity) stayed
 * green.
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
    const entries = (catalog as typeof en).projects.entries;
    for (const project of PROJECTS) {
      const description = (entries as Record<string, string>)[project.id];
      expect(description, `missing projects.entries.${project.id}`).toBeTruthy();
      expect(description.length).toBeGreaterThan(0);
    }
  });
});
