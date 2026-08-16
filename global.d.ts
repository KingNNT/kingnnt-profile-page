import type messages from "./messages/en.json";

/**
 * next-intl type augmentation: makes `Messages` equal the shape of
 * `messages/en.json`, so every literal `t("some.key")` call site is checked
 * against the actual catalog at compile time. Roughly 30 keys are built from
 * runtime template literals (`t(\`entries.${id}\`)`) and stay covered by
 * `tests/messages/id-coverage.test.ts` instead — TypeScript can't check a
 * template literal against a JSON shape. The other ~60 keys are plain string
 * literals (`t("lead1")`, `t("metaTitle")`), and this is what turns a
 * renamed or mistyped one into a `tsc` error instead of a raw `about.lead1`
 * string rendered into crawler-visible HTML.
 *
 * This file must have a top-level `import`/`export` (it does, above) to be
 * treated as a module by TypeScript — otherwise `declare module "next-intl"`
 * below stops being an augmentation of the real module and instead replaces
 * it outright, silently deleting every other export (`hasLocale`,
 * `useTranslations`, `NextIntlClientProvider`, ...).
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
