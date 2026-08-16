# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Overview

Trang cá nhân song ngữ EN/VI của Ninh Ngọc Tuấn (Jesse / KingNNT) tại
`kingnnt.org`. Next.js 16 App Router + React 19 + TypeScript strict, Tailwind v4,
shadcn/ui. Năm route tĩnh: `/`, `/about`, `/experience`, `/skills`, `/projects`.

165 test xanh, `pnpm lint` sạch cảnh báo và không có comment `eslint-disable`
nào trong repo — cả hai là tính chất cố ý, không phải tình cờ.

## Ràng buộc ẩn danh

**Trang này không nêu tên bất kỳ nơi làm việc, công ty đứng sau sản phẩm, khách
hàng cuối hay codename dự án nội bộ nào.** Chỉ sản phẩm public có website được
nêu tên: IntentSite, Orkestrators, SemiKong, Live Call. Trường học và đơn vị
cấp chứng chỉ (Electric Power University, Anthropic, Coursera, LandingAI) nêu
tên thẳng ở `lib/profile/credentials.ts` — chúng không tuyển và không phải
khách hàng, nên không rơi vào ràng buộc trên.

`tests/lib/anonymity.test.ts` giữ denylist và quét `lib/profile/**` cùng
`messages/**`, mỗi cây được khẳng định non-empty riêng (một cây rỗng không
được phép âm thầm kéo test xanh theo). Có thêm hai test khẳng định chính bộ
dò hoạt động: một chuỗi có tên cấm ngoài trường `url` phải bị bắt, một chuỗi
chỉ có tên cấm bên trong `url` thì không. Trường `url` được miễn trừ vì trang
sản phẩm Orkestrators nằm dưới tên công ty bị cấm (`artinleap.com`) — bù lại
nhãn link hiển thị chỉ được là tên sản phẩm hoặc hostname rút gọn.

Trong JSON-LD: **không** `worksFor`, `affiliation`, hay node `Organization`.

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

`lib/metadata.ts` dựng canonical/hreflang/OG cho từng trang. Canonical đặt ở
page, không đặt ở layout. `og:image` phải được tham chiếu tường minh: khi một
trang khai `openGraph` trong `generateMetadata`, Next ngừng gộp file convention
`opengraph-image` và card biến mất không báo lỗi.

Màu trong `app/[locale]/opengraph-image.tsx` viết hex thủ công vì Satori không
hiểu biến CSS. Đổi accent trong `globals.css` thì đổi cả ở đó.

Ảnh chân dung cho OG card được nạp qua fetch tới URL công khai của chính site,
không đọc từ đĩa (bundler trace path không đáng tin trên Vercel). Card lùi về
bản thuần chữ khi fetch lỗi mạng, status không phải 2xx, content-type không
phải ảnh, hoặc bytes không mở đầu bằng magic number JPEG (`0xff 0xd8 0xff`).
Có một lớp lỗi mà không kiểm nào ở trên bắt được: một body vượt qua cả bốn
kiểm tra nhưng vẫn không giải mã được bên trong Satori — `ImageResponse` render
trong callback `start` của một `ReadableStream`, sau khi response 200 đã
commit, nên lỗi đó làm hỏng response stream chứ không ném ra để try/catch nào
bắt được nữa.

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
`public/images/portrait.jpg`. Icon trong `app/` sinh từ ảnh gốc bằng `sips`.

### Component

`Section` (`components/section.tsx`) nhận props dạng discriminated union:
`{ id, index, label }` đi cùng nhau hoặc không có cái nào — một section có
`index`/`label` mà thiếu `id`, hay ngược lại, đỏ compile thay vì render sai
lúc chạy. Chỉ section có nhãn mới nhận `aria-labelledby`/role landmark; một
region không tên là tiếng ồn với screen reader.

## Testing

Vitest + jsdom + Testing Library. Test ở `tests/**`, gương cấu trúc source.
Thêm section hay message key thì thêm/mở rộng test tương ứng.

Trang `/experience`, `/skills`, `/projects` là async Server Component nên
Testing Library không render được; test ở `tests/pages/*.test.tsx` theo mẫu
`tests/pages/about.test.tsx` — khẳng định trực tiếp trên mảng dữ liệu
(`EXPERIENCE`, `SKILL_GROUPS`, `PROJECTS`) và trên catalog, thay vì render
cây component. Mục đích: xoá một mục khỏi mapping của trang phải làm CI đỏ,
kể cả khi id đó vẫn còn khớp catalog (thứ `id-coverage.test.ts` không bắt
được, vì nó chỉ so id với catalog, không so page với id).
