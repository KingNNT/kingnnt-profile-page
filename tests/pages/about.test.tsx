import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { TRADING } from "@/lib/profile";

const CATALOGS = { en, vi };

describe("about copy", () => {
  it.each(Object.entries(CATALOGS))("%s tells the trading chapter", (_locale, catalog) => {
    const about = (catalog as typeof en).about;
    expect(about.tradingLabel.length).toBeGreaterThan(0);
    expect(about.trading1.length).toBeGreaterThan(80);
  });

  it.each(Object.entries(CATALOGS))("%s names a milestone for every market", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).about);
    for (const milestone of TRADING) {
      expect(serialised).toContain(String(milestone.year));
    }
  });

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
});
