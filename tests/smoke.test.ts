import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("resolves the @/ alias to the repo root", async () => {
    const pkg = await import("@/package.json");
    expect(pkg.default.name).toBe("kingnnt-profile-page");
  });
});
