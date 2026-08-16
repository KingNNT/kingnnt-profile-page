export type Proficiency = "expert" | "intermediate" | "basic";

export interface Skill {
  name: string;
  proficiency: Proficiency;
  years: number;
  /**
   * Năm dùng gần nhất. Trường tự tố cáo: để nguyên vài năm là thành sai sự
   * thật. Giữ vì đó chính là thứ làm bảng này đáng tin hơn một rừng logo.
   */
  lastUsed: number;
}

export interface SkillGroup {
  id: string;
  skills: readonly Skill[];
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: "languages",
    skills: [
      { name: "TypeScript", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "JavaScript", proficiency: "expert", years: 5, lastUsed: 2026 },
      { name: "Python", proficiency: "expert", years: 3, lastUsed: 2026 },
      { name: "PHP", proficiency: "expert", years: 3, lastUsed: 2023 },
      { name: "Rust", proficiency: "basic", years: 1, lastUsed: 2026 },
      { name: "C/C++", proficiency: "intermediate", years: 2, lastUsed: 2021 },
      { name: "C#", proficiency: "basic", years: 1, lastUsed: 2021 },
      { name: "Java", proficiency: "basic", years: 1, lastUsed: 2021 },
    ],
  },
  {
    id: "frontend",
    skills: [
      { name: "React", proficiency: "expert", years: 5, lastUsed: 2026 },
      { name: "Next.js", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "Tailwind CSS", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "Vue", proficiency: "expert", years: 4, lastUsed: 2024 },
    ],
  },
  {
    id: "backend",
    skills: [
      { name: "FastAPI", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "NestJS", proficiency: "expert", years: 3, lastUsed: 2026 },
      { name: "Django", proficiency: "expert", years: 3, lastUsed: 2026 },
      { name: "Laravel", proficiency: "expert", years: 3, lastUsed: 2023 },
    ],
  },
  {
    id: "devops",
    skills: [
      { name: "Docker", proficiency: "expert", years: 5, lastUsed: 2026 },
      { name: "AWS", proficiency: "intermediate", years: 3, lastUsed: 2026 },
      { name: "Google Cloud", proficiency: "intermediate", years: 3, lastUsed: 2026 },
      { name: "Microsoft Azure", proficiency: "intermediate", years: 2, lastUsed: 2025 },
      { name: "DigitalOcean", proficiency: "intermediate", years: 2, lastUsed: 2026 },
      { name: "Vultr", proficiency: "intermediate", years: 4, lastUsed: 2026 },
      { name: "Terraform", proficiency: "basic", years: 1, lastUsed: 2026 },
      { name: "GitHub Actions", proficiency: "basic", years: 1, lastUsed: 2026 },
      { name: "Jenkins", proficiency: "basic", years: 2, lastUsed: 2026 },
      { name: "Kubernetes", proficiency: "basic", years: 1, lastUsed: 2025 },
    ],
  },
  {
    id: "data",
    skills: [
      { name: "PostgreSQL", proficiency: "intermediate", years: 5, lastUsed: 2026 },
      { name: "SQLite", proficiency: "intermediate", years: 6, lastUsed: 2026 },
      { name: "MongoDB", proficiency: "intermediate", years: 4, lastUsed: 2026 },
      { name: "MySQL", proficiency: "intermediate", years: 4, lastUsed: 2024 },
      { name: "Redis", proficiency: "intermediate", years: 4, lastUsed: 2026 },
      { name: "Kafka", proficiency: "intermediate", years: 2, lastUsed: 2026 },
      { name: "Memcached", proficiency: "basic", years: 1, lastUsed: 2024 },
      { name: "Firebase", proficiency: "basic", years: 1, lastUsed: 2023 },
    ],
  },
];

export function allSkillNames(): string[] {
  return SKILL_GROUPS.flatMap((group) => group.skills.map((skill) => skill.name));
}
