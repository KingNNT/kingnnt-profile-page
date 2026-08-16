import type { Facet } from "@/enums";

export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";

export interface RouteDef {
  /** Path sau locale prefix, không có dấu gạch chéo đầu hay cuối. */
  path: string;
  /** Key trong message catalog chứa copy của route này. */
  key: string;
  /** Path của route cha, dùng dựng breadcrumb. */
  parent?: string;
  priority: number;
  changeFrequency: ChangeFrequency;
  lastModified?: string;
  /** Nhánh chứa route. `undefined` = route chung: hub, about, contact. */
  facet?: Facet;
}

/**
 * Trang chủ nằm ngay tại `/{locale}`. Reference đặt nó ở `/{locale}/home` vì nó
 * phục vụ bốn hostname qua rewrite; ở đây một site nên bỏ được một lần redirect.
 */
export const HOME_PATH = "";

/**
 * Ngày copy của trang đổi lần cuối, nuôi cả `<lastmod>` trong sitemap lẫn
 * `dateModified` trong schema. **Bump khi sửa message catalog**, không phải khi
 * deploy: nếu lấy thời điểm build thì một trang không đụng tới hàng tháng vẫn
 * khai là vừa đổi vài phút trước, và đó là tín hiệu chỉ đáng có khi nó đúng.
 */
export const CONTENT_LAST_MODIFIED = "2026-08-17";

export function routeLastModified(route: RouteDef): string {
  return route.lastModified ?? CONTENT_LAST_MODIFIED;
}

/**
 * Nguồn sự thật duy nhất cho mọi route công khai. Navigation, sitemap,
 * breadcrumb và llms.txt đều đọc từ đây nên chúng không thể lệch nhau. Thêm
 * trang nghĩa là thêm một mục ở đây cộng với copy ở cả hai catalog.
 */
export const ROUTES: readonly RouteDef[] = [
  { path: HOME_PATH, key: "home", priority: 1, changeFrequency: "monthly" },
  {
    path: "dev",
    key: "dev",
    parent: HOME_PATH,
    facet: "dev",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: "dev/experience",
    key: "devExperience",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "dev/skills",
    key: "devSkills",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "dev/projects",
    key: "devProjects",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  /**
   * A different kind of page from the three above: those list facts, this one
   * makes an argument. It is here because it is the only page on the site that
   * says something nobody else is saying — which is what an answer engine has
   * a reason to cite, and a profile page never is. `yearly` is honest: an
   * argument does not change monthly the way a project list does.
   */
  {
    path: "dev/estimating",
    key: "devEstimating",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "yearly",
  },
  {
    path: "trading",
    key: "trading",
    parent: HOME_PATH,
    facet: "trading",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  { path: "about", key: "about", parent: HOME_PATH, priority: 0.9, changeFrequency: "monthly" },
  { path: "contact", key: "contact", parent: HOME_PATH, priority: 0.8, changeFrequency: "yearly" },
];

export function findRoute(path: string): RouteDef | undefined {
  return ROUTES.find((route) => route.path === path);
}

/**
 * Thanh điều hướng tầng một: mọi route treo thẳng dưới trang chủ. Cây phân cấp
 * suy ra từ `parent` sẵn có, không khai thêm một trường thứ hai để hai nguồn
 * có cơ hội lệch nhau.
 */
export function primaryNavRoutes(): RouteDef[] {
  return ROUTES.filter((route) => route.parent === HOME_PATH);
}

/** Trang chủ của từng nhánh — thứ trang hub liệt kê làm lối vào. */
export function facetHubRoutes(): RouteDef[] {
  return primaryNavRoutes().filter((route) => route.facet !== undefined);
}

/** Các trang con của một nhánh, theo đúng thứ tự trong registry. Rỗng nếu nhánh chưa có hub. */
export function facetRoutes(facet: Facet): RouteDef[] {
  const hub = facetHubRoutes().find((route) => route.facet === facet);
  return hub === undefined ? [] : ROUTES.filter((route) => route.parent === hub.path);
}

/** Breadcrumb từ gốc tới chính route đó. Rỗng nếu path không phải một route. */
export function breadcrumbTrail(path: string): RouteDef[] {
  const trail: RouteDef[] = [];
  let current = findRoute(path);

  while (current) {
    trail.unshift(current);
    current = current.parent !== undefined ? findRoute(current.parent) : undefined;
  }

  return trail;
}
