import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactBlock } from "@/components/contact-block";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";
import { Section } from "@/components/section";
import { PageStructuredData } from "@/components/structured-data";
import { FACETS } from "@/enums";
import { pageMetadata } from "@/lib/metadata";
import { FACET_CONTACT_IDS, GENERAL_CONTACT_IDS } from "@/lib/profile";
import { dynamicMessageKey } from "@/lib/utils";

const PATH = "contact";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return pageMetadata({
    locale,
    path: PATH,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  const tGroups = await getTranslations({ locale, namespace: "contact.groups" });

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
      <Section id="general" index={1} label={tGroups("general")}>
        <Reveal>
          <Prose>
            <p>{t("lead")}</p>
          </Prose>
          <ContactBlock ids={GENERAL_CONTACT_IDS} className="mt-6" />
        </Reveal>
      </Section>
      {FACETS.map((facet, i) => (
        <Section key={facet} id={facet} index={i + 2} label={tGroups(dynamicMessageKey(facet))}>
          <Reveal>
            <ContactBlock ids={FACET_CONTACT_IDS[facet]} />
          </Reveal>
        </Section>
      ))}
    </main>
  );
}
