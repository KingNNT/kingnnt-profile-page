import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/skills",
  useRouter: () => ({ replace }),
}));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));

import { LanguageSwitcher } from "@/components/language-switcher";

describe("LanguageSwitcher", () => {
  it("keeps the reader on the same page when switching locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("button", { name: /language/i }));
    await user.click(await screen.findByText("Tiếng Việt"));
    expect(replace).toHaveBeenCalledWith("/skills", { locale: "vi" });
  });
});
