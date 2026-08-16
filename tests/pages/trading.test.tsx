import { describe, expect, it } from "vitest";
import { TRADING } from "@/lib/profile";
import { findRoute } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

describe("trading facet", () => {
  it("is a registered route with its own facet", () => {
    expect(findRoute("trading")?.facet).toBe("trading");
  });

  it.each(Object.entries(CATALOGS))("%s tells the trading chapter", (_locale, catalog) => {
    const trading = (catalog as typeof en).trading;
    expect(trading.title.length).toBeGreaterThan(0);
    expect(trading.lead1.length).toBeGreaterThan(80);
  });

  it.each(Object.entries(CATALOGS))("%s names a milestone for every market", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).trading);
    for (const milestone of TRADING) {
      expect(serialised).toContain(String(milestone.year));
    }
  });

  /**
   * Trang cá nhân này không phải nội dung tài chính. Một câu khoe hiệu suất sẽ
   * kéo nó vào phạm trù YMYL mà nó không có lý do gì để bước vào. Ràng buộc
   * này đi theo nội dung trading sang nhà mới của nó.
   */
  it.each(
    Object.entries(CATALOGS),
  )("%s claims no returns and gives no advice", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).trading);
    expect(serialised).not.toMatch(/\d+\s*%/);
    expect(serialised).not.toMatch(/\b(ROI|lợi nhuận|profit|returns)\b/i);
  });
});
