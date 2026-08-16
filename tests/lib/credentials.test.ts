import { describe, expect, it } from "vitest";
import { AWARDS, CERTIFICATIONS, EDUCATION } from "@/lib/profile";

describe("credentials", () => {
  it("records the degree with its field and years", () => {
    expect(EDUCATION.institution).toBe("Electric Power University");
    expect(EDUCATION.from).toBe(2018);
    expect(EDUCATION.to).toBe(2023);
  });

  it("lists every certification with an issuer", () => {
    expect(CERTIFICATIONS.length).toBeGreaterThanOrEqual(4);
    for (const cert of CERTIFICATIONS) {
      expect(cert.issuer.length, cert.name).toBeGreaterThan(0);
    }
  });

  it("dates every award", () => {
    for (const award of AWARDS) {
      expect(award.year, award.id).toBeGreaterThan(2000);
    }
  });

  it("keeps credential ids unique", () => {
    const ids = [...CERTIFICATIONS, ...AWARDS].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
