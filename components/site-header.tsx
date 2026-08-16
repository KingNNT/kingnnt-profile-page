"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { HOME_PATH, navRoutes } from "@/lib/routes";
import { IDENTITY } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-4">
        <Link href={`/${HOME_PATH}`} className="font-mono text-sm tracking-tight">
          {IDENTITY.nickname}
        </Link>
        <nav className="flex flex-1 items-center gap-5 overflow-x-auto">
          {navRoutes().map((route) => {
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
                {t(route.key)}
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
