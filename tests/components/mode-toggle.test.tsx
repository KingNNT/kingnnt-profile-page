import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme, theme: "dark" }) }));

import { ModeToggle } from "@/components/mode-toggle";

describe("ModeToggle", () => {
  it("exposes an accessible name for the trigger", () => {
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
  });

  it("switches to light when the light item is chosen", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await user.click(await screen.findByText("Light"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
