/**
 * Ba URL của giai đoạn một-mảng. Chúng từng được index, nên chúng được giữ
 * sống bằng redirect vĩnh viễn thay vì để rơi vào 404.
 *
 * File này cố ý KHÔNG import gì: `next.config.ts` nạp nó ngoài đường path
 * alias của tsconfig, nên bất kỳ import `@/...` nào ở đây (kể cả bắc cầu) sẽ
 * hỏng lúc build. Đổi lại, matcher locale là bản chép tay —
 * `tests/seo/redirects.test.ts` neo nó với `routing.locales`.
 */
export const LEGACY_DEV_PAGES = ["experience", "skills", "projects"] as const;

export const REDIRECT_LOCALE_MATCHER = ":locale(en|vi)";

export function legacyRedirects() {
  return LEGACY_DEV_PAGES.map((page) => ({
    source: `/${REDIRECT_LOCALE_MATCHER}/${page}`,
    destination: `/:locale/dev/${page}`,
    permanent: true,
  }));
}
