import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { LEGACY_DEV_PAGES, legacyRedirects, REDIRECT_LOCALE_MATCHER } from "@/lib/redirects";
import { findRoute } from "@/lib/routes";

describe("legacy redirects", () => {
  /**
   * `next.config.ts` không dùng được path alias nên matcher locale là bản chép
   * tay của `routing.locales`. Test này là thứ giữ hai chỗ đó không lệch: thêm
   * một locale mà quên sửa matcher thì đỏ ở đây.
   */
  it("matches exactly the routed locales", () => {
    const inside = REDIRECT_LOCALE_MATCHER.replace(/^:locale\(|\)$/g, "").split("|");
    expect(inside.sort()).toEqual([...routing.locales].sort());
  });

  it("sends every legacy page to its place under the dev facet", () => {
    for (const redirect of legacyRedirects()) {
      expect(redirect.destination).toMatch(/^\/:locale\/dev\//);
      expect(redirect.permanent).toBe(true);
    }
  });

  it("covers every page that moved", () => {
    expect(legacyRedirects().map((r) => r.source)).toEqual(
      LEGACY_DEV_PAGES.map((page) => `/${REDIRECT_LOCALE_MATCHER}/${page}`),
    );
  });

  /** Một redirect chỉ có nghĩa nếu đích của nó là route thật. */
  it("points every destination at a registered route", () => {
    for (const page of LEGACY_DEV_PAGES) {
      expect(findRoute(`dev/${page}`), page).toBeDefined();
    }
  });

  /** Và nguồn của nó phải KHÔNG còn là route — nếu không, redirect che mất một trang sống. */
  it("never redirects a path that is still a route", () => {
    for (const page of LEGACY_DEV_PAGES) {
      expect(findRoute(page), page).toBeUndefined();
    }
  });
});
