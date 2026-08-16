import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { formatPeriod } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { earlierProjects, featuredProjects, type Project } from "@/lib/profile";
import { dynamicMessageKey } from "@/lib/utils";

const PATH = "projects";

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
      description={t(dynamicMessageKey(`entries.${project.id}`))}
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
