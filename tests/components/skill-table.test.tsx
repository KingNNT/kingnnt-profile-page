import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillTable } from "@/components/skill-table";
import type { Skill } from "@/lib/profile";

const SKILLS: Skill[] = [
  { name: "TypeScript", proficiency: "expert", years: 4, lastUsed: 2026 },
  { name: "Kubernetes", proficiency: "basic", years: 1, lastUsed: 2025 },
];

const COLUMNS = { name: "Skill", proficiency: "Level", years: "Years", lastUsed: "Last used" };
const LABELS = { expert: "Expert", intermediate: "Intermediate", basic: "Basic" };

function renderTable() {
  return render(
    <SkillTable skills={SKILLS} columns={COLUMNS} proficiencyLabels={LABELS} caption="Languages" />,
  );
}

describe("SkillTable", () => {
  it("is a real table with a caption, so it is navigable by screen reader", () => {
    renderTable();
    expect(screen.getByRole("table", { name: "Languages" })).toBeInTheDocument();
  });

  it("heads every column", () => {
    renderTable();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
  });

  /**
   * Mục "basic" phải hiện. Một bảng chỉ toàn "expert" là một bảng không ai tin;
   * giá trị của nó nằm ở chỗ nó dám nói mình yếu ở đâu.
   */
  it("shows low-proficiency rows rather than hiding them", () => {
    renderTable();
    const row = screen.getByRole("row", { name: /Kubernetes/ });
    expect(within(row).getByText("Basic")).toBeInTheDocument();
  });

  it("shows the year a skill was last used", () => {
    renderTable();
    const row = screen.getByRole("row", { name: /Kubernetes/ });
    expect(within(row).getByText("2025")).toBeInTheDocument();
  });

  it("renders one row per skill plus the header row", () => {
    renderTable();
    expect(screen.getAllByRole("row")).toHaveLength(SKILLS.length + 1);
  });

  /**
   * The table has no focusable content of its own, unlike site-header's nav
   * whose links make scrolling a side effect of tabbing. On a narrow viewport
   * a keyboard-only user must be able to reach the scroll container directly,
   * and a tabbable region without a name is just an unlabelled tab stop.
   */
  it("exposes the scroll wrapper as a focusable, named region", () => {
    renderTable();
    const region = screen.getByRole("region", { name: "Languages" });
    expect(region).toHaveAttribute("tabIndex", "0");
  });
});
