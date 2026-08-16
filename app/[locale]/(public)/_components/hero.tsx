import { getTranslations } from "next-intl/server";
import { ContactBlock } from "@/components/contact-block";
import { Portrait } from "@/components/portrait";
import { IDENTITY } from "@/lib/profile";
import { GENERAL_CONTACT_IDS } from "@/lib/profile/contact";

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_18rem] md:items-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {IDENTITY.englishName} · {IDENTITY.nickname}
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          {IDENTITY.fullName}
        </h1>
        <p className="mt-2 font-mono text-sm text-primary">{IDENTITY.jobTitle}</p>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          {t("tagline")}
        </p>
        <ContactBlock ids={GENERAL_CONTACT_IDS} variant="inline" className="mt-8" />
      </div>
      <Portrait priority className="mx-auto max-w-[18rem] md:mx-0" />
    </div>
  );
}
