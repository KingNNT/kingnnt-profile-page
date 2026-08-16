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
export const CONTENT_LAST_MODIFIED = "2026-08-16";

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
  { path: "about", key: "about", parent: HOME_PATH, priority: 0.9, changeFrequency: "monthly" },
  {
    path: "experience",
    key: "experience",
    parent: HOME_PATH,
    priority: 0.9,
    changeFrequency: "monthly",
  },
  { path: "skills", key: "skills", parent: HOME_PATH, priority: 0.8, changeFrequency: "monthly" },
  {
    path: "projects",
    key: "projects",
    parent: HOME_PATH,
    priority: 0.9,
    changeFrequency: "monthly",
  },
];

export function findRoute(path: string): RouteDef | undefined {
  return ROUTES.find((route) => route.path === path);
}

/** Mọi route trừ trang chủ, theo đúng thứ tự hiển thị trên thanh điều hướng. */
export function navRoutes(): RouteDef[] {
  return ROUTES.filter((route) => route.path !== HOME_PATH);
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
