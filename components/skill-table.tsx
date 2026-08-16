import type { Proficiency, Skill } from "@/lib/profile";
import { cn } from "@/lib/utils";

const WEIGHT: Record<Proficiency, string> = {
  expert: "text-foreground",
  intermediate: "text-muted-foreground",
  // De-emphasised via style, not opacity: `/70` dropped this row below AA on a
  // page whose whole point is that weak entries stay honestly legible.
  basic: "text-muted-foreground italic",
};

export function SkillTable({
  skills,
  columns,
  proficiencyLabels,
  caption,
}: {
  skills: readonly Skill[];
  columns: { name: string; proficiency: string; years: string; lastUsed: string };
  proficiencyLabels: Record<Proficiency, string>;
  caption: string;
}) {
  return (
    // A four-column mono table can still outgrow a 375px viewport (long skill
    // names, or a locale where the translated column headers run wider). It
    // must scroll inside its own box, never widen the page. The table has no
    // focusable content of its own (unlike site-header's nav, whose links make
    // the scroll a side effect of tabbing), so the wrapper itself needs to be
    // a named, focusable region or a keyboard-only user can never reach the
    // `Years` / `Last used` columns on a narrow viewport.
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full border-collapse text-left font-mono text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            <th scope="col" className="py-2 font-normal">
              {columns.name}
            </th>
            <th scope="col" className="py-2 font-normal">
              {columns.proficiency}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {columns.years}
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              {columns.lastUsed}
            </th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill.name} className="border-b border-rule/50 last:border-0">
              <th scope="row" className="py-2 font-normal text-foreground">
                {skill.name}
              </th>
              <td className={cn("py-2", WEIGHT[skill.proficiency])}>
                {proficiencyLabels[skill.proficiency]}
              </td>
              <td className="py-2 text-right text-muted-foreground tabular-nums">{skill.years}</td>
              <td className="py-2 text-right text-muted-foreground tabular-nums">
                {skill.lastUsed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
