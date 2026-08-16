import { EXPERIENCE, featuredProjects, IDENTITY, SKILL_GROUPS } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { pageUrl } from "@/lib/site";

function period(from: string, to: string | null): string {
  return `${from} — ${to ?? "present"}`;
}

/**
 * Sinh từ registry route và tầng profile, không viết tay. Một file llms.txt
 * viết tay là một file sẽ lệch khỏi trang thật ngay lần sửa nội dung đầu tiên.
 */
export function buildLlmsTxt(locale: string): string {
  const lines: string[] = [
    `# ${IDENTITY.fullName}`,
    "",
    `> ${IDENTITY.jobTitle} — ${IDENTITY.englishName} / ${IDENTITY.nickname}. ` +
      `Based in ${IDENTITY.location.city}, ${IDENTITY.location.country}.`,
    "",
    "## Pages",
    "",
    ...ROUTES.map((route) => `- [${route.key}](${pageUrl(locale, route.path)})`),
    "",
    "## Roles",
    "",
    ...EXPERIENCE.map(
      (entry) =>
        `- ${entry.role} (${period(entry.from, entry.to)}) — ` +
        `${entry.domains.join(", ")}; markets: ${entry.markets.join(", ")}`,
    ),
    "",
    "## Selected work",
    "",
    ...featuredProjects().map((project) => {
      const label = project.name ?? "Undisclosed client project";
      const link = project.name !== null && project.url ? ` (${project.url})` : "";
      return `- ${label}${link} — ${project.role}; ${project.stack.join(", ")}`;
    }),
    "",
    "## Skills",
    "",
    ...SKILL_GROUPS.map(
      (group) =>
        `- ${group.id}: ${group.skills
          .map((skill) => `${skill.name} (${skill.proficiency}, last used ${skill.lastUsed})`)
          .join("; ")}`,
    ),
    "",
    "## Contact",
    "",
    `- Email: ${IDENTITY.email}`,
    ...IDENTITY.socials.map((social) => `- ${social.label}: ${social.url}`),
    "",
  ];

  return lines.join("\n");
}
