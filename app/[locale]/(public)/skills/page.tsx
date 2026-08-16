import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { SkillTable } from "@/components/skill-table";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { PRACTICE_AREAS, type Proficiency, SKILL_GROUPS } from "@/lib/profile";
import { dynamicMessageKey } from "@/lib/utils";

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
        <Section
          key={group.id}
          id={group.id}
          index={i + 1}
          label={t(dynamicMessageKey(`groups.${group.id}`))}
        >
          <Reveal>
            <SkillTable
              skills={group.skills}
              columns={columns}
              proficiencyLabels={proficiencyLabels}
              caption={t(dynamicMessageKey(`groups.${group.id}`))}
            />
          </Reveal>
        </Section>
      ))}
      <Section id="practice" index={6} label={t("practiceLabel")}>
        <Reveal>
          <p className="mb-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
            {t("practiceNote")}
          </p>
          <dl className="space-y-8">
            {PRACTICE_AREAS.map((area) => (
              <div key={area.id}>
                <dt className="font-mono text-sm font-medium text-foreground">
                  {t(dynamicMessageKey(`practice.${area.id}.term`))}
                </dt>
                <dd className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                  {t(dynamicMessageKey(`practice.${area.id}.detail`))}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Section>
    </main>
  );
}
