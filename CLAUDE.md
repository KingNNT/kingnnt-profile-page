# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Overview

Trang cá nhân song ngữ EN/VI của Ninh Ngọc Tuấn (Jesse / KingNNT) tại
`kingnnt.org`. Next.js 16 App Router + React 19 + TypeScript strict, Tailwind v4,
shadcn/ui. Năm route tĩnh: `/`, `/about`, `/experience`, `/skills`, `/projects`.

Bộ test xanh toàn bộ (`pnpm test` là nguồn sự thật cho số lượng — đừng chép
con số vào đây, nó lệch ngay commit kế tiếp). `pnpm lint` sạch cảnh báo và
không có comment `eslint-disable` nào trong repo — cả hai là tính chất cố ý,
không phải tình cờ.

## Ràng buộc ẩn danh

**Trang này không nêu tên bất kỳ nơi làm việc, công ty đứng sau sản phẩm, khách
hàng cuối hay codename dự án nội bộ nào.** Chỉ sản phẩm public có website được
nêu tên: IntentSite, Orkestrators, SemiKong, Live Call. Trường học và đơn vị
cấp chứng chỉ (Electric Power University, Anthropic, Coursera, LandingAI) nêu
tên thẳng ở `lib/profile/credentials.ts` — chúng không tuyển và không phải
khách hàng, nên không rơi vào ràng buộc trên.

`tests/lib/anonymity.test.ts` giữ denylist và quét `components/**`, `app/**`,
`lib/**` (bỏ trùng `lib/profile/**`) cùng `messages/**`, mỗi cây được khẳng
định non-empty riêng (một cây rỗng không được phép âm thầm kéo test xanh
theo). Có thêm hai test khẳng định chính bộ dò hoạt động: một chuỗi có tên
cấm ngoài trường `url` phải bị bắt, một chuỗi chỉ có tên cấm bên trong `url`
thì không. Ràng buộc áp lên các khẳng định văn xuôi về nơi làm việc; địa chỉ
công khai của một sản phẩm được miễn trừ ở mọi cách serialize, có markup hay
không — vì vậy trường `url` được miễn trừ (trang sản phẩm Orkestrators nằm
dưới tên công ty bị cấm, `artinleap.com`) — bù lại nhãn link hiển thị chỉ
được là tên sản phẩm, hết.

In JSON-LD: still no `worksFor` and no `affiliation`. The blanket ban on
`Organization` nodes was lifted deliberately — credential issuers are emitted
as `Organization` under `hasCredential`, because a certifying body is a
third-party anchor for the person entity and this site gave up the usual one by
refusing to name employers. The test in `tests/seo/structured-data.test.ts` got
narrower rather than weaker: it walks the whole graph and asserts every
organisation named anywhere in it is one of the issuers in `credentials.ts`. An
employer smuggled in under any field name still fails.

## Commands

Package manager là **pnpm**. `pnpm-lock.yaml` là lockfile duy nhất — thêm
`yarn.lock` sẽ khiến Vercel âm thầm đổi package manager lúc deploy.
`pnpm-workspace.yaml` khai `allowBuilds` cho bốn package (`@parcel/watcher`,
`@swc/core`, `sharp`, `unrs-resolver`) — thiếu file này thì cơ chế chặn
supply-chain của pnpm làm `install` đỏ, kể cả trên CI.

    pnpm dev            # http://localhost:3000
    pnpm build
    pnpm test           # vitest chạy một lần
    pnpm test:watch
    pnpm lint           # eslint
    pnpm format         # biome format --write
    pnpm format:check   # CI chạy cái này

Chạy một file test: `pnpm exec vitest run tests/components/timeline.test.tsx`

## Format và lint tách đôi

Cố ý, không gộp lại. **Biome** chỉ format (linter tắt trong `biome.json`).
**ESLint** chỉ lint qua `eslint-config-next`. `eslint.config.mjs` có một
override cho `tests/**` tắt riêng `@next/next/no-img-element`, vì test double
của `next/image` cố ý render `<img>` thô và không nên bị cảnh báo vì điều đó.

## Git

Nhánh tích hợp là **`develop`**, không commit thẳng vào. Nhánh feature đặt tên
`feature/<kebab>`. Conventional Commits, commitlint bắt buộc. Không thêm dòng
`Co-Authored-By` hay attribution vào commit message.

## Kiến trúc

### Tách dữ liệu khỏi văn xuôi

`lib/profile/*.ts` giữ dữ liệu có cấu trúc (typed, một nguồn sự thật):
identity, credentials, experience, skills, projects, trading. `messages/{en,vi}.json`
chỉ giữ văn xuôi, khoá theo `id` trong `lib/profile`. Component join hai nguồn.

Sửa email, link, số năm → sửa `lib/profile`. Sửa câu chữ → sửa cả hai catalog.
`tests/messages/parity.test.ts` bắt lỗi khi hai catalog lệch key nhau.

Một vài trang dựng key catalog *lúc chạy* — `t(\`entries.${id}\`)`,
`t(\`groups.${id}\`)`, `t(\`awards.${id}\`)` — nên TypeScript không kiểm được
id trong `lib/profile` có khớp key trong JSON hay không; lệch chỉ lộ ra ở HTML
render dưới dạng key thô (`about.awards.icpc`) mà next-intl trả về khi
fallback. `tests/messages/id-coverage.test.ts` bắt lệch đó theo cả hai chiều
(id thiếu bản dịch, và bản dịch mồ côi không id nào) cho mọi id được dựng key
runtime, ở cả hai locale. Đây là tấm chắn chính chống một key thô lọt ra HTML
crawler đọc được.

**Cập nhật CV thì cập nhật luôn `lib/profile/skills.ts`.** Trường `lastUsed`
là trường tự tố cáo: để nguyên vài năm là nó thành sai sự thật.

`lib/format.ts` xuất `formatPeriod(from, to, nowLabel)`, dùng chung bởi trang
experience và projects để định dạng "07.2026 — hiện tại" theo cột mono thẳng
hàng ở cả hai locale, thay vì `Intl.DateTimeFormat` (tên tháng đã dịch dài
ngắn khác nhau sẽ phá cột).

`Project` (`lib/profile/projects.ts`) là **discriminated union**:
`{ name: string; url: string | null } | { name: null; url: null }`. Một dự án
không public thì không có tên lẫn không có link ngay ở tầng kiểu, không chỉ
bằng comment — trước đây `{ name: null, url: "..." }` là TypeScript hợp lệ và
từng suýt làm `llms.ts` in lộ `url` cho một dự án ẩn danh.

### i18n

`next-intl`, `localePrefix: "always"`, mặc định `en`. Locale khai trong
`enums/locale.enum.ts` và `i18n/routing.ts`. Middleware nằm ở **`proxy.ts`**
(Next 16 đổi tên `middleware.ts`). Điều hướng nội bộ dùng `@/i18n/navigation`,
**không** dùng `next/link` hay `next/navigation`.

Server Component đọc bản dịch qua `getTranslations`; Client Component qua
`useTranslations`. Gọi `setRequestLocale(locale)` trong layout và page để giữ
static rendering.

### Route

`lib/routes.ts` là registry duy nhất, nuôi navigation, sitemap, breadcrumb và
`llms.txt`. Thêm trang = thêm một mục ở đó + copy ở cả hai catalog + một page.

Trang chủ nằm ngay tại `/{locale}`, không phải `/{locale}/home`.

`CONTENT_LAST_MODIFIED` trong `lib/routes.ts` là hằng số — **bump khi sửa
catalog**, không phải khi deploy.

### SEO

The site cannot lean on employer names, so the person entity is anchored by
what is left. Four pieces carry that load and are easy to undo by accident:

- `IDENTITY.latinName` — the name without diacritics. It is in `alternateName`
  **and** in visible copy on `/about` (`about.names`), because matching is on
  literal strings and schema alone is the weaker of the two signals. It looks
  like a duplicate of `fullName`; it is not.
- `EXPERTISE_TOPICS` (`lib/profile/practice.ts`) leads `knowsAbout`, ahead of
  the tool names. Tool names describe millions of people.
- `hasCredential` and `award` in `personSchema` — the named issuers and
  competitions are third-party anchors, standing in for the employers the site
  will not name.
- `TITLE_SUFFIX` (`lib/site.ts`), not `SITE_NAME`, ends every non-home title.
  The brand is "KingNNT" but the search is for the real name, and
  "About | KingNNT" never contained it.

`/dev/estimating` is the only page that argues rather than lists, and its
shape is load-bearing: the title is a question, and the claim sits in the first
paragraph of the first section. That is what an answer engine can attribute a
quote to — a profile page gives it nothing to cite.
`tests/pages/estimating.test.tsx` pins both.

`lib/metadata.ts` dựng canonical/hreflang/OG cho từng trang. Canonical đặt ở
page, không đặt ở layout. `og:image` phải được tham chiếu tường minh: khi một
trang khai `openGraph` trong `generateMetadata`, Next ngừng gộp file convention
`opengraph-image` và card biến mất không báo lỗi.

Màu trong `app/[locale]/opengraph-image.tsx` viết hex thủ công vì Satori không
hiểu biến CSS. Đổi accent trong `globals.css` thì đổi cả ở đó.

Ảnh chân dung cho OG card được nạp qua fetch tới URL công khai của chính site,
không đọc từ đĩa (bundler trace path không đáng tin trên Vercel). Lỗi mạng khi
fetch là một exception xảy ra trước khi có response nào để kiểm — bắt bằng
try/catch, không phải một trong các `if`. Sau khi đã có response, card lùi về
bản thuần chữ nếu một trong ba kiểm tra trên body thất bại: status không phải
2xx, content-type không phải ảnh, hoặc bytes không mở đầu bằng magic number
JPEG (`0xff 0xd8 0xff`). Có một lớp lỗi mà không kiểm nào ở trên bắt được: một
body vượt qua cả ba kiểm tra đó nhưng vẫn không giải mã được bên trong Satori —
`ImageResponse` render trong callback `start` của một `ReadableStream`, sau khi
response 200 đã commit, nên lỗi đó làm hỏng response stream chứ không ném ra để
try/catch nào bắt được nữa.

### Nội dung phải server-render

Crawler của các answer engine không chạy JavaScript. `components/reveal.tsx`
chỉ đổi opacity/transform của nội dung đã render — không bao giờ quyết định có
render hay không.

`useReducedMotion` (`lib/hooks.ts`) dùng `useSyncExternalStore`, không phải
`useEffect` + `setState`, để tránh nhấp nháy giữa snapshot mặc định và giá trị
thật của media query trên client.

### Theme

Dark-first (`defaultTheme="dark"`). Accent lấy từ viền sáng trong ảnh chân dung
và ánh xạ vào token `--primary` (**không** phải `--accent`, thứ shadcn dùng cho
nền hover). Bản light dùng accent tối hơn để giữ tương phản — có test cho việc
đó trong `tests/components/theme-tokens.test.ts`.

### Ảnh

`assets/portrait.png` là ảnh gốc, cố ý nằm ngoài `public/`. Bản deploy là
`public/images/portrait.jpg`.

### Logo and icons

`assets/logo-mark.svg` is the vector original of the brand mark (a K inside a
square frame), kept outside `public/` like the portrait. `components/logo.tsx`
restates that same geometry as an inline path — svgr is not enabled, so a
`.svg` cannot be imported directly; `tests/components/logo.test.tsx` keeps the
two from drifting apart.

The on-page mark uses `currentColor` so it follows both themes. The icons under
`app/` are the opposite: a hard `#131313` plate with an `#EBEBEB` mark, because
a browser tab strip offers no colour context at all — a transparent mark
disappears on half of them. The "KINGNNT" wordmark from the source brand file
is deliberately **not** in the icons: below 32px it degrades into noise.

Regenerate the icons after editing `assets/logo-mark.svg` (mark fills 80% of
the canvas):

    sed 's/currentColor/#EBEBEB/' assets/logo-mark.svg > /tmp/mark.svg
    magick -background none /tmp/mark.svg -resize 154x154 \
      -background '#131313' -gravity center -extent 192x192 \
      -colorspace Gray -depth 8 -strip -define png:color-type=0 app/icon.png
    magick -background none /tmp/mark.svg -resize 410x410 \
      -background '#131313' -gravity center -extent 512x512 \
      -colorspace Gray -depth 8 -strip -define png:color-type=0 app/apple-icon.png

Grayscale is deliberate — the logo holds only two greys, and forcing `-depth 8`
keeps the file at ~1KB instead of the 33KB 16-bit truecolour PNG ImageMagick
emits by default.

### Component

`Section` (`components/section.tsx`) nhận props dạng discriminated union:
nhánh còn lại là `{ id?: string; index?: never; label?: never }`, nên `id`
một mình (không `index`/`label`) vẫn hợp lệ — cái type ngăn là `index` hoặc
`label` xuất hiện mà không đi kèm đủ cả ba (`id`, `index`, `label` cùng lúc,
khớp nhánh đầu). Nói cách khác: không có section nào có nhãn mà thiếu `id`,
nhưng có `id` không nhãn là bình thường. Chỉ section có nhãn mới nhận
`aria-labelledby`/role landmark; một region không tên là tiếng ồn với screen
reader.

## Testing

Vitest + jsdom + Testing Library. Test ở `tests/**`, gương cấu trúc source.
Thêm section hay message key thì thêm/mở rộng test tương ứng.

Trang `/experience`, `/skills`, `/projects` là async Server Component nên
Testing Library không render được; test ở `tests/pages/*.test.tsx` theo mẫu
`tests/pages/about.test.tsx` — khẳng định trực tiếp trên mảng dữ liệu
(`EXPERIENCE`, `SKILL_GROUPS`, `PROJECTS`) và trên catalog, thay vì render
cây component. Những test này bảo vệ độ đầy đủ của dữ liệu và catalog (mỗi
entry trong mảng nguồn có một bản dịch không rỗng), **không** bảo vệ chính
JSX của trang: nếu ai đó thêm `.slice`/`.filter` vào `.map` của trang, các
test cho `experience`/`skills` vẫn xanh vì chúng không đọc `page.tsx`.
`projects.test.tsx` là ngoại lệ đáng kể — nó gọi thẳng `featuredProjects()`
và `earlierProjects()`, hai hàm production mà trang dùng để chia section, nên
một dự án bị loại khỏi cả hai partition sẽ bị bắt thật.
