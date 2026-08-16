import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/app/[locale]/(public)/_components/hero";
import { NavIndex } from "@/app/[locale]/(public)/_components/nav-index";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { HOME_PATH } from "@/lib/routes";

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
