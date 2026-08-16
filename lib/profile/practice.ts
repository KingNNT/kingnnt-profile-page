export interface PracticeArea {
  id: string;
}

/**
 * Areas of practice that carry no proficiency, years, or last-used figure —
 * the CV records them as prose, not as table rows. Only the ids live here;
 * the label and description are translated, so they live in the catalogs.
 * Deliberately NOT folded into SKILL_GROUPS: a row in that table promises four
 * verifiable facts, and inventing them for these would undo the reason the
 * table is trustworthy.
 */
export const PRACTICE_AREAS: readonly PracticeArea[] = [
  { id: "patterns" },
  { id: "architecture" },
  { id: "systems" },
  { id: "design" },
  { id: "delivery" },
];

/**
 * Subject matter for `knowsAbout` in the Person schema, sitting alongside the
 * tool names from `SKILL_GROUPS`.
 *
 * The tool names alone are a poor description of a person: "TypeScript, React,
 * Docker" is true of millions and tells an answer engine nothing about what
 * the work is. These say what the work is. Every one of them is already
 * evidenced in prose on the site — they are a restatement for machines, not a
 * wider claim than the pages make.
 *
 * Deliberately untranslated: `knowsAbout` is matched by machines against a
 * shared vocabulary, and emitting a Vietnamese variant per locale would split
 * one topic association into two weaker ones.
 */
export const EXPERTISE_TOPICS: readonly string[] = [
  "Solution architecture",
  "Presales engineering",
  "Technical discovery",
  "Software effort estimation",
  "Cloud cost optimization",
  "AI document processing",
  "Full-stack web development",
  "System design",
  "Enterprise system integration",
];
