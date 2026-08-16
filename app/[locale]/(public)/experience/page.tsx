import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { Timeline, type TimelineItem } from "@/components/timeline";
import { formatPeriod } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { EXPERIENCE } from "@/lib/profile";
import { dynamicMessageKey } from "@/lib/utils";

const PATH = "experience";

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
    summary: t(dynamicMessageKey(`entries.${entry.id}`)),
    meta: [
      ...entry.domains,
      ...entry.markets,
      ...(entry.teamSize ? [`team ${entry.teamSize}+`] : []),
    ],
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
