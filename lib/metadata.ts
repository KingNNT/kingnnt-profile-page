import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { IDENTITY } from "@/lib/profile";
import { languageAlternates, OG_LOCALE, pageUrl, SITE_NAME, SITE_URL } from "@/lib/site";

interface PageMetadataArgs {
  locale: string;
  /** Path sau locale prefix; chuỗi rỗng cho trang chủ. */
  path: string;
  title: string;
  description: string;
}

/**
 * Canonical, hreflang và Open Graph cho từng trang.
 *
 * Đặt ở page chứ không ở layout: layout bọc mọi route, nên canonical khai ở đó
 * sẽ trỏ tất cả các trang về cùng một URL.
 */
export function pageMetadata({ locale, path, title, description }: PageMetadataArgs): Metadata {
  const url = pageUrl(locale, path);

  /**
   * Tham chiếu tường minh thay vì để Next tự gộp file convention
   * `opengraph-image`: khi một trang khai báo `openGraph` trong
   * `generateMetadata`, ảnh theo convention không được gộp vào và trang ship ra
   * không có og:image nào cả.
   */
  const image = {
    url: `${SITE_URL}/${locale}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${IDENTITY.fullName} — ${IDENTITY.jobTitle}`,
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates(path),
        "x-default": pageUrl(routing.defaultLocale, path),
      },
    },
    openGraph: {
      type: "profile",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
