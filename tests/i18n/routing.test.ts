import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { routing } from "@/i18n/routing";

describe("routing", () => {
  it("routes exactly en and vi", () => {
    expect([...routing.locales].sort()).toEqual([LocaleSupport.EN, LocaleSupport.VI].sort());
  });

  it("defaults to English", () => {
    expect(routing.defaultLocale).toBe(LocaleSupport.EN);
  });

  it("always prefixes the locale, so every public URL is unambiguous", () => {
    expect(routing.localePrefix).toBe("always");
  });
});
