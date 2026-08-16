import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { NavIndex } from "@/app/[locale]/(public)/_components/nav-index";

const entries = [
  { path: "about", label: "About", blurb: "About blurb" },
  { path: "experience", label: "Experience", blurb: "Experience blurb" },
  { path: "skills", label: "Skills", blurb: "Skills blurb" },
  { path: "projects", label: "Projects", blurb: "Projects blurb" },
];

describe("NavIndex", () => {
  it("lists every entry as a numbered item", () => {
    render(<NavIndex entries={entries} />);
    for (const index of ["01", "02", "03", "04"]) {
      expect(screen.getByText(index)).toBeInTheDocument();
    }
  });

  it("links each entry to its own route, in order", () => {
    render(<NavIndex entries={entries} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/about",
      "/experience",
      "/skills",
      "/projects",
    ]);
  });
});
