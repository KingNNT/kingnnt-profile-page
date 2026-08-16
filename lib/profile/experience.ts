export interface ExperienceEntry {
  id: string;
  /** ISO year-month, ví dụ "2026-07". */
  from: string;
  /** `null` nghĩa là đang diễn ra. Nhiều mục cùng `null` là hợp lệ. */
  to: string | null;
  /** Chức danh — dữ liệu, không phải bản dịch. */
  role: string;
  domains: readonly string[];
  markets: readonly string[];
  teamSize: number | null;
}

/**
 * Không có tên nơi làm việc ở đây, theo yêu cầu của chủ trang. Thứ thay thế
 * phải cụ thể hơn một chức danh trần: lĩnh vực, thị trường và quy mô đội là ba
 * thứ nói được năng lực mà không nói ra tên.
 *
 * Thứ tự: mới nhất trước.
 */
export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    id: "consultant",
    from: "2026-07",
    to: null,
    role: "Solutions Consultant",
    domains: ["presales", "solution-architecture", "cloud-cost"],
    markets: ["VN", "Global"],
    teamSize: null,
  },
  {
    id: "engineer-current",
    from: "2025-09",
    to: null,
    role: "Full-stack Engineer",
    domains: ["banking", "healthcare", "e-commerce", "ai"],
    markets: ["VN", "MY", "AU"],
    teamSize: null,
  },
  {
    id: "engineer-ai",
    from: "2024-04",
    to: "2025-10",
    role: "Full-stack Engineer",
    domains: ["ai", "document-processing", "enterprise"],
    markets: ["JP", "EU"],
    teamSize: 8,
  },
  {
    id: "engineer-offshore",
    from: "2021-08",
    to: "2024-03",
    role: "Full-stack Engineer",
    domains: ["communications", "booking", "education"],
    markets: ["JP", "Global"],
    teamSize: 15,
  },
  {
    id: "engineer-hospitality",
    from: "2020-12",
    to: "2021-08",
    role: "Full-stack Engineer",
    domains: ["hospitality", "tourism"],
    markets: ["JP"],
    teamSize: 5,
  },
  {
    id: "freelance",
    from: "2020-01",
    to: null,
    role: "Independent Engineer",
    domains: ["product", "architecture", "cloud"],
    markets: ["VN", "Global"],
    teamSize: null,
  },
];
