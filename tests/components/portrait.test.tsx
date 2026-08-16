import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt, src, priority, ...rest }: Record<string, unknown> & { alt: string }) => (
    // biome-ignore lint: test double for next/image
    <img alt={alt} src={String(src)} data-priority={String(Boolean(priority))} {...rest} />
  ),
}));

import { Portrait } from "@/components/portrait";

describe("Portrait", () => {
  it("names the person in the alt text", () => {
    render(<Portrait />);
    expect(screen.getByAltText(/Ninh Ngọc Tuấn/)).toBeInTheDocument();
  });

  it("marks itself as priority when it is the LCP element", () => {
    render(<Portrait priority />);
    expect(screen.getByRole("img")).toHaveAttribute("data-priority", "true");
  });
});
