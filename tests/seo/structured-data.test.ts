import { describe, expect, it } from "vitest";
import { FACETS, FACET_CONTACT_TYPE, LocaleSupport } from "@/enums";
import {
  ALTERNATE_NAMES,
  type Award,
  AWARDS,
  CERTIFICATIONS,
  FACET_CONTACT_IDS,
  IDENTITY,
  profileChannels,
} from "@/lib/profile";
import {
  breadcrumbSchema,
  personSchema,
  profilePageSchema,
  webSiteSchema,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

const awardName = (award: Award) => `Award ${award.id}`;

describe("personSchema", () => {
  const person = personSchema(LocaleSupport.EN, awardName) as Record<string, unknown>;

  it("is a Person", () => {
    expect(person["@type"]).toBe("Person");
  });

  it("carries every alternate name people search for", () => {
    expect(person.alternateName).toEqual(ALTERNATE_NAMES);
  });

  /**
   * The spelling without diacritics is the one most keyboards outside Vietnam
   * can produce, so it is the one most searches use. It is also the easiest to
   * lose in a refactor, because it looks like a duplicate of `name`.
   */
  it("carries the name without diacritics", () => {
    expect(person.alternateName).toContain(IDENTITY.latinName);
    expect(IDENTITY.latinName).not.toBe(IDENTITY.fullName);
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
   * Tool names describe millions of people; the subject-matter topics are what
   * make the entity specific. Assert both halves are present, and that the
   * topics come first — a consumer that truncates the list should keep the
   * half that carries meaning.
   */
  it("leads knowsAbout with subject matter, not tool names", () => {
    const topics = person.knowsAbout as string[];
    expect(topics).toContain("Solution architecture");
    expect(topics.indexOf("Solution architecture")).toBeLessThan(topics.indexOf("TypeScript"));
  });

  it("claims every certification, with its issuer", () => {
    const held = person.hasCredential as { name: string; recognizedBy: { name: string } }[];
    expect(held.map((c) => c.name)).toEqual(CERTIFICATIONS.map((c) => c.name));
    expect(held.map((c) => c.recognizedBy.name)).toEqual(CERTIFICATIONS.map((c) => c.issuer));
  });

  it("claims every award, using the translated name", () => {
    expect(person.award).toEqual(AWARDS.map(awardName));
  });

  /**
   * The anonymity rule, pinned where it leaks most easily: `worksFor` is the
   * field every Person schema example on the web carries.
   *
   * This used to ban the string "Organization" outright. It no longer can —
   * credential issuers are emitted as `Organization` nodes on purpose, because
   * a certifying body is a third-party anchor for the person entity and this
   * site gave up the usual one by refusing to name employers. So the check got
   * narrower and stricter instead: every organisation named anywhere in the
   * graph must be one of the issuers. An employer smuggled in under any field
   * name fails this, which the old string ban would also have caught, and so
   * does an issuer that is not in `credentials.ts`, which it would not.
   */
  it("names no organisation other than a credential issuer", () => {
    expect(person).not.toHaveProperty("worksFor");
    expect(person).not.toHaveProperty("affiliation");

    const named = new Set<string>();
    const visit = (node: unknown) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (node === null || typeof node !== "object") return;
      const record = node as Record<string, unknown>;
      if (record["@type"] === "Organization" && typeof record.name === "string") {
        named.add(record.name);
      }
      Object.values(record).forEach(visit);
    };
    visit(person);

    expect([...named].sort()).toEqual([...new Set(CERTIFICATIONS.map((c) => c.issuer))].sort());
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
        "hasCredential",
        "award",
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
    awardName,
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
