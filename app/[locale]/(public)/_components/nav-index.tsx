"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { navRoutes } from "@/lib/routes";

/**
 * Bốn lối vào, đánh số. Thay cho một dãy nút CTA — trang này không bán gì, nó
 * mời đọc tiếp, và một mục lục nói đúng điều đó.
 */
export function NavIndex() {
  const t = useTranslations("nav");
  const tHome = useTranslations("home.index");

  return (
    <ul className="grid gap-px overflow-hidden rounded-sm bg-rule sm:grid-cols-2">
      {navRoutes().map((route, i) => (
        <li key={route.path} className="bg-background">
          <Link
            href={`/${route.path}`}
            className="group flex h-full flex-col gap-2 p-6 transition-colors hover:bg-secondary"
          >
            <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-mono text-sm uppercase tracking-[0.15em]">{t(route.key)}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {tHome(route.key)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
