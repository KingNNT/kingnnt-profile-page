# Facet Split — Đợt 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách trang cá nhân một-mảng hiện tại thành hub + ba nhánh (dev / trading / creator), mỗi nhánh có kênh liên hệ riêng, cộng một trang `/contact` gom đủ mọi kênh.

**Architecture:** `Facet` trở thành một chiều bậc nhất: `RouteDef` mọc thêm trường `facet`, cây phân cấp suy ra từ `parent` sẵn có, và kênh liên hệ chuyển từ hai trường trên `IDENTITY` sang một module `lib/profile/contact.ts` nơi mỗi kênh là **một bản ghi** được các nhóm **tham chiếu bằng id**. Đợt 1 dựng trọn hạ tầng đó, chuyển nhánh dev sang `/dev/*`, và ship `/contact`; nhánh trading nhận nội dung đã có sẵn trong `/about`, nhánh creator dừng ở hub.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, next-intl (`localePrefix: "always"`), Tailwind v4, Vitest + jsdom + Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-16-facet-split-design.md`

## Global Constraints

- Package manager là **pnpm**. Chạy test: `pnpm test`. Một file: `pnpm exec vitest run <path>`.
- Lint: `pnpm lint` phải sạch cảnh báo. **Không** được thêm comment `eslint-disable` nào.
- Format: `pnpm format` (Biome). CI chạy `pnpm format:check`.
- Conventional Commits, commitlint bắt buộc. **Không** thêm `Co-Authored-By` hay dòng attribution.
- Nhánh làm việc: `feature/facet-split` (đã tạo, tách từ `develop`). Không commit thẳng vào `develop`.
- **Ẩn danh:** không nêu tên nơi làm việc, công ty đứng sau sản phẩm, khách hàng cuối, codename nội bộ. Trường chứa URL **bắt buộc đặt tên là `url`** — `stripUrls` trong `tests/lib/anonymity.test.ts` chỉ miễn trừ đúng tên đó.
- **JSON-LD:** không `worksFor`, không `affiliation`, không node `Organization`.
- **YMYL:** nội dung trading không có số hiệu suất, không khuyến nghị mua bán. Không thêm trường `return`/`pnl`/`winRate`/`capital` vào bất kỳ kiểu nào.
- Điều hướng nội bộ dùng `@/i18n/navigation`, **không** `next/link` / `next/navigation`.
- Server Component đọc bản dịch qua `getTranslations`; Client Component qua `useTranslations`. Gọi `setRequestLocale(locale)` trong page để giữ static rendering.
- Canonical đặt ở **page**, không đặt ở layout.
- Client component import từ **leaf module** (`@/lib/profile/contact`), không qua barrel `@/lib/profile`.
- Mỗi key thêm vào `messages/en.json` phải có bản tương ứng ở `messages/vi.json` — `tests/messages/parity.test.ts` bắt lệch.

---

### Task 1: Facet enum và module contact

**Files:**
- Create: `enums/facet.enum.ts`
- Modify: `enums/index.ts`
- Create: `lib/profile/contact.ts`
- Modify: `lib/profile/index.ts`
- Test: `tests/lib/contact.test.ts`

**Interfaces:**
- Consumes: không có (task đầu tiên)
- Produces:
  - `FACETS: readonly ["dev", "trading", "creator"]`, `type Facet`
  - `FACET_CONTACT_TYPE: Record<Facet, string>`, `FACET_LABEL_EN: Record<Facet, string>`
  - `type ContactChannelId`, `type ContactChannel`, `type ProfileChannel`
  - `CONTACT_CHANNELS`, `GENERAL_CONTACT_IDS`, `FACET_CONTACT_IDS`
  - `channelsFor(ids: readonly ContactChannelId[]): ContactChannel[]`
  - `primaryEmail(): string`
  - `profileChannels(): ProfileChannel[]`

- [ ] **Step 1: Viết test đỏ**

Tạo `tests/lib/contact.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/lib/contact.test.ts`
Expected: FAIL — không phân giải được `@/lib/profile/contact` và `FACETS`.

- [ ] **Step 3: Tạo `enums/facet.enum.ts`**

```ts
export const FACETS = ["dev", "trading", "creator"] as const;

export type Facet = (typeof FACETS)[number];

/**
 * Nhãn tiếng Anh của từng nhánh. Cố ý **không** nằm trong message catalog:
 * chúng không bao giờ render ra trang — chỗ dùng duy nhất là `llms.txt` và
 * `contactType` trong JSON-LD, cả hai đều chỉ có một bản tiếng Anh.
 */
export const FACET_LABEL_EN: Record<Facet, string> = {
  dev: "Software engineering",
  trading: "Trading",
  creator: "Content",
};

/** `contactType` của schema.org ContactPoint — chữ thường theo quy ước schema. */
export const FACET_CONTACT_TYPE: Record<Facet, string> = {
  dev: "software engineering",
  trading: "trading",
  creator: "content collaboration",
};
```

- [ ] **Step 4: Export từ barrel enums**

`enums/index.ts` — thêm một dòng:

```ts
export * from "./facet.enum";
export * from "./locale.enum";
```

- [ ] **Step 5: Tạo `lib/profile/contact.ts`**

```ts
import type { Facet } from "@/enums";

export type ContactChannelId =
  | "work-email"
  | "dev-email"
  | "trader-email"
  | "linkedin"
  | "github";

/**
 * Discriminated union, cùng lý do với `Project`: một entry LinkedIn không thể
 * có `address` để chỗ nào đó lỡ dựng `mailto:`, và một email không thể có
 * `url` để lọt vào `sameAs`. Trường URL bắt buộc tên là `url` — đó là tên duy
 * nhất `stripUrls` trong test ẩn danh miễn trừ.
 */
export type ContactChannel =
  | { id: ContactChannelId; kind: "email"; address: string }
  | { id: ContactChannelId; kind: "profile"; label: string; url: string };

export type ProfileChannel = Extract<ContactChannel, { kind: "profile" }>;

/** Mỗi kênh đúng một bản ghi. Nhóm ở dưới tham chiếu bằng id, không sao chép. */
export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  { id: "work-email", kind: "email", address: "Work.KingNNT@gmail.com" },
  { id: "dev-email", kind: "email", address: "Dev.KingNNT@gmail.com" },
  { id: "trader-email", kind: "email", address: "Trader.KingNNT@gmail.com" },
  {
    id: "linkedin",
    kind: "profile",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/kingnnt/",
  },
  { id: "github", kind: "profile", label: "GitHub", url: "https://github.com/KingNNT" },
];

/** Cửa trước cho mọi mảng. Hiển thị ở hub và footer. */
export const GENERAL_CONTACT_IDS: readonly ContactChannelId[] = ["work-email"];

/**
 * `Record` chứ không `Partial`: thêm một nhánh mà quên khai kênh là lỗi biên
 * dịch, không phải một khối liên hệ rỗng render lặng lẽ.
 */
export const FACET_CONTACT_IDS: Record<Facet, readonly ContactChannelId[]> = {
  dev: ["dev-email", "linkedin", "github"],
  trading: ["trader-email"],
  creator: ["work-email"],
};

export function channelsFor(ids: readonly ContactChannelId[]): ContactChannel[] {
  return ids.map((id) => {
    const channel = CONTACT_CHANNELS.find((c) => c.id === id);
    if (!channel) throw new Error(`unknown contact channel id "${id}"`);
    return channel;
  });
}

/** Email chung — thứ `personSchema` và footer dùng. */
export function primaryEmail(): string {
  const channel = channelsFor(GENERAL_CONTACT_IDS).find((c) => c.kind === "email");
  if (channel === undefined || channel.kind !== "email") {
    throw new Error("GENERAL_CONTACT_IDS carries no email channel");
  }
  return channel.address;
}

/** Mọi profile công khai, bất kể nhánh — `sameAs` nói về danh tính, không về mảng. */
export function profileChannels(): ProfileChannel[] {
  return CONTACT_CHANNELS.filter((c): c is ProfileChannel => c.kind === "profile");
}
```

- [ ] **Step 6: Export từ barrel profile**

`lib/profile/index.ts` — thêm dòng đầu tiên theo thứ tự alphabet:

```ts
export * from "./contact";
export * from "./credentials";
```

- [ ] **Step 7: Chạy test để chắc nó xanh**

Run: `pnpm exec vitest run tests/lib/contact.test.ts`
Expected: PASS — 10 test.

- [ ] **Step 8: Chạy toàn bộ suite và lint**

Run: `pnpm test && pnpm lint`
Expected: PASS toàn bộ. `tests/lib/anonymity.test.ts` giờ quét thêm `lib/profile/contact.ts` và `enums` không nằm trong diện quét — cả hai đều không chứa tên bị cấm.

- [ ] **Step 9: Commit**

```bash
git add enums/facet.enum.ts enums/index.ts lib/profile/contact.ts lib/profile/index.ts tests/lib/contact.test.ts
git commit -m "feat(profile): add facet enum and referenced contact channels"
```

---

### Task 2: Component ContactBlock

**Files:**
- Create: `components/contact-block.tsx`
- Test: `tests/components/contact-block.test.tsx`

**Interfaces:**
- Consumes: `channelsFor`, `ContactChannelId` từ `@/lib/profile/contact`
- Produces: `<ContactBlock ids={…} variant?="block" | "inline" />`

Component thuần trình bày, **không** gọi i18n: nội dung nó hiển thị là địa chỉ email và tên profile, cả hai đều không dịch. Nhờ vậy test dựng được mà không mock next-intl, và nó dùng được ở cả Server Component lẫn footer.

- [ ] **Step 1: Viết test đỏ**

Tạo `tests/components/contact-block.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactBlock } from "@/components/contact-block";

describe("ContactBlock", () => {
  it("renders an email channel as a mailto link showing the address", () => {
    render(<ContactBlock ids={["dev-email"]} />);
    const link = screen.getByRole("link", { name: "Dev.KingNNT@gmail.com" });
    expect(link).toHaveAttribute("href", "mailto:Dev.KingNNT@gmail.com");
  });

  it("renders a profile channel as an external link showing its label", () => {
    render(<ContactBlock ids={["github"]} />);
    const link = screen.getByRole("link", { name: "GitHub" });
    expect(link).toHaveAttribute("href", "https://github.com/KingNNT");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "me noreferrer");
  });

  /** Một profile không bao giờ được biến thành mailto — union `kind` là để chặn đúng chuyện này. */
  it("never turns a profile into a mailto", () => {
    render(<ContactBlock ids={["linkedin"]} />);
    expect(screen.getByRole("link", { name: "LinkedIn" }).getAttribute("href")).not.toMatch(
      /^mailto:/,
    );
  });

  it("keeps the order it is given", () => {
    render(<ContactBlock ids={["github", "dev-email"]} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["GitHub", "Dev.KingNNT@gmail.com"]);
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<ContactBlock ids={[]} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/components/contact-block.test.tsx`
Expected: FAIL — không phân giải được `@/components/contact-block`.

- [ ] **Step 3: Tạo component**

```tsx
import { channelsFor, type ContactChannelId } from "@/lib/profile/contact";
import { cn } from "@/lib/utils";

interface ContactBlockProps {
  ids: readonly ContactChannelId[];
  /** `inline` cho dải footer, `block` cho một section liên hệ. */
  variant?: "block" | "inline";
  className?: string;
}

/**
 * Nhận danh sách id chứ không nhận facet: nhờ vậy đúng một component phục vụ
 * cả khối chung ở hub, khối riêng trên trang nhánh, bốn khối trong `/contact`,
 * và dải liên hệ ở footer.
 *
 * Không gọi i18n — thứ nó hiển thị là địa chỉ email và tên profile, không có
 * gì để dịch.
 */
export function ContactBlock({ ids, variant = "block", className }: ContactBlockProps) {
  const channels = channelsFor(ids);
  if (channels.length === 0) return null;

  return (
    <ul
      className={cn(
        "font-mono",
        variant === "inline" ? "flex items-center gap-4 text-xs" : "space-y-3 text-sm",
        className,
      )}
    >
      {channels.map((channel) =>
        channel.kind === "email" ? (
          <li key={channel.id}>
            <a
              className="border-b border-primary pb-0.5 text-primary transition-colors hover:text-foreground"
              href={`mailto:${channel.address}`}
            >
              {channel.address}
            </a>
          </li>
        ) : (
          <li key={channel.id}>
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={channel.url}
              rel="me noreferrer"
              target="_blank"
            >
              {channel.label}
            </a>
          </li>
        ),
      )}
    </ul>
  );
}
```

- [ ] **Step 4: Chạy test để chắc nó xanh**

Run: `pnpm exec vitest run tests/components/contact-block.test.tsx`
Expected: PASS — 5 test.

- [ ] **Step 5: Commit**

```bash
git add components/contact-block.tsx tests/components/contact-block.test.tsx
git commit -m "feat(components): add ContactBlock rendering channels by id"
```

---

### Task 3: Rút `email` và `socials` khỏi IDENTITY

**Files:**
- Modify: `lib/profile/identity.ts`
- Modify: `app/[locale]/(public)/_components/hero.tsx`
- Modify: `components/site-footer.tsx`
- Modify: `app/[locale]/layout.tsx:51`
- Modify: `app/[locale]/(public)/about/page.tsx:126-138`
- Modify: `lib/llms.ts`
- Modify: `lib/structured-data.ts`
- Modify: `messages/en.json`, `messages/vi.json` (xoá namespace `footer`)
- Test: `tests/lib/profile.test.ts:64-71`, `tests/seo/structured-data.test.ts:23-25,51-69`, `tests/seo/llms.test.ts`

**Interfaces:**
- Consumes: `primaryEmail`, `profileChannels`, `channelsFor`, `GENERAL_CONTACT_IDS`, `FACET_CONTACT_IDS` (Task 1); `ContactBlock` (Task 2); `FACETS`, `FACET_LABEL_EN`, `FACET_CONTACT_TYPE` (Task 1)
- Produces: `IDENTITY` không còn `email`/`socials`; `personSchema` có thêm `contactPoint`

Sáu chỗ đang đọc `IDENTITY.email`/`IDENTITY.socials`; sau task này con số đó là **không**. `SiteFooter` bỏ luôn `getTranslations` và prop `locale` — nó chỉ còn hiển thị tên, địa điểm và `ContactBlock`, không còn chữ nào để dịch, nên namespace `footer` (chỉ chứa một key `email`) bị xoá khỏi cả hai catalog.

- [ ] **Step 1: Cập nhật test cho `sameAs` và `contactPoint`**

`tests/seo/structured-data.test.ts` — sửa import và ba chỗ:

```ts
// dòng 3: thay `import { IDENTITY } from "@/lib/profile";`
import { FACET_CONTACT_IDS, IDENTITY, profileChannels } from "@/lib/profile";
import { FACETS, FACET_CONTACT_TYPE } from "@/enums";
```

```ts
  it("links out to every social profile as sameAs", () => {
    expect(person.sameAs).toEqual(profileChannels().map((c) => c.url));
  });

  /**
   * Kênh liên hệ theo nhánh, phát ra dưới dạng có cấu trúc. `ContactPoint`
   * KHÔNG phải node `Organization` — ràng buộc ẩn danh vẫn nguyên vẹn.
   */
  it("publishes one contact point per facet", () => {
    const points = person.contactPoint as { contactType: string; email: string }[];
    expect(points.map((p) => p.contactType)).toEqual(FACETS.map((f) => FACET_CONTACT_TYPE[f]));
    for (const point of points) {
      expect(point.email).toMatch(/^mailto:/);
    }
  });

  it("keeps every contact point in step with the contact module", () => {
    const points = person.contactPoint as { email: string }[];
    expect(points).toHaveLength(FACETS.filter((f) => FACET_CONTACT_IDS[f].length > 0).length);
  });
```

Và thêm `"contactPoint"` vào allowlist ở dòng 52-68 (danh sách key của `person`).

- [ ] **Step 2: Cập nhật test profile**

`tests/lib/profile.test.ts` — dòng 7 bỏ `IDENTITY` khỏi import nếu không còn dùng ở chỗ khác (**vẫn còn dùng** ở test cuối, dòng 93), thêm `profileChannels`; dòng 65 đổi:

```ts
    const urls = [...PROJECTS.map((p) => p.url), ...profileChannels().map((c) => c.url)];
```

- [ ] **Step 3: Chạy hai file test để chắc chúng đỏ**

Run: `pnpm exec vitest run tests/seo/structured-data.test.ts tests/lib/profile.test.ts`
Expected: FAIL — `person.contactPoint` là `undefined`, và `profileChannels` chưa được `personSchema` dùng.

- [ ] **Step 4: Rút hai trường khỏi `identity.ts`**

Xoá `Social`, `socials`, `email` — file còn lại:

```ts
export interface Identity {
  fullName: string;
  englishName: string;
  nickname: string;
  jobTitle: string;
  location: { city: string; country: string };
}

/**
 * Số điện thoại và ngày sinh trong CV cố ý không có ở đây. Trang này công khai
 * và được crawler đọc; một số điện thoại đặt trên trang công khai là một số
 * điện thoại đã bị thu thập.
 *
 * Email và social cũng không ở đây nữa: chúng phụ thuộc vào nhánh (dev,
 * trading, creator dùng địa chỉ khác nhau) nên sống trong `./contact`.
 */
export const IDENTITY: Identity = {
  fullName: "Ninh Ngọc Tuấn",
  englishName: "Jesse",
  nickname: "KingNNT",
  jobTitle: "Solutions Consultant",
  location: { city: "Hà Nội", country: "Việt Nam" },
};
```

- [ ] **Step 5: Cập nhật `lib/structured-data.ts`**

Thêm import và một helper, sửa hai dòng trong `personSchema`:

```ts
import { FACET_CONTACT_TYPE, FACETS } from "@/enums";
import { allSkillNames, channelsFor, EDUCATION, FACET_CONTACT_IDS, IDENTITY, primaryEmail, profileChannels } from "@/lib/profile";
```

```ts
/**
 * Một ContactPoint cho mỗi nhánh, sinh thẳng từ `FACET_CONTACT_IDS` nên không
 * thể lệch với trang `/contact`. Nhánh nào không có email thì không có điểm
 * liên hệ — không bịa ra một cái rỗng.
 */
function contactPoints() {
  return FACETS.flatMap((facet) => {
    const email = channelsFor(FACET_CONTACT_IDS[facet]).find((c) => c.kind === "email");
    return email !== undefined && email.kind === "email"
      ? [
          {
            "@type": "ContactPoint",
            contactType: FACET_CONTACT_TYPE[facet],
            email: `mailto:${email.address}`,
          },
        ]
      : [];
  });
}
```

Trong `personSchema`: `email: \`mailto:${primaryEmail()}\``, `sameAs: profileChannels().map((c) => c.url)`, và thêm `contactPoint: contactPoints(),` ngay sau `sameAs`.

- [ ] **Step 6: Cập nhật `lib/llms.ts`**

Đổi import và thay khối Contact ở cuối:

```ts
import { FACET_LABEL_EN, FACETS } from "@/enums";
import {
  channelsFor,
  type ContactChannelId,
  EXPERIENCE,
  FACET_CONTACT_IDS,
  featuredProjects,
  GENERAL_CONTACT_IDS,
  IDENTITY,
  SKILL_GROUPS,
} from "@/lib/profile";
```

```ts
function contactLine(label: string, ids: readonly ContactChannelId[]): string {
  const rendered = channelsFor(ids).map((channel) =>
    channel.kind === "email" ? channel.address : `${channel.label}: ${channel.url}`,
  );
  return `- ${label}: ${rendered.join(", ")}`;
}
```

Thay hai dòng cuối của mảng `lines` (`- Email: …` và `...IDENTITY.socials.map(...)`) bằng:

```ts
    contactLine("General", GENERAL_CONTACT_IDS),
    ...FACETS.filter((facet) => FACET_CONTACT_IDS[facet].length > 0).map((facet) =>
      contactLine(FACET_LABEL_EN[facet], FACET_CONTACT_IDS[facet]),
    ),
```

Và đổi heading `"## Roles"` thành hai dòng `"## Software engineering"`, `""`, `"### Roles"`; tương tự `"## Selected work"` → `"### Selected work"`, `"## Skills"` → `"### Skills"`. Heading `## Trading` và `## Content` được thêm ở đợt 2/3.

- [ ] **Step 7: Cập nhật ba consumer còn lại**

`app/[locale]/(public)/_components/hero.tsx` — bỏ import `IDENTITY.socials`, thay khối `<div className="mt-8 …">` bằng:

```tsx
        <ContactBlock ids={GENERAL_CONTACT_IDS} variant="inline" className="mt-8" />
```

với `import { ContactBlock } from "@/components/contact-block";` và `import { GENERAL_CONTACT_IDS } from "@/lib/profile/contact";`. Hệ quả có chủ ý: hero ở hub chỉ còn kênh chung — LinkedIn và GitHub đã thuộc nhánh dev và sẽ xuất hiện ở `/dev` (Task 6).

`components/site-footer.tsx` — thành component đồng bộ, không prop, không i18n:

```tsx
import { ContactBlock } from "@/components/contact-block";
import { GENERAL_CONTACT_IDS } from "@/lib/profile/contact";
import { IDENTITY } from "@/lib/profile/identity";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {IDENTITY.fullName} · {IDENTITY.location.city}, {IDENTITY.location.country}
        </p>
        <ContactBlock ids={GENERAL_CONTACT_IDS} variant="inline" />
      </div>
    </footer>
  );
}
```

`app/[locale]/layout.tsx:51` — `<SiteFooter locale={locale} />` thành `<SiteFooter />`.

`app/[locale]/(public)/about/page.tsx:131-136` — thay thẻ `<a>` cứng bằng `<ContactBlock ids={GENERAL_CONTACT_IDS} className="mt-6" />`. (Cả section này bị gỡ ở Task 8; đổi ở đây để repo xanh sau mỗi task.)

- [ ] **Step 8: Xoá namespace `footer` khỏi hai catalog**

Xoá khối `"footer": { "email": "Email" }` khỏi `messages/en.json` và `messages/vi.json`.

- [ ] **Step 9: Chạy toàn bộ suite**

Run: `pnpm test`
Expected: PASS. Nếu `tests/seo/llms.test.ts` đỏ vì khẳng định trên chuỗi Contact cũ, cập nhật nó theo định dạng `- General: …` mới.

- [ ] **Step 10: Lint, format, commit**

```bash
pnpm lint && pnpm format
git add -A
git commit -m "refactor(profile): move contact channels out of IDENTITY

Email và social profile phụ thuộc vào nhánh, nên chúng thuộc về module
contact chứ không thuộc identity. personSchema có thêm contactPoint cho
từng nhánh; llms.txt gom kênh theo nhóm."
```

---

### Task 4: API điều hướng theo facet

**Files:**
- Modify: `lib/routes.ts`
- Modify: `components/site-header.tsx:7,35`
- Modify: `app/[locale]/(public)/page.tsx:9,31`
- Test: `tests/lib/routes.test.ts`, `tests/messages/id-coverage.test.ts:11,134-140`

**Interfaces:**
- Consumes: `Facet` (Task 1)
- Produces: `RouteDef.facet?: Facet`; `primaryNavRoutes(): RouteDef[]`, `facetHubRoutes(): RouteDef[]`, `facetRoutes(facet: Facet): RouteDef[]`. `navRoutes()` bị xoá.

Task này **không đổi hành vi**: mọi route hiện có đều có `parent: HOME_PATH`, nên `primaryNavRoutes()` trả về đúng thứ `navRoutes()` đang trả. Đổi route thật diễn ra ở Task 6. Tách ra để reviewer xem được API mới mà không phải đọc lẫn với việc di chuyển trang.

- [ ] **Step 1: Viết test đỏ**

`tests/lib/routes.test.ts` — thay import `navRoutes` bằng `facetHubRoutes, facetRoutes, primaryNavRoutes`, thay test dòng 30-32 và thêm ba test:

```ts
  it("lists the primary navigation from the routes parented at home", () => {
    expect(primaryNavRoutes().map((r) => r.path)).toEqual([
      "about",
      "experience",
      "skills",
      "projects",
    ]);
  });

  it("excludes home from the primary navigation", () => {
    expect(primaryNavRoutes().map((r) => r.path)).not.toContain(HOME_PATH);
  });

  /** Chưa có nhánh nào ở bước này — Task 6 mới thêm. Test neo con số ở 0 để
   * lần thêm đầu tiên là một thay đổi cố ý, nhìn thấy được trong diff. */
  it("has no facet hub yet", () => {
    expect(facetHubRoutes()).toEqual([]);
  });

  it("returns an empty child list for a facet with no hub", () => {
    expect(facetRoutes("dev")).toEqual([]);
  });
```

`tests/messages/id-coverage.test.ts` — dòng 11 đổi `navRoutes` thành `primaryNavRoutes`, dòng 134-140 đổi tương ứng:

```ts
  it("covers every non-home route key in home.index, both directions", () => {
    assertIdsMatchCatalog(
      "primaryNavRoutes()",
      primaryNavRoutes().map((route) => route.key),
      ["home", "index"],
    );
  });
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/lib/routes.test.ts`
Expected: FAIL — `primaryNavRoutes`, `facetHubRoutes`, `facetRoutes` chưa tồn tại.

- [ ] **Step 3: Sửa `lib/routes.ts`**

Thêm import `import type { Facet } from "@/enums";`, thêm trường vào `RouteDef`:

```ts
  /** Nhánh chứa route. `undefined` = route chung: hub, about, contact. */
  facet?: Facet;
```

Thay `navRoutes()` bằng ba hàm:

```ts
/**
 * Thanh điều hướng tầng một: mọi route treo thẳng dưới trang chủ. Cây phân cấp
 * suy ra từ `parent` sẵn có, không khai thêm một trường thứ hai để hai nguồn
 * có cơ hội lệch nhau.
 */
export function primaryNavRoutes(): RouteDef[] {
  return ROUTES.filter((route) => route.parent === HOME_PATH);
}

/** Trang chủ của từng nhánh — thứ trang hub liệt kê làm lối vào. */
export function facetHubRoutes(): RouteDef[] {
  return primaryNavRoutes().filter((route) => route.facet !== undefined);
}

/** Các trang con của một nhánh, theo đúng thứ tự trong registry. Rỗng nếu nhánh chưa có hub. */
export function facetRoutes(facet: Facet): RouteDef[] {
  const hub = facetHubRoutes().find((route) => route.facet === facet);
  return hub === undefined ? [] : ROUTES.filter((route) => route.parent === hub.path);
}
```

- [ ] **Step 4: Cập nhật hai consumer**

`components/site-header.tsx` — dòng 7 và 35: `navRoutes` → `primaryNavRoutes`.
`app/[locale]/(public)/page.tsx` — dòng 9 và 31: `navRoutes` → `primaryNavRoutes`.

- [ ] **Step 5: Chạy toàn bộ suite**

Run: `pnpm test`
Expected: PASS. `tests/components/site-header.test.tsx` xanh không cần sửa — danh sách route chưa đổi.

- [ ] **Step 6: Lint và commit**

```bash
pnpm lint
git add -A
git commit -m "refactor(routes): derive navigation tiers from route parent and facet"
```

---

### Task 5: Component FacetNav

**Files:**
- Create: `components/facet-nav.tsx`
- Test: `tests/components/facet-nav.test.tsx`

**Interfaces:**
- Consumes: `facetRoutes` (Task 4), `Facet` (Task 1)
- Produces: `<FacetNav facet={…} />`

Client Component (cần `usePathname` để đánh dấu trang hiện tại), theo đúng khuôn `SiteHeader`. Import `facetRoutes` từ `@/lib/routes` — module đó không kéo theo dữ liệu profile nào nên không phình bundle.

- [ ] **Step 1: Viết test đỏ**

Tạo `tests/components/facet-nav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let mockPathname = "/dev/skills";
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ devExperience: "Experience", devSkills: "Skills", devProjects: "Projects" })[key] ?? key,
}));

import { FacetNav } from "@/components/facet-nav";

describe("FacetNav", () => {
  it("links every child route of the facet", () => {
    mockPathname = "/dev/skills";
    render(<FacetNav facet="dev" />);
    for (const name of ["Experience", "Skills", "Projects"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", expect.stringContaining("/dev/"));
    }
  });

  it("marks the current page for assistive technology", () => {
    mockPathname = "/dev/skills";
    render(<FacetNav facet="dev" />);
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark sibling pages as current", () => {
    mockPathname = "/dev/skills";
    render(<FacetNav facet="dev" />);
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
  });

  /** Trên chính trang hub của nhánh, không mục con nào là trang hiện tại. */
  it("marks nothing as current on the facet hub", () => {
    mockPathname = "/dev";
    render(<FacetNav facet="dev" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  /** Nhánh chưa có trang con thì không render một thanh rỗng. */
  it("renders nothing when the facet has no child routes", () => {
    const { container } = render(<FacetNav facet="creator" />);
    expect(container.querySelector("nav")).toBeNull();
  });
});
```

**Lưu ý:** test này giả định nhánh `dev` đã có ba trang con trong registry — điều Task 6 mới làm. Chạy nó ở Task 5 sẽ đỏ ở bốn test đầu vì `facetRoutes("dev")` còn rỗng. Vì vậy ở task này chỉ giữ **hai** test không phụ thuộc registry (`renders nothing when the facet has no child routes` cho `dev` và cho `creator`), và bốn test còn lại được thêm ở Task 6 Step 8. Viết file với hai test đó trước:

```tsx
  it("renders nothing while the facet has no child routes", () => {
    const { container } = render(<FacetNav facet="dev" />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("renders nothing for a facet that has no hub at all", () => {
    const { container } = render(<FacetNav facet="creator" />);
    expect(container.querySelector("nav")).toBeNull();
  });
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/components/facet-nav.test.tsx`
Expected: FAIL — không phân giải được `@/components/facet-nav`.

- [ ] **Step 3: Tạo component**

```tsx
"use client";

import { useTranslations } from "next-intl";
import type { Facet } from "@/enums";
import { Link, usePathname } from "@/i18n/navigation";
import { facetRoutes } from "@/lib/routes";
import { cn, dynamicMessageKey } from "@/lib/utils";

/**
 * Điều hướng tầng hai, render bởi layout của từng nhánh. `SiteHeader` cố ý
 * không biết facet là gì: sub-nav thuộc về nhánh, không thuộc về site.
 *
 * Nhánh chưa có trang con thì không render gì — một thanh điều hướng rỗng là
 * tiếng ồn với screen reader.
 */
export function FacetNav({ facet }: { facet: Facet }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const routes = facetRoutes(facet);

  if (routes.length === 0) return null;

  return (
    <nav className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-5 overflow-x-auto px-6 py-3">
        {routes.map((route) => {
          const href = `/${route.path}`;
          const current = pathname === href;
          return (
            <Link
              key={route.path}
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "whitespace-nowrap font-mono text-xs tracking-tight transition-colors",
                current ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(dynamicMessageKey(route.key))}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Chạy test để chắc nó xanh**

Run: `pnpm exec vitest run tests/components/facet-nav.test.tsx`
Expected: PASS — 2 test.

- [ ] **Step 5: Lint và commit**

```bash
pnpm lint
git add components/facet-nav.tsx tests/components/facet-nav.test.tsx
git commit -m "feat(components): add FacetNav for the second navigation tier"
```

---

### Task 6: Chuyển nhánh dev sang `/dev/*`

**Files:**
- Move: `app/[locale]/(public)/{experience,skills,projects}/page.tsx` → `app/[locale]/(public)/dev/{experience,skills,projects}/page.tsx`
- Create: `app/[locale]/(public)/dev/layout.tsx`
- Create: `app/[locale]/(public)/dev/page.tsx`
- Modify: `lib/routes.ts` (ROUTES)
- Modify: `messages/en.json`, `messages/vi.json`
- Modify: `tests/lib/routes.test.ts`, `tests/messages/id-coverage.test.ts:80-100`, `tests/components/site-header.test.tsx`, `tests/components/facet-nav.test.tsx`, `tests/seo/structured-data.test.ts:94-104`, `tests/pages/{experience,skills,projects}.test.tsx`

**Interfaces:**
- Consumes: `FacetNav` (Task 5), `facetRoutes`/`facetHubRoutes` (Task 4), `ContactBlock` (Task 2), `FACET_CONTACT_IDS` (Task 1)
- Produces: route `dev`, `dev/experience`, `dev/skills`, `dev/projects` với key `dev`, `devExperience`, `devSkills`, `devProjects`

Route key **là** namespace catalog của trang đó (CLAUDE.md), nên ba namespace `experience`/`skills`/`projects` được đổi tên thành `devExperience`/`devSkills`/`devProjects` cùng lúc.

- [ ] **Step 1: Cập nhật test registry trước**

`tests/lib/routes.test.ts` — thay ba test:

```ts
  it("registers exactly the public routes of phase one", () => {
    expect(ROUTES.map((r) => r.path).sort()).toEqual(
      ["", "about", "dev", "dev/experience", "dev/projects", "dev/skills"].sort(),
    );
  });

  it("lists the primary navigation from the routes parented at home", () => {
    expect(primaryNavRoutes().map((r) => r.path)).toEqual(["dev", "about"]);
  });

  it("hangs every dev page under the dev hub", () => {
    expect(facetRoutes("dev").map((r) => r.path)).toEqual([
      "dev/experience",
      "dev/skills",
      "dev/projects",
    ]);
  });

  it("registers one hub per facet that has pages", () => {
    expect(facetHubRoutes().map((r) => r.facet)).toEqual(["dev"]);
  });

  it("builds a breadcrumb trail rooted at home", () => {
    expect(breadcrumbTrail("dev/skills").map((r) => r.path)).toEqual([HOME_PATH, "dev", "dev/skills"]);
  });
```

(Xoá test `has no facet hub yet` và `returns an empty child list for a facet with no hub` — thay bằng hai test trên; `facetRoutes("trading")` vẫn rỗng và được phủ ở Task 9.)

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/lib/routes.test.ts`
Expected: FAIL — ROUTES vẫn còn `experience`, `skills`, `projects` ở gốc.

- [ ] **Step 3: Viết lại `ROUTES`**

```ts
export const ROUTES: readonly RouteDef[] = [
  { path: HOME_PATH, key: "home", priority: 1, changeFrequency: "monthly" },
  { path: "dev", key: "dev", parent: HOME_PATH, facet: "dev", priority: 0.9, changeFrequency: "monthly" },
  {
    path: "dev/experience",
    key: "devExperience",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "dev/skills",
    key: "devSkills",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "dev/projects",
    key: "devProjects",
    parent: "dev",
    facet: "dev",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  { path: "about", key: "about", parent: HOME_PATH, priority: 0.9, changeFrequency: "monthly" },
];
```

- [ ] **Step 4: Di chuyển ba trang, giữ lịch sử git**

```bash
mkdir -p "app/[locale]/(public)/dev"
git mv "app/[locale]/(public)/experience" "app/[locale]/(public)/dev/experience"
git mv "app/[locale]/(public)/skills" "app/[locale]/(public)/dev/skills"
git mv "app/[locale]/(public)/projects" "app/[locale]/(public)/dev/projects"
```

Trong mỗi trang vừa chuyển, sửa hai chỗ:
- `const PATH = "experience";` → `const PATH = "dev/experience";` (tương tự `dev/skills`, `dev/projects`)
- cả hai lời gọi `getTranslations({ locale, namespace: "experience" })` → `namespace: "devExperience"` (tương tự)

- [ ] **Step 5: Đổi tên ba namespace trong hai catalog**

Trong `messages/en.json` và `messages/vi.json`, đổi tên khoá cấp một: `"experience"` → `"devExperience"`, `"skills"` → `"devSkills"`, `"projects"` → `"devProjects"`. Nội dung bên trong không đổi.

- [ ] **Step 6: Cập nhật `nav` và thêm copy cho `/dev`**

Trong `nav` (cả hai catalog): xoá `experience`, `skills`, `projects`; thêm `dev`, `devExperience`, `devSkills`, `devProjects`. `nav` phải khớp **chính xác** tập key của `ROUTES` — `tests/messages/id-coverage.test.ts` kiểm cả hai chiều.

`messages/en.json`:

```json
"nav": {
  "home": "Home",
  "dev": "Dev",
  "devExperience": "Experience",
  "devSkills": "Skills",
  "devProjects": "Projects",
  "about": "About"
},
"dev": {
  "metaTitle": "Software engineering",
  "metaDescription": "Roles, skills and selected work — the engineering side of what I do.",
  "title": "Software engineering",
  "lead": "Fifteen years of building software, told by domain and market rather than by employer.",
  "indexLabel": "In this section",
  "index": {
    "devExperience": "Six roles, by domain and market rather than by employer.",
    "devSkills": "What I use, how well, and when I last used it.",
    "devProjects": "Selected work, with links where the product is public."
  },
  "contactLabel": "Work with me",
  "contact": "The fastest way to reach me about engineering work is email. LinkedIn I read less often, and GitHub is where the code is."
}
```

`messages/vi.json`:

```json
"nav": {
  "home": "Trang chủ",
  "dev": "Kỹ thuật",
  "devExperience": "Kinh nghiệm",
  "devSkills": "Kỹ năng",
  "devProjects": "Dự án",
  "about": "Giới thiệu"
},
"dev": {
  "metaTitle": "Kỹ thuật phần mềm",
  "metaDescription": "Vai trò, kỹ năng và các dự án chọn lọc — phần kỹ thuật trong công việc của tôi.",
  "title": "Kỹ thuật phần mềm",
  "lead": "Mười lăm năm làm phần mềm, kể theo lĩnh vực và thị trường thay vì theo nơi làm.",
  "indexLabel": "Trong phần này",
  "index": {
    "devExperience": "Sáu vai trò, kể theo lĩnh vực và thị trường thay vì theo nơi làm.",
    "devSkills": "Tôi dùng gì, tới mức nào, và lần gần nhất là khi nào.",
    "devProjects": "Các dự án chọn lọc, có link ở những sản phẩm đã public."
  },
  "contactLabel": "Làm việc cùng tôi",
  "contact": "Cách nhanh nhất để liên hệ về công việc kỹ thuật là email. LinkedIn tôi đọc thưa hơn, còn GitHub là nơi có code."
}
```

Ba blurb trong `dev.index` là copy **chuyển nguyên văn** từ `home.index.{experience,skills,projects}`; ba key đó vẫn còn trong `home.index` và được dọn ở Task 11. Câu `dev.lead` và `dev.contact` là **đề xuất** — chủ trang duyệt hoặc thay trước khi merge.

- [ ] **Step 7: Tạo layout và hub của nhánh**

`app/[locale]/(public)/dev/layout.tsx`:

```tsx
import { FacetNav } from "@/components/facet-nav";

/** Không khai `metadata` ở đây: canonical đặt ở page, theo ràng buộc của repo. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FacetNav facet="dev" />
      {children}
    </>
  );
}
```

`app/[locale]/(public)/dev/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NavIndex } from "@/app/[locale]/(public)/_components/nav-index";
import { ContactBlock } from "@/components/contact-block";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { FACET_CONTACT_IDS } from "@/lib/profile";
import { facetRoutes } from "@/lib/routes";
import { dynamicMessageKey } from "@/lib/utils";

const PATH = "dev";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dev" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function DevPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dev" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tIndex = await getTranslations({ locale, namespace: "dev.index" });

  const entries = facetRoutes("dev").map((route) => ({
    path: route.path,
    label: tNav(dynamicMessageKey(route.key)),
    blurb: tIndex(dynamicMessageKey(route.key)),
  }));

  return (
    <main>
      <PageStructuredData
        locale={locale}
        path={PATH}
        title={t("metaTitle")}
        description={t("metaDescription")}
      />
      <Section className="pt-14 pb-0">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>
      </Section>
      <Section id="index" index={1} label={t("indexLabel")}>
        <Reveal>
          <NavIndex entries={entries} />
        </Reveal>
      </Section>
      <Section id="contact" index={2} label={t("contactLabel")}>
        <Reveal>
          <Prose>
            <p>{t("contact")}</p>
          </Prose>
          <ContactBlock ids={FACET_CONTACT_IDS.dev} className="mt-6" />
        </Reveal>
      </Section>
    </main>
  );
}
```

- [ ] **Step 8: Cập nhật các test còn lại**

`tests/components/facet-nav.test.tsx` — thay hai test tạm bằng bốn test thật ở Step 1 của Task 5 (`links every child route`, `marks the current page`, `does not mark sibling pages`, `marks nothing as current on the facet hub`), giữ `renders nothing for a facet that has no hub at all` cho `creator`.

`tests/components/site-header.test.tsx` — map mock i18n và ba danh sách tên đổi thành `{ home: "Home", dev: "Dev", about: "About" }` và `["Dev", "About"]`; `mockPathname` đổi từ `/about` giữ nguyên (route `about` vẫn tồn tại).

`tests/messages/id-coverage.test.ts` — ba `namespacePath` đổi: `["experience","entries"]` → `["devExperience","entries"]`, `["projects","entries"]` → `["devProjects","entries"]`, `["skills","groups"]` → `["devSkills","groups"]`, `["skills","practice"]` → `["devSkills","practice"]`.

`tests/pages/experience.test.tsx:27` → `(catalog as typeof en).devExperience.entries`;
`tests/pages/projects.test.tsx:37` → `.devProjects.entries`;
`tests/pages/skills.test.tsx:23,44` → `.devSkills.groups`, `.devSkills.practice`.

`tests/seo/structured-data.test.ts:95-103` — breadcrumb giờ ba tầng:

```ts
  const crumbs = breadcrumbSchema(LocaleSupport.EN, "dev/skills", (route) =>
    route.path === "" ? "Home" : route.path === "dev" ? "Dev" : "Skills",
  ) as { itemListElement: { position: number; name: string; item: string }[] };

  it("orders the trail from the root", () => {
    expect(crumbs.itemListElement.map((c) => c.position)).toEqual([1, 2, 3]);
    expect(crumbs.itemListElement[0].name).toBe("Home");
    expect(crumbs.itemListElement[2].item).toBe(`${SITE_URL}/en/dev/skills`);
  });
```

- [ ] **Step 9: Chạy toàn bộ suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 10: Dựng thật để chắc route mới render**

Run: `pnpm build`
Expected: build xanh, output liệt kê `/[locale]/dev`, `/[locale]/dev/experience`, `/[locale]/dev/skills`, `/[locale]/dev/projects`.

- [ ] **Step 11: Lint, format, commit**

```bash
pnpm lint && pnpm format
git add -A
git commit -m "feat(dev): move engineering pages under the dev facet"
```

---

### Task 7: Redirect ba URL cũ

**Files:**
- Create: `lib/redirects.ts`
- Modify: `next.config.ts`
- Test: `tests/seo/redirects.test.ts`

**Interfaces:**
- Consumes: không có
- Produces: `LEGACY_DEV_PAGES`, `REDIRECT_LOCALE_MATCHER`, `legacyRedirects()`

`lib/redirects.ts` cố ý **không import gì**: `next.config.ts` được Next nạp ngoài đường path-alias của tsconfig, nên một import `@/i18n/routing` ở đây (hoặc bắc cầu qua nó) sẽ hỏng lúc build. Cái giá là danh sách locale bị chép tay — test dưới đây neo nó lại với `routing.locales`.

- [ ] **Step 1: Viết test đỏ**

Tạo `tests/seo/redirects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { LEGACY_DEV_PAGES, legacyRedirects, REDIRECT_LOCALE_MATCHER } from "@/lib/redirects";
import { findRoute } from "@/lib/routes";

describe("legacy redirects", () => {
  /**
   * `next.config.ts` không dùng được path alias nên matcher locale là bản chép
   * tay của `routing.locales`. Test này là thứ giữ hai chỗ đó không lệch: thêm
   * một locale mà quên sửa matcher thì đỏ ở đây.
   */
  it("matches exactly the routed locales", () => {
    const inside = REDIRECT_LOCALE_MATCHER.replace(/^:locale\(|\)$/g, "").split("|");
    expect(inside.sort()).toEqual([...routing.locales].sort());
  });

  it("sends every legacy page to its place under the dev facet", () => {
    for (const redirect of legacyRedirects()) {
      expect(redirect.destination).toMatch(/^\/:locale\/dev\//);
      expect(redirect.permanent).toBe(true);
    }
  });

  it("covers every page that moved", () => {
    expect(legacyRedirects().map((r) => r.source)).toEqual(
      LEGACY_DEV_PAGES.map((page) => `/${REDIRECT_LOCALE_MATCHER}/${page}`),
    );
  });

  /** Một redirect chỉ có nghĩa nếu đích của nó là route thật. */
  it("points every destination at a registered route", () => {
    for (const page of LEGACY_DEV_PAGES) {
      expect(findRoute(`dev/${page}`), page).toBeDefined();
    }
  });

  /** Và nguồn của nó phải KHÔNG còn là route — nếu không, redirect che mất một trang sống. */
  it("never redirects a path that is still a route", () => {
    for (const page of LEGACY_DEV_PAGES) {
      expect(findRoute(page), page).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/seo/redirects.test.ts`
Expected: FAIL — không phân giải được `@/lib/redirects`.

- [ ] **Step 3: Tạo `lib/redirects.ts`**

```ts
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
```

- [ ] **Step 4: Nối vào `next.config.ts`**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { legacyRedirects } from "./lib/redirects";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return legacyRedirects();
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Chạy test để chắc nó xanh**

Run: `pnpm exec vitest run tests/seo/redirects.test.ts`
Expected: PASS — 5 test.

- [ ] **Step 6: Kiểm redirect chạy thật**

Run: `pnpm build && pnpm exec next start -p 3100` (nền), rồi
`curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3100/en/skills`
Expected: `308 http://localhost:3100/en/dev/skills`. Dừng server sau khi kiểm.

- [ ] **Step 7: Lint và commit**

```bash
pnpm lint
git add lib/redirects.ts next.config.ts tests/seo/redirects.test.ts
git commit -m "feat(seo): redirect the three pre-split URLs to the dev facet"
```

---

### Task 8: Trang `/contact`

**Files:**
- Create: `app/[locale]/(public)/contact/page.tsx`
- Modify: `lib/routes.ts` (thêm route `contact`)
- Modify: `app/[locale]/(public)/about/page.tsx` (gỡ section liên hệ)
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/pages/contact.test.tsx`, `tests/lib/routes.test.ts`

**Interfaces:**
- Consumes: `ContactBlock` (Task 2), `GENERAL_CONTACT_IDS`/`FACET_CONTACT_IDS`/`FACETS` (Task 1)
- Produces: route `contact` (key `contact`), namespace catalog `contact`

Trang này là async Server Component nên Testing Library không render được — test khẳng định trên dữ liệu và catalog, theo đúng mẫu `tests/pages/about.test.tsx`.

- [ ] **Step 1: Viết test đỏ**

Tạo `tests/pages/contact.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { FACETS } from "@/enums";
import { channelsFor, FACET_CONTACT_IDS, GENERAL_CONTACT_IDS } from "@/lib/profile";
import { findRoute } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

describe("contact page", () => {
  it("is a registered route", () => {
    expect(findRoute("contact")).toBeDefined();
  });

  it.each(Object.entries(CATALOGS))("%s labels every contact group", (_locale, catalog) => {
    const contact = (catalog as typeof en).contact;
    const groups = contact.groups as Record<string, string>;
    expect(groups.general.length).toBeGreaterThan(0);
    for (const facet of FACETS) {
      expect(groups[facet], `missing contact.groups.${facet}`).toBeTruthy();
    }
  });

  it.each(Object.entries(CATALOGS))("%s introduces the page", (_locale, catalog) => {
    const contact = (catalog as typeof en).contact;
    expect(contact.title.length).toBeGreaterThan(0);
    expect(contact.lead.length).toBeGreaterThan(40);
  });

  /**
   * Trang này là nơi duy nhất liệt kê đủ mọi kênh. Nếu một kênh có trong
   * `CONTACT_CHANNELS` mà không nhóm nào tham chiếu, nó vô hình với người đọc —
   * và không ai phát hiện ra cho tới khi cần dùng nó.
   */
  it("shows every channel in at least one group", () => {
    const shown = new Set(
      [
        ...channelsFor(GENERAL_CONTACT_IDS),
        ...FACETS.flatMap((facet) => channelsFor(FACET_CONTACT_IDS[facet])),
      ].map((c) => c.id),
    );
    expect(shown.has("work-email")).toBe(true);
    expect(shown.has("dev-email")).toBe(true);
    expect(shown.has("trader-email")).toBe(true);
    expect(shown.has("linkedin")).toBe(true);
    expect(shown.has("github")).toBe(true);
  });

  it.each(Object.entries(CATALOGS))("%s no longer keeps a contact section in about", (_locale, catalog) => {
    expect((catalog as typeof en).about).not.toHaveProperty("contactLabel");
    expect((catalog as typeof en).about).not.toHaveProperty("contact");
  });
});
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/pages/contact.test.tsx`
Expected: FAIL — route `contact` chưa có, namespace `contact` chưa có.

- [ ] **Step 3: Thêm route**

`lib/routes.ts` — thêm vào cuối mảng `ROUTES`:

```ts
  { path: "contact", key: "contact", parent: HOME_PATH, priority: 0.8, changeFrequency: "yearly" },
```

Và cập nhật `tests/lib/routes.test.ts`: danh sách path thêm `"contact"`, `primaryNavRoutes()` thành `["dev", "about", "contact"]`.

- [ ] **Step 4: Thêm copy vào hai catalog**

`messages/en.json` — thêm `nav.contact: "Contact"` và namespace mới:

```json
"contact": {
  "metaTitle": "Contact",
  "metaDescription": "Every way to reach me, grouped by what you want to talk about.",
  "title": "Contact",
  "lead": "Different parts of my work have different inboxes, so a message lands where it belongs. The general address always works.",
  "groups": {
    "general": "General",
    "dev": "Software engineering",
    "trading": "Trading",
    "creator": "Content"
  }
}
```

`messages/vi.json` — thêm `nav.contact: "Liên hệ"` và:

```json
"contact": {
  "metaTitle": "Liên hệ",
  "metaDescription": "Mọi cách liên hệ với tôi, nhóm theo việc bạn muốn trao đổi.",
  "title": "Liên hệ",
  "lead": "Mỗi mảng công việc có một hộp thư riêng để tin nhắn rơi đúng chỗ. Địa chỉ chung thì lúc nào cũng dùng được.",
  "groups": {
    "general": "Chung",
    "dev": "Kỹ thuật phần mềm",
    "trading": "Giao dịch",
    "creator": "Nội dung"
  }
}
```

Xoá `about.contactLabel` và `about.contact` khỏi cả hai catalog.

- [ ] **Step 5: Tạo trang**

`app/[locale]/(public)/contact/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactBlock } from "@/components/contact-block";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { FACETS } from "@/enums";
import { pageMetadata } from "@/lib/metadata";
import { FACET_CONTACT_IDS, GENERAL_CONTACT_IDS } from "@/lib/profile";
import { dynamicMessageKey } from "@/lib/utils";

const PATH = "contact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  const tGroups = await getTranslations({ locale, namespace: "contact.groups" });

  return (
    <main>
      <PageStructuredData
        locale={locale}
        path={PATH}
        title={t("metaTitle")}
        description={t("metaDescription")}
      />
      <Section className="pt-14 pb-0">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">{t("title")}</h1>
      </Section>
      <Section id="general" index={1} label={tGroups("general")}>
        <Reveal>
          <Prose>
            <p>{t("lead")}</p>
          </Prose>
          <ContactBlock ids={GENERAL_CONTACT_IDS} className="mt-6" />
        </Reveal>
      </Section>
      {FACETS.map((facet, i) => (
        <Section key={facet} id={facet} index={i + 2} label={tGroups(dynamicMessageKey(facet))}>
          <Reveal>
            <ContactBlock ids={FACET_CONTACT_IDS[facet]} />
          </Reveal>
        </Section>
      ))}
    </main>
  );
}
```

- [ ] **Step 6: Gỡ section liên hệ khỏi `/about`**

Xoá trọn `<Section id="contact" index={5} …>…</Section>` (dòng 126-138) và bỏ `ContactBlock`, `GENERAL_CONTACT_IDS` khỏi import nếu không còn dùng.

- [ ] **Step 7: Chạy toàn bộ suite**

Run: `pnpm test`
Expected: PASS. `tests/messages/id-coverage.test.ts` giờ đòi `nav.contact` tồn tại — đã thêm ở Step 4.

- [ ] **Step 8: Build và commit**

```bash
pnpm build && pnpm lint && pnpm format
git add -A
git commit -m "feat(contact): add a contact page grouping channels by facet"
```

---

### Task 9: Hub nhánh trading

**Files:**
- Create: `app/[locale]/(public)/trading/layout.tsx`
- Create: `app/[locale]/(public)/trading/page.tsx`
- Modify: `lib/routes.ts`
- Modify: `app/[locale]/(public)/about/page.tsx` (gỡ section trading)
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/pages/trading.test.tsx`, `tests/pages/about.test.tsx`, `tests/lib/routes.test.ts`

**Interfaces:**
- Consumes: `FacetNav` (Task 5), `ContactBlock` (Task 2), `FACET_CONTACT_IDS` (Task 1), `TRADING` (đã có)
- Produces: route `trading` (key `trading`), namespace catalog `trading`

Nội dung của hub này là **ba đoạn văn đã có** trong `about.trading1..3` ở cả hai locale — chuyển chỗ, không viết mới. Ba trang con (`journey`, `markets`, `notes`) thuộc đợt 2.

- [ ] **Step 1: Chuyển ba test trading từ about sang trading**

`tests/pages/about.test.tsx` — xoá hai test `tells the trading chapter` và `names a milestone for every market`, bỏ `TRADING` khỏi import. Giữ nguyên test `claims no returns and gives no advice` nhưng đổi đối tượng sang `about` **và** thêm bản cho `trading` ở file mới.

Tạo `tests/pages/trading.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { TRADING } from "@/lib/profile";
import { findRoute } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

describe("trading facet", () => {
  it("is a registered route with its own facet", () => {
    expect(findRoute("trading")?.facet).toBe("trading");
  });

  it.each(Object.entries(CATALOGS))("%s tells the trading chapter", (_locale, catalog) => {
    const trading = (catalog as typeof en).trading;
    expect(trading.title.length).toBeGreaterThan(0);
    expect(trading.lead1.length).toBeGreaterThan(80);
  });

  it.each(Object.entries(CATALOGS))("%s names a milestone for every market", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).trading);
    for (const milestone of TRADING) {
      expect(serialised).toContain(String(milestone.year));
    }
  });

  /**
   * Trang cá nhân này không phải nội dung tài chính. Một câu khoe hiệu suất sẽ
   * kéo nó vào phạm trù YMYL mà nó không có lý do gì để bước vào. Ràng buộc
   * này đi theo nội dung trading sang nhà mới của nó.
   */
  it.each(Object.entries(CATALOGS))("%s claims no returns and gives no advice", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).trading);
    expect(serialised).not.toMatch(/\d+\s*%/);
    expect(serialised).not.toMatch(/\b(ROI|lợi nhuận|profit|returns)\b/i);
  });
});
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/pages/trading.test.tsx`
Expected: FAIL — route `trading` chưa có.

- [ ] **Step 3: Thêm route**

`lib/routes.ts` — chèn sau nhóm `dev`, trước `about`:

```ts
  {
    path: "trading",
    key: "trading",
    parent: HOME_PATH,
    facet: "trading",
    priority: 0.9,
    changeFrequency: "monthly",
  },
```

Cập nhật `tests/lib/routes.test.ts`: danh sách path thêm `"trading"`; `primaryNavRoutes()` thành `["dev", "trading", "about", "contact"]`; `facetHubRoutes()` thành `["dev", "trading"]`.

- [ ] **Step 4: Chuyển copy sang namespace `trading`**

Trong cả hai catalog: xoá `about.tradingLabel`, `about.trading1`, `about.trading2`, `about.trading3`; thêm `nav.trading` và namespace `trading`, dùng **nguyên văn** ba đoạn đã có.

`messages/en.json`:

```json
"nav": { "…": "…", "trading": "Trading" },
"trading": {
  "metaTitle": "Trading",
  "metaDescription": "Six years across crypto, forex and equities — method, not performance.",
  "title": "Trading",
  "leadLabel": "How it started",
  "lead1": "<giữ nguyên chuỗi cũ của about.trading1>",
  "lead2": "<giữ nguyên chuỗi cũ của about.trading2>",
  "lead3": "<giữ nguyên chuỗi cũ của about.trading3>",
  "contactLabel": "Talk trading",
  "contact": "Anything about markets, method or risk goes to this address."
}
```

`messages/vi.json` — cùng cấu trúc, `nav.trading: "Giao dịch"`, `metaTitle: "Giao dịch"`, `title: "Giao dịch"`, `leadLabel: "Bắt đầu thế nào"`, `contactLabel: "Trao đổi về giao dịch"`, `contact: "Mọi câu chuyện về thị trường, phương pháp hay quản trị rủi ro gửi về địa chỉ này."`, ba đoạn `lead1..3` giữ nguyên chuỗi cũ.

`metaDescription` và `contact` là **đề xuất** — chủ trang duyệt trước khi merge. Không được có số phần trăm hay từ chỉ lợi nhuận trong bất kỳ chuỗi nào (test ở Step 1 kiểm).

- [ ] **Step 5: Tạo layout và hub**

`app/[locale]/(public)/trading/layout.tsx` — giống `dev/layout.tsx`, đổi `facet="trading"`. `FacetNav` tự trả `null` vì nhánh chưa có trang con.

`app/[locale]/(public)/trading/page.tsx` — theo đúng khuôn `dev/page.tsx` nhưng không có `NavIndex` (chưa có trang con):

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactBlock } from "@/components/contact-block";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { FACET_CONTACT_IDS } from "@/lib/profile";

const PATH = "trading";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "trading" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function TradingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "trading" });

  return (
    <main>
      <PageStructuredData
        locale={locale}
        path={PATH}
        title={t("metaTitle")}
        description={t("metaDescription")}
      />
      <Section className="pt-14 pb-0">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">{t("title")}</h1>
      </Section>
      <Section id="lead" index={1} label={t("leadLabel")}>
        <Reveal>
          <Prose>
            <p>{t("lead1")}</p>
            <p>{t("lead2")}</p>
            <p>{t("lead3")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="contact" index={2} label={t("contactLabel")}>
        <Reveal>
          <Prose>
            <p>{t("contact")}</p>
          </Prose>
          <ContactBlock ids={FACET_CONTACT_IDS.trading} className="mt-6" />
        </Reveal>
      </Section>
    </main>
  );
}
```

- [ ] **Step 6: Gỡ section trading khỏi `/about`**

Xoá `<Section id="trading" index={3} …>` (dòng 56-64) và đánh số lại hai section còn lại: `credentials` thành `index={3}`.

- [ ] **Step 7: Thêm khối Trading vào `llms.txt`**

`lib/llms.ts` — sau khối `## Software engineering`, thêm:

```ts
    "## Trading",
    "",
    ...TRADING.map((milestone) => `- ${milestone.market} since ${milestone.year}`),
    "",
```

với `TRADING` thêm vào import từ `@/lib/profile`.

- [ ] **Step 8: Chạy toàn bộ suite, build, commit**

```bash
pnpm test && pnpm build && pnpm lint && pnpm format
git add -A
git commit -m "feat(trading): give the trading facet its own hub page"
```

---

### Task 10: Hub nhánh creator — **chặn bởi nội dung**

**Files:**
- Create: `app/[locale]/(public)/creator/layout.tsx`
- Create: `app/[locale]/(public)/creator/page.tsx`
- Modify: `lib/routes.ts`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/pages/creator.test.tsx`, `tests/lib/routes.test.ts`

**Interfaces:**
- Consumes: `FacetNav` (Task 5), `ContactBlock` (Task 2), `FACET_CONTACT_IDS` (Task 1)
- Produces: route `creator` (key `creator`), namespace catalog `creator`

**Điều kiện tiên quyết — không được bỏ qua:** repo không có một dòng dữ liệu nào về mảng content creator. Hai đoạn `creator.lead1`/`creator.lead2` là **khẳng định sự thật về chủ trang** (làm nội dung gì, ở đâu, cho ai) nên **phải do chủ trang cung cấp**, ở cả hai ngôn ngữ. Không viết thay, không để placeholder.

**Nếu chưa có nội dung:** bỏ qua task này. Đợt 1 vẫn hoàn chỉnh và deploy được với hai nhánh (`dev`, `trading`) — `Record<Facet, …>` trong `FACET_CONTACT_IDS` vẫn khai đủ ba facet nên không có lỗi biên dịch, `facetRoutes("creator")` trả rỗng, và `/contact` vẫn hiện nhóm Creator vì nhóm đó có email. Task 11 lấy danh sách lối vào từ `facetHubRoutes()` nên trang hub tự khớp với số nhánh thật có.

- [ ] **Step 1: Xác nhận đã có copy**

Kiểm tra chủ trang đã cung cấp: `creator.title`, `creator.leadLabel`, `creator.lead1`, `creator.lead2`, `creator.metaTitle`, `creator.metaDescription`, `creator.contactLabel`, `creator.contact` — cả `en` lẫn `vi`. Thiếu bất kỳ chuỗi nào thì dừng task và báo lại.

- [ ] **Step 2: Viết test đỏ**

Tạo `tests/pages/creator.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { findRoute } from "@/lib/routes";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

const CATALOGS = { en, vi };

describe("creator facet", () => {
  it("is a registered route with its own facet", () => {
    expect(findRoute("creator")?.facet).toBe("creator");
  });

  it.each(Object.entries(CATALOGS))("%s introduces the content work", (_locale, catalog) => {
    const creator = (catalog as typeof en).creator;
    expect(creator.title.length).toBeGreaterThan(0);
    expect(creator.lead1.length).toBeGreaterThan(80);
    expect(creator.lead2.length).toBeGreaterThan(40);
  });
});
```

- [ ] **Step 3: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/pages/creator.test.tsx`
Expected: FAIL — route và namespace chưa có.

- [ ] **Step 4: Thêm route, copy, layout và page**

`lib/routes.ts` — chèn sau `trading`:

```ts
  {
    path: "creator",
    key: "creator",
    parent: HOME_PATH,
    facet: "creator",
    priority: 0.9,
    changeFrequency: "monthly",
  },
```

Catalog: thêm `nav.creator` (`"Creator"` / `"Nội dung"`) và namespace `creator` với **copy chủ trang cung cấp ở Step 1**.

`app/[locale]/(public)/creator/layout.tsx` — giống `trading/layout.tsx`, đổi `facet="creator"`.
`app/[locale]/(public)/creator/page.tsx` — sao khuôn `trading/page.tsx`, đổi `PATH = "creator"`, namespace `"creator"`, hai đoạn `lead1`/`lead2`, và `FACET_CONTACT_IDS.creator`.

Cập nhật `tests/lib/routes.test.ts`: thêm `"creator"` vào danh sách path, `primaryNavRoutes()` thành `["dev", "trading", "creator", "about", "contact"]`, `facetHubRoutes()` thành `["dev", "trading", "creator"]`.

- [ ] **Step 5: Chạy toàn bộ suite, build, commit**

```bash
pnpm test && pnpm build && pnpm lint && pnpm format
git add -A
git commit -m "feat(creator): give the content facet its own hub page"
```

---

### Task 11: Dựng lại trang hub

**Files:**
- Modify: `app/[locale]/(public)/page.tsx`
- Modify: `app/[locale]/(public)/_components/nav-index.tsx` (comment)
- Modify: `messages/en.json`, `messages/vi.json` (`home.index`)
- Modify: `lib/routes.ts` (`CONTENT_LAST_MODIFIED`)
- Test: `tests/pages/home.test.tsx`, `tests/messages/id-coverage.test.ts:134-140`

**Interfaces:**
- Consumes: `facetHubRoutes` (Task 4), `ContactBlock` (Task 2), `GENERAL_CONTACT_IDS` (Task 1)
- Produces: trang chủ liệt kê đúng các nhánh có thật trong registry

`home.index` neo vào `facetHubRoutes()` chứ **không** vào `FACETS`: nếu Task 10 bị bỏ qua vì thiếu nội dung, hub vẫn khớp với hai nhánh thật có thay vì đòi một bản dịch cho nhánh chưa tồn tại.

- [ ] **Step 1: Đổi neo của `home.index`**

`tests/messages/id-coverage.test.ts` — dòng 11 thêm `facetHubRoutes` vào import, và thay test cuối:

```ts
  /**
   * Trang hub liệt kê các nhánh, không liệt kê mọi mục trên thanh điều hướng:
   * `about` và `contact` có mặt ở header nhưng không phải một lối vào theo
   * mảng. Neo vào `facetHubRoutes()` cũng có nghĩa là một nhánh chưa dựng
   * không đòi bản dịch cho một lối vào không tồn tại.
   */
  it("covers every facet hub key in home.index, both directions", () => {
    assertIdsMatchCatalog(
      "facetHubRoutes()",
      facetHubRoutes().map((route) => route.key),
      ["home", "index"],
    );
  });
```

- [ ] **Step 2: Chạy test để chắc nó đỏ**

Run: `pnpm exec vitest run tests/messages/id-coverage.test.ts`
Expected: FAIL — `home.index` còn bốn key cũ (`about`, `experience`, `skills`, `projects`).

- [ ] **Step 3: Viết lại `home.index` trong hai catalog**

`messages/en.json`:

```json
"home": {
  "…": "…",
  "indexLabel": "Three lines of work",
  "index": {
    "dev": "Fifteen years building software — roles, skills and selected work.",
    "trading": "Six years across crypto, forex and equities. Method, not performance.",
    "creator": "What I write and record, and how to work with me on it."
  },
  "contactLabel": "Reach me",
  "contact": "This address reaches me whatever the subject. Each line of work also has its own — see the contact page."
}
```

`messages/vi.json`:

```json
"home": {
  "…": "…",
  "indexLabel": "Ba mảng công việc",
  "index": {
    "dev": "Mười lăm năm làm phần mềm — vai trò, kỹ năng và dự án chọn lọc.",
    "trading": "Sáu năm với crypto, forex và cổ phiếu. Phương pháp, không phải hiệu suất.",
    "creator": "Những gì tôi viết và ghi hình, và cách hợp tác cùng tôi."
  },
  "contactLabel": "Liên hệ",
  "contact": "Địa chỉ này đến được tôi dù là chuyện gì. Mỗi mảng còn có hộp thư riêng — xem trang liên hệ."
}
```

Nếu Task 10 bị bỏ qua, **không** thêm key `creator` vào `home.index` — test ở Step 1 kiểm cả hai chiều nên một key mồ côi sẽ đỏ.

- [ ] **Step 4: Viết lại trang chủ**

`app/[locale]/(public)/page.tsx` — đổi `primaryNavRoutes` thành `facetHubRoutes`, và thêm một section liên hệ chung sau `index`:

```tsx
  const indexEntries = facetHubRoutes().map((route) => ({
    path: route.path,
    label: tNav(dynamicMessageKey(route.key)),
    blurb: tIndex(dynamicMessageKey(route.key)),
  }));
```

```tsx
      <Section id="contact" index={3} label={t("contactLabel")}>
        <Reveal>
          <Prose>
            <p>{t("contact")}</p>
          </Prose>
          <ContactBlock ids={GENERAL_CONTACT_IDS} className="mt-6" />
        </Reveal>
      </Section>
```

`_components/nav-index.tsx` — sửa comment "Bốn lối vào, đánh số" thành "Các lối vào, đánh số" (component giờ phục vụ cả hub và `/dev`, số mục không cố định).

- [ ] **Step 5: Cập nhật test trang chủ**

`tests/pages/home.test.tsx:14-16` — thay ba entry giả bằng các nhánh:

```tsx
  { path: "dev", label: "Dev", blurb: "Dev blurb" },
  { path: "trading", label: "Trading", blurb: "Trading blurb" },
  { path: "creator", label: "Creator", blurb: "Creator blurb" },
```

(Bỏ dòng `creator` nếu Task 10 bị bỏ qua.)

- [ ] **Step 6: Bump `CONTENT_LAST_MODIFIED`**

`lib/routes.ts` — đặt bằng ngày merge đợt 1 (định dạng `YYYY-MM-DD`).

- [ ] **Step 7: Chạy toàn bộ suite và build**

Run: `pnpm test && pnpm build`
Expected: PASS; build liệt kê đủ route của đợt 1 ở cả hai locale.

- [ ] **Step 8: Kiểm bằng mắt**

Run: `pnpm dev`, mở `http://localhost:3000/en` và `http://localhost:3000/vi`.
Kiểm: header có 4-5 mục; `/dev` hiện sub-nav ba mục; `/dev/skills` đánh dấu `Skills` là trang hiện tại; `/contact` có bốn khối; footer chỉ có một email; `/en/skills` nhảy sang `/en/dev/skills`.

- [ ] **Step 9: Lint, format, commit**

```bash
pnpm lint && pnpm format
git add -A
git commit -m "feat(home): turn the home page into a three-facet hub"
```

---

## Self-review

**Phủ spec:** §3.1 → Task 1. §3.2 → Task 1. §3.3 → Task 3. §3.4/§3.5 → đợt 2/3, ngoài phạm vi plan này. §4.1 → Task 4, 6, 8, 9, 10. §4.2 → Task 6 Step 5-6. §4.3 → Task 5, 6. §4.4 → Task 6, 8, 9, 10, 11. §4.5 → Task 7. §5 → Task 10 (điều kiện tiên quyết). §6.1 → tự động, kiểm ở Task 6 Step 10. §6.2 → Task 3. §6.3 → không làm, đúng chủ ý. §6.4 → Task 3 Step 6, Task 9 Step 7. §6.5 → Task 11 Step 6. §7.1 → rải khắp. §7.2 → Task 3, 4, 6, 11. §7.3.1 → Task 1. §7.3.2 → Task 7. §7.3.3 → Task 6 Step 1, Task 1 (`gives every facet at least one channel`). §7.3.4 → Task 3 Step 1. §7.3.5 → đợt 2/3.

**Hai chỗ spec nói sai, đã sửa trong plan:** §7.2 liệt kê "thêm test `parent` trỏ tới route tồn tại" — test đó **đã có sẵn** ở `tests/lib/routes.test.ts:47-52`. Và §7.2 sót `tests/seo/structured-data.test.ts:95` (`breadcrumbSchema(…, "skills", …)`), sẽ đỏ khi `skills` không còn là route; đã đưa vào Task 6 Step 8.

**Một sai lệch có chủ ý so với spec §4.4:** spec nói footer dùng `ContactBlock`; plan làm đúng vậy nhưng kéo theo việc xoá namespace `footer` và bỏ prop `locale` của `SiteFooter`, vì component không còn chuỗi nào để dịch. Ghi rõ ở Task 3.

**Copy cần chủ trang duyệt trước khi merge:** `dev.lead`, `dev.contact`, `dev.metaDescription`, `trading.metaDescription`, `trading.contact`, `contact.lead`, `home.index.*`, `home.contact`. Toàn bộ `creator.*` thì **chặn cứng** — không viết thay.
