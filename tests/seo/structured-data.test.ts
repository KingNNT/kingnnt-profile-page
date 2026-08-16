import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { IDENTITY } from "@/lib/profile";
import {
  breadcrumbSchema,
  personSchema,
  profilePageSchema,
  webSiteSchema,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

describe("personSchema", () => {
  const person = personSchema(LocaleSupport.EN) as Record<string, unknown>;

  it("is a Person", () => {
    expect(person["@type"]).toBe("Person");
  });

  it("carries both alternate names people search for", () => {
    expect(person.alternateName).toEqual([IDENTITY.englishName, IDENTITY.nickname]);
  });

  it("links out to every social profile as sameAs", () => {
    expect(person.sameAs).toEqual(IDENTITY.socials.map((s) => s.url));
  });

  it("lists areas of expertise from the skills data", () => {
    expect(Array.isArray(person.knowsAbout)).toBe(true);
    expect(person.knowsAbout).toContain("TypeScript");
  });

  /**
   * Ràng buộc ẩn danh, đóng đinh ở đúng chỗ dễ rò rỉ nhất: `worksFor` là trường
   * mà mọi ví dụ Person schema trên mạng đều có.
   */
  it("declares no employer of any kind", () => {
    const serialised = JSON.stringify(person);
    expect(person).not.toHaveProperty("worksFor");
    expect(person).not.toHaveProperty("affiliation");
    expect(serialised).not.toContain("Organization");
  });

  it("omits the phone number", () => {
    expect(person).not.toHaveProperty("telephone");
  });
});

describe("profilePageSchema", () => {
  const page = profilePageSchema({
    locale: LocaleSupport.EN,
    path: "about",
    title: "About",
    description: "The long version.",
  }) as Record<string, unknown>;

  it("is a ProfilePage about the person", () => {
    expect(page["@type"]).toBe("ProfilePage");
    expect((page.mainEntity as Record<string, unknown>)["@type"]).toBe("Person");
  });

  it("dates itself from the content constant, not the build clock", () => {
    expect(page.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("breadcrumbSchema", () => {
  const crumbs = breadcrumbSchema(LocaleSupport.EN, "skills", (route) =>
    route.path === "" ? "Home" : "Skills",
  ) as { itemListElement: { position: number; name: string; item: string }[] };

  it("orders the trail from the root", () => {
    expect(crumbs.itemListElement.map((c) => c.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[0].name).toBe("Home");
    expect(crumbs.itemListElement[1].item).toBe(`${SITE_URL}/en/skills`);
  });
});

describe("webSiteSchema", () => {
  it("names the site after the person, not a company", () => {
    const site = webSiteSchema(LocaleSupport.EN) as Record<string, unknown>;
    expect(site["@type"]).toBe("WebSite");
    expect(JSON.stringify(site)).not.toContain("Organization");
  });
});
