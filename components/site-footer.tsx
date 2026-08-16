import { ContactBlock } from "@/components/contact-block";
import { GENERAL_CONTACT_IDS } from "@/lib/profile/contact";
import { IDENTITY } from "@/lib/profile/identity";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-10 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {IDENTITY.fullName} · {IDENTITY.location.city}, {IDENTITY.location.country}
        </p>
        <ContactBlock ids={GENERAL_CONTACT_IDS} variant="inline" />
      </div>
    </footer>
  );
}
