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
