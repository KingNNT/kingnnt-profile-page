"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoMark } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { HOME_PATH, primaryNavRoutes } from "@/lib/routes";
// Import directly from the leaf module, not the `@/lib/profile` barrel: the
// barrel also re-exports experience, projects, skills, credentials and
// trading, which would pull all of that into this client component's bundle
// for a header that only needs `IDENTITY`.
import { IDENTITY } from "@/lib/profile/identity";
import { cn, dynamicMessageKey } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const homeHref = `/${HOME_PATH}`;
  const homeCurrent = pathname === homeHref;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-4">
        <Link
          href={homeHref}
          aria-current={homeCurrent ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 font-mono text-sm tracking-tight transition-colors",
            homeCurrent ? "text-primary" : undefined,
          )}
        >
          {/* Decorative: the nickname beside it already names the link, and a
              second copy of "KingNNT" would just make the link read twice. */}
          {/* Accent on the mark and on the K it stands for, so the two read as
              one lockup. On the home route the whole link is already accented,
              which makes this a no-op rather than a conflict. */}
          <LogoMark className="text-primary" />
          {/* The accent falls on the K through `::first-letter`, not by
              splitting the string into `<span>K</span>ingNNT`. The nickname
              stays one text node, so the link's accessible name and the text a
              crawler extracts are both still exactly "KingNNT" — splitting it
              risks either picking up a space between the two nodes or, worse,
              inviting someone to drop the K and lean on the logo for it.
              `inline-block` is load-bearing: `::first-letter` only applies to
              a block container, and this link is a flex parent. */}
          <span className="inline-block first-letter:text-primary">{IDENTITY.nickname}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-5 overflow-x-auto">
          {primaryNavRoutes().map((route) => {
            const href = `/${route.path}`;
            const current = pathname === href;
            return (
              <Link
                key={route.path}
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap font-mono text-xs uppercase tracking-[0.15em] transition-colors",
                  current ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(dynamicMessageKey(route.key))}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
