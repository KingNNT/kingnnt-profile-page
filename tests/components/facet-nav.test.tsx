import { render } from "@testing-library/react";
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
  it("renders nothing while the facet has no child routes", () => {
    const { container } = render(<FacetNav facet="dev" />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("renders nothing for a facet that has no hub at all", () => {
    const { container } = render(<FacetNav facet="creator" />);
    expect(container.querySelector("nav")).toBeNull();
  });
});
