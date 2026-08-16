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
