import { describe, expect, it } from "vitest";
import {
  breadcrumbTrail,
  facetHubRoutes,
  facetRoutes,
  findRoute,
  HOME_PATH,
  primaryNavRoutes,
  ROUTES,
  routeLastModified,
} from "@/lib/routes";

describe("route registry", () => {
  it("registers exactly the five public routes", () => {
    expect(ROUTES.map((r) => r.path).sort()).toEqual(
      ["", "about", "experience", "projects", "skills"].sort(),
    );
  });

  it("keeps paths free of leading and trailing slashes", () => {
    for (const route of ROUTES) {
      expect(route.path.startsWith("/"), route.path).toBe(false);
      expect(route.path.endsWith("/"), route.path).toBe(false);
    }
  });

  it("gives the home page the top priority", () => {
    const home = findRoute(HOME_PATH);
    expect(home?.priority).toBe(1);
  });

  it("lists the primary navigation from the routes parented at home", () => {
    expect(primaryNavRoutes().map((r) => r.path)).toEqual([
      "about",
      "experience",
      "skills",
      "projects",
    ]);
  });

  it("excludes home from the primary navigation", () => {
    expect(primaryNavRoutes().map((r) => r.path)).not.toContain(HOME_PATH);
  });

  /** Chưa có nhánh nào ở bước này — Task 6 mới thêm. Test neo con số ở 0 để
   * lần thêm đầu tiên là một thay đổi cố ý, nhìn thấy được trong diff. */
  it("has no facet hub yet", () => {
    expect(facetHubRoutes()).toEqual([]);
  });

  it("returns an empty child list for a facet with no hub", () => {
    expect(facetRoutes("dev")).toEqual([]);
  });

  it("builds a breadcrumb trail rooted at home", () => {
    expect(breadcrumbTrail("skills").map((r) => r.path)).toEqual([HOME_PATH, "skills"]);
  });

  it("returns an empty trail for an unknown path", () => {
    expect(breadcrumbTrail("blog")).toEqual([]);
  });

  it("falls back to the site-wide content date", () => {
    const route = findRoute("about");
    expect(route && routeLastModified(route)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("points every parent at a route that exists", () => {
    for (const route of ROUTES) {
      if (route.parent === undefined) continue;
      expect(findRoute(route.parent), `${route.path} -> ${route.parent}`).toBeDefined();
    }
  });
});
