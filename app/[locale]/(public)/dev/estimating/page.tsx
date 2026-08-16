import { getTranslations, setRequestLocale } from "next-intl/server";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/metadata";

const PATH = "dev/estimating";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devEstimating" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

/**
 * The one page here that argues rather than lists.
 *
 * The section order is the point and should survive edits: the claim lands
 * first, under a heading that is the question someone would actually type, and
 * the provenance comes second. An answer engine quoting this needs the claim
 * inside the first screen — put the story first and the quotable part sinks
 * below three paragraphs of setup, where extraction stops looking.
 */
export default async function EstimatingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "devEstimating" });

  return (
    <main>
      <PageStructuredData
        locale={locale}
        path={PATH}
        title={t("metaTitle")}
        description={t("metaDescription")}
      />
      <Section className="pt-14 pb-0">
        <h1 className="max-w-[20ch] text-4xl font-medium tracking-tight text-balance sm:text-5xl">
          {t("title")}
        </h1>
      </Section>
      <Section id="answer" index={1} label={t("answerLabel")}>
        <Reveal>
          <Prose>
            <p>{t("answer1")}</p>
            <p>{t("answer2")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="origin" index={2} label={t("originLabel")}>
        <Reveal>
          <Prose>
            <p>{t("origin1")}</p>
          </Prose>
          <Link
            className="mt-6 inline-block font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            href="/trading"
          >
            {t("originLink")}
          </Link>
        </Reveal>
      </Section>
      <Section id="practice" index={3} label={t("practiceLabel")}>
        <Reveal>
          <Prose>
            <p>{t("practice1")}</p>
            <p>{t("practice2")}</p>
            <p>{t("practice3")}</p>
          </Prose>
        </Reveal>
      </Section>
      <Section id="limits" index={4} label={t("limitsLabel")}>
        <Reveal>
          <Prose>
            <p>{t("limits1")}</p>
            <p>{t("limits2")}</p>
          </Prose>
        </Reveal>
      </Section>
    </main>
  );
}
