import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { languageAlternates, pageUrl } from "@/lib/site";
import { ROUTES, routeLastModified } from "@/lib/routes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: pageUrl(locale, route.path),
      lastModified: routeLastModified(route),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: languageAlternates(route.path) },
    })),
  );
}
