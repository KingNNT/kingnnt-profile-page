import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// SiteHeader render cả LanguageSwitcher và ModeToggle, nên mock phải phủ luôn
// `useRouter` và `next-themes` — thiếu một trong hai thì test ném lỗi ở chính
// component con chứ không phải ở thứ đang được kiểm.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/about",
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
    render(<SiteHeader />);
    for (const name of ["About", "Experience", "Skills", "Projects"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("marks the current page for assistive technology", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark other pages as current", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveAttribute("aria-current");
  });
});
