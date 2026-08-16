import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { buildLlmsTxt } from "@/lib/llms";
import { featuredProjects, IDENTITY } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { pageUrl } from "@/lib/site";

describe("llms.txt", () => {
  const text = buildLlmsTxt(LocaleSupport.EN);

  it("opens with the person as the H1", () => {
    expect(text.startsWith(`# ${IDENTITY.fullName}`)).toBe(true);
  });

  it("links every public route", () => {
    for (const route of ROUTES) {
      expect(text).toContain(pageUrl(LocaleSupport.EN, route.path));
    }
  });

  it("lists named featured projects with their url", () => {
    for (const project of featuredProjects()) {
      if (project.name === null) continue;
      expect(text).toContain(project.name);
    }
  });

  it("states the job title without naming an employer", () => {
    expect(text).toContain(IDENTITY.jobTitle);
  });
});
