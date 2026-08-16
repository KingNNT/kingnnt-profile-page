import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Prose } from "@/components/prose";
import { Section } from "@/components/section";
import { HOME_PATH } from "@/lib/routes";

/**
 * Site-wide 404. Next ships a bare default (white background, system font,
 * English only, no header, no footer, no link home) that never renders
 * inside `[locale]/layout.tsx`'s chrome. This one does, because it lives at
 * the same segment level and next-intl's request config resolves the locale
 * from the incoming URL rather than from a `params` prop this file never
 * receives.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main>
      <Section className="pt-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t("label")}</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">{t("title")}</h1>
        <Prose className="mt-6">
          <p>{t("description")}</p>
        </Prose>
        <Link
          href={`/${HOME_PATH}`}
          className="mt-6 inline-block border-b border-primary pb-0.5 font-mono text-sm text-primary"
        >
          {t("homeLink")}
        </Link>
      </Section>
    </main>
  );
}
