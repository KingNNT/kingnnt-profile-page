import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/**
 * English là catalog tham chiếu. Keyed theo locale để khi thêm một locale vào
 * `routing.locales` mà quên import catalog thì test này đỏ, thay vì locale đó
 * âm thầm không được kiểm tra.
 */
const CATALOGS: Record<string, unknown> = { en, vi };
const TRANSLATIONS = routing.locales.filter((locale) => locale !== routing.defaultLocale);

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

function arrayLengths(obj: unknown, prefix = ""): Record<string, number> {
  if (Array.isArray(obj)) {
    return obj.reduce<Record<string, number>>(
      (acc, item, i) => Object.assign(acc, arrayLengths(item, `${prefix}[${i}]`)),
      { [prefix]: obj.length },
    );
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).reduce<Record<string, number>>(
      (acc, [k, v]) => Object.assign(acc, arrayLengths(v, prefix ? `${prefix}.${k}` : k)),
      {},
    );
  }
  return {};
}

describe("message catalogs", () => {
  it("ships a catalog for every routed locale", () => {
    for (const locale of routing.locales) {
      expect(CATALOGS[locale], `no catalog imported for "${locale}"`).toBeDefined();
    }
  });

  describe.each(TRANSLATIONS)("%s against en", (locale) => {
    it("has an identical key structure", () => {
      expect(keyPaths(CATALOGS[locale]).sort()).toEqual(keyPaths(en).sort());
    });

    it("has identical array lengths at every path", () => {
      expect(arrayLengths(CATALOGS[locale])).toEqual(arrayLengths(en));
    });
  });
});
