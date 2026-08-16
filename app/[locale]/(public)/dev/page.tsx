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
