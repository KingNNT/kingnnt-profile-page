import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { buildLlmsTxt } from "@/lib/llms";
import { featuredProjects, IDENTITY, PROJECTS } from "@/lib/profile";
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

  /**
   * Kiểm ngay trên text sinh ra, không chỉ trên kiểu dữ liệu — `name` và `url`
   * được nới rộng lại thành độc lập nullable ở đây để phép thử không bị chính
   * union phân biệt của `Project` vô hiệu hoá. Nếu dữ liệu nạp động sau này phá
   * vỡ bất biến (tên rỗng nhưng vẫn còn url), test này báo lỗi ngay cả khi
   * TypeScript không còn kiểm được nữa.
   */
  it("never leaks the url of a project with no public name", () => {
    const projects: readonly { id: string; name: string | null; url: string | null }[] = PROJECTS;

    for (const project of projects) {
      if (project.name === null && project.url) {
        expect(text, project.id).not.toContain(project.url);
      }
    }
  });
});
