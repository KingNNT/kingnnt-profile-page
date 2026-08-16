import { describe, expect, it } from "vitest";
import { FACETS, FACET_CONTACT_TYPE, LocaleSupport } from "@/enums";
import { FACET_CONTACT_IDS, IDENTITY, profileChannels } from "@/lib/profile";
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
    expect(person.sameAs).toEqual(profileChannels().map((c) => c.url));
  });

  /**
   * Kênh liên hệ theo nhánh, phát ra dưới dạng có cấu trúc. `ContactPoint`
   * KHÔNG phải node `Organization` — ràng buộc ẩn danh vẫn nguyên vẹn.
   */
  it("publishes one contact point per facet", () => {
    const points = person.contactPoint as { contactType: string; email: string }[];
    expect(points.map((p) => p.contactType)).toEqual(FACETS.map((f) => FACET_CONTACT_TYPE[f]));
    for (const point of points) {
      expect(point.email).toMatch(/^mailto:/);
    }
  });

  it("keeps every contact point in step with the contact module", () => {
    const points = person.contactPoint as { email: string }[];
    expect(points).toHaveLength(FACETS.filter((f) => FACET_CONTACT_IDS[f].length > 0).length);
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

  /**
   * Allowlist, không phải denylist: một denylist chỉ chặn được những rò rỉ mà
   * ai đó đã lường trước (`worksFor`, `affiliation`, chuỗi `Organization`). Một
   * trường mới như `employer` hay `worksAt` với `@type` không chứa "Organization"
   * sẽ lọt qua denylist ở trên mà không ai hay. Khoá tập key lại: bất kỳ trường
   * nào thêm vào sau này đều phải được cố ý thêm vào danh sách dưới đây, tại
   * đúng chỗ review sẽ nhìn thấy nó.
   */
  it("carries exactly the intended properties and no employer of any kind", () => {
    expect(Object.keys(person).sort()).toEqual(
      [
        "@type",
        "@id",
        "name",
        "alternateName",
        "jobTitle",
        "email",
        "url",
        "image",
        "sameAs",
        "contactPoint",
        "knowsAbout",
        "knowsLanguage",
        "address",
        "alumniOf",
      ].sort(),
    );
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
  const crumbs = breadcrumbSchema(LocaleSupport.EN, "dev/skills", (route) =>
    route.path === "" ? "Home" : route.path === "dev" ? "Dev" : "Skills",
  ) as { itemListElement: { position: number; name: string; item: string }[] };

  it("orders the trail from the root", () => {
    expect(crumbs.itemListElement.map((c) => c.position)).toEqual([1, 2, 3]);
    expect(crumbs.itemListElement[0].name).toBe("Home");
    expect(crumbs.itemListElement[2].item).toBe(`${SITE_URL}/en/dev/skills`);
  });
});

describe("webSiteSchema", () => {
  it("names the site after the person, not a company", () => {
    const site = webSiteSchema(LocaleSupport.EN) as Record<string, unknown>;
    expect(site["@type"]).toBe("WebSite");
    expect(JSON.stringify(site)).not.toContain("Organization");
  });
});
