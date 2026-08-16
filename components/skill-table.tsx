import type { Proficiency, Skill } from "@/lib/profile";
import { cn } from "@/lib/utils";

const WEIGHT: Record<Proficiency, string> = {
  expert: "text-foreground",
  intermediate: "text-muted-foreground",
  basic: "text-muted-foreground/70",
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
            <td className="py-2 text-right text-muted-foreground tabular-nums">{skill.lastUsed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
