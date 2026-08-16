import { describe, expect, it } from "vitest";
import {
  allSkillNames,
  earlierProjects,
  EXPERIENCE,
  featuredProjects,
  IDENTITY,
  profileChannels,
  PROJECTS,
  SKILL_GROUPS,
  TRADING,
} from "@/lib/profile";

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function ids(items: readonly { id: string }[]) {
  return items.map((i) => i.id);
}

describe("profile data", () => {
  it("keeps ids unique within every collection", () => {
    for (const collection of [EXPERIENCE, SKILL_GROUPS, PROJECTS, TRADING]) {
      const list = ids(collection);
      expect(new Set(list).size, `duplicate id in ${list.join(", ")}`).toBe(list.length);
    }
  });

  it("uses ISO year-month for every period boundary", () => {
    for (const entry of [...EXPERIENCE, ...PROJECTS]) {
      expect(entry.from, entry.id).toMatch(YEAR_MONTH);
      if (entry.to !== null) expect(entry.to, entry.id).toMatch(YEAR_MONTH);
    }
  });

  it("never ends a period before it starts", () => {
    for (const entry of [...EXPERIENCE, ...PROJECTS]) {
      if (entry.to !== null) expect(entry.to >= entry.from, entry.id).toBe(true);
    }
  });

  /**
   * Vai trò freelance chạy song song từ 2020 tới nay, và giai đoạn consultant
   * chồng lên giai đoạn engineer. Đây là sự thật, không phải lỗi dữ liệu — test
   * khẳng định để không ai "sửa" nó thành một chuỗi tuyến tính về sau.
   */
  it("allows concurrent ongoing roles", () => {
    expect(EXPERIENCE.filter((e) => e.to === null).length).toBeGreaterThan(1);
  });

  it("gives every skill a plausible lastUsed year", () => {
    for (const group of SKILL_GROUPS) {
      for (const skill of group.skills) {
        expect(skill.years, `${skill.name} years`).toBeGreaterThan(0);
        expect(skill.lastUsed, `${skill.name} lastUsed`).toBeGreaterThanOrEqual(2016);
        expect(skill.lastUsed, `${skill.name} lastUsed`).toBeLessThanOrEqual(2026);
      }
    }
  });

  it("exposes every skill name for knowsAbout", () => {
    const total = SKILL_GROUPS.reduce((n, g) => n + g.skills.length, 0);
    expect(allSkillNames()).toHaveLength(total);
  });

  it("only links out over https", () => {
    const urls = [...PROJECTS.map((p) => p.url), ...profileChannels().map((c) => c.url)];
    for (const url of urls) {
      if (url === null) continue;
      expect(() => new URL(url)).not.toThrow();
      expect(new URL(url).protocol, url).toBe("https:");
    }
  });

  /**
   * `name: null` mã hoá ràng buộc ẩn danh vào chính kiểu dữ liệu: dự án không
   * public thì không có tên để hiển thị, và cũng không được có link.
   */
  it("never carries a url for an unnamed project", () => {
    for (const project of PROJECTS) {
      if (project.name === null) expect(project.url, project.id).toBeNull();
    }
  });

  it("splits projects into featured and earlier without losing any", () => {
    expect(featuredProjects().length + earlierProjects().length).toBe(PROJECTS.length);
    expect(featuredProjects().every((p) => p.featured)).toBe(true);
  });

  it("orders projects newest first", () => {
    const froms = PROJECTS.map((p) => p.from);
    expect([...froms].sort().reverse()).toEqual(froms);
  });

  it("describes the person without a phone number or birth date", () => {
    const serialised = JSON.stringify(IDENTITY);
    expect(serialised).not.toMatch(/\+84/);
    expect(serialised).not.toMatch(/\b(19|20)\d{2}-\d{2}-\d{2}\b/);
  });
});
