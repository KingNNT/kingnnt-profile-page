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
