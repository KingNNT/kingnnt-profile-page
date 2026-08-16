import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { NavIndex } from "@/app/[locale]/(public)/_components/nav-index";

describe("NavIndex", () => {
  it("lists every non-home route as a numbered entry", () => {
    render(<NavIndex />);
    for (const index of ["01", "02", "03", "04"]) {
      expect(screen.getByText(index)).toBeInTheDocument();
    }
  });

  it("links each entry to its route", () => {
    render(<NavIndex />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});
