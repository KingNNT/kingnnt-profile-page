import { describe, expect, it } from "vitest";
import { FACETS } from "@/enums";
import { channelsFor, FACET_CONTACT_IDS, GENERAL_CONTACT_IDS } from "@/lib/profile";
import { findRoute } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

describe("contact page", () => {
  it("is a registered route", () => {
    expect(findRoute("contact")).toBeDefined();
  });

  it.each(Object.entries(CATALOGS))("%s labels every contact group", (_locale, catalog) => {
    const contact = (catalog as typeof en).contact;
    const groups = contact.groups as Record<string, string>;
    expect(groups.general.length).toBeGreaterThan(0);
    for (const facet of FACETS) {
      expect(groups[facet], `missing contact.groups.${facet}`).toBeTruthy();
    }
  });

  it.each(Object.entries(CATALOGS))("%s introduces the page", (_locale, catalog) => {
    const contact = (catalog as typeof en).contact;
    expect(contact.title.length).toBeGreaterThan(0);
    expect(contact.lead.length).toBeGreaterThan(40);
  });

  /**
   * Trang này là nơi duy nhất liệt kê đủ mọi kênh. Nếu một kênh có trong
   * `CONTACT_CHANNELS` mà không nhóm nào tham chiếu, nó vô hình với người đọc —
   * và không ai phát hiện ra cho tới khi cần dùng nó.
   */
  it("shows every channel in at least one group", () => {
    const shown = new Set(
      [
        ...channelsFor(GENERAL_CONTACT_IDS),
        ...FACETS.flatMap((facet) => channelsFor(FACET_CONTACT_IDS[facet])),
      ].map((c) => c.id),
    );
    expect(shown.has("work-email")).toBe(true);
    expect(shown.has("dev-email")).toBe(true);
    expect(shown.has("trader-email")).toBe(true);
    expect(shown.has("linkedin")).toBe(true);
    expect(shown.has("github")).toBe(true);
  });

  it.each(
    Object.entries(CATALOGS),
  )("%s no longer keeps a contact section in about", (_locale, catalog) => {
    expect((catalog as typeof en).about).not.toHaveProperty("contactLabel");
    expect((catalog as typeof en).about).not.toHaveProperty("contact");
  });
});
