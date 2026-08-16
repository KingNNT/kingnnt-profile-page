# kingnnt-profile-page — Design

Ngày: 2026-08-16
Trạng thái: đã duyệt hai phần design trong hội thoại, chờ review spec

## 1. Mục tiêu

Trang cá nhân của **Ninh Ngọc Tuấn** (tên tiếng Anh: Jesse, nickname: KingNNT),
Solutions Consultant / Full-stack Engineer. Mục đích chính là **personal brand**:
một nơi ổn định, do chính chủ sở hữu, để người khác hiểu anh làm gì và tin được
điều đó. Blog là hướng mở rộng đã dự tính nhưng **không nằm trong phạm vi giai
đoạn 1**.

Thành công nghĩa là: một recruiter, một khách hàng tiềm năng, hoặc một AI agent
đọc trang này đều rút ra được cùng một bức tranh chính xác về năng lực — mà
không cần biết tên bất kỳ công ty nào.

### Ngoài phạm vi (giai đoạn 1)

- Blog / MDX content pipeline. Kiến trúc không cản trở việc thêm sau, nhưng
  giai đoạn 1 không dựng sẵn route rỗng hay data layer treo.
- Form liên hệ. Liên hệ chỉ qua `mailto:` và link social.
- Analytics tự host, CMS, comment, newsletter.
- Docker / mise / self-host. Deploy là Vercel.

## 2. Ràng buộc

### 2.1 Ẩn danh — ràng buộc cứng

Chủ trang yêu cầu **không nhắc tên công ty đã làm**. Diễn giải đã chốt:

| Loại | Xử lý |
| --- | --- |
| Employer (nơi làm thuê) | Ẩn hoàn toàn. Thay bằng vai trò + lĩnh vực + thị trường. |
| Công ty đứng sau sản phẩm (startup anh tham gia) | Ẩn. |
| Tên khách hàng cuối | Ẩn. Mô tả gián tiếp, ví dụ "một ngân hàng thương mại lớn tại Việt Nam". |
| Codename dự án nội bộ | Ẩn. Mô tả theo bài toán. |
| Sản phẩm public có website công khai | **Giữ**, vì kiểm chứng được và là bằng chứng năng lực. |

Sản phẩm public được giữ: `IntentSite` (intentsite.com), `Orkestrators`
(artinleap.com/products/orkestrators — giữ tên sản phẩm, **không** giữ tên công
ty trong phần chữ), `SemiKong` (semikong.ai), `Live Call` (livecall.net).

Ràng buộc này được thực thi bằng test chứ không phải bằng ghi chú — xem §7.2.

### 2.2 Ràng buộc kỹ thuật

- Pattern và folder structure bám theo `/Users/kingnnt/Documents/workspaces/sofinwave/landing-page`,
  bỏ phần multi-site và Docker.
- Song ngữ EN + VI ngay từ đầu.
- Deploy Vercel, domain `kingnnt.org` (đã sở hữu).
- Mọi nội dung phải có mặt trong HTML server-render: crawler của các answer
  engine không chạy JavaScript.

## 3. Stack

Kế thừa từ reference, đã lược bỏ:

| Lớp | Lựa chọn |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Style | Tailwind v4, shadcn/ui style "new-york", `tw-animate-css` |
| i18n | next-intl, `localePrefix: "always"`, mặc định `en` |
| Theme | next-themes, dark-first |
| Format | Biome — **chỉ format**, linter tắt |
| Lint | ESLint + `eslint-config-next` — **chỉ lint** |
| Test | Vitest + jsdom + Testing Library |
| Hook | Husky + lint-staged + commitlint (Conventional Commits) |
| CI | GitHub Actions: `format:check → lint → test → build` |
| Package manager | pnpm, pin bằng `packageManager` |
| Analytics | `@vercel/analytics` |

Việc tách Biome/ESLint là cố ý và không được gộp lại, giống reference: Biome lo
định dạng (2 space, 100 cột, double quote, semicolon, trailing comma), ESLint lo
quy tắc Next.

`pnpm-lock.yaml` là lockfile duy nhất. Không thêm `yarn.lock` hay
`package-lock.json` — Vercel chọn package manager theo lockfile và xếp
`yarn.lock` trên `pnpm-lock.yaml`, nên lockfile thứ hai sẽ âm thầm đổi cả cây
dependency lúc deploy.

## 4. Kiến trúc

### 4.1 Tách "sự thật" khỏi "văn xuôi"

Quyết định kiến trúc trung tâm. Reference đặt toàn bộ chữ trong
`messages/*.json`; ở đây điều đó sai, vì phần lớn nội dung profile là **dữ liệu
có cấu trúc không cần dịch** (link, số năm, tên công nghệ, mốc thời gian). Nhét
chúng vào catalog i18n buộc phải duy trì hai bản sao giống hệt nhau.

```
lib/profile/
  identity.ts     tên, các biến thể tên, title, email, socials, nơi ở
  experience.ts   ExperienceEntry[]
  skills.ts       SkillGroup[]
  projects.ts     Project[]
  trading.ts      TradingMilestone[]
  index.ts        re-export
```

`messages/en.json` và `messages/vi.json` **chỉ** chứa văn xuôi, khoá theo đúng
`id` trong `lib/profile`. Component join hai nguồn: dữ liệu từ `lib/profile`,
chữ từ catalog.

Đánh đổi: phải giữ `id` đồng bộ giữa hai nơi. Được xử lý bằng test song ánh
(§7.2) — mọi `id` phải có key ở **cả hai** catalog, và mọi key nội dung phải
ứng với một `id` tồn tại.

### 4.2 Kiểu dữ liệu

```ts
// lib/profile/experience.ts
export type ExperienceEntry = {
  id: string;              // "consultant" | "engineer-current" | ...
  from: string;            // "2026-07" — ISO year-month
  to: string | null;       // null = đang diễn ra
  role: string;            // "Solutions Consultant" — chức danh, không phải bản dịch
  domains: string[];       // ["banking", "healthcare", "e-commerce", "ai"]
  markets: string[];       // ["VN", "MY", "AU"]
  stack: string[];
};
```

`to: null` cùng lúc ở nhiều entry là **hợp lệ và có thật**: vai trò freelance
chạy song song từ 2020 tới nay, và giai đoạn consultant chồng lên giai đoạn
engineer. Timeline vì vậy không phải một chuỗi tuyến tính — component phải xử
lý được các khoảng chồng nhau, và test phải khẳng định điều đó thay vì ép mốc
thời gian rời nhau.

```ts
// lib/profile/skills.ts
export type Proficiency = "expert" | "intermediate" | "basic";
export type Skill = {
  name: string;
  proficiency: Proficiency;
  years: number;
  lastUsed: number;        // năm dùng gần nhất — tín hiệu trung thực nhất
};
export type SkillGroup = { id: string; skills: Skill[] };
```

```ts
// lib/profile/projects.ts
export type Project = {
  id: string;
  from: string;
  to: string | null;
  name: string | null;     // null = sản phẩm không public, chỉ mô tả
  url: string | null;
  role: string;
  teamSize: number | null;
  stack: string[];
  featured: boolean;
};
```

`name: null` là cách mã hoá ràng buộc ẩn danh vào chính kiểu dữ liệu: dự án
không public thì không có tên để hiển thị, và trình biên dịch bắt buộc UI phải
xử lý trường hợp đó.

### 4.3 Routing

```
app/
  [locale]/
    (public)/
      page.tsx            /            hero + about ngắn + điều hướng
      about/page.tsx      /about       câu chuyện đầy đủ, gồm chương trading
      experience/page.tsx /experience  timeline
      skills/page.tsx     /skills      bảng năng lực
      projects/page.tsx   /projects    dự án
      _components/        section riêng của từng trang
    layout.tsx
    opengraph-image.tsx
    twitter-image.tsx
  globals.css
  sitemap.ts
  robots.ts
  llms.txt/route.ts
proxy.ts                  middleware next-intl (Next 16 đổi tên middleware.ts → proxy.ts)
```

Khác reference ở hai điểm, đều vì đây là **một** site chứ không phải bốn:

- Không có segment `[site]`, không có `lib/sites.ts`, không có rewrite theo
  hostname trong `proxy.ts`.
- Dùng convention gốc của Next cho `sitemap.ts` / `robots.ts` thay vì XML tự
  viết. Reference phải tự viết vì nó phục vụ nhiều hostname; ở đây
  `alternates.languages` của `MetadataRoute.Sitemap` đã lo hreflang. Cảnh báo
  của reference về việc đặt tên thư mục trùng file metadata chỉ áp dụng cho
  **dynamic route**, nên không ảnh hưởng ở đây.

`lib/routes.ts` là registry 5 route, làm nguồn duy nhất cho navigation,
sitemap, breadcrumb và `llms.txt`, để chúng không thể mâu thuẫn nhau.
`CONTENT_LAST_MODIFIED` là hằng số, **bump khi nội dung đổi**, không phải khi
deploy — nếu lấy thời điểm build thì mọi trang sẽ tự nhận là vừa cập nhật sau
mỗi lần rebuild.

## 5. Nội dung

### 5.1 Định danh

| Trường | Giá trị |
| --- | --- |
| Tên | Ninh Ngọc Tuấn |
| Tên tiếng Anh | Jesse |
| Nickname | KingNNT |
| Title | Solutions Consultant |
| Email | Work.KingNNT@gmail.com |
| LinkedIn | https://www.linkedin.com/in/kingnnt/ |
| GitHub | https://github.com/KingNNT |
| Nơi ở | Hà Nội, Việt Nam |

Số điện thoại và ngày sinh trong CV **không** đưa lên trang.

### 5.2 Experience — đã ẩn danh

| id | Giai đoạn | Vai trò | Lĩnh vực / thị trường |
| --- | --- | --- | --- |
| `consultant` | 2026-07 → nay | Solutions Consultant | IT outsourcing, khách hàng doanh nghiệp — pre-sales, kiến trúc giải pháp, ước lượng, tối ưu chi phí cloud |
| `engineer-current` | 2025-09 → nay | Full-stack Engineer | Banking · healthcare · e-commerce · AI — VN, MY, AU. Kiêm phỏng vấn kỹ thuật và mentoring |
| `engineer-ai` | 2024-04 → 2025-10 | Full-stack Engineer | AI center — khách hàng Nhật và EU. Python/FastAPI, Next.js, Azure, Docker, Kubernetes |
| `engineer-offshore` | 2021-08 → 2024-03 | Full-stack Engineer | Khách hàng Nhật và quốc tế — video call, booking, school management. Đội 15+ người |
| `engineer-hospitality` | 2020-12 → 2021-08 | Full-stack Engineer | Hospitality, du lịch Nhật. Đội 4–6 người |
| `freelance` | 2020-01 → nay | Independent Engineer | Trực tiếp với khách hàng: từ tìm hiểu nhu cầu tới kiến trúc, triển khai và vận hành |

### 5.3 Skills

Nguồn: bảng năng lực trong CV, giữ nguyên proficiency / số năm / năm dùng gần
nhất. Nhóm:

`languages` — PHP, JavaScript, TypeScript, Python, C/C++, C#, Java, Rust
`frontend` — React, Vue, Tailwind CSS
`backend` — Laravel, NestJS, Django, FastAPI
`devops` — Docker, Kubernetes, AWS, Azure, GCP, DigitalOcean, Vultr, Terraform, Jenkins, GitHub Actions
`data` — MySQL, PostgreSQL, MongoDB, SQLite, Firebase, Redis, Memcached, Kafka
`practice` — design pattern, kiến trúc ứng dụng web, Linux, Agile/Kanban, UI/UX & mockup, UML

Hiển thị **giữ nguyên cả mục thấp** (`Kubernetes · basic · 3 tháng · 2025`).
Một bảng có mục "basic" đáng tin hơn một rừng logo đồng hạng, và
`lastUsed` là tín hiệu mà kiểu badge thông thường vứt đi.

### 5.4 Projects

Nổi bật (`featured: true`):

| id | Tên hiển thị | Giai đoạn | Vai trò |
| --- | --- | --- | --- |
| `intentsite` | IntentSite ↗ intentsite.com | 2026-01 → nay | Tech Lead / Solution Architect |
| `orkestrators` | Orkestrators ↗ *(link tới trang sản phẩm; nhãn hiển thị chỉ là tên sản phẩm — xem §8.2)* | 2025-05 → nay | Tech Lead / Implementation Advisor |
| `semikong` | SemiKong ↗ semikong.ai | 2024-06 → 2024-07 | Team Lead |
| `livecall` | Live Call ↗ livecall.net | 2022-03 → 2024-03 | Full-stack Engineer |
| `bank-kpi` | *(không tên)* — nền tảng KPI cho một ngân hàng thương mại lớn tại Việt Nam | 2025-11 → 2026-04 | Full-stack Engineer |
| `mental-health-elearning` | *(không tên)* — nền tảng e-learning sức khoẻ tinh thần, thị trường Úc | 2025-11 → nay | Backend Engineer |

Danh sách gọn phía dưới (`featured: false`, không tên, mô tả theo bài toán):
hệ thống AI xử lý email doanh nghiệp (khách hàng Nhật, 2025), marketplace nhà
hàng (Nhật, 2022–2023), hệ thống quản lý trường học (Nhật, 2021–2022).

**Điểm cần bạn xác nhận:** dự án e-learning Úc có tên riêng trong CV nhưng
không có website công khai, nên spec này xếp nó vào nhóm ẩn tên cho nhất quán
với quy tắc §2.1. Nếu sản phẩm đã ra mắt công khai và bạn muốn nêu tên, đổi
`name` trong `lib/profile/projects.ts` và gỡ khỏi denylist là đủ.

### 5.5 Trading — chương riêng trong `/about`

Đây là phần làm trang này khác mọi trang dev khác, nên viết như một mạch
chuyện chứ không phải danh sách.

| Mốc | Nội dung |
| --- | --- |
| 2020 | Bắt đầu với crypto |
| Giữa 2023 | Chuyển sang forex |
| Đầu 2024 | Thêm chứng khoán |
| Xuyên suốt | Giữ song song hai trường phái: holding và swing trading |

Mạch chuyện: kỹ sư → thị trường → và điều mang ngược lại vào nghề kỹ thuật.
Bản nháp văn xuôi do người viết chốt ở bước triển khai; spec chỉ cố định các
mốc và góc kể. Không nêu con số lợi nhuận, không lời khuyên đầu tư — trang này
không phải nội dung tài chính, và một câu khoe hiệu suất sẽ kéo nó vào phạm trù
YMYL mà nó không cần bước vào.

### 5.6 Khác

Học vấn: Electric Power University, Bachelor of Engineering, Software
Engineering, 2018–2023.

Chứng chỉ: LandingLens Computer Vision Fundamentals; Use Generative AI as Your
Thought Partner (Coursera); Building with the Claude API (Anthropic); AI
Fluency for Small Businesses (Anthropic).

Giải thưởng: tham gia ACM/ICPC miền Bắc (2018–2021); Giải Nhì Olympic Tin học
cấp tỉnh (2016).

Ngôn ngữ: tiếng Anh — professional working proficiency; tiếng Việt — bản ngữ.

## 6. Hệ thị giác

Hướng: **terminal-editorial, dark-first**. Nhãn và số liệu bằng mono, văn xuôi
bằng sans, phân tách bằng đường kẻ mảnh thay vì khối nền, đúng một accent.

### 6.1 Token

Khai báo trong `app/globals.css` theo cùng cấu trúc reference: `@theme inline`
ánh xạ sang biến CSS, `:root` cho light, `.dark` cho dark.

```
/* dark — mặc định */
--background  oklch(0.15 0.006 60)
--foreground  oklch(0.95 0.008 80)
--accent      oklch(0.78 0.14 68)
--rule        oklch(1 0 0 / 0.10)

/* light */
--background  oklch(0.99 0.004 80)
--foreground  oklch(0.18 0.01 60)
--accent      oklch(0.58 0.13 62)
--rule        oklch(0 0 0 / 0.10)
```

Accent lấy từ chính viền sáng vàng hổ phách trên ảnh chân dung, nên trang và
ảnh không đánh nhau về màu. Bản light dùng accent tối hơn để giữ tỉ lệ tương
phản ≥ 4.5:1 trên nền sáng — cùng một giá trị accent không thể đạt ngưỡng ở cả
hai theme.

`next-themes` với `defaultTheme="dark"`, `enableSystem`.

### 6.2 Chữ

`Geist Sans` cho văn xuôi, `Geist Mono` cho nhãn / mốc thời gian / bảng skills,
nạp qua `next/font` (self-host, không request ra ngoài), phơi ra thành
`--font-geist-sans` và `--font-geist-mono` như reference.

Khối đọc dài giới hạn `max-w-[68ch]`.

### 6.3 Component

| Component | Vai trò |
| --- | --- |
| `components/section.tsx` | Khung section: container + nhịp dọc |
| `components/section-label.tsx` | Nhãn đánh số mono `01 — ABOUT` |
| `components/portrait.tsx` | Ảnh chân dung, `next/image`, `priority` ở hero |
| `components/timeline.tsx` | Timeline, xử lý được các khoảng chồng nhau và mục đang diễn ra |
| `components/skill-table.tsx` | Bảng mono: tên · proficiency · số năm · dùng gần nhất |
| `components/project-card.tsx` | Thẻ dự án, viền hairline, link ngoài có dấu ↗, chịu được `name: null` |
| `components/prose.tsx` | Khung đọc dài cho `/about` |
| `components/reveal.tsx` | Fade/translate khi cuộn, thuần CSS |
| `components/site-header.tsx`, `site-footer.tsx` | Điều hướng, đọc từ `lib/routes.ts` |
| `components/language-switcher.tsx`, `mode-toggle.tsx`, `theme-provider.tsx` | Port từ reference |
| `components/structured-data.tsx` | Nhúng JSON-LD |

Từ shadcn/ui chỉ lấy những gì thực dùng: `button`, `card`, `dropdown-menu`.

### 6.4 Chuyển động và khả năng tiếp cận

Chuyển động chỉ là fade + translate nhẹ khi cuộn, và **nội dung luôn có sẵn
trong HTML server-render** — bot đứng sau ChatGPT, Claude, Perplexity không
chạy JavaScript, nên chữ chỉ xuất hiện sau hydration là chữ vô hình với chúng.
`Reveal` chỉ đổi opacity/transform của nội dung đã render, không bao giờ quyết
định *có* render hay không.

Tôn trọng `prefers-reduced-motion`. Trang phải dùng được bằng bàn phím, mọi ảnh
có `alt`, focus ring nhìn thấy được ở cả hai theme.

### 6.5 Ảnh

Ảnh gốc để ở `assets/` (ngoài `public/`) để bản đầy đủ không bị deploy hay tải
công khai; bản tối ưu nằm ở `public/images/`. Reference giữ file brand 4.4 MB
theo đúng cách này.

`app/[locale]/opengraph-image.tsx` sinh OG card từ ảnh chân dung + tên + title.
Khi `generateMetadata` khai báo `openGraph`, Next ngừng tự gộp file convention
`opengraph-image`, nên `og:image` phải được tham chiếu tường minh — nếu không
card sẽ biến mất mà không báo lỗi.

## 7. SEO và dữ liệu có cấu trúc

### 7.1 Thành phần

- `lib/site.ts` — `SITE_URL` mặc định `https://kingnnt.org`, override bằng
  `NEXT_PUBLIC_SITE_URL` cho preview. Builder `pageUrl`, `languageAlternates`.
  `OG_LOCALE`: `en → en_US`, `vi → vi_VN`.
- `lib/metadata.ts` — `pageMetadata()` dựng canonical + hreflang + Open Graph.
  Canonical đặt ở **page**, không đặt ở layout, vì layout bọc mọi route.
- `lib/structured-data.ts` — JSON-LD `Person` lồng trong `ProfilePage`, cùng
  `BreadcrumbList` cho các trang con.
- `app/sitemap.ts`, `app/robots.ts` — convention Next.
- `app/llms.txt/route.ts` — sinh từ `lib/routes.ts` và `lib/profile`, không
  viết tay.

### 7.2 `Person` schema

```
name          Ninh Ngọc Tuấn
alternateName [Jesse, KingNNT]
jobTitle      Solutions Consultant
sameAs        [LinkedIn, GitHub]
knowsAbout    sinh từ lib/profile/skills.ts
alumniOf      Electric Power University
address       Hà Nội, Việt Nam
```

**Không** khai báo `worksFor`, `affiliation`, hay `Organization` nào — đúng
ràng buộc ẩn danh §2.1. Đây là chỗ dễ rò rỉ nhất, vì `worksFor` là trường mặc
định mọi ví dụ `Person` schema đều có.

`robots.txt` nêu đích danh từng crawler của các answer engine. Mỗi hãng chạy
nhiều agent tách biệt cho training, indexing và live fetch; chỉ cho phép agent
training là lỗi thường gặp.

## 8. Kiểm thử

Vitest + jsdom + Testing Library, cấu hình `vitest.config.mts` và
`vitest.setup.ts`, alias `@/*`. Test ở `tests/**` và gương cấu trúc source.

### 8.1 Phạm vi

| File | Khẳng định |
| --- | --- |
| `tests/lib/profile.test.ts` | `id` duy nhất trong từng collection; `from` ≤ `to`; **cho phép** nhiều mục `to: null` và các khoảng chồng nhau; mọi `url` là absolute HTTPS hợp lệ; `lastUsed` ≥ năm bắt đầu tương ứng |
| `tests/lib/anonymity.test.ts` | Quét toàn bộ `lib/profile/**` và `messages/**` với denylist; không được xuất hiện |
| `tests/messages/parity.test.ts` | `en.json` và `vi.json` trùng khít cấu trúc key; mọi `id` trong `lib/profile` có bản dịch ở **cả hai**; không có key nội dung mồ côi |
| `tests/components/*.test.tsx` | timeline (mục đang diễn ra, khoảng chồng nhau), skill-table (hiển thị đủ cả mục `basic`), project-card (`name: null`), language-switcher, section-label |
| `tests/pages/*.test.tsx` | Mỗi route render đủ các mục bắt buộc |
| `tests/seo/*.test.ts` | canonical đúng và không trỏ vào `/{locale}` trần; hreflang đủ cặp; `Person` schema **không** chứa `worksFor`; sitemap khớp `lib/routes.ts`; robots liệt kê đủ crawler |

### 8.2 Test ẩn danh

```ts
const DENYLIST = [
  // employer
  "SyncSoft", "FPT", "Kaopiz", "Tap Hospitality",
  // công ty đứng sau sản phẩm
  "SmartGoldFish", "ArtinLeap",
  // khách hàng cuối
  "SHB", "Saigon-Hanoi", "Saigon Hanoi",
  // codename nội bộ
  "KPIRB", "TMC", "GICRM", "RENEW02", "E-Concierge", "Accommod",
  // tên sản phẩm chưa public
  "Zyrahh",
];
```

Quy tắc so khớp:

- Không phân biệt hoa thường, so theo **ranh giới từ** — token ngắn như `TMC`
  hay `SHB` mà so kiểu substring sẽ bắt nhầm những từ vô can.
- Quét `messages/**` toàn bộ, và `lib/profile/**` **trừ giá trị của trường
  `url`**. Trang sản phẩm Orkestrators nằm dưới `artinleap.com`, nên chính URL
  hợp lệ sẽ chứa tên công ty bị cấm. Một URL là địa chỉ công khai kiểm chứng
  được, không phải một lời khẳng định về nơi làm việc — ràng buộc áp lên chữ
  hiển thị, không áp lên đích của link. Đổi lại, `project-card.tsx` **phải**
  hiển thị nhãn link bằng tên sản phẩm hoặc hostname rút gọn, không bao giờ
  bằng đường dẫn đầy đủ; `tests/components/project-card.test.tsx` khẳng định
  điều đó.

Test này tồn tại vì "đừng nhắc đến công ty" là loại ràng buộc bị vi phạm lúc
sửa nội dung vội — dán một đoạn từ CV vào là đủ. Một dòng ghi chú trong
CLAUDE.md không chặn được điều đó; một test đỏ thì có. Khi một tên được phép
công khai, gỡ nó khỏi denylist là hành động có chủ đích và có dấu vết trong git.

## 9. Git và vận hành

- `git init`, nhánh tích hợp mặc định là **`develop`**, giống reference. PR
  nhắm vào `develop`; `develop` là nhánh được bảo vệ nên không commit thẳng
  vào, luôn tách nhánh feature trước.
- Conventional Commits, commitlint bắt buộc. Nhánh đặt tên theo
  `<type>/<kebab-description>` với type là từ đầy đủ (`feature/`, không phải
  `feat/`).
- Pre-commit qua lint-staged: Biome format toàn bộ file staged, ESLint `--fix`
  cho `.ts/.tsx`.
- CI GitHub Actions chạy `format:check → lint → test → build` trên push và PR.
- Deploy Vercel. `NEXT_PUBLIC_SITE_URL` đặt cho môi trường preview để canonical
  không trỏ nhầm về production.

Script trong `package.json`: `dev`, `build`, `start`, `lint`, `lint:fix`,
`format`, `format:check`, `test`, `test:watch`, `prepare`.

## 10. Rủi ro đã biết

**Nội dung song ngữ là chi phí thường trực.** Mỗi lần sửa văn xuôi phải sửa hai
lần. Test parity biến việc quên thành lỗi build thay vì một trang tiếng Việt
hiển thị chuỗi key — nhưng nó không viết hộ bản dịch.

**Ẩn danh làm giảm sức thuyết phục.** Timeline không tên công ty vốn yếu hơn
timeline có tên. Bù lại bằng ba thứ cụ thể: lĩnh vực, thị trường, quy mô đội —
và bằng các sản phẩm public kiểm chứng được ở `/projects`. Nếu về sau bạn muốn
mở tên một số nơi, thay đổi nằm gọn trong `lib/profile` cộng với denylist.

**Bảng skills sẽ cũ đi.** `lastUsed` là trường tự tố cáo: một dòng ghi
`lastUsed: 2026` mà hai năm nữa không sửa sẽ thành sai sự thật. Đây là đánh đổi
có chủ đích — trường này đáng giá chính vì nó cụ thể. Ghi vào CLAUDE.md rằng
cập nhật CV thì cập nhật luôn `lib/profile/skills.ts`.

**Blog chưa dựng.** Khi thêm, nó sẽ cần một content pipeline mà thiết kế hiện
tại chưa quyết định. Kiến trúc không cản trở việc đó — `lib/routes.ts` và tầng
metadata đã sẵn sàng nhận thêm route — nhưng lựa chọn MDX hay CMS là một vòng
brainstorm riêng.
