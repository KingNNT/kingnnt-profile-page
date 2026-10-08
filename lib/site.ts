import { LocaleSupport } from "@/enums";
import { routing } from "@/i18n/routing";
import { IDENTITY } from "@/lib/profile";

const PROTOCOL = process.env.NEXT_PUBLIC_SITE_PROTOCOL || "https";

/**
 * Origin chuẩn. Đặt `NEXT_PUBLIC_SITE_URL` trong môi trường preview của Vercel,
 * nếu không canonical của bản preview sẽ trỏ về production.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `${PROTOCOL}://kingnnt.org`).replace(
  /\/$/,
  "",
);

export const SITE_NAME = IDENTITY.nickname;

/**
 * What every page title but the homepage's ends with.
 *
 * Not `SITE_NAME`: the brand is "KingNNT", but a stranger searching for the
 * person types the real name, and a title of "About | KingNNT" never contains
 * it. Only the homepage title carries the full name otherwise, which leaves
 * the other pages unable to answer the query that matters most.
 */
export const TITLE_SUFFIX = `${IDENTITY.fullName} (${IDENTITY.nickname})`;

/** Thẻ BCP-47 cho Open Graph và hreflang. */
export const OG_LOCALE: Record<string, string> = {
  [LocaleSupport.EN]: "en_US",
  [LocaleSupport.VI]: "vi_VN",
};

/** URL tuyệt đối của một trang. `path` rỗng cho ra chính gốc của locale. */
export function pageUrl(locale: string, path: string): string {
  return path === "" ? `${SITE_URL}/${locale}` : `${SITE_URL}/${locale}/${path}`;
}

export function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, pageUrl(locale, path)]));
}
