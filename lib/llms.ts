import { FACET_LABEL_EN, FACETS } from "@/enums";
import {
  channelsFor,
  type ContactChannelId,
  EXPERIENCE,
  FACET_CONTACT_IDS,
  featuredProjects,
  GENERAL_CONTACT_IDS,
  IDENTITY,
  SKILL_GROUPS,
} from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { pageUrl } from "@/lib/site";

function period(from: string, to: string | null): string {
  return `${from} — ${to ?? "present"}`;
}

function contactLine(label: string, ids: readonly ContactChannelId[]): string {
  const rendered = channelsFor(ids).map((channel) =>
    channel.kind === "email" ? channel.address : `${channel.label}: ${channel.url}`,
  );
  return `- ${label}: ${rendered.join(", ")}`;
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
    "## Software engineering",
    "",
    "### Roles",
    "",
    ...EXPERIENCE.map(
      (entry) =>
        `- ${entry.role} (${period(entry.from, entry.to)}) — ` +
        `${entry.domains.join(", ")}; markets: ${entry.markets.join(", ")}`,
    ),
    "",
    "### Selected work",
    "",
    ...featuredProjects().map((project) => {
      const label = project.name ?? "Undisclosed client project";
      const link = project.name !== null && project.url ? ` (${project.url})` : "";
      return `- ${label}${link} — ${project.role}; ${project.stack.join(", ")}`;
    }),
    "",
    "### Skills",
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
    contactLine("General", GENERAL_CONTACT_IDS),
    ...FACETS.filter((facet) => FACET_CONTACT_IDS[facet].length > 0).map((facet) =>
      contactLine(FACET_LABEL_EN[facet], FACET_CONTACT_IDS[facet]),
    ),
    "",
  ];

  return lines.join("\n");
}
