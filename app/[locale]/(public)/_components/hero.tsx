import { getTranslations } from "next-intl/server";
import { Portrait } from "@/components/portrait";
import { IDENTITY } from "@/lib/profile";

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
        <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs">
          <a
            className="border-b border-primary pb-0.5 text-primary"
            href={`mailto:${IDENTITY.email}`}
          >
            {IDENTITY.email}
          </a>
          {IDENTITY.socials.map((social) => (
            <a
              key={social.id}
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={social.url}
              rel="me noreferrer"
              target="_blank"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
      <Portrait priority className="mx-auto max-w-[18rem] md:mx-0" />
    </div>
  );
}
