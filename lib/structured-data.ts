import { FACET_CONTACT_TYPE, FACETS } from "@/enums";
import { routing } from "@/i18n/routing";
import {
  allSkillNames,
  ALTERNATE_NAMES,
  type Award,
  AWARDS,
  CERTIFICATIONS,
  channelsFor,
  EDUCATION,
  EXPERTISE_TOPICS,
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
 * Named credential issuers. These are the only `Organization` nodes the graph
 * is allowed to carry.
 *
 * The anonymity rule bans employers, clients, and the companies behind the
 * products — an issuer is none of those, and the same four names are already
 * printed on `/about`. They earn their place here because a certifying body is
 * a third-party anchor for the person entity, and this site deliberately gave
 * up the usual one by refusing to name employers.
 */
function credentials() {
  return CERTIFICATIONS.map((certification) => ({
    "@type": "EducationalOccupationalCredential",
    name: certification.name,
    credentialCategory: "certificate",
    recognizedBy: { "@type": "Organization", name: certification.issuer },
  }));
}

/**
 * Person node — the entity this whole site exists to describe, and the one
 * thing search engines and answer engines are trying to resolve.
 *
 * Still NO `worksFor` and NO `affiliation`: the owner does not name employers,
 * and schema is where that constraint leaks most easily, because every Person
 * example on the web carries `worksFor`.
 *
 * `awardName` is threaded in rather than read from the data, for the same
 * reason `breadcrumbSchema` takes `labelFor`: award names are prose and live
 * in the translated catalogs, not in `credentials.ts`.
 */
export function personSchema(locale: string, awardName: (award: Award) => string) {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: IDENTITY.fullName,
    alternateName: ALTERNATE_NAMES,
    jobTitle: IDENTITY.jobTitle,
    email: `mailto:${primaryEmail()}`,
    url: pageUrl(locale, ""),
    image: `${SITE_URL}/images/portrait.jpg`,
    sameAs: profileChannels().map((c) => c.url),
    contactPoint: contactPoints(),
    // Topics first, tool names after: what the work is, then what it is built
    // with. A consumer truncating the list keeps the more useful half.
    knowsAbout: [...EXPERTISE_TOPICS, ...allSkillNames()],
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
    hasCredential: credentials(),
    award: AWARDS.map(awardName),
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
  /** Translated name of an award — see the note on `personSchema`. */
  awardName: (award: Award) => string;
}

export function profilePageSchema({
  locale,
  path,
  title,
  description,
  awardName,
}: ProfilePageArgs) {
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
    mainEntity: personSchema(locale, awardName),
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
