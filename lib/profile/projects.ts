/**
 * Bắt cặp `name`/`url` thành một union phân biệt: dự án không public thì không
 * có tên lẫn không có link, ở ngay tầng kiểu chứ không chỉ trong comment. Trước
 * đây `{ name: null, url: "..." }` là TypeScript hợp lệ — review đã gắn cờ điều
 * này khi tầng data được dựng, và một lần llms.ts suýt in lộ `url` cho một dự
 * án ẩn danh là lúc khoản nợ đó đến hạn.
 */
type ProjectIdentity = { name: string; url: string | null } | { name: null; url: null };

export type Project = ProjectIdentity & {
  id: string;
  from: string;
  to: string | null;
  role: string;
  teamSize: number | null;
  stack: readonly string[];
  featured: boolean;
};

/** Mới nhất trước. */
export const PROJECTS: readonly Project[] = [
  {
    id: "intentsite",
    from: "2026-01",
    to: null,
    name: "IntentSite",
    url: "https://www.intentsite.com/",
    role: "Tech Lead · Solution Architect",
    teamSize: 6,
    stack: ["Next.js", "Python", "LLM", "WhatsApp API"],
    featured: true,
  },
  {
    id: "bank-kpi",
    from: "2025-11",
    to: "2026-04",
    name: null,
    url: null,
    role: "Full-stack Engineer",
    teamSize: 4,
    stack: ["Next.js", "PostgreSQL", "AWS"],
    featured: true,
  },
  {
    id: "mental-health-elearning",
    from: "2025-11",
    to: null,
    name: null,
    url: null,
    role: "Backend Engineer",
    teamSize: 6,
    stack: ["NestJS", "Next.js", "PostgreSQL", "AWS"],
    featured: true,
  },
  {
    id: "email-agent",
    from: "2025-07",
    to: "2025-10",
    name: null,
    url: null,
    role: "Tech Lead · Full-stack Engineer",
    teamSize: 8,
    stack: ["FastAPI", "Next.js", "Azure OpenAI", "Kubernetes"],
    featured: false,
  },
  {
    id: "orkestrators",
    from: "2025-05",
    to: null,
    name: "Orkestrators",
    url: "https://www.artinleap.com/products/orkestrators",
    role: "Tech Lead · Implementation Advisor",
    teamSize: 5,
    stack: ["FastAPI", "React", "MongoDB", "LangChain", "MCP", "OAuth 2.0"],
    featured: true,
  },
  {
    id: "semikong",
    from: "2024-06",
    to: "2024-07",
    name: "SemiKong",
    url: "https://semikong.ai",
    role: "Team Lead",
    teamSize: 4,
    stack: ["Django", "Next.js", "PostgreSQL", "Azure"],
    featured: true,
  },
  {
    id: "restaurant-marketplace",
    from: "2022-11",
    to: "2023-04",
    name: null,
    url: null,
    role: "Full-stack Engineer",
    teamSize: 15,
    stack: ["Laravel", "Nuxt", "TypeScript", "Puppeteer"],
    featured: false,
  },
  {
    id: "livecall",
    from: "2022-03",
    to: "2024-03",
    name: "Live Call",
    url: "https://livecall.net",
    role: "Full-stack Engineer",
    teamSize: 15,
    stack: ["Django", "Vue", "TypeScript", "Twilio", "Stripe", "WebSocket"],
    featured: true,
  },
  {
    id: "school-management",
    from: "2021-09",
    to: "2022-06",
    name: null,
    url: null,
    role: "Full-stack Engineer",
    teamSize: 15,
    stack: ["Laravel", "Vue", "MySQL", "Redis"],
    featured: false,
  },
];

export function featuredProjects(): Project[] {
  return PROJECTS.filter((project) => project.featured);
}

export function earlierProjects(): Project[] {
  return PROJECTS.filter((project) => !project.featured);
}
