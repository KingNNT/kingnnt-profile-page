import { describe, expect, it } from "vitest";
import { formatPeriod } from "@/lib/format";

describe("formatPeriod", () => {
  it("renders a closed period as month.year on both ends", () => {
    expect(formatPeriod("2024-04", "2025-10", "now")).toBe("04.2024 — 10.2025");
  });

  it("substitutes the translated label for an ongoing period", () => {
    expect(formatPeriod("2026-07", null, "nay")).toBe("07.2026 — nay");
  });

  it("keeps the leading zero of a single-digit month", () => {
    expect(formatPeriod("2020-01", "2020-09", "now")).toBe("01.2020 — 09.2020");
  });
});
