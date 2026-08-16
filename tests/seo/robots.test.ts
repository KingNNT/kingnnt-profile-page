import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  const result = robots();
  const agents = (Array.isArray(result.rules) ? result.rules : [result.rules]).flatMap((rule) =>
    Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent ?? ""],
  );

  it("points at the sitemap", () => {
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("allows everyone by default", () => {
    const wildcard = (Array.isArray(result.rules) ? result.rules : [result.rules]).find((rule) =>
      (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]).includes("*"),
    );
    expect(wildcard?.allow).toBe("/");
  });

  /**
   * Mỗi hãng chạy nhiều agent tách biệt cho training, indexing và live fetch.
   * Chỉ cho phép agent training là lỗi thường gặp — trang được dùng để huấn
   * luyện nhưng không bao giờ được trích dẫn.
   */
  it.each([
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
  ])("names %s explicitly", (agent) => {
    expect(agents).toContain(agent);
  });
});
