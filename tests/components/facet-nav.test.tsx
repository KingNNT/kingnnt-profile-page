import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let mockPathname = "/dev/skills";
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ devExperience: "Experience", devSkills: "Skills", devProjects: "Projects" })[key] ?? key,
}));

import { FacetNav } from "@/components/facet-nav";

describe("FacetNav", () => {
  it("links every child route of the facet", () => {
    mockPathname = "/dev/skills";
    render(<FacetNav facet="dev" />);
    for (const name of ["Experience", "Skills", "Projects"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        expect.stringContaining("/dev/"),
      );
    }
  });

  it("marks the current page for assistive technology", () => {
    mockPathname = "/dev/skills";
    render(<FacetNav facet="dev" />);
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark sibling pages as current", () => {
    mockPathname = "/dev/skills";
    render(<FacetNav facet="dev" />);
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
  });

  /** Trên chính trang hub của nhánh, không mục con nào là trang hiện tại. */
  it("marks nothing as current on the facet hub", () => {
    mockPathname = "/dev";
    render(<FacetNav facet="dev" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("renders nothing for a facet that has no hub at all", () => {
    const { container } = render(<FacetNav facet="creator" />);
    expect(container.querySelector("nav")).toBeNull();
  });
});
