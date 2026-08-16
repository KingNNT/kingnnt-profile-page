import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Từng answer-engine crawler được nêu đích danh. Mỗi hãng chạy nhiều agent tách
 * biệt — một cho training, một cho index tìm kiếm, một cho lần fetch trực tiếp
 * khi người dùng hỏi. Chỉ cho phép agent training nghĩa là trang này góp vào mô
 * hình nhưng không bao giờ được trích dẫn lại, tức là mất đúng phần giá trị.
 */
const ANSWER_ENGINE_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Applebot-Extended",
  "Applebot",
  "CCBot",
  "Bytespider",
];

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: ANSWER_ENGINE_AGENTS, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
