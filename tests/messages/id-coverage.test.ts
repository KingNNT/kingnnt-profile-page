import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { AWARDS, EXPERIENCE, PROJECTS, SKILL_GROUPS } from "@/lib/profile";
import { navRoutes, ROUTES } from "@/lib/routes";
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

  it("covers every experience entry id in experience.entries, both directions", () => {
    assertIdsMatchCatalog(
      "EXPERIENCE",
      EXPERIENCE.map((entry) => entry.id),
      ["experience", "entries"],
    );
  });

  it("covers every project id in projects.entries, both directions", () => {
    assertIdsMatchCatalog(
      "PROJECTS",
      PROJECTS.map((project) => project.id),
      ["projects", "entries"],
    );
  });

  it("covers every skill group id in skills.groups, both directions", () => {
    assertIdsMatchCatalog(
      "SKILL_GROUPS",
      SKILL_GROUPS.map((group) => group.id),
      ["skills", "groups"],
    );
  });

  /**
   * `ROUTES` bao gồm trang chủ (`key: "home"`), nên namespace `nav` có đúng
   * bấy nhiêu key — không so với `navRoutes()`.
   */
  it("covers every route key in nav, both directions", () => {
    assertIdsMatchCatalog(
      "ROUTES",
      ROUTES.map((route) => route.key),
      ["nav"],
    );
  });

  /**
   * `navRoutes()` cố ý bỏ trang chủ, nên `home.index` có ít hơn `nav` đúng
   * một key — so với nguồn đúng của nó thay vì ép hai namespace phải khớp.
   */
  it("covers every non-home route key in home.index, both directions", () => {
    assertIdsMatchCatalog(
      "navRoutes()",
      navRoutes().map((route) => route.key),
      ["home", "index"],
    );
  });
});
