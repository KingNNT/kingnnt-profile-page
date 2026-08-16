import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/lib/profile";

const NAMED: Project = {
  id: "semikong",
  from: "2024-06",
  to: "2024-07",
  name: "SemiKong",
  url: "https://semikong.ai",
  role: "Team Lead",
  teamSize: 4,
  stack: ["Django", "Next.js"],
  featured: true,
};

const UNNAMED: Project = {
  id: "bank-kpi",
  from: "2025-11",
  to: "2026-04",
  name: null,
  url: null,
  role: "Full-stack Engineer",
  teamSize: 4,
  stack: ["Next.js", "AWS"],
  featured: true,
};

describe("ProjectCard", () => {
  it("links a public product to its site", () => {
    render(
      <ProjectCard
        project={NAMED}
        title="SemiKong"
        description="An open-source domain LLM."
        period="06.2024 — 07.2024"
      />,
    );
    expect(screen.getByRole("link", { name: /SemiKong/ })).toHaveAttribute(
      "href",
      "https://semikong.ai",
    );
  });

  /**
   * Nhãn link phải là tên sản phẩm hoặc hostname rút gọn, không bao giờ là
   * đường dẫn đầy đủ — đường dẫn của Orkestrators chứa tên công ty mà trang này
   * không nêu.
   */
  it("never prints the full url as the link text", () => {
    render(
      <ProjectCard
        project={{ ...NAMED, url: "https://www.artinleap.com/products/orkestrators" }}
        title="Orkestrators"
        description="An AI agent platform."
        period="05.2025 — now"
      />,
    );
    expect(screen.queryByText(/products\/orkestrators/)).toBeNull();
  });

  it("renders an unnamed project without a link", () => {
    render(
      <ProjectCard
        project={UNNAMED}
        title="Undisclosed client project"
        description="An enterprise KPI platform."
        period="11.2025 — 04.2026"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Undisclosed client project")).toBeInTheDocument();
  });

  it("lists the stack", () => {
    render(<ProjectCard project={UNNAMED} title="x" description="y" period="p" />);
    expect(screen.getByText("AWS")).toBeInTheDocument();
  });

  it("opens external links safely", () => {
    render(<ProjectCard project={NAMED} title="SemiKong" description="d" period="p" />);
    expect(screen.getByRole("link")).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });
});
