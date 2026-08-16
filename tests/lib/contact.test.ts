import { describe, expect, it } from "vitest";
import { FACETS } from "@/enums";
import {
  CONTACT_CHANNELS,
  channelsFor,
  FACET_CONTACT_IDS,
  GENERAL_CONTACT_IDS,
  primaryEmail,
  profileChannels,
} from "@/lib/profile/contact";

describe("contact channels", () => {
  it("keeps channel ids unique", () => {
    const ids = CONTACT_CHANNELS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * `Record<Facet, …>` ép phải có một danh sách cho mỗi facet, nhưng không ép
   * các id bên trong danh sách đó có thật. Đây là lỗ duy nhất kiểu không bịt
   * được, nên nó phải có test.
   */
  it("references only channels that exist", () => {
    const known = new Set(CONTACT_CHANNELS.map((c) => c.id));
    const referenced = [...GENERAL_CONTACT_IDS, ...FACETS.flatMap((f) => FACET_CONTACT_IDS[f])];
    for (const id of referenced) {
      expect(known.has(id), `unknown contact channel id "${id}"`).toBe(true);
    }
  });

  it("gives every facet at least one channel", () => {
    for (const facet of FACETS) {
      expect(FACET_CONTACT_IDS[facet].length, facet).toBeGreaterThan(0);
    }
  });

  it("gives every facet an email people can actually write to", () => {
    for (const facet of FACETS) {
      const emails = channelsFor(FACET_CONTACT_IDS[facet]).filter((c) => c.kind === "email");
      expect(emails.length, facet).toBeGreaterThan(0);
    }
  });

  /**
   * Chủ trang dùng cùng một email cho nhóm chung và nhánh creator. Đó là chủ ý,
   * và nó chỉ được phép tồn tại dưới dạng MỘT bản ghi được hai nhóm tham
   * chiếu — không phải hai bản ghi trùng địa chỉ.
   */
  it("shares one record when two groups use the same channel", () => {
    const addresses = CONTACT_CHANNELS.filter((c) => c.kind === "email").map((c) =>
      c.kind === "email" ? c.address : "",
    );
    expect(new Set(addresses).size).toBe(addresses.length);
    expect(FACET_CONTACT_IDS.creator).toContain(GENERAL_CONTACT_IDS[0]);
  });

  it("throws on an unknown id instead of rendering a hole", () => {
    // @ts-expect-error — id không thuộc ContactChannelId, đây chính là điều đang kiểm
    expect(() => channelsFor(["nope"])).toThrow(/nope/);
  });

  it("resolves ids in the order given", () => {
    expect(channelsFor(FACET_CONTACT_IDS.dev).map((c) => c.id)).toEqual([
      "dev-email",
      "linkedin",
      "github",
    ]);
  });

  it("takes the primary email from the general group", () => {
    expect(primaryEmail()).toBe("Work.KingNNT@gmail.com");
  });

  it("exposes every profile channel for sameAs, over https", () => {
    const profiles = profileChannels();
    expect(profiles.length).toBeGreaterThan(0);
    for (const channel of profiles) {
      expect(new URL(channel.url).protocol, channel.url).toBe("https:");
    }
  });

  it("never lets a profile channel look like an email", () => {
    for (const channel of profileChannels()) {
      expect(channel).not.toHaveProperty("address");
    }
  });
});
