import { FACET_CONTACT_TYPE, FACETS } from "@/enums";
import { routing } from "@/i18n/routing";
import {
  allSkillNames,
  channelsFor,
  EDUCATION,
  FACET_CONTACT_IDS,
  IDENTITY,
  primaryEmail,
  profileChannels,
} from "@/lib/profile";
import {
  breadcrumbTrail,
  CONTENT_LAST_MODIFIED,
  findRoute,
  type RouteDef,
  routeLastModified,
} from "@/lib/routes";
import { pageUrl, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Một ContactPoint cho mỗi nhánh, sinh thẳng từ `FACET_CONTACT_IDS` nên không
 * thể lệch với trang `/contact`. Nhánh nào không có email thì không có điểm
 * liên hệ — không bịa ra một cái rỗng.
 */
function contactPoints() {
  return FACETS.flatMap((facet) => {
    const email = channelsFor(FACET_CONTACT_IDS[facet]).find((c) => c.kind === "email");
    return email !== undefined && email.kind === "email"
      ? [
          {
            "@type": "ContactPoint",
            contactType: FACET_CONTACT_TYPE[facet],
            email: `mailto:${email.address}`,
          },
        ]
      : [];
  });
}

/**
 * Node Person — thực thể chính của trang này với search engine và answer engine.
 *
 * Cố ý KHÔNG có `worksFor`, `affiliation`, hay bất kỳ node `Organization` nào:
 * chủ trang yêu cầu không nhắc tên nơi làm việc, và schema là chỗ ràng buộc đó
 * rò rỉ dễ nhất vì mọi ví dụ Person đều kèm `worksFor`.
 */
export function personSchema(locale: string) {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: IDENTITY.fullName,
    alternateName: [IDENTITY.englishName, IDENTITY.nickname],
    jobTitle: IDENTITY.jobTitle,
    email: `mailto:${primaryEmail()}`,
    url: pageUrl(locale, ""),
    image: `${SITE_URL}/images/portrait.jpg`,
    sameAs: profileChannels().map((c) => c.url),
    contactPoint: contactPoints(),
    knowsAbout: allSkillNames(),
    knowsLanguage: routing.locales,
    address: {
      "@type": "PostalAddress",
      addressLocality: IDENTITY.location.city,
      addressCountry: "VN",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: EDUCATION.institution,
    },
  };
}

export function webSiteSchema(locale: string) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: pageUrl(locale, ""),
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

interface ProfilePageArgs {
  locale: string;
  path: string;
  title: string;
  description: string;
}

export function profilePageSchema({ locale, path, title, description }: ProfilePageArgs) {
  const route = findRoute(path);

  return {
    "@type": "ProfilePage",
    "@id": `${pageUrl(locale, path)}#page`,
    url: pageUrl(locale, path),
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    dateModified: route ? routeLastModified(route) : CONTENT_LAST_MODIFIED,
    mainEntity: personSchema(locale),
  };
}

/** `labelFor` trả về tên hiển thị đã dịch của một route. */
export function breadcrumbSchema(
  locale: string,
  path: string,
  labelFor: (route: RouteDef) => string,
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbTrail(path).map((route, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: labelFor(route),
      item: pageUrl(locale, route.path),
    })),
  };
}
