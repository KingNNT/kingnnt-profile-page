import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// `import.meta.url` is assigned to a variable before use: Vite statically special-cases
// the literal pattern `new URL("...", import.meta.url)` as a browser asset reference and
// resolves it against the dev server origin instead of the filesystem, which breaks this
// Node-side file read under vitest.
const moduleUrl = import.meta.url;
const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", moduleUrl)), "utf8");

/** Token mà component dựa vào. Thiếu một cái ở một theme là lỗi im lặng. */
const REQUIRED = [
  "--background",
  "--foreground",
  "--primary",
  "--primary-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--rule",
  "--radius",
];

const AA_SMALL_TEXT_MIN_CONTRAST = 4.5;

function blockOf(selector: string): string {
  const match = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`no ${selector} block in app/globals.css`);
  return match[1];
}

/**
 * `oklch(L C H)` -> sRGB, relative luminance, WCAG contrast ratio. Written inline
 * rather than pulled from a package: this is the one place the site's own contrast
 * claims get checked, so the math should be readable and self-contained here.
 */
function oklchOf(block: string, token: string): [number, number, number] {
  const match = block.match(new RegExp(`${token}:\\s*oklch\\(([^)]+)\\)`));
  if (!match) throw new Error(`${token} is not an oklch() value`);
  // Drop an optional `/ <alpha>` before splitting on whitespace, so an
  // alpha-slash value like `oklch(0 0 0 / 0.12)` parses as L C H instead of
  // risking the alpha token landing in `h` and silently producing NaN.
  const [colorPart] = match[1].split("/");
  const parts = colorPart.trim().split(/\s+/).map(Number);
  const [l, c, h] = parts;
  if (parts.length < 2 || [l, c, h].some((n) => n !== undefined && Number.isNaN(n))) {
    throw new Error(`${token} has an unparseable oklch() value: "oklch(${match[1]})"`);
  }
  return [l, c, h ?? 0];
}

function oklchToSrgb([L, C, Hdeg]: [number, number, number]): [number, number, number] {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toSrgb = (channel: number) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return [toSrgb(rLin), toSrgb(gLin), toSrgb(bLin)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linearize = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG 2.x contrast ratio between two OKLCH colors, order-independent. */
function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const lumA = relativeLuminance(oklchToSrgb(a));
  const lumB = relativeLuminance(oklchToSrgb(b));
  const [lighter, darker] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

describe("theme tokens", () => {
  const light = blockOf(":root");
  const dark = blockOf("\\.dark");

  it.each(REQUIRED)("defines %s in the light theme", (token) => {
    expect(light).toContain(`${token}:`);
  });

  // --radius không đổi giữa hai theme; nó chỉ cần tồn tại ở :root. Lọc ra khỏi
  // danh sách thay vì return sớm trong thân test — một test chạy mà không assert
  // gì là một test báo xanh vô nghĩa.
  it.each(
    REQUIRED.filter((token) => token !== "--radius"),
  )("defines %s in the dark theme", (token) => {
    expect(dark).toContain(`${token}:`);
  });

  /**
   * Spec §6.1 requires >= 4.5:1 for `--primary`: it is used as small text in
   * several places (hero job title, section index numerals, project role, the
   * current nav link, `mailto:` links, NavIndex numerals), which puts it under
   * the AA small-text floor, not the 3:1 large-text/UI-component one. This is
   * the test that is supposed to catch a light accent that looks fine but
   * fails the ratio the spec itself commits to.
   */
  it.each([
    ["light", light],
    ["dark", dark],
  ])("keeps --primary at >= 4.5:1 against --background in the %s theme", (_label, block) => {
    const primary = oklchOf(block, "--primary");
    const background = oklchOf(block, "--background");
    const ratio = contrastRatio(primary, background);
    expect(ratio).toBeGreaterThanOrEqual(AA_SMALL_TEXT_MIN_CONTRAST);
  });
});
