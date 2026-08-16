# kingnnt-profile-page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng trang cá nhân song ngữ EN/VI cho Ninh Ngọc Tuấn (Jesse / KingNNT) tại `kingnnt.org` — 5 route tĩnh, dark-first, không nhắc tên công ty nào.

**Architecture:** Next.js App Router locale-scoped (`app/[locale]/(public)/…`). Dữ liệu có cấu trúc nằm trong `lib/profile/*.ts` (typed, một nguồn sự thật); văn xuôi nằm trong `messages/{en,vi}.json` khoá theo `id` của dữ liệu; component join hai nguồn. `lib/routes.ts` là registry route duy nhất, nuôi navigation, sitemap, breadcrumb và `llms.txt`.

**Tech Stack:** Next.js 16 · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (new-york) · next-intl · next-themes · Biome (format) + ESLint (lint) · Vitest + jsdom + Testing Library · pnpm · Vercel

**Spec:** `docs/superpowers/specs/2026-08-16-kingnnt-profile-page-design.md`

## Global Constraints

Mọi task đều chịu các ràng buộc dưới đây.

- **Ẩn danh (ràng buộc cứng).** Không tên employer, không tên công ty đứng sau sản phẩm, không tên khách hàng cuối, không codename dự án nội bộ. Chỉ giữ tên sản phẩm public có website: `IntentSite`, `Orkestrators`, `SemiKong`, `Live Call`. Thực thi bằng `tests/lib/anonymity.test.ts`.
- **Denylist** (so khớp không phân biệt hoa thường, theo ranh giới từ): `SyncSoft`, `FPT`, `Kaopiz`, `Tap Hospitality`, `SmartGoldFish`, `ArtinLeap`, `SHB`, `Saigon-Hanoi`, `Saigon Hanoi`, `KPIRB`, `TMC`, `GICRM`, `RENEW02`, `E-Concierge`, `Accommod`, `Zyrahh`.
- **Denylist không quét giá trị trường `url`** trong `lib/profile/**`. Trang sản phẩm Orkestrators nằm dưới `artinleap.com`. Bù lại nhãn link hiển thị chỉ được là tên sản phẩm hoặc hostname rút gọn, không bao giờ là đường dẫn đầy đủ.
- **Không có `worksFor`, `affiliation`, hay node `Organization`** trong JSON-LD.
- **Không đưa lên trang:** số điện thoại, ngày sinh, con số lợi nhuận trading, lời khuyên đầu tư.
- **Locale:** `en` (mặc định) và `vi`, `localePrefix: "always"`. Mọi key phải có ở cả hai catalog.
- **Domain:** `https://kingnnt.org`, override bằng `NEXT_PUBLIC_SITE_URL`.
- **Nội dung phải có trong HTML server-render.** Component chuyển động chỉ được đổi opacity/transform của nội dung đã render, không bao giờ quyết định *có* render hay không.
- **Biome chỉ format, ESLint chỉ lint** — không gộp. Biome: 2 space, 100 cột, double quote, semicolon, trailing comma, LF.
- **Git:** nhánh tích hợp là `develop`, không commit thẳng vào. Nhánh feature đặt tên `feature/<kebab>`. Conventional Commits, commitlint bắt buộc. **Không** thêm dòng `Co-Authored-By` hay attribution vào commit message.
- **Lockfile:** chỉ `pnpm-lock.yaml`. Không tạo `yarn.lock` hay `package-lock.json`.

---

## File Structure

```
app/
  [locale]/
    (public)/
      page.tsx                 /            hero + about ngắn + điều hướng
      _components/hero.tsx
      _components/nav-index.tsx
      about/page.tsx           /about
      experience/page.tsx      /experience
      skills/page.tsx          /skills
      projects/page.tsx        /projects
    layout.tsx
    opengraph-image.tsx
  globals.css
  sitemap.ts
  robots.ts
  llms.txt/route.ts
  icon.png
components/
  ui/{button,card,dropdown-menu}.tsx   shadcn
  section.tsx  section-label.tsx  reveal.tsx  prose.tsx
  portrait.tsx  timeline.tsx  skill-table.tsx  project-card.tsx
  site-header.tsx  site-footer.tsx
  language-switcher.tsx  mode-toggle.tsx  theme-provider.tsx
  structured-data.tsx
enums/{locale.enum.ts,index.ts}
i18n/{routing.ts,request.ts,navigation.ts}
lib/
  profile/{identity,experience,skills,projects,trading,index}.ts
  {site,routes,metadata,structured-data,llms,hooks,utils}.ts
messages/{en,vi}.json
assets/portrait.png              ảnh gốc, ngoài public/
public/images/portrait.jpg       bản tối ưu
tests/
  lib/{profile,anonymity,routes,hooks}.test.ts
  messages/parity.test.ts
  i18n/routing.test.ts
  components/*.test.tsx
  pages/*.test.tsx
  seo/{metadata,structured-data,sitemap,robots,llms}.test.ts
proxy.ts
```

Ranh giới: `lib/profile/*` chỉ chứa dữ liệu, không import gì từ `components/`. `lib/routes.ts` không import `lib/profile`. Component đọc dữ liệu qua `lib/profile`, đọc chữ qua `next-intl` — không component nào tự hardcode nội dung.

**Lệch so với reference, có chủ đích:** home nằm ngay tại `/{locale}` chứ không phải `/{locale}/home`. Reference cần `/home` vì nó phục vụ nhiều site qua rewrite; ở đây một site nên bỏ được một lần redirect. Hệ quả: canonical của trang chủ **là** `/{locale}`, và cảnh báo "canonical không được trỏ vào `/{locale}`" trong reference không áp dụng ở đây.

---

## Task 1: Toolchain và bộ khung chạy được

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `biome.json`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.setup.ts`, `.lintstagedrc.json`, `commitlint.config.ts`, `.gitignore`, `.husky/pre-commit`, `.husky/commit-msg`, `.github/workflows/ci.yml`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Consumes: không có — task đầu tiên.
- Produces: alias `@/*` → repo root (dùng được ở cả `tsc` và Vitest); các script `pnpm dev|build|start|lint|lint:fix|format|format:check|test|test:watch`.

- [ ] **Step 1: Tạo nhánh feature**

`develop` là nhánh được bảo vệ. Mọi task trong plan này chạy trên nhánh feature.

```bash
git checkout -b feature/scaffold-toolchain
```

- [ ] **Step 2: Viết `package.json`**

```json
{
  "name": "kingnnt-profile-page",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.9.0",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "biome format --write",
    "format:check": "biome format",
    "prepare": "husky",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@radix-ui/react-dropdown-menu": "^2.1.20",
    "@radix-ui/react-slot": "^1.3.0",
    "@vercel/analytics": "^2.0.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.23.0",
    "next": "16.2.10",
    "next-intl": "^4.13.1",
    "next-themes": "^0.4.6",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.5.2",
    "@commitlint/cli": "^21.2.0",
    "@commitlint/config-conventional": "^21.2.0",
    "@commitlint/types": "^19",
    "@tailwindcss/postcss": "^4.3.2",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^26.1.0",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "eslint": "^9.39.4",
    "eslint-config-next": "16.2.10",
    "husky": "^9.1.7",
    "jsdom": "^29.1.1",
    "lint-staged": "^17.0.8",
    "tailwindcss": "^4.3.2",
    "tw-animate-css": "^1.4.0",
    "typescript": "^6.0.3",
    "vitest": "^4.1.10"
  }
}
```

Phiên bản khớp reference đúng chủ ý: hai project chia chung một bộ pattern, lệch version nghĩa là lệch cả cách viết. `zod` của reference bị bỏ — không có form nào để validate.

- [ ] **Step 3: Viết `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Viết các config còn lại**

`next.config.ts` — bỏ `output: "standalone"` của reference (thứ đó phục vụ image Docker, ở đây deploy Vercel):

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
```

`postcss.config.mjs`:

```js
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
```

`biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.2/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "includes": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx",
      "**/*.mjs",
      "**/*.mts",
      "**/*.json",
      "**/*.jsonc",
      "**/*.css"
    ],
    "ignoreUnknown": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "lineEnding": "lf"
    }
  },
  "json": { "formatter": { "trailingCommas": "none" } },
  "css": { "parser": { "tailwindDirectives": true } },
  "linter": { "enabled": false }
}
```

`eslint.config.mjs`:

```js
import next from "eslint-config-next";

const eslintConfig = [
  { ignores: [".next/**", "next-env.d.ts", "coverage/**"] },
  ...next,
];

export default eslintConfig;
```

`vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
```

`vitest.setup.ts` — `matchMedia` báo reduced-motion BẬT để component có chuyển động render tất định trong test:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

vi.stubGlobal("matchMedia", (query: string) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}));

// @ts-expect-error - minimal mock for testing
globalThis.IntersectionObserver = class MockIntersectionObserver {
  constructor(_callback: unknown, _options?: unknown) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
```

`.lintstagedrc.json`:

```json
{
  "*.{ts,tsx,js,jsx,mjs,mts,json,jsonc,css}": ["biome format --write"],
  "*.{ts,tsx}": ["eslint --fix"]
}
```

`commitlint.config.ts`:

```ts
import type { UserConfig } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
};
export default Configuration;
```

`.gitignore`:

```
node_modules
.next
out
build
coverage
.DS_Store
*.pem
.env*
!.env.example
.vercel
next-env.d.ts
tsconfig.tsbuildinfo
```

- [ ] **Step 5: Viết test smoke**

`tests/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("resolves the @/ alias to the repo root", async () => {
    const pkg = await import("@/package.json");
    expect(pkg.default.name).toBe("kingnnt-profile-page");
  });
});
```

Test này không tầm thường: nó là thứ duy nhất chứng minh alias `@/*` được cấu hình khớp giữa `tsconfig.json` và `vitest.config.mts`. Hai file đó khai báo alias độc lập nhau và rất dễ lệch.

- [ ] **Step 6: Cài dependency và chạy test để thấy nó chạy**

```bash
pnpm install
pnpm test
```

Kỳ vọng: PASS, 1 test.

Nếu `pnpm install` báo thiếu `next-env.d.ts` thì bỏ qua — file đó do `next build` sinh và đã nằm trong `.gitignore`.

- [ ] **Step 7: Cài husky hook**

```bash
pnpm exec husky init
printf 'pnpm exec lint-staged\n' > .husky/pre-commit
printf 'pnpm exec commitlint --edit "$1"\n' > .husky/commit-msg
chmod +x .husky/pre-commit .husky/commit-msg
```

Reference chỉ có `pre-commit`; ở đây thêm `commit-msg` vì commitlint đã cấu hình mà không có hook thì nó chưa bao giờ chạy — một cấu hình chỉ trang trí.

- [ ] **Step 8: Viết CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [develop]
  push:
    branches: [develop]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Format, Lint, Test, Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with:
          version: "11.9.0"
      - uses: actions/setup-node@v5
        with:
          node-version: "22.15.0"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
        env:
          HUSKY: 0
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 9: Kiểm tra format và commit**

```bash
pnpm format:check
git add -A
git commit -m "build: scaffold toolchain, vitest and CI"
```

`pnpm lint` và `pnpm build` chưa chạy được ở bước này vì chưa có `app/` — chúng sẽ xanh từ Task 2 trở đi.

---

## Task 2: Xương sống i18n và một trang chạy được

**Files:**
- Create: `enums/locale.enum.ts`, `enums/index.ts`, `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts`, `proxy.ts`, `messages/en.json`, `messages/vi.json`, `lib/utils.ts`, `app/globals.css`, `app/[locale]/layout.tsx`, `app/[locale]/(public)/page.tsx`
- Test: `tests/i18n/routing.test.ts`, `tests/messages/parity.test.ts`

**Interfaces:**
- Consumes: alias `@/*` (Task 1).
- Produces:
  - `LocaleSupport.EN = "en"`, `LocaleSupport.VI = "vi"` từ `@/enums`
  - `routing` (`next-intl` routing object) từ `@/i18n/routing`
  - `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` từ `@/i18n/navigation` — **dùng những cái này, không dùng `next/link` hay `next/navigation`** cho điều hướng nội bộ
  - `cn(...inputs: ClassValue[]): string` từ `@/lib/utils`

- [ ] **Step 1: Viết test parity trước khi có catalog**

`tests/messages/parity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/**
 * English là catalog tham chiếu. Keyed theo locale để khi thêm một locale vào
 * `routing.locales` mà quên import catalog thì test này đỏ, thay vì locale đó
 * âm thầm không được kiểm tra.
 */
const CATALOGS: Record<string, unknown> = { en, vi };
const TRANSLATIONS = routing.locales.filter((locale) => locale !== routing.defaultLocale);

function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keyPaths(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [prefix];
}

function arrayLengths(obj: unknown, prefix = ""): Record<string, number> {
  if (Array.isArray(obj)) {
    return obj.reduce<Record<string, number>>(
      (acc, item, i) => Object.assign(acc, arrayLengths(item, `${prefix}[${i}]`)),
      { [prefix]: obj.length },
    );
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>).reduce<Record<string, number>>(
      (acc, [k, v]) => Object.assign(acc, arrayLengths(v, prefix ? `${prefix}.${k}` : k)),
      {},
    );
  }
  return {};
}

describe("message catalogs", () => {
  it("ships a catalog for every routed locale", () => {
    for (const locale of routing.locales) {
      expect(CATALOGS[locale], `no catalog imported for "${locale}"`).toBeDefined();
    }
  });

  describe.each(TRANSLATIONS)("%s against en", (locale) => {
    it("has an identical key structure", () => {
      expect(keyPaths(CATALOGS[locale]).sort()).toEqual(keyPaths(en).sort());
    });

    it("has identical array lengths at every path", () => {
      expect(arrayLengths(CATALOGS[locale])).toEqual(arrayLengths(en));
    });
  });
});
```

`tests/i18n/routing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { routing } from "@/i18n/routing";

describe("routing", () => {
  it("routes exactly en and vi", () => {
    expect([...routing.locales].sort()).toEqual([LocaleSupport.EN, LocaleSupport.VI].sort());
  });

  it("defaults to English", () => {
    expect(routing.defaultLocale).toBe(LocaleSupport.EN);
  });

  it("always prefixes the locale, so every public URL is unambiguous", () => {
    expect(routing.localePrefix).toBe("always");
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
pnpm exec vitest run tests/i18n tests/messages
```

Kỳ vọng: FAIL — `Cannot find module '@/i18n/routing'`.

- [ ] **Step 3: Viết i18n backbone**

`enums/locale.enum.ts`:

```ts
export enum LocaleSupport {
  EN = "en",
  VI = "vi",
}
```

`enums/index.ts`:

```ts
export * from "./locale.enum";
```

`i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";
import { LocaleSupport } from "@/enums";

export const routing = defineRouting({
  locales: [LocaleSupport.EN, LocaleSupport.VI],
  defaultLocale: LocaleSupport.EN,
  localePrefix: "always",
});
```

`i18n/request.ts`:

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

`i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

`proxy.ts` — Next 16 đổi tên `middleware.ts` thành `proxy.ts`. Không có rewrite theo hostname như reference, vì đây là một site:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

`matcher` loại trừ mọi path có dấu chấm, nên `/sitemap.xml`, `/robots.txt` và `/llms.txt` (Task 7) đi thẳng tới route handler, không bị next-intl gắn locale prefix vào.

`lib/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Viết catalog tối thiểu cho cả hai locale**

`messages/en.json`:

```json
{
  "metadata": {
    "title": "Ninh Ngọc Tuấn — Solutions Consultant",
    "description": "Solutions consultant and full-stack engineer. Six years turning business problems into systems that hold up in production."
  }
}
```

`messages/vi.json`:

```json
{
  "metadata": {
    "title": "Ninh Ngọc Tuấn — Solutions Consultant",
    "description": "Solutions consultant, full-stack engineer. Sáu năm biến bài toán kinh doanh thành hệ thống trụ được trong môi trường thật."
  }
}
```

- [ ] **Step 5: Viết `app/globals.css` tối thiểu**

Bộ token đầy đủ thuộc Task 3. Ở đây chỉ cần đủ để build chạy:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 6: Viết layout và trang chủ tạm**

`app/[locale]/layout.tsx`:

```tsx
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  // Chỉ default toàn site. Canonical, hreflang và Open Graph theo từng trang do
  // `pageMetadata` đặt — khai báo canonical ở layout sẽ trỏ mọi route về một URL.
  return {
    title: { default: t("title"), template: "%s | KingNNT" },
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

`app/[locale]/(public)/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <main>KingNNT</main>;
}
```

- [ ] **Step 7: Chạy test và build**

```bash
pnpm exec vitest run tests/i18n tests/messages
pnpm lint
pnpm build
```

Kỳ vọng: test PASS; lint sạch; build sinh ra `/en` và `/vi` dưới dạng static.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(i18n): add next-intl routing, catalogs and locale layout"
```

---

## Task 3: Design token, font và chuyển theme

**Files:**
- Modify: `app/globals.css`, `app/[locale]/layout.tsx`
- Create: `components/theme-provider.tsx`, `components/mode-toggle.tsx`, `components/ui/button.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/card.tsx`, `components.json`
- Test: `tests/components/theme-tokens.test.ts`, `tests/components/mode-toggle.test.tsx`

**Interfaces:**
- Consumes: `cn` từ `@/lib/utils`; layout từ Task 2.
- Produces:
  - `<ThemeProvider>` từ `@/components/theme-provider` — wrapper của `next-themes`
  - `<ModeToggle />` từ `@/components/mode-toggle`
  - Biến CSS: `--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, `--rule`, `--radius` — định nghĩa ở cả `:root` (light) và `.dark`
  - Tailwind class dùng được: `bg-background`, `text-foreground`, `text-primary`, `text-muted-foreground`, `border-border`

Lưu ý đặt tên: accent trong spec ánh xạ thành token **`--primary`**, không phải `--accent`. shadcn/ui đã dùng `--accent` cho màu nền hover, và ghi đè nó sẽ làm mọi primitive hiểu sai. `--rule` là token riêng cho đường kẻ mảnh.

- [ ] **Step 1: Viết test cho token**

Test đọc chính file CSS. Đây là cách duy nhất kiểm chứng được token trong jsdom — jsdom không áp dụng stylesheet đã import nên `getComputedStyle` sẽ trả về rỗng.

`tests/components/theme-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

/** Token mà component dựa vào. Thiếu một cái ở một theme là lỗi im lặng. */
const REQUIRED = [
  "--background",
  "--foreground",
  "--primary",
  "--primary-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--rule",
  "--radius",
];

function blockOf(selector: string): string {
  const match = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`no ${selector} block in app/globals.css`);
  return match[1];
}

describe("theme tokens", () => {
  const light = blockOf(":root");
  const dark = blockOf("\\.dark");

  it.each(REQUIRED)("defines %s in the light theme", (token) => {
    expect(light).toContain(`${token}:`);
  });

  it.each(REQUIRED)("defines %s in the dark theme", (token) => {
    // --radius không đổi giữa hai theme; chỉ cần nó tồn tại ở :root.
    if (token === "--radius") return;
    expect(dark).toContain(`${token}:`);
  });

  it("uses a darker accent in the light theme so contrast holds on white", () => {
    const lightness = (block: string) => {
      const m = block.match(/--primary:\s*oklch\(([\d.]+)/);
      if (!m) throw new Error("--primary is not an oklch() value");
      return Number(m[1]);
    };
    expect(lightness(light)).toBeLessThan(lightness(dark));
  });
});
```

Test cuối là thứ đáng giá nhất trong ba: nó chặn cái bẫy dùng chung một giá trị accent cho cả hai theme, vốn luôn hỏng tương phản ở một bên.

- [ ] **Step 2: Chạy test để xác nhận nó đỏ**

```bash
pnpm exec vitest run tests/components/theme-tokens.test.ts
```

Kỳ vọng: FAIL — `no :root block in app/globals.css`.

- [ ] **Step 3: Viết bộ token đầy đủ**

Ghi đè `app/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-rule: var(--rule);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

/* Light. Accent tối hơn bản dark để giữ tương phản >= 4.5:1 trên nền sáng —
   một giá trị accent duy nhất không thể đạt ngưỡng ở cả hai theme. */
:root {
  --radius: 0.375rem;
  --background: oklch(0.99 0.004 80);
  --foreground: oklch(0.18 0.01 60);
  --card: oklch(0.99 0.004 80);
  --card-foreground: oklch(0.18 0.01 60);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.01 60);
  --primary: oklch(0.58 0.13 62);
  --primary-foreground: oklch(0.99 0.004 80);
  --secondary: oklch(0.96 0.005 80);
  --secondary-foreground: oklch(0.18 0.01 60);
  --muted: oklch(0.96 0.005 80);
  --muted-foreground: oklch(0.48 0.012 65);
  --accent: oklch(0.96 0.005 80);
  --accent-foreground: oklch(0.18 0.01 60);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0 0 0 / 0.12);
  --input: oklch(0 0 0 / 0.14);
  --ring: oklch(0.58 0.13 62);
  --rule: oklch(0 0 0 / 0.1);
}

/* Dark — mặc định. Nền gần đen hơi ấm, không phải xám xanh, để không đánh nhau
   với viền sáng vàng hổ phách trong ảnh chân dung. */
.dark {
  --background: oklch(0.15 0.006 60);
  --foreground: oklch(0.95 0.008 80);
  --card: oklch(0.18 0.006 60);
  --card-foreground: oklch(0.95 0.008 80);
  --popover: oklch(0.18 0.006 60);
  --popover-foreground: oklch(0.95 0.008 80);
  --primary: oklch(0.78 0.14 68);
  --primary-foreground: oklch(0.15 0.006 60);
  --secondary: oklch(0.23 0.006 60);
  --secondary-foreground: oklch(0.95 0.008 80);
  --muted: oklch(0.22 0.006 60);
  --muted-foreground: oklch(0.68 0.01 70);
  --accent: oklch(0.23 0.006 60);
  --accent-foreground: oklch(0.95 0.008 80);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 0.12);
  --input: oklch(1 0 0 / 0.16);
  --ring: oklch(0.78 0.14 68);
  --rule: oklch(1 0 0 / 0.1);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  /* Nội dung dài đọc dễ hơn khi từ không bị kéo giãn ở màn hẹp. */
  p {
    text-wrap: pretty;
  }
}
```

- [ ] **Step 4: Chạy lại test token**

```bash
pnpm exec vitest run tests/components/theme-tokens.test.ts
```

Kỳ vọng: PASS.

- [ ] **Step 5: Khởi tạo shadcn và thêm primitive**

`components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

```bash
pnpm dlx shadcn@latest add button card dropdown-menu
```

CLI có thể đề nghị ghi đè `app/globals.css` — **từ chối**. Bộ token ở Step 3 là cố ý và không được thay bằng bản mặc định của shadcn.

- [ ] **Step 6: Viết test cho mode toggle**

`tests/components/mode-toggle.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme, theme: "dark" }) }));

import { ModeToggle } from "@/components/mode-toggle";

describe("ModeToggle", () => {
  it("exposes an accessible name for the trigger", () => {
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
  });

  it("switches to light when the light item is chosen", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /theme/i }));
    await user.click(await screen.findByText("Light"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
```

- [ ] **Step 7: Viết theme provider và mode toggle**

`components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

`components/mode-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 8: Gắn ThemeProvider vào layout**

Trong `app/[locale]/layout.tsx`, thêm import `import { ThemeProvider } from "@/components/theme-provider";` và bọc phần thân:

```tsx
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
```

`defaultTheme="dark"` chứ không phải `"system"` như reference — spec chọn dark-first, và ảnh chân dung được chụp cho nền tối.

- [ ] **Step 9: Chạy toàn bộ test và build**

```bash
pnpm test
pnpm lint
pnpm build
```

Kỳ vọng: tất cả PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(theme): add dark-first token set, shadcn primitives and mode toggle"
```

---

## Task 4: Tầng dữ liệu `lib/profile` và test ẩn danh

Task lớn nhất về nội dung, và là chỗ ràng buộc ẩn danh được đóng đinh.

**Files:**
- Create: `lib/profile/identity.ts`, `lib/profile/experience.ts`, `lib/profile/skills.ts`, `lib/profile/projects.ts`, `lib/profile/trading.ts`, `lib/profile/index.ts`
- Test: `tests/lib/profile.test.ts`, `tests/lib/anonymity.test.ts`

**Interfaces:**
- Consumes: alias `@/*`.
- Produces — mọi task sau đọc dữ liệu qua các export này:
  - `IDENTITY: Identity` — `{ fullName, englishName, nickname, jobTitle, email, location: { city, country }, socials: Social[] }`, `Social = { id: "linkedin" | "github"; label: string; url: string }`
  - `EXPERIENCE: readonly ExperienceEntry[]` — `{ id, from, to, role, domains, markets, teamSize }`
  - `SKILL_GROUPS: readonly SkillGroup[]` — `{ id, skills: Skill[] }`, `Skill = { name, proficiency, years, lastUsed }`
  - `PROJECTS: readonly Project[]` — `{ id, from, to, name, url, role, teamSize, stack, featured }`
  - `featuredProjects(): Project[]`, `earlierProjects(): Project[]`
  - `TRADING: readonly TradingMilestone[]` — `{ id, year, market }`
  - `allSkillNames(): string[]` — nuôi `knowsAbout` trong JSON-LD

- [ ] **Step 1: Viết test bất biến dữ liệu**

`tests/lib/profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  allSkillNames,
  earlierProjects,
  EXPERIENCE,
  featuredProjects,
  IDENTITY,
  PROJECTS,
  SKILL_GROUPS,
  TRADING,
} from "@/lib/profile";

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function ids(items: readonly { id: string }[]) {
  return items.map((i) => i.id);
}

describe("profile data", () => {
  it("keeps ids unique within every collection", () => {
    for (const collection of [EXPERIENCE, SKILL_GROUPS, PROJECTS, TRADING]) {
      const list = ids(collection);
      expect(new Set(list).size, `duplicate id in ${list.join(", ")}`).toBe(list.length);
    }
  });

  it("uses ISO year-month for every period boundary", () => {
    for (const entry of [...EXPERIENCE, ...PROJECTS]) {
      expect(entry.from, entry.id).toMatch(YEAR_MONTH);
      if (entry.to !== null) expect(entry.to, entry.id).toMatch(YEAR_MONTH);
    }
  });

  it("never ends a period before it starts", () => {
    for (const entry of [...EXPERIENCE, ...PROJECTS]) {
      if (entry.to !== null) expect(entry.to >= entry.from, entry.id).toBe(true);
    }
  });

  /**
   * Vai trò freelance chạy song song từ 2020 tới nay, và giai đoạn consultant
   * chồng lên giai đoạn engineer. Đây là sự thật, không phải lỗi dữ liệu — test
   * khẳng định để không ai "sửa" nó thành một chuỗi tuyến tính về sau.
   */
  it("allows concurrent ongoing roles", () => {
    expect(EXPERIENCE.filter((e) => e.to === null).length).toBeGreaterThan(1);
  });

  it("gives every skill a plausible lastUsed year", () => {
    for (const group of SKILL_GROUPS) {
      for (const skill of group.skills) {
        expect(skill.years, `${skill.name} years`).toBeGreaterThan(0);
        expect(skill.lastUsed, `${skill.name} lastUsed`).toBeGreaterThanOrEqual(2016);
        expect(skill.lastUsed, `${skill.name} lastUsed`).toBeLessThanOrEqual(2026);
      }
    }
  });

  it("exposes every skill name for knowsAbout", () => {
    const total = SKILL_GROUPS.reduce((n, g) => n + g.skills.length, 0);
    expect(allSkillNames()).toHaveLength(total);
  });

  it("only links out over https", () => {
    const urls = [...PROJECTS.map((p) => p.url), ...IDENTITY.socials.map((s) => s.url)];
    for (const url of urls) {
      if (url === null) continue;
      expect(() => new URL(url)).not.toThrow();
      expect(new URL(url).protocol, url).toBe("https:");
    }
  });

  /**
   * `name: null` mã hoá ràng buộc ẩn danh vào chính kiểu dữ liệu: dự án không
   * public thì không có tên để hiển thị, và cũng không được có link.
   */
  it("never carries a url for an unnamed project", () => {
    for (const project of PROJECTS) {
      if (project.name === null) expect(project.url, project.id).toBeNull();
    }
  });

  it("splits projects into featured and earlier without losing any", () => {
    expect(featuredProjects().length + earlierProjects().length).toBe(PROJECTS.length);
    expect(featuredProjects().every((p) => p.featured)).toBe(true);
  });

  it("orders projects newest first", () => {
    const froms = PROJECTS.map((p) => p.from);
    expect([...froms].sort().reverse()).toEqual(froms);
  });

  it("describes the person without a phone number or birth date", () => {
    const serialised = JSON.stringify(IDENTITY);
    expect(serialised).not.toMatch(/\+84/);
    expect(serialised).not.toMatch(/\b(19|20)\d{2}-\d{2}-\d{2}\b/);
  });
});
```

- [ ] **Step 2: Viết test ẩn danh**

`tests/lib/anonymity.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Tên không bao giờ được xuất hiện trong chữ hiển thị. Gỡ một mục khỏi đây là
 * hành động có chủ đích, để lại dấu vết trong git — đó chính là điểm của test
 * này. Ràng buộc "đừng nhắc tên công ty" bị vi phạm dễ nhất lúc dán một đoạn
 * từ CV vào catalog trong lúc vội; một dòng ghi chú không chặn được điều đó.
 */
const DENYLIST = [
  "SyncSoft",
  "FPT",
  "Kaopiz",
  "Tap Hospitality",
  "SmartGoldFish",
  "ArtinLeap",
  "SHB",
  "Saigon-Hanoi",
  "Saigon Hanoi",
  "KPIRB",
  "TMC",
  "GICRM",
  "RENEW02",
  "E-Concierge",
  "Accommod",
  "Zyrahh",
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * Bỏ giá trị của trường `url`. Trang sản phẩm Orkestrators nằm dưới
 * `artinleap.com`, nên URL hợp lệ tất yếu chứa một tên bị cấm. Một URL là địa
 * chỉ công khai kiểm chứng được, không phải lời khẳng định về nơi làm việc —
 * ràng buộc áp lên chữ hiển thị, không áp lên đích của link.
 */
function stripUrls(source: string): string {
  return source.replace(/url:\s*"[^"]*"/g, 'url: ""').replace(/"url":\s*"[^"]*"/g, '"url": ""');
}

function occurrences(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ranh giới từ: token ngắn như "TMC" hay "SHB" so kiểu substring sẽ bắt nhầm.
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu").test(haystack);
}

const FILES = [
  ...walk(join(ROOT, "lib", "profile")),
  ...walk(join(ROOT, "messages")),
];

describe("anonymity", () => {
  it("scans a non-empty set of files", () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it.each(FILES)("%s carries no denylisted name", (file) => {
    const content = stripUrls(readFileSync(file, "utf8"));
    for (const name of DENYLIST) {
      expect(occurrences(content, name), `"${name}" found in ${file}`).toBe(false);
    }
  });
});
```

`it("scans a non-empty set of files")` không thừa: nếu đường dẫn sai, `it.each([])` sẽ không chạy test nào và bộ test vẫn xanh — một test ẩn danh không quét gì cả còn tệ hơn không có test.

- [ ] **Step 3: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/lib
```

Kỳ vọng: FAIL — `Cannot find module '@/lib/profile'`.

- [ ] **Step 4: Viết `lib/profile/identity.ts`**

```ts
export interface Social {
  id: "linkedin" | "github";
  label: string;
  url: string;
}

export interface Identity {
  fullName: string;
  englishName: string;
  nickname: string;
  jobTitle: string;
  email: string;
  location: { city: string; country: string };
  socials: readonly Social[];
}

/**
 * Số điện thoại và ngày sinh trong CV cố ý không có ở đây. Trang này công khai
 * và được crawler đọc; một số điện thoại đặt trên trang công khai là một số
 * điện thoại đã bị thu thập.
 */
export const IDENTITY: Identity = {
  fullName: "Ninh Ngọc Tuấn",
  englishName: "Jesse",
  nickname: "KingNNT",
  jobTitle: "Solutions Consultant",
  email: "Work.KingNNT@gmail.com",
  location: { city: "Hà Nội", country: "Việt Nam" },
  socials: [
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/kingnnt/" },
    { id: "github", label: "GitHub", url: "https://github.com/KingNNT" },
  ],
};
```

- [ ] **Step 5: Viết `lib/profile/experience.ts`**

```ts
export interface ExperienceEntry {
  id: string;
  /** ISO year-month, ví dụ "2026-07". */
  from: string;
  /** `null` nghĩa là đang diễn ra. Nhiều mục cùng `null` là hợp lệ. */
  to: string | null;
  /** Chức danh — dữ liệu, không phải bản dịch. */
  role: string;
  domains: readonly string[];
  markets: readonly string[];
  teamSize: number | null;
}

/**
 * Không có tên nơi làm việc ở đây, theo yêu cầu của chủ trang. Thứ thay thế
 * phải cụ thể hơn một chức danh trần: lĩnh vực, thị trường và quy mô đội là ba
 * thứ nói được năng lực mà không nói ra tên.
 *
 * Thứ tự: mới nhất trước.
 */
export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    id: "consultant",
    from: "2026-07",
    to: null,
    role: "Solutions Consultant",
    domains: ["presales", "solution-architecture", "cloud-cost"],
    markets: ["VN", "Global"],
    teamSize: null,
  },
  {
    id: "engineer-current",
    from: "2025-09",
    to: null,
    role: "Full-stack Engineer",
    domains: ["banking", "healthcare", "e-commerce", "ai"],
    markets: ["VN", "MY", "AU"],
    teamSize: null,
  },
  {
    id: "engineer-ai",
    from: "2024-04",
    to: "2025-10",
    role: "Full-stack Engineer",
    domains: ["ai", "document-processing", "enterprise"],
    markets: ["JP", "EU"],
    teamSize: 8,
  },
  {
    id: "engineer-offshore",
    from: "2021-08",
    to: "2024-03",
    role: "Full-stack Engineer",
    domains: ["communications", "booking", "education"],
    markets: ["JP", "Global"],
    teamSize: 15,
  },
  {
    id: "engineer-hospitality",
    from: "2020-12",
    to: "2021-08",
    role: "Full-stack Engineer",
    domains: ["hospitality", "tourism"],
    markets: ["JP"],
    teamSize: 5,
  },
  {
    id: "freelance",
    from: "2020-01",
    to: null,
    role: "Independent Engineer",
    domains: ["product", "architecture", "cloud"],
    markets: ["VN", "Global"],
    teamSize: null,
  },
];
```

- [ ] **Step 6: Viết `lib/profile/skills.ts`**

```ts
export type Proficiency = "expert" | "intermediate" | "basic";

export interface Skill {
  name: string;
  proficiency: Proficiency;
  years: number;
  /**
   * Năm dùng gần nhất. Trường tự tố cáo: để nguyên vài năm là thành sai sự
   * thật. Giữ vì đó chính là thứ làm bảng này đáng tin hơn một rừng logo.
   */
  lastUsed: number;
}

export interface SkillGroup {
  id: string;
  skills: readonly Skill[];
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: "languages",
    skills: [
      { name: "TypeScript", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "JavaScript", proficiency: "expert", years: 5, lastUsed: 2026 },
      { name: "Python", proficiency: "expert", years: 3, lastUsed: 2026 },
      { name: "PHP", proficiency: "expert", years: 3, lastUsed: 2023 },
      { name: "Rust", proficiency: "basic", years: 1, lastUsed: 2026 },
      { name: "C/C++", proficiency: "intermediate", years: 2, lastUsed: 2021 },
      { name: "C#", proficiency: "basic", years: 1, lastUsed: 2021 },
      { name: "Java", proficiency: "basic", years: 1, lastUsed: 2021 },
    ],
  },
  {
    id: "frontend",
    skills: [
      { name: "React", proficiency: "expert", years: 5, lastUsed: 2026 },
      { name: "Next.js", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "Tailwind CSS", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "Vue", proficiency: "expert", years: 4, lastUsed: 2024 },
    ],
  },
  {
    id: "backend",
    skills: [
      { name: "FastAPI", proficiency: "expert", years: 4, lastUsed: 2026 },
      { name: "NestJS", proficiency: "expert", years: 3, lastUsed: 2026 },
      { name: "Django", proficiency: "expert", years: 3, lastUsed: 2026 },
      { name: "Laravel", proficiency: "expert", years: 3, lastUsed: 2023 },
    ],
  },
  {
    id: "devops",
    skills: [
      { name: "Docker", proficiency: "expert", years: 5, lastUsed: 2026 },
      { name: "AWS", proficiency: "intermediate", years: 3, lastUsed: 2026 },
      { name: "Google Cloud", proficiency: "intermediate", years: 3, lastUsed: 2026 },
      { name: "Microsoft Azure", proficiency: "intermediate", years: 2, lastUsed: 2025 },
      { name: "DigitalOcean", proficiency: "intermediate", years: 2, lastUsed: 2026 },
      { name: "Vultr", proficiency: "intermediate", years: 4, lastUsed: 2026 },
      { name: "Terraform", proficiency: "basic", years: 1, lastUsed: 2026 },
      { name: "GitHub Actions", proficiency: "basic", years: 1, lastUsed: 2026 },
      { name: "Jenkins", proficiency: "basic", years: 2, lastUsed: 2026 },
      { name: "Kubernetes", proficiency: "basic", years: 1, lastUsed: 2025 },
    ],
  },
  {
    id: "data",
    skills: [
      { name: "PostgreSQL", proficiency: "intermediate", years: 5, lastUsed: 2026 },
      { name: "SQLite", proficiency: "intermediate", years: 6, lastUsed: 2026 },
      { name: "MongoDB", proficiency: "intermediate", years: 4, lastUsed: 2026 },
      { name: "MySQL", proficiency: "intermediate", years: 4, lastUsed: 2024 },
      { name: "Redis", proficiency: "intermediate", years: 4, lastUsed: 2026 },
      { name: "Kafka", proficiency: "intermediate", years: 2, lastUsed: 2026 },
      { name: "Memcached", proficiency: "basic", years: 1, lastUsed: 2024 },
      { name: "Firebase", proficiency: "basic", years: 1, lastUsed: 2023 },
    ],
  },
];

export function allSkillNames(): string[] {
  return SKILL_GROUPS.flatMap((group) => group.skills.map((skill) => skill.name));
}
```

Lưu ý về dữ liệu: CV ghi `Kubernetes — 3 tháng` và `Firebase — 3 tháng`. `years` là số nguyên nên chúng thành `1`; `proficiency: "basic"` mới là thứ mang thông tin, và đó là lý do cột proficiency không bị bỏ đi. `Next.js` được thêm vào nhóm frontend dù bảng trong CV không tách riêng — nó xuất hiện ở gần hết dự án, và bỏ nó khỏi bảng trong khi cả trang này chạy trên nó là một sự im lặng khó hiểu.

- [ ] **Step 7: Viết `lib/profile/projects.ts`**

```ts
export interface Project {
  id: string;
  from: string;
  to: string | null;
  /** `null` khi sản phẩm chưa public — không có tên để hiển thị. */
  name: string | null;
  /** Luôn `null` khi `name` là `null`. */
  url: string | null;
  role: string;
  teamSize: number | null;
  stack: readonly string[];
  featured: boolean;
}

/** Mới nhất trước. */
export const PROJECTS: readonly Project[] = [
  {
    id: "intentsite",
    from: "2026-01",
    to: null,
    name: "IntentSite",
    url: "https://www.intentsite.com/",
    role: "Tech Lead · Solution Architect",
    teamSize: 6,
    stack: ["Next.js", "Python", "LLM", "WhatsApp API"],
    featured: true,
  },
  {
    id: "bank-kpi",
    from: "2025-11",
    to: "2026-04",
    name: null,
    url: null,
    role: "Full-stack Engineer",
    teamSize: 4,
    stack: ["Next.js", "PostgreSQL", "AWS"],
    featured: true,
  },
  {
    id: "mental-health-elearning",
    from: "2025-11",
    to: null,
    name: null,
    url: null,
    role: "Backend Engineer",
    teamSize: 6,
    stack: ["NestJS", "Next.js", "PostgreSQL", "AWS"],
    featured: true,
  },
  {
    id: "email-agent",
    from: "2025-07",
    to: "2025-10",
    name: null,
    url: null,
    role: "Tech Lead · Full-stack Engineer",
    teamSize: 8,
    stack: ["FastAPI", "Next.js", "Azure OpenAI", "Kubernetes"],
    featured: false,
  },
  {
    id: "orkestrators",
    from: "2025-05",
    to: null,
    name: "Orkestrators",
    url: "https://www.artinleap.com/products/orkestrators",
    role: "Tech Lead · Implementation Advisor",
    teamSize: 5,
    stack: ["FastAPI", "React", "MongoDB", "LangChain", "MCP", "OAuth 2.0"],
    featured: true,
  },
  {
    id: "semikong",
    from: "2024-06",
    to: "2024-07",
    name: "SemiKong",
    url: "https://semikong.ai",
    role: "Team Lead",
    teamSize: 4,
    stack: ["Django", "Next.js", "PostgreSQL", "Azure"],
    featured: true,
  },
  {
    id: "restaurant-marketplace",
    from: "2022-11",
    to: "2023-04",
    name: null,
    url: null,
    role: "Full-stack Engineer",
    teamSize: 15,
    stack: ["Laravel", "Nuxt", "TypeScript", "Puppeteer"],
    featured: false,
  },
  {
    id: "livecall",
    from: "2022-03",
    to: "2024-03",
    name: "Live Call",
    url: "https://livecall.net",
    role: "Full-stack Engineer",
    teamSize: 15,
    stack: ["Django", "Vue", "TypeScript", "Twilio", "Stripe", "WebSocket"],
    featured: true,
  },
  {
    id: "school-management",
    from: "2021-09",
    to: "2022-06",
    name: null,
    url: null,
    role: "Full-stack Engineer",
    teamSize: 15,
    stack: ["Laravel", "Vue", "MySQL", "Redis"],
    featured: false,
  },
];

export function featuredProjects(): Project[] {
  return PROJECTS.filter((project) => project.featured);
}

export function earlierProjects(): Project[] {
  return PROJECTS.filter((project) => !project.featured);
}
```

- [ ] **Step 8: Viết `lib/profile/trading.ts` và `index.ts`**

```ts
export interface TradingMilestone {
  id: string;
  year: number;
  market: "crypto" | "forex" | "equities";
}

/**
 * Chỉ các mốc. Câu chuyện nằm trong catalog — và không có con số lợi nhuận nào
 * ở cả hai nơi: một câu khoe hiệu suất sẽ kéo trang cá nhân này vào phạm trù
 * YMYL mà nó không có lý do gì để bước vào.
 */
export const TRADING: readonly TradingMilestone[] = [
  { id: "crypto", year: 2020, market: "crypto" },
  { id: "forex", year: 2023, market: "forex" },
  { id: "equities", year: 2024, market: "equities" },
];
```

`lib/profile/index.ts`:

```ts
export * from "./experience";
export * from "./identity";
export * from "./projects";
export * from "./skills";
export * from "./trading";
```

- [ ] **Step 9: Chạy test**

```bash
pnpm exec vitest run tests/lib
```

Kỳ vọng: PASS. Nếu `anonymity` đỏ, đọc tên file trong thông báo lỗi — nó chỉ đúng chỗ rò rỉ.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(profile): add typed profile data layer with anonymity test"
```

---

## Task 5: Registry route, URL builder và metadata theo trang

**Files:**
- Create: `lib/routes.ts`, `lib/site.ts`, `lib/metadata.ts`
- Test: `tests/lib/routes.test.ts`, `tests/seo/metadata.test.ts`

**Interfaces:**
- Consumes: `routing` từ `@/i18n/routing`.
- Produces:
  - `ROUTES: readonly RouteDef[]`, `RouteDef = { path, key, parent?, priority, changeFrequency, lastModified? }`
  - `HOME_PATH = ""`, `CONTENT_LAST_MODIFIED: string`, `routeLastModified(route): string`
  - `findRoute(path): RouteDef | undefined`, `breadcrumbTrail(path): RouteDef[]`, `navRoutes(): RouteDef[]`
  - `SITE_URL: string`, `pageUrl(locale, path): string`, `languageAlternates(path): Record<string, string>`, `OG_LOCALE: Record<string, string>`
  - `pageMetadata({ locale, path, title, description }): Metadata`

- [ ] **Step 1: Viết test**

`tests/lib/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  breadcrumbTrail,
  findRoute,
  HOME_PATH,
  navRoutes,
  ROUTES,
  routeLastModified,
} from "@/lib/routes";

describe("route registry", () => {
  it("registers exactly the five public routes", () => {
    expect(ROUTES.map((r) => r.path).sort()).toEqual(
      ["", "about", "experience", "projects", "skills"].sort(),
    );
  });

  it("keeps paths free of leading and trailing slashes", () => {
    for (const route of ROUTES) {
      expect(route.path.startsWith("/"), route.path).toBe(false);
      expect(route.path.endsWith("/"), route.path).toBe(false);
    }
  });

  it("gives the home page the top priority", () => {
    const home = findRoute(HOME_PATH);
    expect(home?.priority).toBe(1);
  });

  it("excludes home from the navigation list", () => {
    expect(navRoutes().map((r) => r.path)).toEqual([
      "about",
      "experience",
      "skills",
      "projects",
    ]);
  });

  it("builds a breadcrumb trail rooted at home", () => {
    expect(breadcrumbTrail("skills").map((r) => r.path)).toEqual([HOME_PATH, "skills"]);
  });

  it("returns an empty trail for an unknown path", () => {
    expect(breadcrumbTrail("blog")).toEqual([]);
  });

  it("falls back to the site-wide content date", () => {
    const route = findRoute("about");
    expect(route && routeLastModified(route)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("points every parent at a route that exists", () => {
    for (const route of ROUTES) {
      if (route.parent === undefined) continue;
      expect(findRoute(route.parent), `${route.path} -> ${route.parent}`).toBeDefined();
    }
  });
});
```

`tests/seo/metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { pageMetadata } from "@/lib/metadata";
import { languageAlternates, pageUrl, SITE_URL } from "@/lib/site";

describe("site urls", () => {
  it("has no trailing slash on the origin", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
  });

  it("puts the locale first and the path after it", () => {
    expect(pageUrl(LocaleSupport.EN, "skills")).toBe(`${SITE_URL}/en/skills`);
  });

  it("renders the home page as the bare locale root", () => {
    expect(pageUrl(LocaleSupport.VI, "")).toBe(`${SITE_URL}/vi`);
  });

  it("offers an alternate for every routed locale", () => {
    expect(languageAlternates("about")).toEqual({
      en: `${SITE_URL}/en/about`,
      vi: `${SITE_URL}/vi/about`,
    });
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({
    locale: LocaleSupport.EN,
    path: "projects",
    title: "Projects",
    description: "Selected work.",
  });

  it("sets the canonical to this page, not the site root", () => {
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en/projects`);
  });

  it("declares an x-default alternate pointing at the default locale", () => {
    expect(meta.alternates?.languages?.["x-default"]).toBe(`${SITE_URL}/en/projects`);
  });

  /**
   * Khai báo `openGraph` trong `generateMetadata` khiến Next ngừng gộp file
   * convention `opengraph-image`. Không tham chiếu tường minh thì og:image biến
   * mất mà không có lỗi nào.
   */
  it("references the og image explicitly", () => {
    const images = meta.openGraph?.images;
    expect(Array.isArray(images) && images.length).toBeTruthy();
  });

  it("lists the other locale as an alternate og locale", () => {
    expect(meta.openGraph?.alternateLocale).toEqual(["vi_VN"]);
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/lib/routes.test.ts tests/seo/metadata.test.ts
```

Kỳ vọng: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết `lib/routes.ts`**

```ts
export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";

export interface RouteDef {
  /** Path sau locale prefix, không có dấu gạch chéo đầu hay cuối. */
  path: string;
  /** Key trong message catalog chứa copy của route này. */
  key: string;
  /** Path của route cha, dùng dựng breadcrumb. */
  parent?: string;
  priority: number;
  changeFrequency: ChangeFrequency;
  lastModified?: string;
}

/**
 * Trang chủ nằm ngay tại `/{locale}`. Reference đặt nó ở `/{locale}/home` vì nó
 * phục vụ bốn hostname qua rewrite; ở đây một site nên bỏ được một lần redirect.
 */
export const HOME_PATH = "";

/**
 * Ngày copy của trang đổi lần cuối, nuôi cả `<lastmod>` trong sitemap lẫn
 * `dateModified` trong schema. **Bump khi sửa message catalog**, không phải khi
 * deploy: nếu lấy thời điểm build thì một trang không đụng tới hàng tháng vẫn
 * khai là vừa đổi vài phút trước, và đó là tín hiệu chỉ đáng có khi nó đúng.
 */
export const CONTENT_LAST_MODIFIED = "2026-08-16";

export function routeLastModified(route: RouteDef): string {
  return route.lastModified ?? CONTENT_LAST_MODIFIED;
}

/**
 * Nguồn sự thật duy nhất cho mọi route công khai. Navigation, sitemap,
 * breadcrumb và llms.txt đều đọc từ đây nên chúng không thể lệch nhau. Thêm
 * trang nghĩa là thêm một mục ở đây cộng với copy ở cả hai catalog.
 */
export const ROUTES: readonly RouteDef[] = [
  { path: HOME_PATH, key: "home", priority: 1, changeFrequency: "monthly" },
  { path: "about", key: "about", parent: HOME_PATH, priority: 0.9, changeFrequency: "monthly" },
  {
    path: "experience",
    key: "experience",
    parent: HOME_PATH,
    priority: 0.9,
    changeFrequency: "monthly",
  },
  { path: "skills", key: "skills", parent: HOME_PATH, priority: 0.8, changeFrequency: "monthly" },
  {
    path: "projects",
    key: "projects",
    parent: HOME_PATH,
    priority: 0.9,
    changeFrequency: "monthly",
  },
];

export function findRoute(path: string): RouteDef | undefined {
  return ROUTES.find((route) => route.path === path);
}

/** Mọi route trừ trang chủ, theo đúng thứ tự hiển thị trên thanh điều hướng. */
export function navRoutes(): RouteDef[] {
  return ROUTES.filter((route) => route.path !== HOME_PATH);
}

/** Breadcrumb từ gốc tới chính route đó. Rỗng nếu path không phải một route. */
export function breadcrumbTrail(path: string): RouteDef[] {
  const trail: RouteDef[] = [];
  let current = findRoute(path);

  while (current) {
    trail.unshift(current);
    current = current.parent !== undefined ? findRoute(current.parent) : undefined;
  }

  return trail;
}
```

Thứ tự trong `ROUTES` **là** thứ tự điều hướng: about → experience → skills → projects. Đó cũng là thứ tự kể chuyện — ai trước, làm gì sau.

- [ ] **Step 4: Viết `lib/site.ts`**

```ts
import { LocaleSupport } from "@/enums";
import { routing } from "@/i18n/routing";
import { IDENTITY } from "@/lib/profile";

const PROTOCOL = process.env.NEXT_PUBLIC_SITE_PROTOCOL ?? "https";

/**
 * Origin chuẩn. Đặt `NEXT_PUBLIC_SITE_URL` trong môi trường preview của Vercel,
 * nếu không canonical của bản preview sẽ trỏ về production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? `${PROTOCOL}://kingnnt.org`
).replace(/\/$/, "");

export const SITE_NAME = IDENTITY.nickname;

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
```

- [ ] **Step 5: Viết `lib/metadata.ts`**

```ts
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
```

`type: "profile"` chứ không phải `"website"` như reference — đây là trang của một người, và Open Graph có sẵn kiểu đúng cho việc đó.

- [ ] **Step 6: Chạy test**

```bash
pnpm exec vitest run tests/lib tests/seo
```

Kỳ vọng: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(seo): add route registry, url builders and per-page metadata"
```

---

## Task 6: JSON-LD

**Files:**
- Create: `lib/structured-data.ts`, `components/structured-data.tsx`
- Test: `tests/seo/structured-data.test.ts`

**Interfaces:**
- Consumes: `IDENTITY`, `allSkillNames` từ `@/lib/profile`; `breadcrumbTrail`, `CONTENT_LAST_MODIFIED`, `findRoute`, `routeLastModified` từ `@/lib/routes`; `pageUrl`, `SITE_URL` từ `@/lib/site`.
- Produces:
  - `personSchema(locale): object`, `webSiteSchema(locale): object`
  - `profilePageSchema({ locale, path, title, description }): object`
  - `breadcrumbSchema(locale, path, labelFor): object`
  - `<PageStructuredData locale path title description />` từ `@/components/structured-data`

- [ ] **Step 1: Viết test**

`tests/seo/structured-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { IDENTITY } from "@/lib/profile";
import {
  breadcrumbSchema,
  personSchema,
  profilePageSchema,
  webSiteSchema,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

describe("personSchema", () => {
  const person = personSchema(LocaleSupport.EN) as Record<string, unknown>;

  it("is a Person", () => {
    expect(person["@type"]).toBe("Person");
  });

  it("carries both alternate names people search for", () => {
    expect(person.alternateName).toEqual([IDENTITY.englishName, IDENTITY.nickname]);
  });

  it("links out to every social profile as sameAs", () => {
    expect(person.sameAs).toEqual(IDENTITY.socials.map((s) => s.url));
  });

  it("lists areas of expertise from the skills data", () => {
    expect(Array.isArray(person.knowsAbout)).toBe(true);
    expect(person.knowsAbout).toContain("TypeScript");
  });

  /**
   * Ràng buộc ẩn danh, đóng đinh ở đúng chỗ dễ rò rỉ nhất: `worksFor` là trường
   * mà mọi ví dụ Person schema trên mạng đều có.
   */
  it("declares no employer of any kind", () => {
    const serialised = JSON.stringify(person);
    expect(person).not.toHaveProperty("worksFor");
    expect(person).not.toHaveProperty("affiliation");
    expect(serialised).not.toContain("Organization");
  });

  it("omits the phone number", () => {
    expect(person).not.toHaveProperty("telephone");
  });
});

describe("profilePageSchema", () => {
  const page = profilePageSchema({
    locale: LocaleSupport.EN,
    path: "about",
    title: "About",
    description: "The long version.",
  }) as Record<string, unknown>;

  it("is a ProfilePage about the person", () => {
    expect(page["@type"]).toBe("ProfilePage");
    expect((page.mainEntity as Record<string, unknown>)["@type"]).toBe("Person");
  });

  it("dates itself from the content constant, not the build clock", () => {
    expect(page.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("breadcrumbSchema", () => {
  const crumbs = breadcrumbSchema(LocaleSupport.EN, "skills", (route) =>
    route.path === "" ? "Home" : "Skills",
  ) as { itemListElement: { position: number; name: string; item: string }[] };

  it("orders the trail from the root", () => {
    expect(crumbs.itemListElement.map((c) => c.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[0].name).toBe("Home");
    expect(crumbs.itemListElement[1].item).toBe(`${SITE_URL}/en/skills`);
  });
});

describe("webSiteSchema", () => {
  it("names the site after the person, not a company", () => {
    const site = webSiteSchema(LocaleSupport.EN) as Record<string, unknown>;
    expect(site["@type"]).toBe("WebSite");
    expect(JSON.stringify(site)).not.toContain("Organization");
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/seo/structured-data.test.ts
```

Kỳ vọng: FAIL — không tìm thấy `@/lib/structured-data`.

- [ ] **Step 3: Viết `lib/structured-data.ts`**

```ts
import { allSkillNames, IDENTITY } from "@/lib/profile";
import {
  breadcrumbTrail,
  CONTENT_LAST_MODIFIED,
  findRoute,
  type RouteDef,
  routeLastModified,
} from "@/lib/routes";
import { pageUrl, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Node Person — thực thể chính của trang này với search engine và answer engine.
 *
 * Cố ý KHÔNG có `worksFor`, `affiliation`, hay bất kỳ node `Organization` nào:
 * chủ trang yêu cầu không nhắc tên nơi làm việc, và schema là chỗ ràng buộc đó
 * rò rỉ dễ nhất vì mọi ví dụ Person đều kèm `worksFor`.
 */
export function personSchema(locale: string) {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: IDENTITY.fullName,
    alternateName: [IDENTITY.englishName, IDENTITY.nickname],
    jobTitle: IDENTITY.jobTitle,
    email: `mailto:${IDENTITY.email}`,
    url: pageUrl(locale, ""),
    image: `${SITE_URL}/images/portrait.jpg`,
    sameAs: IDENTITY.socials.map((social) => social.url),
    knowsAbout: allSkillNames(),
    knowsLanguage: ["en", "vi"],
    address: {
      "@type": "PostalAddress",
      addressLocality: IDENTITY.location.city,
      addressCountry: "VN",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Electric Power University",
    },
  };
}

export function webSiteSchema(locale: string) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: pageUrl(locale, ""),
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

interface ProfilePageArgs {
  locale: string;
  path: string;
  title: string;
  description: string;
}

export function profilePageSchema({ locale, path, title, description }: ProfilePageArgs) {
  const route = findRoute(path);

  return {
    "@type": "ProfilePage",
    "@id": `${pageUrl(locale, path)}#page`,
    url: pageUrl(locale, path),
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    dateModified: route ? routeLastModified(route) : CONTENT_LAST_MODIFIED,
    mainEntity: personSchema(locale),
  };
}

/** `labelFor` trả về tên hiển thị đã dịch của một route. */
export function breadcrumbSchema(
  locale: string,
  path: string,
  labelFor: (route: RouteDef) => string,
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbTrail(path).map((route, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: labelFor(route),
      item: pageUrl(locale, route.path),
    })),
  };
}
```

- [ ] **Step 4: Viết `components/structured-data.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import {
  breadcrumbSchema,
  profilePageSchema,
  webSiteSchema,
} from "@/lib/structured-data";

/**
 * Server component. Gộp mọi node vào một graph `@context` duy nhất thay vì
 * nhiều thẻ script rời — các node tham chiếu nhau qua `@id`, và một graph
 * chung là cách để consumer phân giải được những tham chiếu đó.
 */
export async function PageStructuredData({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}) {
  const t = await getTranslations({ locale, namespace: "nav" });

  const graph = [
    webSiteSchema(locale),
    profilePageSchema({ locale, path, title, description }),
    breadcrumbSchema(locale, path, (route) => t(route.key)),
  ];

  return (
    <script
      type="application/ld+json"
      // Nội dung sinh từ dữ liệu và catalog của chính chúng ta, không phải input người dùng.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
```

- [ ] **Step 5: Thêm namespace `nav` vào cả hai catalog**

Component vừa viết đọc `nav.<key>` cho nhãn breadcrumb, và Task 9 sẽ dùng lại chính namespace này cho thanh điều hướng — nhãn breadcrumb và nhãn menu không được phép lệch nhau.

Thêm vào `messages/en.json`:

```json
  "nav": {
    "home": "Home",
    "about": "About",
    "experience": "Experience",
    "skills": "Skills",
    "projects": "Projects"
  }
```

Thêm vào `messages/vi.json`:

```json
  "nav": {
    "home": "Trang chủ",
    "about": "Giới thiệu",
    "experience": "Kinh nghiệm",
    "skills": "Kỹ năng",
    "projects": "Dự án"
  }
```

- [ ] **Step 6: Chạy test**

```bash
pnpm exec vitest run tests/seo tests/messages
```

Kỳ vọng: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(seo): emit Person, ProfilePage and breadcrumb JSON-LD"
```

---

## Task 7: sitemap, robots và llms.txt

**Files:**
- Create: `lib/llms.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`
- Test: `tests/seo/sitemap.test.ts`, `tests/seo/robots.test.ts`, `tests/seo/llms.test.ts`

**Interfaces:**
- Consumes: `ROUTES`, `routeLastModified` từ `@/lib/routes`; `pageUrl`, `SITE_URL` từ `@/lib/site`; `@/lib/profile`.
- Produces: `buildLlmsTxt(locale): string` từ `@/lib/llms`; ba route file.

- [ ] **Step 1: Viết test**

`tests/seo/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists every route in every locale", () => {
    expect(entries).toHaveLength(ROUTES.length * routing.locales.length);
  });

  it("gives every entry a language alternate map", () => {
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual(["en", "vi"]);
    }
  });

  it("emits the home url without a trailing path segment", () => {
    expect(entries.map((e) => e.url)).toContain(`${SITE_URL}/en`);
  });

  it("never emits a url with a double slash after the origin", () => {
    for (const entry of entries) {
      expect(entry.url.replace(`${SITE_URL}/`, ""), entry.url).not.toContain("//");
    }
  });

  it("dates entries from the content constant", () => {
    for (const entry of entries) {
      expect(String(entry.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
```

`tests/seo/robots.test.ts`:

```ts
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
```

`tests/seo/llms.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LocaleSupport } from "@/enums";
import { buildLlmsTxt } from "@/lib/llms";
import { featuredProjects, IDENTITY } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { pageUrl } from "@/lib/site";

describe("llms.txt", () => {
  const text = buildLlmsTxt(LocaleSupport.EN);

  it("opens with the person as the H1", () => {
    expect(text.startsWith(`# ${IDENTITY.fullName}`)).toBe(true);
  });

  it("links every public route", () => {
    for (const route of ROUTES) {
      expect(text).toContain(pageUrl(LocaleSupport.EN, route.path));
    }
  });

  it("lists named featured projects with their url", () => {
    for (const project of featuredProjects()) {
      if (project.name === null) continue;
      expect(text).toContain(project.name);
    }
  });

  it("states the job title without naming an employer", () => {
    expect(text).toContain(IDENTITY.jobTitle);
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/seo/sitemap.test.ts tests/seo/robots.test.ts tests/seo/llms.test.ts
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { languageAlternates, pageUrl } from "@/lib/site";
import { ROUTES, routeLastModified } from "@/lib/routes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: pageUrl(locale, route.path),
      lastModified: routeLastModified(route),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: languageAlternates(route.path) },
    })),
  );
}
```

- [ ] **Step 4: Viết `app/robots.ts`**

```ts
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
  "Applebot-Extended",
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
```

- [ ] **Step 5: Viết `lib/llms.ts` và route handler**

```ts
import { EXPERIENCE, featuredProjects, IDENTITY, SKILL_GROUPS } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";
import { pageUrl } from "@/lib/site";

function period(from: string, to: string | null): string {
  return `${from} — ${to ?? "present"}`;
}

/**
 * Sinh từ registry route và tầng profile, không viết tay. Một file llms.txt
 * viết tay là một file sẽ lệch khỏi trang thật ngay lần sửa nội dung đầu tiên.
 */
export function buildLlmsTxt(locale: string): string {
  const lines: string[] = [
    `# ${IDENTITY.fullName}`,
    "",
    `> ${IDENTITY.jobTitle} — ${IDENTITY.englishName} / ${IDENTITY.nickname}. ` +
      `Based in ${IDENTITY.location.city}, ${IDENTITY.location.country}.`,
    "",
    "## Pages",
    "",
    ...ROUTES.map((route) => `- [${route.key}](${pageUrl(locale, route.path)})`),
    "",
    "## Roles",
    "",
    ...EXPERIENCE.map(
      (entry) =>
        `- ${entry.role} (${period(entry.from, entry.to)}) — ` +
        `${entry.domains.join(", ")}; markets: ${entry.markets.join(", ")}`,
    ),
    "",
    "## Selected work",
    "",
    ...featuredProjects().map((project) => {
      const label = project.name ?? "Undisclosed client project";
      const link = project.url ? ` (${project.url})` : "";
      return `- ${label}${link} — ${project.role}; ${project.stack.join(", ")}`;
    }),
    "",
    "## Skills",
    "",
    ...SKILL_GROUPS.map(
      (group) =>
        `- ${group.id}: ${group.skills
          .map((skill) => `${skill.name} (${skill.proficiency}, last used ${skill.lastUsed})`)
          .join("; ")}`,
    ),
    "",
    "## Contact",
    "",
    `- Email: ${IDENTITY.email}`,
    ...IDENTITY.socials.map((social) => `- ${social.label}: ${social.url}`),
    "",
  ];

  return lines.join("\n");
}
```

`app/llms.txt/route.ts`:

```ts
import { routing } from "@/i18n/routing";
import { buildLlmsTxt } from "@/lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(routing.defaultLocale), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 6: Chạy test và build**

```bash
pnpm exec vitest run tests/seo
pnpm build
```

Kỳ vọng: test PASS; build sinh `/sitemap.xml`, `/robots.txt`, `/llms.txt`.

- [ ] **Step 7: Kiểm chứng ba file thật sự phục vụ được**

```bash
pnpm build && pnpm start &
sleep 5
curl -s localhost:3000/robots.txt | head -5
curl -s localhost:3000/llms.txt | head -5
curl -s localhost:3000/sitemap.xml | head -5
kill %1
```

Kỳ vọng: cả ba trả về nội dung, không phải HTML 404. Nếu một trong ba ra HTML thì `matcher` trong `proxy.ts` đang nuốt nó — kiểm tra lại mệnh đề loại trừ `.*\..*`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(seo): add sitemap, robots and generated llms.txt"
```

---

## Task 8: Primitive bố cục dùng chung

**Files:**
- Create: `lib/hooks.ts`, `components/section.tsx`, `components/section-label.tsx`, `components/reveal.tsx`, `components/prose.tsx`
- Test: `tests/components/section.test.tsx`, `tests/components/reveal.test.tsx`

**Interfaces:**
- Consumes: `cn` từ `@/lib/utils`.
- Produces:
  - `useReducedMotion(): boolean`, `useInView<T extends Element>(options?)` từ `@/lib/hooks`
  - `<Section id? className? index? label?>` từ `@/components/section`
  - `<SectionLabel index name className? />` từ `@/components/section-label`
  - `<Reveal delay? className?>` từ `@/components/reveal`
  - `<Prose className?>` từ `@/components/prose`

- [ ] **Step 1: Viết test**

`tests/components/section.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "@/components/section";
import { SectionLabel } from "@/components/section-label";

describe("SectionLabel", () => {
  it("zero-pads the index so the column stays aligned", () => {
    render(<SectionLabel index={3} name="Skills" />);
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("uppercases the name for the mono label", () => {
    render(<SectionLabel index={1} name="About" />);
    expect(screen.getByText("ABOUT")).toBeInTheDocument();
  });
});

describe("Section", () => {
  it("renders its children", () => {
    render(<Section>body copy</Section>);
    expect(screen.getByText("body copy")).toBeInTheDocument();
  });

  it("exposes a landmark with an accessible name when labelled", () => {
    render(
      <Section id="skills" index={3} label="Skills">
        body
      </Section>,
    );
    expect(screen.getByRole("region", { name: /skills/i })).toBeInTheDocument();
  });

  it("omits the label row when no label is given", () => {
    const { container } = render(<Section>body</Section>);
    expect(container.querySelector(".font-mono")).toBeNull();
  });
});
```

`tests/components/reveal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "@/components/reveal";

describe("Reveal", () => {
  /**
   * Điều kiện quan trọng nhất của cả component: nội dung phải nằm trong HTML
   * ngay cả khi chưa vào viewport. Crawler của answer engine không chạy
   * JavaScript — chữ chỉ xuất hiện sau khi IntersectionObserver bắn là chữ vô
   * hình với chúng.
   */
  it("renders its children even before they enter the viewport", () => {
    render(<Reveal>indexable copy</Reveal>);
    expect(screen.getByText("indexable copy")).toBeInTheDocument();
  });

  it("shows content immediately when the user prefers reduced motion", () => {
    // vitest.setup.ts trả về matchMedia matches: true cho mọi query.
    render(<Reveal>copy</Reveal>);
    expect(screen.getByText("copy").parentElement).toHaveClass("opacity-100");
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/components/section.test.tsx tests/components/reveal.test.tsx
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `lib/hooks.ts`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setInView(true);
        io.disconnect();
      }
    }, options ?? { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [inView, options]);
  return { ref, inView };
}
```

- [ ] **Step 4: Viết các component bố cục**

`components/section-label.tsx`:

```tsx
import { cn } from "@/lib/utils";

export function SectionLabel({
  index,
  name,
  className,
}: {
  index: number;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      <span className="text-primary">{String(index).padStart(2, "0")}</span>
      <span aria-hidden className="h-px w-6 bg-rule" />
      <span>{name.toUpperCase()}</span>
    </span>
  );
}
```

`components/section.tsx`:

```tsx
import { SectionLabel } from "@/components/section-label";
import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
  index,
  label,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  index?: number;
  label?: string;
}) {
  const labelled = index != null && label != null;
  const headingId = id ? `${id}-label` : undefined;

  return (
    <section
      id={id}
      // Chỉ nhận vai trò landmark khi có nhãn — một region không tên là tiếng ồn
      // với screen reader, không phải trợ giúp.
      aria-labelledby={labelled ? headingId : undefined}
      className={cn("mx-auto w-full max-w-5xl px-6 py-16 md:py-24", className)}
    >
      {labelled ? (
        <div className="mb-8">
          <SectionLabel index={index} name={label} className="" />
          <span id={headingId} className="sr-only">
            {label}
          </span>
        </div>
      ) : null}
      {children}
    </section>
  );
}
```

`components/reveal.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { useInView, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Chỉ đổi opacity và transform của nội dung ĐÃ render. Không bao giờ quyết định
 * có render hay không: nội dung phải nằm sẵn trong HTML server-render, vì
 * crawler của answer engine không chạy JavaScript.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const shown = reduced || inView;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

`components/prose.tsx`:

```tsx
import { cn } from "@/lib/utils";

/** Khối đọc dài. 68ch là chỗ dòng còn quét mắt được mà không cần lia đầu. */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-[68ch] space-y-5 text-base leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Chạy test**

```bash
pnpm exec vitest run tests/components
```

Kỳ vọng: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): add section, reveal and prose layout primitives"
```

---

## Task 9: Header, footer và chuyển ngôn ngữ

**Files:**
- Create: `components/language-switcher.tsx`, `components/site-header.tsx`, `components/site-footer.tsx`
- Modify: `app/[locale]/layout.tsx`, `messages/en.json`, `messages/vi.json`
- Test: `tests/components/language-switcher.test.tsx`, `tests/components/site-header.test.tsx`

**Interfaces:**
- Consumes: `navRoutes` từ `@/lib/routes`; `Link`, `usePathname` từ `@/i18n/navigation`; `IDENTITY` từ `@/lib/profile`; `<ModeToggle />`.
- Produces: `<SiteHeader />`, `<SiteFooter />`, `<LanguageSwitcher />`.

- [ ] **Step 1: Viết test**

`tests/components/site-header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/about",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ home: "Home", about: "About", experience: "Experience", skills: "Skills", projects: "Projects" })[
      key
    ] ?? key,
  useLocale: () => "en",
}));

import { SiteHeader } from "@/components/site-header";

describe("SiteHeader", () => {
  it("links every navigation route from the registry", () => {
    render(<SiteHeader />);
    for (const name of ["About", "Experience", "Skills", "Projects"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("marks the current page for assistive technology", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark other pages as current", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveAttribute("aria-current");
  });
});
```

`tests/components/language-switcher.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/skills",
  useRouter: () => ({ replace }),
}));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));

import { LanguageSwitcher } from "@/components/language-switcher";

describe("LanguageSwitcher", () => {
  it("keeps the reader on the same page when switching locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("button", { name: /language/i }));
    await user.click(await screen.findByText("Tiếng Việt"));
    expect(replace).toHaveBeenCalledWith("/skills", { locale: "vi" });
  });
});
```

Test đó bảo vệ một hành vi dễ mất: đổi ngôn ngữ mà quăng người đọc về trang chủ là cách nhanh nhất khiến họ bỏ đi.

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/components/site-header.test.tsx tests/components/language-switcher.test.tsx
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `components/language-switcher.tsx`**

```tsx
"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleSupport } from "@/enums";
import { usePathname, useRouter } from "@/i18n/navigation";

const LABELS: Record<string, string> = {
  [LocaleSupport.EN]: "English",
  [LocaleSupport.VI]: "Tiếng Việt",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(LABELS).map(([value, label]) => (
          <DropdownMenuItem
            key={value}
            disabled={value === locale}
            // `pathname` từ next-intl đã bỏ locale prefix, nên người đọc ở lại
            // đúng trang thay vì bị quăng về trang chủ.
            onClick={() => router.replace(pathname, { locale: value })}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: Viết header và footer**

`components/site-header.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { HOME_PATH, navRoutes } from "@/lib/routes";
import { IDENTITY } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-4">
        <Link href={`/${HOME_PATH}`} className="font-mono text-sm tracking-tight">
          {IDENTITY.nickname}
        </Link>
        <nav className="flex flex-1 items-center gap-5 overflow-x-auto">
          {navRoutes().map((route) => {
            const href = `/${route.path}`;
            const current = pathname === href;
            return (
              <Link
                key={route.path}
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap font-mono text-xs uppercase tracking-[0.15em] transition-colors",
                  current ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(route.key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
```

`components/site-footer.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { IDENTITY } from "@/lib/profile";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {IDENTITY.fullName} · {IDENTITY.location.city}, {IDENTITY.location.country}
        </p>
        <div className="flex items-center gap-4">
          <a className="hover:text-foreground" href={`mailto:${IDENTITY.email}`}>
            {t("email")}
          </a>
          {IDENTITY.socials.map((social) => (
            <a
              key={social.id}
              className="hover:text-foreground"
              href={social.url}
              rel="me noreferrer"
              target="_blank"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
```

`rel="me"` trên link social là thứ nối trang này với hồ sơ ngoài theo cách máy đọc được, khớp với `sameAs` trong JSON-LD.

- [ ] **Step 5: Thêm namespace `footer` vào cả hai catalog**

`messages/en.json`:

```json
  "footer": {
    "email": "Email"
  }
```

`messages/vi.json`:

```json
  "footer": {
    "email": "Email"
  }
```

- [ ] **Step 6: Gắn header và footer vào layout**

Trong `app/[locale]/layout.tsx`, bọc `children`:

```tsx
          <NextIntlClientProvider>
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter locale={locale} />
            </div>
          </NextIntlClientProvider>
```

Thêm hai import tương ứng ở đầu file.

- [ ] **Step 7: Chạy test và build**

```bash
pnpm test
pnpm lint
pnpm build
```

Kỳ vọng: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): add site header, footer and language switcher"
```

---

## Task 10: Ảnh chân dung và trang chủ

**Files:**
- Create: `assets/portrait.png`, `public/images/portrait.jpg`, `components/portrait.tsx`, `app/[locale]/(public)/_components/hero.tsx`, `app/[locale]/(public)/_components/nav-index.tsx`
- Modify: `app/[locale]/(public)/page.tsx`, `messages/en.json`, `messages/vi.json`
- Test: `tests/components/portrait.test.tsx`, `tests/pages/home.test.tsx`

**Interfaces:**
- Consumes: `Section`, `Reveal`, `Prose`, `IDENTITY`, `navRoutes`, `pageMetadata`, `PageStructuredData`.
- Produces: `<Portrait className? priority? />`, `<Hero locale />`, `<NavIndex />`.

- [ ] **Step 1: Đưa ảnh vào repo**

Ảnh gốc để ngoài `public/` để bản đầy đủ không bị deploy hay tải công khai; chỉ bản tối ưu nằm trong `public/`.

```bash
mkdir -p assets public/images
cp "/Users/kingnnt/Library/CloudStorage/SynologyDrive-sync/Pictures/People/Gemini_Generated_Image_jtn1zkjtn1zkjtn1.png" assets/portrait.png
sips -s format jpeg -s formatOptions 80 assets/portrait.png --out public/images/portrait.jpg
ls -la public/images/portrait.jpg
```

Ảnh gốc 864×1184 PNG, khoảng 1 MB. Bản JPEG chất lượng 80 phải nhỏ hơn đáng kể; nếu vẫn trên 250 KB thì hạ `formatOptions` xuống 70 và chạy lại. Không resize — 864 px vừa đủ cho khung hero ở màn hình 2x.

- [ ] **Step 2: Viết test**

`tests/components/portrait.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt, src, priority, ...rest }: Record<string, unknown> & { alt: string }) => (
    // biome-ignore lint: test double for next/image
    <img alt={alt} src={String(src)} data-priority={String(Boolean(priority))} {...rest} />
  ),
}));

import { Portrait } from "@/components/portrait";

describe("Portrait", () => {
  it("names the person in the alt text", () => {
    render(<Portrait />);
    expect(screen.getByAltText(/Ninh Ngọc Tuấn/)).toBeInTheDocument();
  });

  it("marks itself as priority when it is the LCP element", () => {
    render(<Portrait priority />);
    expect(screen.getByRole("img")).toHaveAttribute("data-priority", "true");
  });
});
```

`tests/pages/home.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { NavIndex } from "@/app/[locale]/(public)/_components/nav-index";

describe("NavIndex", () => {
  it("lists every non-home route as a numbered entry", () => {
    render(<NavIndex />);
    for (const index of ["01", "02", "03", "04"]) {
      expect(screen.getByText(index)).toBeInTheDocument();
    }
  });

  it("links each entry to its route", () => {
    render(<NavIndex />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});
```

- [ ] **Step 3: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/components/portrait.test.tsx tests/pages/home.test.tsx
```

Kỳ vọng: FAIL.

- [ ] **Step 4: Viết `components/portrait.tsx`**

```tsx
import Image from "next/image";
import { IDENTITY } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function Portrait({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/portrait.jpg"
      alt={`${IDENTITY.fullName} — ${IDENTITY.jobTitle}`}
      width={864}
      height={1184}
      priority={priority}
      sizes="(min-width: 768px) 20rem, 12rem"
      className={cn("h-auto w-full rounded-sm object-cover", className)}
    />
  );
}
```

- [ ] **Step 5: Viết hero và bảng điều hướng đánh số**

`app/[locale]/(public)/_components/hero.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Portrait } from "@/components/portrait";
import { IDENTITY } from "@/lib/profile";

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_18rem] md:items-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {IDENTITY.englishName} · {IDENTITY.nickname}
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          {IDENTITY.fullName}
        </h1>
        <p className="mt-2 font-mono text-sm text-primary">{IDENTITY.jobTitle}</p>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          {t("tagline")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs">
          <a
            className="border-b border-primary pb-0.5 text-primary"
            href={`mailto:${IDENTITY.email}`}
          >
            {IDENTITY.email}
          </a>
          {IDENTITY.socials.map((social) => (
            <a
              key={social.id}
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={social.url}
              rel="me noreferrer"
              target="_blank"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
      <Portrait priority className="mx-auto max-w-[18rem] md:mx-0" />
    </div>
  );
}
```

`app/[locale]/(public)/_components/nav-index.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { navRoutes } from "@/lib/routes";

/**
 * Bốn lối vào, đánh số. Thay cho một dãy nút CTA — trang này không bán gì, nó
 * mời đọc tiếp, và một mục lục nói đúng điều đó.
 */
export function NavIndex() {
  const t = useTranslations("nav");
  const tHome = useTranslations("home.index");

  return (
    <ul className="grid gap-px overflow-hidden rounded-sm bg-rule sm:grid-cols-2">
      {navRoutes().map((route, i) => (
        <li key={route.path} className="bg-background">
          <Link
            href={`/${route.path}`}
            className="group flex h-full flex-col gap-2 p-6 transition-colors hover:bg-secondary"
          >
            <span className="font-mono text-xs text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-sm uppercase tracking-[0.15em]">{t(route.key)}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {tHome(route.key)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 6: Viết trang chủ**

`app/[locale]/(public)/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/app/[locale]/(public)/_components/hero";
import { NavIndex } from "@/app/[locale]/(public)/_components/nav-index";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { HOME_PATH } from "@/lib/routes";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return pageMetadata({
    locale,
    path: HOME_PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <main>
      <PageStructuredData
        locale={locale}
        path={HOME_PATH}
        title={t("metaTitle")}
        description={t("metaDescription")}
      />
      <Section className="pt-14">
        <Hero locale={locale} />
      </Section>
      <Section id="intro" index={1} label={t("introLabel")}>
        <Reveal>
          <Prose>
            <p>{t("intro1")}</p>
            <p>{t("intro2")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="index" index={2} label={t("indexLabel")}>
        <Reveal>
          <NavIndex />
        </Reveal>
      </Section>
    </main>
  );
}
```

- [ ] **Step 7: Thêm copy `home` vào cả hai catalog**

`messages/en.json`:

```json
  "home": {
    "metaTitle": "Ninh Ngọc Tuấn — Solutions Consultant",
    "metaDescription": "Solutions consultant and full-stack engineer in Hà Nội. Six years across AI, banking, e-commerce, healthcare and education.",
    "tagline": "I sit between the business conversation and the architecture diagram — scoping what should be built, then building enough of it to prove the scope was right.",
    "introLabel": "Intro",
    "intro1": "Six years of full-stack work across AI, banking, e-commerce, healthcare, education and hospitality, for clients in Vietnam, Japan, Malaysia, Australia and the EU. These days most of my work starts before the code does: discovery sessions, solution architecture, effort estimates, and the proof-of-concept that settles the argument.",
    "intro2": "I still write the systems I scope. That is deliberate — an estimate from someone who no longer builds is a guess with a confident tone.",
    "indexLabel": "Index",
    "index": {
      "about": "The longer version, including the years I spent trading.",
      "experience": "Six roles, by domain and market rather than by employer.",
      "skills": "What I use, how well, and when I last used it.",
      "projects": "Selected work, with links where the product is public."
    }
  }
```

`messages/vi.json`:

```json
  "home": {
    "metaTitle": "Ninh Ngọc Tuấn — Solutions Consultant",
    "metaDescription": "Solutions consultant, full-stack engineer tại Hà Nội. Sáu năm qua AI, ngân hàng, thương mại điện tử, y tế và giáo dục.",
    "tagline": "Tôi đứng giữa cuộc trò chuyện kinh doanh và bản vẽ kiến trúc — xác định cái gì đáng làm, rồi làm đủ phần của nó để chứng minh là mình xác định đúng.",
    "introLabel": "Giới thiệu",
    "intro1": "Sáu năm làm full-stack qua AI, ngân hàng, thương mại điện tử, y tế, giáo dục và khách sạn, cho khách hàng ở Việt Nam, Nhật, Malaysia, Úc và EU. Gần đây phần lớn công việc của tôi bắt đầu trước khi có dòng code nào: buổi discovery, kiến trúc giải pháp, ước lượng công sức, và bản proof-of-concept dùng để kết thúc tranh luận.",
    "intro2": "Tôi vẫn tự viết những hệ thống mình vạch ra. Đó là chủ ý — một bản ước lượng từ người đã ngừng viết code chỉ là phỏng đoán được nói bằng giọng chắc chắn.",
    "indexLabel": "Mục lục",
    "index": {
      "about": "Bản dài hơn, gồm cả những năm tôi giao dịch trên thị trường.",
      "experience": "Sáu vai trò, kể theo lĩnh vực và thị trường thay vì theo nơi làm.",
      "skills": "Tôi dùng gì, tới mức nào, và lần gần nhất là khi nào.",
      "projects": "Các dự án chọn lọc, có link ở những sản phẩm đã public."
    }
  }
```

- [ ] **Step 8: Chạy test, lint, build**

```bash
pnpm test
pnpm lint
pnpm build
```

- [ ] **Step 9: Xem bằng mắt**

```bash
pnpm dev
```

Mở `http://localhost:3000/en` và `http://localhost:3000/vi`. Kiểm: ảnh chân dung sắc nét không méo; accent vàng hổ phách khớp viền sáng trên ảnh; đổi theme sang light vẫn đọc được chữ accent; đổi ngôn ngữ vẫn ở đúng trang.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(home): add portrait, hero and numbered index"
```

---

## Task 11: `/about` và chương trading

**Files:**
- Create: `app/[locale]/(public)/about/page.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/pages/about.test.tsx`

**Interfaces:**
- Consumes: `Section`, `Prose`, `Reveal`, `PageStructuredData`, `pageMetadata`, `TRADING`.
- Produces: route `/{locale}/about`.

- [ ] **Step 1: Viết test**

`tests/pages/about.test.tsx` kiểm nội dung catalog, không render server component — trang này là server component `async` và Testing Library không render được nó trực tiếp:

```ts
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { TRADING } from "@/lib/profile";

const CATALOGS = { en, vi };

describe("about copy", () => {
  it.each(Object.entries(CATALOGS))("%s tells the trading chapter", (_locale, catalog) => {
    const about = (catalog as typeof en).about;
    expect(about.tradingLabel.length).toBeGreaterThan(0);
    expect(about.trading1.length).toBeGreaterThan(80);
  });

  it.each(Object.entries(CATALOGS))("%s names a milestone for every market", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).about);
    for (const milestone of TRADING) {
      expect(serialised).toContain(String(milestone.year));
    }
  });

  /**
   * Trang cá nhân này không phải nội dung tài chính. Một câu khoe hiệu suất sẽ
   * kéo nó vào phạm trù YMYL mà nó không có lý do gì để bước vào.
   */
  it.each(Object.entries(CATALOGS))("%s claims no returns and gives no advice", (_locale, catalog) => {
    const serialised = JSON.stringify((catalog as typeof en).about);
    expect(serialised).not.toMatch(/\d+\s*%/);
    expect(serialised).not.toMatch(/\b(ROI|lợi nhuận|profit|returns)\b/i);
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/pages/about.test.tsx
```

Kỳ vọng: FAIL — `about` chưa có trong catalog.

- [ ] **Step 3: Viết copy `about` cho `messages/en.json`**

```json
  "about": {
    "metaTitle": "About",
    "metaDescription": "Engineer, then trader, then both — how the two halves ended up informing each other.",
    "title": "About",
    "leadLabel": "Now",
    "lead1": "I am a solutions consultant and full-stack engineer, based in Hà Nội. My work splits roughly in half: figuring out what a client actually needs and what it will cost, and then building the part of it that proves the answer was right.",
    "lead2": "The domains have been unusually wide — AI document processing, banking, healthcare, e-commerce, education, hospitality — across teams in Vietnam, Japan, Malaysia, Australia and the EU. Breadth like that is a mixed blessing. It makes me fast at recognising the shape of a new domain, and it means I have to be honest about where my depth actually is. That is what the skills page is for.",
    "pathLabel": "How I got here",
    "path1": "I started building for clients as a freelancer in 2020, while still at university, and never fully stopped. That thread runs underneath every job since: it is where I learned that the hard part is rarely the code, it is agreeing on what the code is supposed to do.",
    "path2": "From there: hospitality systems for the Japanese market, then several years of offshore delivery on large teams — video calling, booking, school management — then an AI centre, where the work turned into document extraction and email agents for Japanese and EU clients. Lately I lead architecture on AI products and sit in the pre-sales conversations that decide whether they get built at all.",
    "tradingLabel": "The other half",
    "trading1": "In 2020 I started trading crypto. In mid-2023 I moved into forex, and in early 2024 I added equities. I have run two styles side by side the whole time: holding positions I believe in for the long horizon, and swing trading around the shorter moves. I am not going to publish numbers here — this is not a finance site and I am not selling a method.",
    "trading2": "What I keep from it is not a market opinion. It is a habit of thinking in position sizes instead of certainties. A trader who is right sixty percent of the time and sizes badly still loses; an engineer who is confident about an estimate and wrong about the tail risk sinks a project the same way. Trading taught me to ask what happens when I am wrong before asking how likely it is that I am right — and that question has changed how I scope work far more than any framework has.",
    "trading3": "It also taught me to sit still. Most days the correct action is none, and the discipline of not acting transfers almost directly to architecture: the cheapest system is the one you did not build because you waited a week and the requirement evaporated.",
    "contactLabel": "Get in touch",
    "contact": "The fastest way to reach me is email. I read LinkedIn less often, and GitHub is where the code is."
  }
```

- [ ] **Step 4: Viết copy `about` cho `messages/vi.json`**

```json
  "about": {
    "metaTitle": "Giới thiệu",
    "metaDescription": "Kỹ sư, rồi trader, rồi cả hai — và cách hai nửa đó soi sáng lẫn nhau.",
    "title": "Giới thiệu",
    "leadLabel": "Hiện tại",
    "lead1": "Tôi là solutions consultant kiêm full-stack engineer, sống ở Hà Nội. Công việc chia đôi khá đều: tìm ra khách hàng thật sự cần gì và cái đó tốn bao nhiêu, rồi tự tay dựng phần đủ để chứng minh câu trả lời đó đúng.",
    "lead2": "Các lĩnh vực đi qua rộng bất thường — xử lý tài liệu bằng AI, ngân hàng, y tế, thương mại điện tử, giáo dục, khách sạn — với các đội ở Việt Nam, Nhật, Malaysia, Úc và EU. Bề rộng đó là con dao hai lưỡi. Nó khiến tôi nhanh chóng nhận ra hình dạng của một lĩnh vực mới, và cũng buộc tôi phải trung thực về chỗ mình thật sự sâu tới đâu. Trang kỹ năng tồn tại là để nói đúng điều đó.",
    "pathLabel": "Đường đi",
    "path1": "Tôi bắt đầu làm cho khách hàng từ 2020, khi còn đi học, và chưa bao giờ dừng hẳn. Mạch freelance đó chạy ngầm dưới mọi công việc sau này: đó là nơi tôi học được rằng phần khó hiếm khi là code, mà là thống nhất được code đó rốt cuộc phải làm gì.",
    "path2": "Từ đó: hệ thống cho ngành khách sạn ở thị trường Nhật, rồi vài năm làm offshore trong các đội lớn — video call, đặt chỗ, quản lý trường học — rồi tới một trung tâm AI, nơi công việc chuyển sang trích xuất tài liệu và agent xử lý email cho khách Nhật và EU. Gần đây tôi dẫn phần kiến trúc cho các sản phẩm AI, và ngồi trong chính những buổi pre-sales quyết định chúng có được làm hay không.",
    "tradingLabel": "Nửa còn lại",
    "trading1": "Năm 2020 tôi bắt đầu giao dịch crypto. Giữa 2023 chuyển sang forex, và đầu 2024 thêm chứng khoán. Suốt thời gian đó tôi chạy song song hai trường phái: nắm giữ dài hạn những vị thế mình tin, và swing trading quanh các nhịp ngắn hơn. Tôi sẽ không đưa con số nào lên đây — trang này không phải nội dung tài chính và tôi không bán phương pháp nào cả.",
    "trading2": "Thứ tôi giữ lại không phải một quan điểm thị trường. Đó là thói quen nghĩ bằng khối lượng vị thế thay vì bằng sự chắc chắn. Một trader đúng sáu trên mười lần mà vào lệnh sai cỡ vẫn lỗ; một kỹ sư tự tin về ước lượng nhưng sai về rủi ro đuôi thì làm chìm dự án theo đúng cách đó. Giao dịch dạy tôi hỏi \"nếu tôi sai thì chuyện gì xảy ra\" trước khi hỏi \"khả năng tôi đúng là bao nhiêu\" — và câu hỏi đó thay đổi cách tôi bóc tách công việc nhiều hơn bất kỳ framework nào.",
    "trading3": "Nó cũng dạy tôi ngồi yên. Phần lớn các ngày, hành động đúng là không hành động, và kỷ luật không-làm-gì đó chuyển gần như trực tiếp sang kiến trúc: hệ thống rẻ nhất là hệ thống bạn đã không dựng, vì bạn chờ thêm một tuần và yêu cầu đó tự bốc hơi.",
    "contactLabel": "Liên hệ",
    "contact": "Cách nhanh nhất là email. LinkedIn tôi đọc thưa hơn, còn GitHub là nơi có code."
  }
```

- [ ] **Step 5: Viết trang**

`app/[locale]/(public)/about/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { IDENTITY } from "@/lib/profile";

const PATH = "about";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

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
      <Section id="now" index={1} label={t("leadLabel")}>
        <Reveal>
          <Prose>
            <p>{t("lead1")}</p>
            <p>{t("lead2")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="path" index={2} label={t("pathLabel")}>
        <Reveal>
          <Prose>
            <p>{t("path1")}</p>
            <p>{t("path2")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="trading" index={3} label={t("tradingLabel")}>
        <Reveal>
          <Prose>
            <p>{t("trading1")}</p>
            <p>{t("trading2")}</p>
            <p>{t("trading3")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="contact" index={4} label={t("contactLabel")}>
        <Reveal>
          <Prose>
            <p>{t("contact")}</p>
          </Prose>
          <a
            className="mt-6 inline-block border-b border-primary pb-0.5 font-mono text-sm text-primary"
            href={`mailto:${IDENTITY.email}`}
          >
            {IDENTITY.email}
          </a>
        </Reveal>
      </Section>
    </main>
  );
}
```

- [ ] **Step 6: Chạy test, lint, build**

```bash
pnpm test
pnpm lint
pnpm build
```

Kỳ vọng: PASS, gồm cả `parity` và `anonymity`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(about): add about page with the trading chapter"
```

---

## Task 12: Timeline và `/experience`

**Files:**
- Create: `components/timeline.tsx`, `app/[locale]/(public)/experience/page.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/components/timeline.test.tsx`

**Interfaces:**
- Consumes: `EXPERIENCE` từ `@/lib/profile`.
- Produces: `<Timeline items />` với `TimelineItem = { id, period, role, summary, meta }` — component không tự đọc `lib/profile`, trang truyền vào dữ liệu đã ghép với bản dịch. Ranh giới này giữ component thuần trình bày và test được mà không cần mock i18n.

- [ ] **Step 1: Viết test**

`tests/components/timeline.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline, type TimelineItem } from "@/components/timeline";

const ITEMS: TimelineItem[] = [
  {
    id: "consultant",
    period: "07.2026 — now",
    role: "Solutions Consultant",
    summary: "Pre-sales and solution architecture.",
    meta: ["presales", "VN"],
    ongoing: true,
  },
  {
    id: "engineer-ai",
    period: "04.2024 — 10.2025",
    role: "Full-stack Engineer",
    summary: "AI document processing.",
    meta: ["ai", "JP"],
    ongoing: false,
  },
];

describe("Timeline", () => {
  it("renders an entry per item", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the role and the period for each entry", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByText("Solutions Consultant")).toBeInTheDocument();
    expect(screen.getByText("07.2026 — now")).toBeInTheDocument();
  });

  /**
   * Nhiều vai trò cùng đang diễn ra là sự thật của hồ sơ này, không phải lỗi dữ
   * liệu. Component phải chịu được, và phải đánh dấu được.
   */
  it("marks ongoing entries so concurrent roles read correctly", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByTestId("marker-consultant")).toHaveAttribute("data-ongoing", "true");
    expect(screen.getByTestId("marker-engineer-ai")).toHaveAttribute("data-ongoing", "false");
  });

  it("lists the meta tags of an entry", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByText("presales")).toBeInTheDocument();
  });

  it("renders nothing but an empty list when given no items", () => {
    render(<Timeline items={[]} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/components/timeline.test.tsx
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `components/timeline.tsx`**

```tsx
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  period: string;
  role: string;
  summary: string;
  meta: readonly string[];
  ongoing: boolean;
}

/**
 * Thuần trình bày: trang truyền vào dữ liệu đã ghép với bản dịch. Component
 * không đọc `lib/profile` và không gọi i18n, nên nó test được mà không cần mock.
 */
export function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="relative border-l border-rule">
      {items.map((item) => (
        <li key={item.id} className="relative pb-10 pl-8 last:pb-0">
          <span
            data-testid={`marker-${item.id}`}
            data-ongoing={String(item.ongoing)}
            aria-hidden
            className={cn(
              "absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full",
              item.ongoing ? "bg-primary" : "bg-rule ring-1 ring-border",
            )}
          />
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {item.period}
          </p>
          <h3 className="mt-2 text-lg font-medium">{item.role}</h3>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
            {item.meta.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Viết trang `/experience`**

`app/[locale]/(public)/experience/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { Timeline, type TimelineItem } from "@/components/timeline";
import { pageMetadata } from "@/lib/metadata";
import { EXPERIENCE } from "@/lib/profile";

const PATH = "experience";

/** "2026-07" → "07.2026". Mono, và không phụ thuộc locale của trình duyệt. */
function formatPeriod(from: string, to: string | null, nowLabel: string): string {
  const fmt = (value: string) => {
    const [year, month] = value.split("-");
    return `${month}.${year}`;
  };
  return `${fmt(from)} — ${to === null ? nowLabel : fmt(to)}`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "experience" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ExperiencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "experience" });

  const items: TimelineItem[] = EXPERIENCE.map((entry) => ({
    id: entry.id,
    period: formatPeriod(entry.from, entry.to, t("now")),
    role: entry.role,
    summary: t(`entries.${entry.id}`),
    meta: [...entry.domains, ...entry.markets, ...(entry.teamSize ? [`team ${entry.teamSize}+`] : [])],
    ongoing: entry.to === null,
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
        <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
          {t("note")}
        </p>
      </Section>
      <Section id="roles" index={1} label={t("rolesLabel")}>
        <Reveal>
          <Timeline items={items} />
        </Reveal>
      </Section>
    </main>
  );
}
```

- [ ] **Step 5: Thêm copy `experience`**

`messages/en.json`:

```json
  "experience": {
    "metaTitle": "Experience",
    "metaDescription": "Six years of engineering and consulting, described by domain, market and team size.",
    "title": "Experience",
    "note": "Roles are listed by what the work was, not by who I worked for. Two entries run to the present at once — the independent thread has never stopped, and the consulting role overlaps the engineering one.",
    "rolesLabel": "Roles",
    "now": "now",
    "entries": {
      "consultant": "Translating client requirements into solution proposals, architectures and effort estimates for enterprise engagements. Runs technical discovery and scoping workshops, builds the proof-of-concepts that decide whether a proposal survives, and advises on cloud cost and well-architected trade-offs.",
      "engineer-current": "Full-stack delivery for international clients: enterprise integration against legacy banking infrastructure, a gamified mental-health learning platform, AI-assisted content tooling, and B2B pharmaceutical distribution. Also the primary technical interviewer and mentor for the team.",
      "engineer-ai": "AI-integrated systems for Japanese and EU clients — email processing agents and document extraction — built with Python/FastAPI and Next.js, deployed to Azure with Docker and Kubernetes. Authored the Basic and Detail Design documents those clients required.",
      "engineer-offshore": "Web platforms for Japanese and international clients on teams of fifteen or more: a browser video-calling product, booking systems, and a school management system. Payment gateways, SSO, and the database design underneath them.",
      "engineer-hospitality": "Hotel and hot-spring management systems for the Japanese tourism industry, in a team of four to six. PHP and Python back ends, MySQL schema design, and the maintenance rota that came with running them in production.",
      "freelance": "Direct client work, start to finish: understanding the problem, designing the architecture and schema, provisioning cloud infrastructure, building the thing, deploying it, and supporting it afterwards. The longest-running thread here, and the one that taught me pricing and scope."
    }
  }
```

`messages/vi.json`:

```json
  "experience": {
    "metaTitle": "Kinh nghiệm",
    "metaDescription": "Sáu năm làm kỹ thuật và tư vấn, mô tả theo lĩnh vực, thị trường và quy mô đội.",
    "title": "Kinh nghiệm",
    "note": "Các vai trò được liệt kê theo bản chất công việc, không theo nơi tôi làm. Có hai mục cùng kéo tới hiện tại — mạch làm độc lập chưa bao giờ dừng, và vai trò tư vấn chồng lên vai trò kỹ sư.",
    "rolesLabel": "Vai trò",
    "now": "nay",
    "entries": {
      "consultant": "Chuyển yêu cầu của khách hàng thành đề xuất giải pháp, kiến trúc và ước lượng công sức cho các hợp đồng doanh nghiệp. Chủ trì buổi discovery và workshop xác định phạm vi, dựng proof-of-concept quyết định một đề xuất có sống được hay không, và tư vấn về chi phí cloud cùng các đánh đổi well-architected.",
      "engineer-current": "Làm full-stack cho khách hàng quốc tế: tích hợp hệ thống doanh nghiệp với hạ tầng ngân hàng cũ, nền tảng học về sức khoẻ tinh thần theo hướng gamification, công cụ tạo nội dung có AI hỗ trợ, và giải pháp phân phối dược phẩm B2B. Đồng thời là người phỏng vấn kỹ thuật chính và mentor cho đội.",
      "engineer-ai": "Hệ thống tích hợp AI cho khách Nhật và EU — agent xử lý email và trích xuất tài liệu — dựng bằng Python/FastAPI và Next.js, triển khai lên Azure với Docker và Kubernetes. Viết tài liệu Basic Design và Detail Design theo chuẩn khách hàng yêu cầu.",
      "engineer-offshore": "Nền tảng web cho khách Nhật và quốc tế trong các đội từ mười lăm người trở lên: sản phẩm gọi video trên trình duyệt, hệ thống đặt chỗ, và hệ thống quản lý trường học. Kèm cổng thanh toán, SSO và phần thiết kế cơ sở dữ liệu bên dưới.",
      "engineer-hospitality": "Hệ thống quản lý khách sạn và suối nước nóng cho ngành du lịch Nhật, trong đội bốn tới sáu người. Back end PHP và Python, thiết kế schema MySQL, và cả phần trực vận hành đi kèm khi hệ thống chạy thật.",
      "freelance": "Làm trực tiếp với khách hàng từ đầu tới cuối: hiểu bài toán, thiết kế kiến trúc và schema, dựng hạ tầng cloud, viết sản phẩm, triển khai, rồi hỗ trợ sau đó. Đây là mạch dài nhất, và là nơi tôi học được cách định giá và khoanh phạm vi."
    }
  }
```

- [ ] **Step 6: Chạy test, lint, build**

```bash
pnpm test
pnpm lint
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(experience): add timeline component and experience page"
```

---

## Task 13: Bảng kỹ năng và `/skills`

**Files:**
- Create: `components/skill-table.tsx`, `app/[locale]/(public)/skills/page.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/components/skill-table.test.tsx`

**Interfaces:**
- Consumes: `SKILL_GROUPS`, `type Skill`, `type Proficiency` từ `@/lib/profile`.
- Produces: `<SkillTable skills columns />` với `columns = { name, proficiency, years, lastUsed }` (nhãn cột đã dịch) và `proficiencyLabels: Record<Proficiency, string>`.

- [ ] **Step 1: Viết test**

`tests/components/skill-table.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillTable } from "@/components/skill-table";
import type { Skill } from "@/lib/profile";

const SKILLS: Skill[] = [
  { name: "TypeScript", proficiency: "expert", years: 4, lastUsed: 2026 },
  { name: "Kubernetes", proficiency: "basic", years: 1, lastUsed: 2025 },
];

const COLUMNS = { name: "Skill", proficiency: "Level", years: "Years", lastUsed: "Last used" };
const LABELS = { expert: "Expert", intermediate: "Intermediate", basic: "Basic" };

function renderTable() {
  return render(
    <SkillTable skills={SKILLS} columns={COLUMNS} proficiencyLabels={LABELS} caption="Languages" />,
  );
}

describe("SkillTable", () => {
  it("is a real table with a caption, so it is navigable by screen reader", () => {
    renderTable();
    expect(screen.getByRole("table", { name: "Languages" })).toBeInTheDocument();
  });

  it("heads every column", () => {
    renderTable();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
  });

  /**
   * Mục "basic" phải hiện. Một bảng chỉ toàn "expert" là một bảng không ai tin;
   * giá trị của nó nằm ở chỗ nó dám nói mình yếu ở đâu.
   */
  it("shows low-proficiency rows rather than hiding them", () => {
    renderTable();
    const row = screen.getByRole("row", { name: /Kubernetes/ });
    expect(within(row).getByText("Basic")).toBeInTheDocument();
  });

  it("shows the year a skill was last used", () => {
    renderTable();
    const row = screen.getByRole("row", { name: /Kubernetes/ });
    expect(within(row).getByText("2025")).toBeInTheDocument();
  });

  it("renders one row per skill plus the header row", () => {
    renderTable();
    expect(screen.getAllByRole("row")).toHaveLength(SKILLS.length + 1);
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/components/skill-table.test.tsx
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `components/skill-table.tsx`**

```tsx
import type { Proficiency, Skill } from "@/lib/profile";
import { cn } from "@/lib/utils";

const WEIGHT: Record<Proficiency, string> = {
  expert: "text-foreground",
  intermediate: "text-muted-foreground",
  basic: "text-muted-foreground/70",
};

export function SkillTable({
  skills,
  columns,
  proficiencyLabels,
  caption,
}: {
  skills: readonly Skill[];
  columns: { name: string; proficiency: string; years: string; lastUsed: string };
  proficiencyLabels: Record<Proficiency, string>;
  caption: string;
}) {
  return (
    <table className="w-full border-collapse text-left font-mono text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-rule text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <th scope="col" className="py-2 font-normal">
            {columns.name}
          </th>
          <th scope="col" className="py-2 font-normal">
            {columns.proficiency}
          </th>
          <th scope="col" className="py-2 text-right font-normal">
            {columns.years}
          </th>
          <th scope="col" className="py-2 text-right font-normal">
            {columns.lastUsed}
          </th>
        </tr>
      </thead>
      <tbody>
        {skills.map((skill) => (
          <tr key={skill.name} className="border-b border-rule/50 last:border-0">
            <th scope="row" className="py-2 font-normal text-foreground">
              {skill.name}
            </th>
            <td className={cn("py-2", WEIGHT[skill.proficiency])}>
              {proficiencyLabels[skill.proficiency]}
            </td>
            <td className="py-2 text-right text-muted-foreground tabular-nums">{skill.years}</td>
            <td className="py-2 text-right text-muted-foreground tabular-nums">{skill.lastUsed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Proficiency thể hiện bằng độ đậm của chữ chứ không bằng thanh tiến độ: một thanh 5/5 là con số bịa, còn "expert / 4 năm / 2026" là ba dữ kiện kiểm chứng được.

- [ ] **Step 4: Viết trang `/skills`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { SkillTable } from "@/components/skill-table";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { type Proficiency, SKILL_GROUPS } from "@/lib/profile";

const PATH = "skills";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "skills" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function SkillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "skills" });

  const columns = {
    name: t("columns.name"),
    proficiency: t("columns.proficiency"),
    years: t("columns.years"),
    lastUsed: t("columns.lastUsed"),
  };
  const proficiencyLabels: Record<Proficiency, string> = {
    expert: t("levels.expert"),
    intermediate: t("levels.intermediate"),
    basic: t("levels.basic"),
  };

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
        <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
          {t("note")}
        </p>
      </Section>
      {SKILL_GROUPS.map((group, i) => (
        <Section key={group.id} id={group.id} index={i + 1} label={t(`groups.${group.id}`)}>
          <Reveal>
            <SkillTable
              skills={group.skills}
              columns={columns}
              proficiencyLabels={proficiencyLabels}
              caption={t(`groups.${group.id}`)}
            />
          </Reveal>
        </Section>
      ))}
    </main>
  );
}
```

- [ ] **Step 5: Thêm copy `skills`**

`messages/en.json`:

```json
  "skills": {
    "metaTitle": "Skills",
    "metaDescription": "Languages, frameworks, infrastructure and data tools — with proficiency, years of use, and the year each was last used.",
    "title": "Skills",
    "note": "Every row carries the year I last used the thing. That makes the weak spots visible on purpose: a list where everything is expert and current is a list nobody should believe.",
    "columns": {
      "name": "Skill",
      "proficiency": "Level",
      "years": "Years",
      "lastUsed": "Last used"
    },
    "levels": {
      "expert": "Expert",
      "intermediate": "Intermediate",
      "basic": "Basic"
    },
    "groups": {
      "languages": "Languages",
      "frontend": "Front end",
      "backend": "Back end",
      "devops": "Infrastructure",
      "data": "Data & messaging"
    }
  }
```

`messages/vi.json`:

```json
  "skills": {
    "metaTitle": "Kỹ năng",
    "metaDescription": "Ngôn ngữ, framework, hạ tầng và công cụ dữ liệu — kèm mức thành thạo, số năm và năm dùng gần nhất.",
    "title": "Kỹ năng",
    "note": "Mỗi dòng đều ghi năm tôi dùng thứ đó gần nhất. Điều đó cố ý phơi ra những chỗ yếu: một danh sách mà cái gì cũng expert và cũng mới thì không đáng tin.",
    "columns": {
      "name": "Kỹ năng",
      "proficiency": "Mức",
      "years": "Số năm",
      "lastUsed": "Dùng gần nhất"
    },
    "levels": {
      "expert": "Thành thạo",
      "intermediate": "Khá",
      "basic": "Cơ bản"
    },
    "groups": {
      "languages": "Ngôn ngữ",
      "frontend": "Front end",
      "backend": "Back end",
      "devops": "Hạ tầng",
      "data": "Dữ liệu & messaging"
    }
  }
```

- [ ] **Step 6: Chạy test, lint, build**

```bash
pnpm test
pnpm lint
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(skills): add skill table and skills page"
```

---

## Task 14: Thẻ dự án và `/projects`

Task duy nhất mà ràng buộc ẩn danh chạm vào UI: một nửa số dự án không có tên.

**Files:**
- Create: `components/project-card.tsx`, `app/[locale]/(public)/projects/page.tsx`
- Modify: `messages/en.json`, `messages/vi.json`
- Test: `tests/components/project-card.test.tsx`

**Interfaces:**
- Consumes: `featuredProjects`, `earlierProjects`, `type Project` từ `@/lib/profile`.
- Produces: `<ProjectCard project title description period linkLabel? />` — `title` là tên hiển thị đã giải quyết (tên thật hoặc nhãn "dự án không nêu tên" đã dịch).

- [ ] **Step 1: Viết test**

`tests/components/project-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/lib/profile";

const NAMED: Project = {
  id: "semikong",
  from: "2024-06",
  to: "2024-07",
  name: "SemiKong",
  url: "https://semikong.ai",
  role: "Team Lead",
  teamSize: 4,
  stack: ["Django", "Next.js"],
  featured: true,
};

const UNNAMED: Project = {
  id: "bank-kpi",
  from: "2025-11",
  to: "2026-04",
  name: null,
  url: null,
  role: "Full-stack Engineer",
  teamSize: 4,
  stack: ["Next.js", "AWS"],
  featured: true,
};

describe("ProjectCard", () => {
  it("links a public product to its site", () => {
    render(
      <ProjectCard
        project={NAMED}
        title="SemiKong"
        description="An open-source domain LLM."
        period="06.2024 — 07.2024"
      />,
    );
    expect(screen.getByRole("link", { name: /SemiKong/ })).toHaveAttribute(
      "href",
      "https://semikong.ai",
    );
  });

  /**
   * Nhãn link phải là tên sản phẩm hoặc hostname rút gọn, không bao giờ là
   * đường dẫn đầy đủ — đường dẫn của Orkestrators chứa tên công ty mà trang này
   * không nêu.
   */
  it("never prints the full url as the link text", () => {
    render(
      <ProjectCard
        project={{ ...NAMED, url: "https://www.artinleap.com/products/orkestrators" }}
        title="Orkestrators"
        description="An AI agent platform."
        period="05.2025 — now"
      />,
    );
    expect(screen.queryByText(/products\/orkestrators/)).toBeNull();
  });

  it("renders an unnamed project without a link", () => {
    render(
      <ProjectCard
        project={UNNAMED}
        title="Undisclosed client project"
        description="An enterprise KPI platform."
        period="11.2025 — 04.2026"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Undisclosed client project")).toBeInTheDocument();
  });

  it("lists the stack", () => {
    render(
      <ProjectCard project={UNNAMED} title="x" description="y" period="p" />,
    );
    expect(screen.getByText("AWS")).toBeInTheDocument();
  });

  it("opens external links safely", () => {
    render(<ProjectCard project={NAMED} title="SemiKong" description="d" period="p" />);
    expect(screen.getByRole("link")).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/components/project-card.test.tsx
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `components/project-card.tsx`**

```tsx
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/profile";

/** `www.artinleap.com` → `artinleap.com`. Chỉ dùng khi không có tên sản phẩm. */
function shortHost(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function ProjectCard({
  project,
  title,
  description,
  period,
}: {
  project: Project;
  /** Tên hiển thị đã giải quyết: tên thật, hoặc nhãn ẩn danh đã dịch. */
  title: string;
  description: string;
  period: string;
}) {
  const heading =
    project.url !== null ? (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-lg font-medium hover:text-primary"
      >
        {/* Nhãn là tên sản phẩm, không phải url — xem test. */}
        {title || shortHost(project.url)}
        <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden />
      </a>
    ) : (
      <span className="text-lg font-medium text-muted-foreground">{title}</span>
    );

  return (
    <article className="border-t border-rule py-8">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {period}
      </p>
      <h3 className="mt-2">{heading}</h3>
      <p className="mt-1 font-mono text-xs text-primary">{project.role}</p>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {project.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
    </article>
  );
}
```

- [ ] **Step 4: Viết trang `/projects`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { earlierProjects, featuredProjects, type Project } from "@/lib/profile";

const PATH = "projects";

function formatPeriod(from: string, to: string | null, nowLabel: string): string {
  const fmt = (value: string) => {
    const [year, month] = value.split("-");
    return `${month}.${year}`;
  };
  return `${fmt(from)} — ${to === null ? nowLabel : fmt(to)}`;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "projects" });

  const card = (project: Project) => (
    <ProjectCard
      key={project.id}
      project={project}
      // Dự án chưa public không có tên để hiển thị; nhãn đã dịch thay vào chỗ đó.
      title={project.name ?? t("undisclosed")}
      description={t(`entries.${project.id}`)}
      period={formatPeriod(project.from, project.to, t("now"))}
    />
  );

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
        <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
          {t("note")}
        </p>
      </Section>
      <Section id="selected" index={1} label={t("selectedLabel")}>
        <Reveal>
          <div>{featuredProjects().map(card)}</div>
        </Reveal>
      </Section>
      <Section id="earlier" index={2} label={t("earlierLabel")}>
        <Reveal>
          <div>{earlierProjects().map(card)}</div>
        </Reveal>
      </Section>
    </main>
  );
}
```

- [ ] **Step 5: Thêm copy `projects`**

`messages/en.json`:

```json
  "projects": {
    "metaTitle": "Projects",
    "metaDescription": "Selected engineering and architecture work, with links where the product is public.",
    "title": "Projects",
    "note": "Products with a public site are named. Client work is not — the problem is described instead, which is the part that carries the information anyway.",
    "selectedLabel": "Selected",
    "earlierLabel": "Earlier",
    "now": "now",
    "undisclosed": "Undisclosed client project",
    "entries": {
      "intentsite": "An AI-native layer over a company's web presence, built so AI agents can read, trust and act on what a business publishes rather than scraping a page. I own the architecture and lead development: intent-based knowledge management over both authored and inferred answers, multi-channel delivery including WhatsApp, and the integrations that let an agent complete a real action on the business's behalf. The hard requirement is not speed but refusal — a system that answers wrongly on a company's behalf destroys the only thing it sells.",
      "bank-kpi": "An enterprise KPI and performance management platform for one of Vietnam's large commercial banks, integrated with legacy core systems. Built the back end and front end on Next.js, with unit, integration and end-to-end coverage, on AWS infrastructure sized for concurrent load across the organisation.",
      "mental-health-elearning": "A Duolingo-style learning platform for mental health education in the Australian market — short lessons, gamification, habit loops. I designed the backend architecture and schema and built the services on NestJS, plus mentoring on the team.",
      "orkestrators": "A platform for building personal AI agents that actually do things: Gmail, Google Calendar, Outlook, Notion and Atlassian integrations via LangChain and MCP, on a multi-tenant architecture with a marketplace for sharing and monetising agents. I led the technical decisions alongside the founder, from feasibility assessment through to the running system.",
      "semikong": "The first open-source large language model built specifically for the semiconductor industry, trained on a domain corpus and benchmarked against general-purpose models. I led the team and the platform architecture — Django back end, Next.js front end, real-time evaluation — and delivered it inside a two-month window.",
      "email-agent": "An intelligent email processing system that extracts and categorises structured data from high-volume inbound mail and attachments. Microservices on FastAPI with a Next.js dashboard, Azure OpenAI and Document Intelligence for extraction, Kubernetes for scale. I led the team and wrote the design documentation the client's process required.",
      "livecall": "A browser-based enterprise video calling platform: calling, screen sharing, recording and multi-party conferencing on Twilio, with co-browsing, Stripe subscriptions and WebSocket presence. Vue 3 and TypeScript on the front end, Django behind it, on a team of fifteen or more.",
      "restaurant-marketplace": "A restaurant marketplace for the Japanese food service industry connecting venues with diners — multi-tenant vendor management, menus and availability, reservations and ordering, social SSO, and payment processing. Laravel back end, Nuxt front end, plus an automated crawler for market data.",
      "school-management": "A school management system for Japanese educational institutions covering enrolment, scheduling, grade tracking and parent communication, with role-based access for students, teachers, administrators and guardians. Laravel and Vue, with Redis caching to survive the registration-period peaks."
    }
  }
```

`messages/vi.json`:

```json
  "projects": {
    "metaTitle": "Dự án",
    "metaDescription": "Các dự án kỹ thuật và kiến trúc chọn lọc, có link ở những sản phẩm đã public.",
    "title": "Dự án",
    "note": "Sản phẩm đã có trang công khai thì được nêu tên. Dự án của khách hàng thì không — thay vào đó là mô tả bài toán, vốn cũng là phần mang thông tin thật.",
    "selectedLabel": "Chọn lọc",
    "earlierLabel": "Trước đó",
    "now": "nay",
    "undisclosed": "Dự án khách hàng không nêu tên",
    "entries": {
      "intentsite": "Một lớp AI-native phủ lên sự hiện diện web của doanh nghiệp, dựng để các AI agent có thể đọc, tin và hành động trên thứ doanh nghiệp công bố thay vì đi cào một trang HTML. Tôi sở hữu phần kiến trúc và dẫn phát triển: quản lý tri thức theo intent cho cả câu trả lời được soạn lẫn được suy ra, phân phối đa kênh gồm WhatsApp, và các tích hợp cho phép agent hoàn tất một hành động thật thay mặt doanh nghiệp. Yêu cầu khó nhất không phải tốc độ mà là biết từ chối — một hệ thống trả lời sai thay mặt doanh nghiệp sẽ phá đúng thứ duy nhất nó bán.",
      "bank-kpi": "Nền tảng quản lý KPI và hiệu suất cho một ngân hàng thương mại lớn tại Việt Nam, tích hợp với hệ thống lõi cũ. Tôi làm cả back end lẫn front end trên Next.js, kèm unit test, integration test và end-to-end, trên hạ tầng AWS tính toán theo tải đồng thời của toàn tổ chức.",
      "mental-health-elearning": "Nền tảng học kiểu Duolingo về sức khoẻ tinh thần cho thị trường Úc — bài học ngắn, gamification, vòng lặp tạo thói quen. Tôi thiết kế kiến trúc backend và schema, dựng service trên NestJS, đồng thời mentor cho các thành viên trong đội.",
      "orkestrators": "Nền tảng tạo AI agent cá nhân biết làm việc thật: tích hợp Gmail, Google Calendar, Outlook, Notion và Atlassian qua LangChain và MCP, trên kiến trúc multi-tenant kèm marketplace để chia sẻ và kiếm tiền từ agent. Tôi dẫn các quyết định kỹ thuật cùng nhà sáng lập, từ đánh giá khả thi tới hệ thống chạy thật.",
      "semikong": "Mô hình ngôn ngữ lớn mã nguồn mở đầu tiên dựng riêng cho ngành bán dẫn, huấn luyện trên kho ngữ liệu chuyên ngành và đo trên các benchmark của ngành. Tôi dẫn đội và phần kiến trúc nền tảng — back end Django, front end Next.js, đánh giá thời gian thực — và hoàn thành trong cửa sổ hai tháng.",
      "email-agent": "Hệ thống xử lý email thông minh, trích xuất và phân loại dữ liệu có cấu trúc từ luồng thư và tệp đính kèm khối lượng lớn. Microservices trên FastAPI với dashboard Next.js, dùng Azure OpenAI và Document Intelligence để trích xuất, Kubernetes để mở rộng. Tôi dẫn đội và viết bộ tài liệu thiết kế theo quy trình khách hàng yêu cầu.",
      "livecall": "Nền tảng gọi video doanh nghiệp chạy trên trình duyệt: gọi, chia sẻ màn hình, ghi hình và hội thoại nhiều bên trên Twilio, kèm co-browsing, gói thuê bao Stripe và trạng thái thời gian thực qua WebSocket. Front end Vue 3 với TypeScript, phía sau là Django, trong đội từ mười lăm người trở lên.",
      "restaurant-marketplace": "Sàn kết nối nhà hàng với thực khách cho ngành ẩm thực Nhật — quản lý nhiều nhà cung cấp, thực đơn và lịch trống, đặt bàn và đặt món, SSO qua mạng xã hội, và xử lý thanh toán. Back end Laravel, front end Nuxt, kèm một crawler tự động thu thập dữ liệu thị trường.",
      "school-management": "Hệ thống quản lý trường học cho các cơ sở giáo dục Nhật, bao gồm tuyển sinh, xếp lịch, theo dõi điểm và liên lạc với phụ huynh, phân quyền cho học sinh, giáo viên, quản trị viên và người giám hộ. Laravel và Vue, dùng Redis cache để trụ qua các đợt cao điểm đăng ký."
    }
  }
```

- [ ] **Step 6: Chạy test, lint, build**

```bash
pnpm test
pnpm lint
pnpm build
```

`anonymity` là test cần soi kỹ nhất ở bước này — task này thêm nhiều chữ nhất, và mô tả dự án là chỗ tên khách hàng dễ lọt ra nhất.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(projects): add project card and projects page"
```

---

## Task 15: Ảnh Open Graph và icon

**Files:**
- Create: `app/[locale]/opengraph-image.tsx`, `app/icon.png`, `app/apple-icon.png`
- Test: `tests/seo/og.test.ts`

**Interfaces:**
- Consumes: `IDENTITY` từ `@/lib/profile`; `SITE_URL` từ `@/lib/site`.
- Produces: route ảnh OG 1200×630 tại `/{locale}/opengraph-image` — đúng URL mà `lib/metadata.ts` đã tham chiếu tường minh.

- [ ] **Step 1: Sinh icon từ ảnh chân dung**

```bash
sips -s format png -z 512 512 assets/portrait.png --out app/apple-icon.png
sips -s format png -z 96 96 assets/portrait.png --out app/icon.png
```

`sips -z` crop theo tỉ lệ khung, nên ảnh dọc 864×1184 sẽ bị bóp. Kiểm bằng mắt sau khi chạy; nếu khuôn mặt bị méo thì crop vuông trước:

```bash
sips -c 864 864 assets/portrait.png --out /tmp/square.png
sips -s format png -z 512 512 /tmp/square.png --out app/apple-icon.png
sips -s format png -z 96 96 /tmp/square.png --out app/icon.png
```

`sips -c` cắt từ tâm, giữ đúng phần khuôn mặt trong ảnh này.

- [ ] **Step 2: Viết test**

`tests/seo/og.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { alt, contentType, size } from "@/app/[locale]/opengraph-image";
import { IDENTITY } from "@/lib/profile";

describe("opengraph image", () => {
  it("uses the 1200x630 card format every platform crops from", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("declares png", () => {
    expect(contentType).toBe("image/png");
  });

  it("names the person in the alt text", () => {
    expect(alt).toContain(IDENTITY.fullName);
  });
});
```

- [ ] **Step 3: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/seo/og.test.ts
```

Kỳ vọng: FAIL.

- [ ] **Step 4: Viết `app/[locale]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { IDENTITY } from "@/lib/profile";
import { SITE_URL } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${IDENTITY.fullName} — ${IDENTITY.jobTitle}`;

/**
 * Ảnh chân dung được nạp qua URL công khai của chính site chứ không đọc từ đĩa:
 * đọc file bằng `fs` trong route này phụ thuộc vào việc bundler có trace được
 * đường dẫn hay không, và nó im lặng hỏng trên Vercel trong khi build cục bộ
 * vẫn xanh. Nếu fetch hỏng, card vẫn ra — chỉ là bản thuần chữ.
 */
async function portraitDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(`${SITE_URL}/images/portrait.jpg`);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const portrait = await portraitDataUrl();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 64,
        padding: 80,
        background: "#0d0b09",
        color: "#f2efe9",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: "#8a8073" }}>
          {IDENTITY.englishName.toUpperCase()} · {IDENTITY.nickname.toUpperCase()}
        </div>
        <div style={{ fontSize: 76, marginTop: 24, lineHeight: 1.1 }}>{IDENTITY.fullName}</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#e0a24a" }}>{IDENTITY.jobTitle}</div>
        <div style={{ height: 2, width: 160, marginTop: 40, background: "#e0a24a" }} />
        <div style={{ fontSize: 24, marginTop: 40, color: "#8a8073" }}>kingnnt.org</div>
      </div>
      {portrait ? (
        // biome-ignore lint: ImageResponse renders to a static png, not to the DOM
        <img
          src={portrait}
          width={330}
          height={452}
          style={{ objectFit: "cover", borderRadius: 4 }}
          alt=""
        />
      ) : null}
    </div>,
    size,
  );
}
```

Màu trong file này viết thẳng dạng hex chứ không đọc từ token: `ImageResponse` render bằng Satori, thứ không hiểu biến CSS. Đó là bản sao thủ công có chủ đích của accent — nếu đổi accent trong `globals.css` thì phải đổi ở đây.

- [ ] **Step 5: Chạy test và build, rồi kiểm ảnh thật**

```bash
pnpm test
pnpm build
pnpm start &
sleep 5
curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" localhost:3000/en/opengraph-image
sips -g pixelWidth -g pixelHeight /tmp/og.png
kill %1
```

Kỳ vọng: `200 image/png`, kích thước 1200×630. Mở `/tmp/og.png` xem bằng mắt — nếu ảnh chân dung không có thì `SITE_URL` lúc build đang trỏ ra ngoài; đặt `NEXT_PUBLIC_SITE_URL=http://localhost:3000` khi kiểm cục bộ.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(seo): add opengraph image and site icons"
```

---

## Task 16: CLAUDE.md, kiểm tra toàn diện và mở PR

**Files:**
- Create: `CLAUDE.md`, `.env.example`
- Test: chạy toàn bộ bộ test

**Interfaces:**
- Consumes: mọi thứ đã dựng.
- Produces: repo sẵn sàng deploy.

- [ ] **Step 1: Viết `.env.example`**

```
# Đặt trong môi trường preview của Vercel để canonical của bản preview không
# trỏ về production. Bỏ trống ở production — mặc định đã là https://kingnnt.org.
NEXT_PUBLIC_SITE_URL=
```

- [ ] **Step 2: Viết `CLAUDE.md`**

```markdown
# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Overview

Trang cá nhân song ngữ EN/VI của Ninh Ngọc Tuấn (Jesse / KingNNT) tại
`kingnnt.org`. Next.js 16 App Router + React 19 + TypeScript strict, Tailwind v4,
shadcn/ui. Năm route tĩnh: `/`, `/about`, `/experience`, `/skills`, `/projects`.

Spec: `docs/superpowers/specs/2026-08-16-kingnnt-profile-page-design.md`

## Ràng buộc ẩn danh

**Trang này không nêu tên bất kỳ nơi làm việc, công ty đứng sau sản phẩm, khách
hàng cuối hay codename dự án nội bộ nào.** Chỉ sản phẩm public có website được
nêu tên: IntentSite, Orkestrators, SemiKong, Live Call.

`tests/lib/anonymity.test.ts` giữ denylist và quét `lib/profile/**` cùng
`messages/**`. Trường `url` được miễn trừ vì trang sản phẩm Orkestrators nằm dưới
tên công ty bị cấm — bù lại nhãn link hiển thị chỉ được là tên sản phẩm hoặc
hostname rút gọn.

Trong JSON-LD: **không** `worksFor`, `affiliation`, hay node `Organization`.

## Commands

Package manager là **pnpm**. `pnpm-lock.yaml` là lockfile duy nhất — thêm
`yarn.lock` sẽ khiến Vercel âm thầm đổi package manager lúc deploy.

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
**ESLint** chỉ lint qua `eslint-config-next`.

## Git

Nhánh tích hợp là **`develop`**, không commit thẳng vào. Nhánh feature đặt tên
`feature/<kebab>`. Conventional Commits, commitlint bắt buộc. Không thêm dòng
`Co-Authored-By` hay attribution vào commit message.

## Kiến trúc

### Tách dữ liệu khỏi văn xuôi

`lib/profile/*.ts` giữ dữ liệu có cấu trúc (typed, một nguồn sự thật):
identity, experience, skills, projects, trading. `messages/{en,vi}.json` chỉ
giữ văn xuôi, khoá theo `id` trong `lib/profile`. Component join hai nguồn.

Sửa email, link, số năm → sửa `lib/profile`. Sửa câu chữ → sửa cả hai catalog.
`tests/messages/parity.test.ts` bắt lỗi khi hai catalog lệch key.

**Cập nhật CV thì cập nhật luôn `lib/profile/skills.ts`.** Trường `lastUsed`
là trường tự tố cáo: để nguyên vài năm là nó thành sai sự thật.

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

### Nội dung phải server-render

Crawler của các answer engine không chạy JavaScript. `components/reveal.tsx`
chỉ đổi opacity/transform của nội dung đã render — không bao giờ quyết định có
render hay không.

### Theme

Dark-first (`defaultTheme="dark"`). Accent lấy từ viền sáng trong ảnh chân dung
và ánh xạ vào token `--primary` (**không** phải `--accent`, thứ shadcn dùng cho
nền hover). Bản light dùng accent tối hơn để giữ tương phản — có test cho việc
đó trong `tests/components/theme-tokens.test.ts`.

### Ảnh

`assets/portrait.png` là ảnh gốc, cố ý nằm ngoài `public/`. Bản deploy là
`public/images/portrait.jpg`. Icon trong `app/` sinh từ ảnh gốc bằng `sips`.

## Testing

Vitest + jsdom + Testing Library. Test ở `tests/**`, gương cấu trúc source.
Thêm section hay message key thì thêm/mở rộng test tương ứng.
```

- [ ] **Step 3: Chạy toàn bộ kiểm tra**

```bash
pnpm format:check
pnpm lint
pnpm test
pnpm build
```

Cả bốn phải xanh. Đây chính xác là những gì CI chạy — nếu có cái nào đỏ, sửa trước khi mở PR.

- [ ] **Step 4: Kiểm bằng mắt trên bản production build**

```bash
pnpm build && pnpm start
```

Đi hết danh sách này ở cả `/en` và `/vi`:

- Cả 5 route render, không có chuỗi key lọt ra (dấu hiệu thiếu bản dịch)
- Đổi ngôn ngữ giữ nguyên trang đang đọc
- Đổi theme sang light: chữ accent vẫn đọc được, không có chỗ nào chữ trắng trên nền trắng
- Thu nhỏ cửa sổ xuống 375 px: bảng skills cuộn ngang được, không có gì tràn
- Dùng bàn phím Tab qua header: mọi link có focus ring nhìn thấy
- Xem source của `/en/projects`: mô tả dự án nằm trong HTML, không phải chỉ xuất hiện sau hydration

- [ ] **Step 5: Kiểm chứng lại ràng buộc ẩn danh trên HTML đã build**

Test quét file nguồn; bước này quét thứ thật sự được phục vụ.

```bash
pnpm build && pnpm start &
sleep 5
for path in /en /en/about /en/experience /en/skills /en/projects /vi /vi/about /vi/experience /vi/skills /vi/projects /llms.txt; do
  for name in SyncSoft FPT Kaopiz SmartGoldFish ArtinLeap SHB KPIRB GICRM RENEW02 Zyrahh; do
    if curl -s "localhost:3000$path" | grep -qi "$name"; then
      echo "LEAK: $name in $path"
    fi
  done
done
kill %1
```

Kỳ vọng: không in ra dòng `LEAK` nào. Lưu ý `artinleap.com` **sẽ** xuất hiện trong thuộc tính `href` của thẻ link Orkestrators — đó là hành vi đúng và đã được miễn trừ; script trên tìm `ArtinLeap` viết hoa kiểu tên công ty nên không bắt vào hostname viết thường.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: add CLAUDE.md and environment example"
```

- [ ] **Step 7: Làm Task 17 trước khi mở PR**

Task 17 sinh ra từ self-review của chính plan này, nên nó nằm sau Task 16 trong tài liệu nhưng phải xong **trước** khi mở PR. Làm Task 17, rồi quay lại chạy lại Step 3 tới Step 5 của task này.

- [ ] **Step 8: Mở PR**

```bash
git push -u origin feature/scaffold-toolchain
```

Trước khi push, hỏi chủ repo — repo này chưa có remote. Nếu chưa có repo trên GitHub thì tạo trước, rồi mở PR nhắm vào `develop` với test plan là chính danh sách ở Step 3 và Step 4.

---

## Self-Review

**Spec coverage.** Đối chiếu từng mục của spec với task:

| Spec | Task |
| --- | --- |
| §2.1 ẩn danh | Task 4 (test denylist), 14 (UI cho dự án không tên), 16 (kiểm HTML đã build) |
| §3 stack | Task 1 |
| §4.1 tách dữ liệu / văn xuôi | Task 4 |
| §4.2 kiểu dữ liệu | Task 4 |
| §4.3 routing | Task 2, 5 |
| §5.1 định danh | Task 4 |
| §5.2 experience | Task 4, 12 |
| §5.3 skills | Task 4, 13 |
| §5.4 projects | Task 4, 14 |
| §5.5 trading | Task 4 (mốc), 11 (văn xuôi) |
| §5.6 học vấn / chứng chỉ / giải thưởng | **Chưa có task** — xem bên dưới |
| §6.1–6.2 token, chữ | Task 3 |
| §6.3 component | Task 8, 9, 10, 12, 13, 14 |
| §6.4 chuyển động, tiếp cận | Task 8 (test Reveal), 16 (kiểm bàn phím) |
| §6.5 ảnh, OG | Task 10, 15 |
| §7 SEO, JSON-LD | Task 5, 6, 7 |
| §8 kiểm thử | rải khắp; test viết trước code ở mọi task |
| §9 git, vận hành | Task 1, 16 |

**Lỗ hổng đã phát hiện và cách xử lý.** §5.6 của spec liệt kê học vấn, chứng chỉ, giải thưởng và ngôn ngữ, nhưng không task nào hiển thị chúng. Học vấn đã vào JSON-LD (`alumniOf`, Task 6) và ngôn ngữ vào `knowsLanguage`, nhưng chứng chỉ và giải thưởng thì chưa xuất hiện ở đâu cả. Xem Task 17 bổ sung ngay dưới.

**Placeholder scan.** Không có "TBD", "TODO", hay "tương tự Task N". Mọi bước code đều có khối code thật; mọi bước copy đều có bản dịch thật cho cả hai locale.

**Type consistency.** `TimelineItem` (Task 12) và `Project` (Task 4) được dùng đúng tên ở mọi nơi. `Proficiency` khai ở Task 4, dùng ở Task 13. `pageMetadata` khai ở Task 5, gọi ở Task 10–14 với đúng bốn tham số. `PageStructuredData` khai ở Task 6 với `{ locale, path, title, description }` và được gọi đúng chữ ký đó ở năm trang. `HOME_PATH = ""` nhất quán giữa `lib/routes.ts`, `pageUrl` và trang chủ.

---

## Task 17: Học vấn, chứng chỉ và giải thưởng

Bổ sung sau self-review: §5.6 của spec có dữ liệu này nhưng không trang nào hiển thị nó.

**Files:**
- Create: `lib/profile/credentials.ts`
- Modify: `lib/profile/index.ts`, `app/[locale]/(public)/about/page.tsx`, `messages/en.json`, `messages/vi.json`
- Test: `tests/lib/credentials.test.ts`

Chạy task này **trước** khi mở PR ở Task 16 Step 8.

**Interfaces:**
- Consumes: không có gì mới.
- Produces: `EDUCATION: Education`, `CERTIFICATIONS: readonly Certification[]`, `AWARDS: readonly Award[]` từ `@/lib/profile`.

- [ ] **Step 1: Viết test**

`tests/lib/credentials.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AWARDS, CERTIFICATIONS, EDUCATION } from "@/lib/profile";

describe("credentials", () => {
  it("records the degree with its field and years", () => {
    expect(EDUCATION.institution).toBe("Electric Power University");
    expect(EDUCATION.from).toBe(2018);
    expect(EDUCATION.to).toBe(2023);
  });

  it("lists every certification with an issuer", () => {
    expect(CERTIFICATIONS.length).toBeGreaterThanOrEqual(4);
    for (const cert of CERTIFICATIONS) {
      expect(cert.issuer.length, cert.name).toBeGreaterThan(0);
    }
  });

  it("dates every award", () => {
    for (const award of AWARDS) {
      expect(award.year, award.id).toBeGreaterThan(2000);
    }
  });

  it("keeps credential ids unique", () => {
    const ids = [...CERTIFICATIONS, ...AWARDS].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Chạy để xác nhận đỏ**

```bash
pnpm exec vitest run tests/lib/credentials.test.ts
```

Kỳ vọng: FAIL.

- [ ] **Step 3: Viết `lib/profile/credentials.ts`**

```ts
export interface Education {
  institution: string;
  degree: string;
  field: string;
  from: number;
  to: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
}

export interface Award {
  id: string;
  year: number;
}

export const EDUCATION: Education = {
  institution: "Electric Power University",
  degree: "Bachelor of Engineering",
  field: "Software Engineering",
  from: 2018,
  to: 2023,
};

export const CERTIFICATIONS: readonly Certification[] = [
  { id: "claude-api", name: "Building with the Claude API", issuer: "Anthropic" },
  { id: "ai-fluency", name: "AI Fluency for Small Businesses", issuer: "Anthropic" },
  {
    id: "genai-thought-partner",
    name: "Use Generative AI as Your Thought Partner",
    issuer: "Coursera",
  },
  {
    id: "landinglens-cv",
    name: "LandingLens Computer Vision Fundamentals",
    issuer: "LandingAI",
  },
];

/** Chỉ năm và id — tên giải nằm trong catalog vì nó cần dịch. */
export const AWARDS: readonly Award[] = [
  { id: "icpc", year: 2021 },
  { id: "informatics-olympiad", year: 2016 },
];
```

- [ ] **Step 4: Export từ index**

Thêm vào `lib/profile/index.ts`:

```ts
export * from "./credentials";
```

- [ ] **Step 5: Thêm section vào `/about`**

Trong `app/[locale]/(public)/about/page.tsx`, thêm import:

```tsx
import { AWARDS, CERTIFICATIONS, EDUCATION } from "@/lib/profile";
```

và chèn một Section trước section `contact`, đồng thời đổi index của `contact` từ 4 thành 5:

```tsx
      <Section id="credentials" index={4} label={t("credentialsLabel")}>
        <Reveal>
          <dl className="space-y-8 font-mono text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("educationLabel")}
              </dt>
              <dd className="mt-2">
                {EDUCATION.degree}, {EDUCATION.field} · {EDUCATION.institution} ·{" "}
                {EDUCATION.from}–{EDUCATION.to}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("certificationsLabel")}
              </dt>
              <dd className="mt-2">
                <ul className="space-y-1">
                  {CERTIFICATIONS.map((cert) => (
                    <li key={cert.id}>
                      {cert.name} <span className="text-muted-foreground">· {cert.issuer}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("awardsLabel")}
              </dt>
              <dd className="mt-2">
                <ul className="space-y-1">
                  {AWARDS.map((award) => (
                    <li key={award.id}>
                      {t(`awards.${award.id}`)}{" "}
                      <span className="text-muted-foreground">· {award.year}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </Reveal>
      </Section>
```

Dùng `dl`/`dt`/`dd` chứ không phải `div`: đây là dữ liệu cặp nhãn–giá trị, và crawler cùng screen reader đọc được cấu trúc đó mà không cần đoán.

- [ ] **Step 6: Thêm copy vào cả hai catalog**

Thêm vào `about` trong `messages/en.json`:

```json
    "credentialsLabel": "Education & credentials",
    "educationLabel": "Education",
    "certificationsLabel": "Certifications",
    "awardsLabel": "Awards",
    "awards": {
      "icpc": "ACM/ICPC Northern Vietnam regional, competitor 2018–2021",
      "informatics-olympiad": "Second prize, provincial informatics olympiad"
    }
```

Thêm vào `about` trong `messages/vi.json`:

```json
    "credentialsLabel": "Học vấn & chứng chỉ",
    "educationLabel": "Học vấn",
    "certificationsLabel": "Chứng chỉ",
    "awardsLabel": "Giải thưởng",
    "awards": {
      "icpc": "ACM/ICPC khu vực miền Bắc, thí sinh 2018–2021",
      "informatics-olympiad": "Giải Nhì Olympic Tin học cấp tỉnh"
    }
```

- [ ] **Step 7: Chạy toàn bộ và commit**

```bash
pnpm test
pnpm lint
pnpm build
git add -A
git commit -m "feat(about): add education, certifications and awards"
```
