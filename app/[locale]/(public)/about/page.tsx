import { getTranslations, setRequestLocale } from "next-intl/server";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { pageMetadata } from "@/lib/metadata";
import { AWARDS, CERTIFICATIONS, EDUCATION, SPOKEN_LANGUAGES } from "@/lib/profile";
import { dynamicMessageKey } from "@/lib/utils";

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
      <Section id="credentials" index={3} label={t("credentialsLabel")}>
        <Reveal>
          <dl className="space-y-8 font-mono text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("educationLabel")}
              </dt>
              <dd className="mt-2">
                {EDUCATION.degree}, {EDUCATION.field} · {EDUCATION.institution} · {EDUCATION.from}–
                {EDUCATION.to}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("certificationsLabel")}
              </dt>
              <dd className="mt-2">
                <ul className="space-y-1">
                  {CERTIFICATIONS.map((cert) => (
                    <li key={cert.id}>
                      {cert.name} <span className="text-muted-foreground">· {cert.issuer}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("awardsLabel")}
              </dt>
              <dd className="mt-2">
                <ul className="space-y-1">
                  {AWARDS.map((award) => (
                    <li key={award.id}>
                      {t(dynamicMessageKey(`awards.${award.id}`))}{" "}
                      <span className="text-muted-foreground">· {award.year}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {t("languagesLabel")}
              </dt>
              <dd className="mt-2">
                <ul className="space-y-1">
                  {SPOKEN_LANGUAGES.map((language) => (
                    <li key={language.id}>
                      {t(dynamicMessageKey(`languages.${language.id}.term`))}{" "}
                      <span className="text-muted-foreground">
                        · {t(dynamicMessageKey(`languages.${language.id}.detail`))}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </Reveal>
      </Section>
    </main>
  );
}
