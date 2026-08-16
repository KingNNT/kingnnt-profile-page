# Tách trang theo mảng (facet split) — Design

Ngày: 2026-08-16
Trạng thái: đã duyệt năm section design trong hội thoại, chờ review spec

## 1. Mục tiêu

Trang hiện tại kể **một** câu chuyện: Solutions Consultant / Full-stack
Engineer. `/experience`, `/skills`, `/projects` đều là IT; trading chỉ là ba
đoạn văn trong `/about` cộng ba mốc năm trong `lib/profile/trading.ts`; content
creator **không tồn tại** ở bất kỳ đâu trong repo.

Chủ trang có ba mảng hoạt động — **IT, trading, content creator** — và muốn mỗi
mảng có không gian riêng với **kênh liên hệ riêng**, đồng thời vẫn giữ những
kênh dùng chung. Một người đến vì trading không nên phải lội qua bảng kỹ năng
TypeScript để tìm cách liên hệ, và ngược lại.

Thành công nghĩa là: mỗi mảng có URL riêng, nội dung riêng, khối liên hệ riêng
đặt đúng chỗ người đọc đang đứng; nhưng site vẫn đọc ra **một con người**, không
phải ba website dán cạnh nhau.

### Ngoài phạm vi

- OG image riêng cho từng nhánh (xem §6.3 để biết vì sao hoãn).
- Blog / MDX pipeline. Không đổi so với spec giai đoạn 1.
- Form liên hệ. Vẫn chỉ `mailto:` và link profile.
- Subdomain riêng cho từng nhánh (đã cân nhắc và loại — xem §2.2).
- Nhánh thứ tư. Kiến trúc không cản trở, nhưng không dựng sẵn.

## 2. Quyết định đã chốt

### 2.1 Hình dạng: hub + ba nhánh route

`/` trở thành trang hub giới thiệu con người và dẫn vào ba nhánh. Mỗi nhánh có
trang chủ riêng và ba trang con. `/about` và `/contact` là trang chung.

### 2.2 Các hướng đã loại

| Hướng | Lý do loại |
| --- | --- |
| Giữ route phẳng, facet chỉ là chiều lọc | Ba mảng vẫn dùng chung một khung kể chuyện; không đạt mục tiêu. |
| Subdomain riêng (`dev.`, `trading.`, `creator.`) | Ba mặt tiền phải nuôi thay vì một; metadata/sitemap/OG nhân ba. Không tương xứng với quy mô nội dung hiện có. |
| `lib/profile/facets/*.ts` tự chứa, `ROUTES` dẫn xuất | Phá tính chất "`lib/routes.ts` là registry duy nhất, liếc một chỗ thấy hết URL". Cái giá đó chỉ đáng khi số nhánh mở; ở đây là ba, cố định. |
| Giữ URL IT ở gốc (`/skills` thay vì `/dev/skills`) | Tránh được redirect nhưng phá đối xứng: breadcrumb nhánh IT khập khiễng và `llms.txt` mô tả một cây không tồn tại. |

### 2.3 Đối xứng ba nhánh

Cả ba nhánh đều có cấu trúc hub + 3 trang con. Hệ quả: nhánh trading và creator
cần lượng nội dung song ngữ đáng kể mà repo **chưa có**. Xử lý bằng triển khai
theo đợt — xem §8.

## 3. Mô hình dữ liệu

### 3.1 `enums/facet.enum.ts` (mới)

```ts
export const FACETS = ["dev", "trading", "creator"] as const;
export type Facet = (typeof FACETS)[number];
```

Theo đúng khuôn `enums/locale.enum.ts` đang có.

### 3.2 `lib/profile/contact.ts` (mới)

Kênh liên hệ là **bản ghi**; nhóm là **danh sách id tham chiếu**. Đây là điểm
thiết kế trung tâm của spec này.

```ts
export type ContactChannelId =
  | "work-email" | "dev-email" | "trader-email" | "linkedin" | "github";

export type ContactChannel =
  | { id: ContactChannelId; kind: "email"; address: string }
  | { id: ContactChannelId; kind: "profile"; label: string; url: string };

export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  { id: "work-email",   kind: "email", address: "Work.KingNNT@gmail.com" },
  { id: "dev-email",    kind: "email", address: "Dev.KingNNT@gmail.com" },
  { id: "trader-email", kind: "email", address: "Trader.KingNNT@gmail.com" },
  { id: "linkedin", kind: "profile", label: "LinkedIn", url: "https://www.linkedin.com/in/kingnnt/" },
  { id: "github",   kind: "profile", label: "GitHub",   url: "https://github.com/KingNNT" },
];

export const GENERAL_CONTACT_IDS: readonly ContactChannelId[] = ["work-email"];

export const FACET_CONTACT_IDS: Record<Facet, readonly ContactChannelId[]> = {
  dev:     ["dev-email", "linkedin", "github"],
  trading: ["trader-email"],
  creator: ["work-email"],
};

export function channelsFor(ids: readonly ContactChannelId[]): ContactChannel[];
export function primaryEmail(): string;              // work-email
export function profileChannels(): ContactChannel[]; // mọi kênh kind === "profile"
```

Ba tính chất được mua có chủ ý:

- **`Record<Facet, …>` chứ không `Partial`** — thêm nhánh mà quên khai kênh là
  lỗi biên dịch, không phải một khối liên hệ rỗng render lặng lẽ.
- **Discriminated union theo `kind`** — cùng tinh thần với `Project`: entry
  LinkedIn không thể có `address` để ai đó lỡ dựng `mailto:`, và một email
  không thể có `url` để lọt vào `sameAs`.
- **`work-email` nằm ở cả nhóm chung lẫn nhánh creator nhưng chỉ có một bản
  ghi.** Đây là ràng buộc chủ trang đưa ra trực tiếp. Đổi email đó về sau là
  sửa một dòng, không phải đi truy từng nơi.

Trường URL **bắt buộc tên là `url`**: `stripUrls` trong
`tests/lib/anonymity.test.ts` chỉ miễn trừ đúng tên trường đó. Đặt là `link`
hay `href` sẽ tạo một test đỏ khó hiểu ngay khi có kênh nào chứa tên bị cấm.

### 3.3 `lib/profile/identity.ts` (sửa)

Bỏ `email` và `socials`. Chúng trở thành derived view trong `contact.ts`
(`primaryEmail()`, `profileChannels()`), để `personSchema`, footer, hero và
`llms.txt` không có cơ hội lệch nhau.

Đây là thay đổi phá vỡ, chạm 6 file — liệt kê đầy đủ ở §7.

### 3.4 `lib/profile/trading.ts` (mở rộng, đợt 2)

```ts
export type Market = "crypto" | "forex" | "equities";

export interface TradingMilestone { id: string; year: number; market: Market }
export interface MarketPractice   { id: Market; since: number; instruments: readonly string[] }
export interface TradingNote      { id: string; published: string; market: Market | null }
```

Chú ý cái **không** có: không `return`, `pnl`, `winRate`, `capital`. Ghi chú
trong file hiện tại nói rõ một câu khoe hiệu suất sẽ kéo trang vào phạm trù
YMYL. Bốn trang trading làm bề mặt cho rủi ro đó lớn gấp bội, nên nó bị khoá ở
**tầng kiểu**: không có trường nào để điền số hiệu suất vào — cùng cơ chế mà
`Project` dùng để một dự án ẩn danh không thể có `url`.

`/trading/notes` là ghi chép phương pháp, **không** phải khuyến nghị mua bán.

### 3.5 `lib/profile/creator.ts` (mới, đợt 3)

```ts
export type CreatorPlatform = "youtube" | "tiktok" | "facebook" | "substack";

export interface CreatorChannel { id: string; platform: CreatorPlatform; handle: string; url: string }
export interface CreatorWork    { id: string; channel: string; year: number; url: string | null }
export interface CollabKind     { id: string }
```

## 4. Route và điều hướng

### 4.1 Registry đầy đủ (`lib/routes.ts`)

`RouteDef` mọc thêm đúng một trường:

```ts
export interface RouteDef {
  path: string;
  key: string;
  parent?: string;
  facet?: Facet;      // undefined = route chung: hub, about, contact
  priority: number;
  changeFrequency: ChangeFrequency;
  lastModified?: string;
}
```

15 route:

| path | key | parent | facet |
| --- | --- | --- | --- |
| `""` | `home` | — | — |
| `dev` | `dev` | `""` | dev |
| `dev/experience` | `devExperience` | `dev` | dev |
| `dev/skills` | `devSkills` | `dev` | dev |
| `dev/projects` | `devProjects` | `dev` | dev |
| `trading` | `trading` | `""` | trading |
| `trading/journey` | `tradingJourney` | `trading` | trading |
| `trading/markets` | `tradingMarkets` | `trading` | trading |
| `trading/notes` | `tradingNotes` | `trading` | trading |
| `creator` | `creator` | `""` | creator |
| `creator/channels` | `creatorChannels` | `creator` | creator |
| `creator/work` | `creatorWork` | `creator` | creator |
| `creator/collab` | `creatorCollab` | `creator` | creator |
| `about` | `about` | `""` | — |
| `contact` | `contact` | `""` | — |

`navRoutes()` được thay bằng hai hàm; cây phân cấp **suy ra từ `parent`**, không
khai thêm:

```ts
primaryNavRoutes()   // parent === HOME_PATH → dev, trading, creator, about, contact
facetRoutes(facet)   // parent === path hub của facet → 3 mục sub-nav
```

`breadcrumbTrail` và `breadcrumbSchema` không sửa một dòng nào — chúng đã đi
theo chuỗi `parent`, nên `/dev/skills` tự ra `home › dev › skills`.

### 4.2 Key catalog: phẳng, camelCase, soi gương path

15 route cần 15 key duy nhất. Chọn `devSkills` thay vì lồng `dev.skills`: lồng
theo dấu chấm buộc `nav.dev` vừa là nhãn hiển thị vừa là nhánh cha của
`nav.dev.skills`, nên nó phải thành `nav.dev.self` — một quy ước ngầm mà
`t(dynamicMessageKey(route.key))` trong `SiteHeader` hiện không biết tới và
`RouteDef.key` sẽ không còn ánh xạ một-một sang key catalog.

### 4.3 Điều hướng hai tầng

```
┌────────────────────────────────────────────────────────┐
│ KingNNT   DEV  TRADING  CREATOR  ABOUT  CONTACT   🌐 ☾ │  ← SiteHeader, mọi trang
├────────────────────────────────────────────────────────┤
│ Experience · Skills · Projects                         │  ← FacetNav, chỉ trong /dev/*
└────────────────────────────────────────────────────────┘
```

`SiteHeader` giữ nguyên hình dạng, chỉ đổi `navRoutes()` → `primaryNavRoutes()`,
vẫn ra đúng 5 mục nên không tràn ngang.

Tầng hai là `components/facet-nav.tsx` (mới), render bởi **layout của từng
nhánh**: `app/[locale]/(public)/{dev,trading,creator}/layout.tsx`, mỗi cái vài
dòng gọi `<FacetNav facet="…" />`. Sub-nav thuộc về nhánh chứ không thuộc site,
nên nó sống trong layout của nhánh; `SiteHeader` không phải biết facet là gì.

Ba `layout.tsx` này **không** khai `metadata` — canonical đặt tại page, theo
đúng ràng buộc đã có trong CLAUDE.md.

### 4.4 Vai trò từng trang

- **`/` (hub)** — hero giữ nguyên; `nav-index.tsx` đổi từ "liệt kê 4 trang"
  thành "ba lối vào có mô tả"; kết bằng khối kênh chung. Đây là chỗ duy nhất
  trên site kể "một con người, ba mảng".
- **`/dev`, `/trading`, `/creator`** — đoạn định vị của nhánh, dẫn vào 3 trang
  con, kết bằng `<ContactBlock ids={FACET_CONTACT_IDS[facet]} />` kèm link
  "Tất cả kênh liên hệ →" trỏ `/contact`.
- **`/contact`** — bốn khối có anchor để nơi khác deep-link:
  `#general`, `#dev`, `#trading`, `#creator`.
- **`/about`** — trang "con người": tiểu sử, học vấn, chứng chỉ, giải thưởng,
  ngôn ngữ. **Gỡ** khối trading (`about.tradingLabel`, `about.trading1..3` →
  chuyển sang `/trading` ở đợt 2) và **gỡ** khối liên hệ
  (`about.contactLabel`, `about.contact` → chuyển sang `/contact`), thay bằng
  một dòng dẫn sang `/contact`.
- **Footer** — chỉ kênh chung, dùng chính `ContactBlock` với
  `GENERAL_CONTACT_IDS`.

`components/contact-block.tsx` nhận **danh sách id**, không nhận facet. Nhờ vậy
một component phục vụ cả bốn chỗ: trang nhánh, `/contact`, footer, và khối
chung ở hub.

### 4.5 Redirect

`next.config.ts` hiện chưa có `redirects()` nào. Thêm:

```ts
async redirects() {
  return ["experience", "skills", "projects"].map((page) => ({
    source: `/:locale(en|vi)/${page}`,
    destination: `/:locale/dev/${page}`,
    permanent: true,   // 308
  }));
}
```

Dùng matcher locale thay vì import `routing` vào config — tránh kéo runtime
next-intl vào thời điểm đọc config. Đánh đổi: danh sách locale bị lặp ở hai
nơi, nên §7 có một test neo nó lại.

## 5. Nội dung

`/creator/channels` là một trang mà toàn bộ nội dung là danh sách kênh, và hiện
có **0 kênh** (LinkedIn và GitHub đã xếp vào nhánh dev; creator chỉ còn một
email). `/creator/work` cũng chưa có tác phẩm nào. `/trading/markets` và
`/trading/notes` khá hơn chút: có ba mốc năm, nhưng không instrument, không ghi
chép.

Không bịa nội dung. Một trang creator rỗng tệ hơn là chưa có nhánh creator. Xử
lý bằng đợt (§8) cộng guard non-empty (§7).

## 6. SEO

### 6.1 Sitemap và metadata

`app/sitemap.ts` đọc `ROUTES` nên **không phải sửa** — thêm 10 route là tự có
10 URL × 2 locale. `lib/metadata.ts` giữ nguyên cơ chế; mỗi route mới cần
`metaTitle`/`metaDescription` ở cả hai catalog.

### 6.2 JSON-LD (`lib/structured-data.ts`)

```ts
email: `mailto:${primaryEmail()}`,
sameAs: profileChannels().map((c) => c.url),
contactPoint: [
  { "@type": "ContactPoint", contactType: "software engineering",  email: "mailto:Dev.KingNNT@gmail.com" },
  { "@type": "ContactPoint", contactType: "trading",               email: "mailto:Trader.KingNNT@gmail.com" },
  { "@type": "ContactPoint", contactType: "content collaboration", email: "mailto:Work.KingNNT@gmail.com" },
]
```

`contactPoint` sinh thẳng từ `FACET_CONTACT_IDS` nên không thể lệch với trang.
Đây là chỗ việc tách kênh trả cổ tức với answer engine: câu hỏi "liên hệ anh ấy
về trading thế nào" có câu trả lời có cấu trúc.

`ContactPoint` **không** phải node `Organization`. Ràng buộc ẩn danh nguyên
vẹn: vẫn không `worksFor`, không `affiliation`, không node `Organization`.

### 6.3 OG image

Giữ **đúng một** OG image dùng chung. `app/[locale]/opengraph-image.tsx` là file
phức tạp nhất repo — fetch chân dung qua HTTP công khai, ba lớp kiểm body
(status, content-type, magic number JPEG), hex màu chép tay vì Satori không đọc
biến CSS, cộng một lớp lỗi không try/catch nào bắt được vì `ImageResponse`
render trong callback `start` của `ReadableStream`. Nhân file đó lên ba là nhân
luôn cả ba lớp phòng thủ và cả cái lớp lỗi không bắt được. Hoãn tới khi có nhu
cầu thật.

### 6.4 `lib/llms.ts`

Hiện phát một khối "Roles / Selected work / Skills / Contact" phẳng — mô tả
đúng một site một mảng. Cấu trúc mới:

```
# Ninh Ngọc Tuấn
> …

## Pages                    ← vẫn sinh từ ROUTES, tự có 15 dòng
## Software engineering
   ### Roles  ### Selected work  ### Skills
## Trading                  ← khi có dữ liệu (đợt 2)
## Content                  ← khi có dữ liệu (đợt 3)
## Contact
   - General: Work.KingNNT@gmail.com
   - Software engineering: Dev.KingNNT@gmail.com, LinkedIn, GitHub
   - Trading: Trader.KingNNT@gmail.com
   - Content: Work.KingNNT@gmail.com
```

Khối Contact sinh từ `GENERAL_CONTACT_IDS` + `FACET_CONTACT_IDS`, cùng nguồn
với `/contact` và với `contactPoint`. Một nguồn, ba nơi phát.

### 6.5 `CONTENT_LAST_MODIFIED`

Bump sang ngày merge đợt 1. Catalog đổi nhiều — đây đúng là trường hợp hằng số
này tồn tại để phục vụ.

## 7. Tác động lên file và kiểm thử

### 7.1 File chạm (đợt 1)

| File | Việc |
| --- | --- |
| `enums/facet.enum.ts` | mới |
| `lib/profile/contact.ts` | mới |
| `lib/profile/identity.ts` | bỏ `email`, `socials` |
| `lib/profile/index.ts` | export `./contact` |
| `lib/routes.ts` | `facet` vào `RouteDef`; 15 route; hai hàm nav mới |
| `lib/structured-data.ts` | `primaryEmail()`, `profileChannels()`, `contactPoint` |
| `lib/llms.ts` | tái cấu trúc theo nhánh |
| `components/contact-block.tsx` | mới |
| `components/facet-nav.tsx` | mới |
| `components/site-header.tsx` | `primaryNavRoutes()` |
| `components/site-footer.tsx` | dùng `ContactBlock` |
| `app/[locale]/(public)/_components/hero.tsx` | bỏ email/socials trực tiếp |
| `app/[locale]/(public)/_components/nav-index.tsx` | 4 trang → 3 lối vào nhánh |
| `app/[locale]/(public)/page.tsx` | hub |
| `app/[locale]/(public)/about/page.tsx` | gỡ khối trading + liên hệ |
| `app/[locale]/(public)/dev/layout.tsx` + 4 page | mới; 3 page cũ chuyển vào |
| `app/[locale]/(public)/contact/page.tsx` | mới |
| `app/[locale]/(public)/{trading,creator}/layout.tsx` + hub | mới, nội dung chờ đợt sau |
| `next.config.ts` | `redirects()` |
| `messages/{en,vi}.json` | key cho 15 route; gỡ `about.trading*`, `about.contact*` |

Import `contact.ts` từ **leaf module**, không qua barrel `@/lib/profile`, trong
mọi client component — đúng kỷ luật `site-header.tsx` đang giữ để không kéo
experience/projects/skills vào bundle.

### 7.2 Test phải sửa

| Test | Vì sao |
| --- | --- |
| `tests/lib/routes.test.ts` | đang khẳng định `navRoutes()` ra `["about","experience","skills","projects"]` |
| `tests/messages/id-coverage.test.ts` | đang neo `home.index` vào `navRoutes()`; giờ `home.index` chỉ có 3 nhánh còn nav có 5 mục → neo vào `FACETS` |
| `tests/lib/profile.test.ts` | đọc `IDENTITY.socials` → `profileChannels()` |
| `tests/seo/structured-data.test.ts` | đọc `IDENTITY.socials` → `profileChannels()` |
| `tests/pages/about.test.tsx` | bỏ phần trading và contact |

### 7.3 Test mới

1. **contact** — mọi id trong `GENERAL_CONTACT_IDS` và `FACET_CONTACT_IDS` phải
   tồn tại trong `CONTACT_CHANNELS`. Đây là lỗi duy nhất mà `Record<Facet, …>`
   không bắt được: kiểu ép phải có *một danh sách*, không ép các id trong danh
   sách đó có thật.
2. **redirect** — ba URL cũ có đích đúng, và danh sách locale trong matcher của
   `next.config.ts` khớp `routing.locales` (matcher `(en|vi)` là bản sao chép
   tay, §4.5).
3. **facet coverage** — mỗi facet có đúng một hub, đúng các trang con đã khai,
   và ít nhất một kênh liên hệ.
4. **`contactPoint`** — số lượng và email khớp `FACET_CONTACT_IDS`.
5. **guard non-empty** (đợt 2/3) — mọi mảng nguồn của mỗi nhánh non-empty, mọi
   `id` có bản dịch không rỗng ở cả hai locale. Không có nó, một nhánh chưa có
   dữ liệu vẫn deploy xanh và ra ba trang trắng.

## 8. Triển khai theo đợt

**Đợt 1 — hạ tầng + nhánh dev + `/contact`.** Toàn bộ §3.1–3.3, §4, §6, §7.
Tất cả đều có dữ liệu thật, deploy được ngay. `/trading` và `/creator` chỉ có
hub + khối liên hệ; các route con của chúng **không vào `ROUTES`** ở đợt này —
không vào sitemap, không vào `llms.txt`, không vào sub-nav.

**Đợt 2 — nhánh trading.** §3.4 cộng 3 page, mở khoá khi chủ trang cung cấp:
instrument từng thị trường, nội dung ghi chép, và ba đoạn văn chuyển từ
`/about`.

**Đợt 3 — nhánh creator.** §3.5 cộng 3 page, mở khoá khi có: danh sách kênh
(nền tảng, handle, url), tác phẩm tiêu biểu, các loại hợp tác nhận.

Bảng §4.1 khai đủ 15 route để đợt sau là *thêm mục vào registry*, không phải
thiết kế lại.

## 9. Rủi ro

| Rủi ro | Giảm thiểu |
| --- | --- |
| Ba URL đang có đổi đường dẫn | Redirect 308 vĩnh viễn (§4.5) + test neo. Site chưa có backlink sâu tới `/skills`. |
| Mở rộng trading kéo trang vào YMYL | Không có trường số hiệu suất ở tầng kiểu (§3.4); `/trading/notes` là phương pháp, không khuyến nghị. |
| Nhánh creator ship rỗng | Guard non-empty (§7.3.5) + đợt 3 bị chặn cho tới khi có dữ liệu. |
| Nội dung mới làm rò tên bị cấm | `tests/lib/anonymity.test.ts` đã quét `lib/**`, `app/**`, `components/**`, `messages/**`; file mới tự động nằm trong diện quét. |
| Site đọc ra ba website rời rạc | `/about` và hub là chỗ giữ "một con người"; `personSchema` vẫn là **một** node Person duy nhất cho cả ba nhánh. |
