import { getTranslations } from "next-intl/server";
import { IDENTITY } from "@/lib/profile";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {IDENTITY.fullName} · {IDENTITY.location.city}, {IDENTITY.location.country}
        </p>
        <div className="flex items-center gap-4">
          <a className="hover:text-foreground" href={`mailto:${IDENTITY.email}`}>
            {t("email")}
          </a>
          {IDENTITY.socials.map((social) => (
            <a
              key={social.id}
              className="hover:text-foreground"
              href={social.url}
              rel="me noreferrer"
              target="_blank"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
