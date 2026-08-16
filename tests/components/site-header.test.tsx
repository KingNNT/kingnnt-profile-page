import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// SiteHeader render cả LanguageSwitcher và ModeToggle, nên mock phải phủ luôn
// `useRouter` và `next-themes` — thiếu một trong hai thì test ném lỗi ở chính
// component con chứ không phải ở thứ đang được kiểm.
let mockPathname = "/about";
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: () => {} }),
}));

vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: () => {}, theme: "dark" }) }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      home: "Home",
      about: "About",
      experience: "Experience",
      skills: "Skills",
      projects: "Projects",
    })[key] ?? key,
  useLocale: () => "en",
}));

import { SiteHeader } from "@/components/site-header";

describe("SiteHeader", () => {
  it("links every navigation route from the registry", () => {
    mockPathname = "/about";
    render(<SiteHeader />);
    for (const name of ["About", "Experience", "Skills", "Projects"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("marks the current page for assistive technology", () => {
    mockPathname = "/about";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark other pages as current", () => {
    mockPathname = "/about";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveAttribute("aria-current");
  });

  it("does not mark the identity link as current on a non-home route", () => {
    mockPathname = "/about";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "KingNNT" })).not.toHaveAttribute("aria-current");
  });

  it("marks the identity link as current on the home page", () => {
    mockPathname = "/";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "KingNNT" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark any nav route as current on the home page", () => {
    mockPathname = "/";
    render(<SiteHeader />);
    for (const name of ["About", "Experience", "Skills", "Projects"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute("aria-current");
    }
  });
});
