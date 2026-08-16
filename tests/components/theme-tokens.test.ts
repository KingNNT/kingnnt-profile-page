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

function blockOf(selector: string): string {
  const match = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`no ${selector} block in app/globals.css`);
  return match[1];
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

  it("uses a darker accent in the light theme so contrast holds on white", () => {
    const lightness = (block: string) => {
      const m = block.match(/--primary:\s*oklch\(([\d.]+)/);
      if (!m) throw new Error("--primary is not an oklch() value");
      return Number(m[1]);
    };
    expect(lightness(light)).toBeLessThan(lightness(dark));
  });
});
