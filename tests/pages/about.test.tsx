import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { SPOKEN_LANGUAGES } from "@/lib/profile";

const CATALOGS = { en, vi };

describe("about copy", () => {
  /**
   * Trang cá nhân này không phải nội dung tài chính. Một câu khoe hiệu suất sẽ
   * kéo nó vào phạm trù YMYL mà nó không có lý do gì để bước vào.
   */
  it.each(
    Object.entries(CATALOGS),
  )("%s claims no returns and gives no advice", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).about);
    expect(serialised).not.toMatch(/\d+\s*%/);
    expect(serialised).not.toMatch(/\b(ROI|lợi nhuận|profit|returns)\b/i);
  });

  it.each(
    Object.entries(CATALOGS),
  )("%s has a term and a detail for every spoken language", (_locale, catalog) => {
    const languages = (catalog as typeof en).about.languages;
    for (const language of SPOKEN_LANGUAGES) {
      const entry = (languages as Record<string, { term: string; detail: string }>)[language.id];
      expect(entry, `missing about.languages.${language.id}`).toBeTruthy();
      expect(entry.term.length).toBeGreaterThan(0);
      expect(entry.detail.length).toBeGreaterThan(0);
    }
  });
});
