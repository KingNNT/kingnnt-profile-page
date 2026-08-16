import { describe, expect, it } from "vitest";
import { FACETS } from "@/enums";
import { routing } from "@/i18n/routing";
import {
  AWARDS,
  EXPERIENCE,
  PRACTICE_AREAS,
  PROJECTS,
  SKILL_GROUPS,
  SPOKEN_LANGUAGES,
} from "@/lib/profile";
import { facetHubRoutes, facetRoutes, ROUTES } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/**
 * Vài trang dựng key catalog lúc chạy: `t(\`entries.${id}\`)`, `t(\`groups.${id}\`)`,
 * `t(\`awards.${id}\`)`, `t(route.key)`. TypeScript không kiểm được một
 * template-literal key so với JSON, nên một id lệch giữa `lib/profile` (hay
 * `lib/routes`) và catalog sẽ không đỏ compile — nó chỉ lộ ra ở HTML render,
 * dưới dạng key thô mà next-intl trả về khi fallback (`about.awards.some-id`).
 * Test này bắt lệch đó theo cả hai chiều: id không có bản dịch, và bản dịch
 * không ứng với id nào (copy mồ côi mà ai đó sẽ tưởng nhầm là đang hiển thị).
 */
const CATALOGS: Record<string, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  vi: vi as Record<string, unknown>,
};

function namespaceKeys(catalog: Record<string, unknown>, path: readonly string[]): string[] {
  let node: unknown = catalog;
  for (const segment of path) {
    node = (node as Record<string, unknown> | undefined)?.[segment];
  }
  return node && typeof node === "object" ? Object.keys(node as Record<string, unknown>) : [];
}

/**
 * Khẳng định song hướng giữa một danh sách id (nguồn dữ liệu) và các key con
 * của một namespace trong catalog, cho mọi locale đã route.
 */
function assertIdsMatchCatalog(
  label: string,
  ids: readonly string[],
  namespacePath: readonly string[],
) {
  const idSet = new Set(ids);
  for (const locale of routing.locales) {
    const catalog = CATALOGS[locale];
    const dottedPath = namespacePath.join(".");
    const catalogKeys = namespaceKeys(catalog, namespacePath);
    const catalogKeySet = new Set(catalogKeys);

    for (const id of ids) {
      expect(
        catalogKeySet.has(id),
        `${label} id "${id}" has no "${locale}" catalog key at "${dottedPath}.${id}"`,
      ).toBe(true);
    }

    for (const key of catalogKeys) {
      expect(
        idSet.has(key),
        `"${locale}" catalog key "${dottedPath}.${key}" has no matching ${label} id`,
      ).toBe(true);
    }
  }
}

describe("data id <-> catalog key coverage", () => {
  it("covers every award id in about.awards, both directions", () => {
    assertIdsMatchCatalog(
      "AWARDS",
      AWARDS.map((award) => award.id),
      ["about", "awards"],
    );
  });

  it("covers every experience entry id in devExperience.entries, both directions", () => {
    assertIdsMatchCatalog(
      "EXPERIENCE",
      EXPERIENCE.map((entry) => entry.id),
      ["devExperience", "entries"],
    );
  });

  it("covers every project id in devProjects.entries, both directions", () => {
    assertIdsMatchCatalog(
      "PROJECTS",
      PROJECTS.map((project) => project.id),
      ["devProjects", "entries"],
    );
  });

  it("covers every skill group id in devSkills.groups, both directions", () => {
    assertIdsMatchCatalog(
      "SKILL_GROUPS",
      SKILL_GROUPS.map((group) => group.id),
      ["devSkills", "groups"],
    );
  });

  it("covers every practice area id in devSkills.practice, both directions", () => {
    assertIdsMatchCatalog(
      "PRACTICE_AREAS",
      PRACTICE_AREAS.map((area) => area.id),
      ["devSkills", "practice"],
    );
  });

  it("covers every spoken language id in about.languages, both directions", () => {
    assertIdsMatchCatalog(
      "SPOKEN_LANGUAGES",
      SPOKEN_LANGUAGES.map((language) => language.id),
      ["about", "languages"],
    );
  });

  /**
   * `ROUTES` bao gồm trang chủ (`key: "home"`), nên namespace `nav` có đúng
   * bấy nhiêu key — không so với `primaryNavRoutes()`.
   */
  it("covers every route key in nav, both directions", () => {
    assertIdsMatchCatalog(
      "ROUTES",
      ROUTES.map((route) => route.key),
      ["nav"],
    );
  });

  /**
   * Trang hub liệt kê các nhánh, không liệt kê mọi mục trên thanh điều hướng:
   * `about` và `contact` có mặt ở header nhưng không phải một lối vào theo
   * mảng. Neo vào `facetHubRoutes()` cũng có nghĩa là một nhánh chưa dựng
   * không đòi bản dịch cho một lối vào không tồn tại.
   */
  it("covers every facet hub key in home.index, both directions", () => {
    assertIdsMatchCatalog(
      "facetHubRoutes()",
      facetHubRoutes().map((route) => route.key),
      ["home", "index"],
    );
  });

  /**
   * `app/[locale]/(public)/dev/page.tsx` dựng key bằng
   * `tIndex(dynamicMessageKey(route.key))` trên `facetRoutes("dev")` — cũng là
   * template-literal key `tsc` không kiểm được, nên cần neo riêng.
   */
  it("covers every dev child route key in dev.index, both directions", () => {
    assertIdsMatchCatalog(
      'facetRoutes("dev")',
      facetRoutes("dev").map((route) => route.key),
      ["dev", "index"],
    );
  });

  /**
   * `app/[locale]/(public)/contact/page.tsx` dựng key bằng
   * `tGroups(dynamicMessageKey(facet))` trên `FACETS`, cộng key literal
   * `general` — cùng lý do: lệch chỉ lộ ra ở HTML dưới dạng key thô.
   */
  it("covers every contact group key in contact.groups, both directions", () => {
    assertIdsMatchCatalog("contact groups", ["general", ...FACETS], ["contact", "groups"]);
  });
});
