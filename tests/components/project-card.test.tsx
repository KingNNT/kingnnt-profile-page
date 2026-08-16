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

const NAMED_NO_URL: Project = {
  id: "semikong",
  from: "2024-06",
  to: "2024-07",
  name: "SemiKong",
  url: null,
  role: "Team Lead",
  teamSize: 4,
  stack: ["Django", "Next.js"],
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
   * Nhãn link luôn luôn là tên sản phẩm, hết — không bao giờ url, không bao
   * giờ hostname rút gọn. Đường dẫn của Orkestrators chứa tên công ty mà
   * trang này không nêu, nên assertion phải khớp đúng bằng, không chỉ loại
   * trừ đường dẫn: một hostname như `artinleap.com` sẽ vẫn qua được test
   * "không phải đường dẫn" trong khi vẫn làm lộ tên công ty.
   */
  it("prints only the product name as the link text", () => {
    render(
      <ProjectCard
        project={{ ...NAMED, url: "https://www.artinleap.com/products/orkestrators" }}
        title="Orkestrators"
        description="An AI agent platform."
        period="05.2025 — now"
      />,
    );
    expect(screen.getByRole("link").textContent?.trim()).toBe("Orkestrators");
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

  it("renders a named project with no public site as text, not a link", () => {
    render(
      <ProjectCard
        project={NAMED_NO_URL}
        title="SemiKong"
        description="An open-source domain LLM."
        period="06.2024 — 07.2024"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("SemiKong")).toBeInTheDocument();
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
