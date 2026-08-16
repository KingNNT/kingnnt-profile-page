import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LOGO_MARK_PATH, LogoMark } from "@/components/logo";

// See the note in `tests/lib/anonymity.test.ts` for why `import.meta.url` has
// to pass through a variable before reaching `new URL(...)`.
const moduleUrl = import.meta.url;
const ROOT = fileURLToPath(new URL("../../", moduleUrl));

describe("LogoMark", () => {
  it("stays in step with the vector original the app icons come from", () => {
    // `assets/logo-mark.svg` is the vector original that `app/icon.png` and
    // `app/apple-icon.png` are rendered from. The component restates that
    // geometry because svgr is not enabled, so the .svg cannot be imported
    // directly. Editing one side and forgetting the other leaves the favicon
    // and the on-page logo showing different shapes, and nothing else catches
    // that.
    const svg = readFileSync(`${ROOT}assets/logo-mark.svg`, "utf8");
    expect(svg).toContain(LOGO_MARK_PATH);
  });

  it("keeps the mark decorative", () => {
    // The header link already carries the "KingNNT" text beside it; exposing
    // the svg to assistive tech would make the link announce the name twice.
    const { container } = render(<LogoMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("inherits the surrounding text colour instead of baking one in", () => {
    // The site is dark-first but ships a light theme too; a hard-coded colour
    // would need a second asset. This is the deliberate difference from the
    // icons under `app/`.
    const { container } = render(<LogoMark />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });

  it("lets the caller override the default size", () => {
    const { container } = render(<LogoMark className="h-6 w-6" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("h-6");
    expect(svg?.getAttribute("class")).not.toContain("h-4");
  });
});
