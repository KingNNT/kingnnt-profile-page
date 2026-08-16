"use client";

import { useTranslations } from "next-intl";
import type { Facet } from "@/enums";
import { Link, usePathname } from "@/i18n/navigation";
import { facetRoutes } from "@/lib/routes";
import { cn, dynamicMessageKey } from "@/lib/utils";

/**
 * Điều hướng tầng hai, render bởi layout của từng nhánh. `SiteHeader` cố ý
 * không biết facet là gì: sub-nav thuộc về nhánh, không thuộc về site.
 *
 * Nhánh chưa có trang con thì không render gì — một thanh điều hướng rỗng là
 * tiếng ồn với screen reader.
 */
export function FacetNav({ facet }: { facet: Facet }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const routes = facetRoutes(facet);

  if (routes.length === 0) return null;

  return (
    <nav className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-5 overflow-x-auto px-6 py-3">
        {routes.map((route) => {
          const href = `/${route.path}`;
          const current = pathname === href;
          return (
            <Link
              key={route.path}
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "whitespace-nowrap font-mono text-xs tracking-tight transition-colors",
                current ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(dynamicMessageKey(route.key))}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
