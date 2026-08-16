import { getTranslations } from "next-intl/server";
import { breadcrumbSchema, profilePageSchema, webSiteSchema } from "@/lib/structured-data";
import { dynamicMessageKey } from "@/lib/utils";

/**
 * Server component. Gộp mọi node vào một graph `@context` duy nhất thay vì
 * nhiều thẻ script rời — các node tham chiếu nhau qua `@id`, và một graph
 * chung là cách để consumer phân giải được những tham chiếu đó.
 */
export async function PageStructuredData({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}) {
  const t = await getTranslations({ locale, namespace: "nav" });
  // Award names are prose, so they live in the `about` catalog rather than in
  // `credentials.ts` — same reason breadcrumb labels come from `nav`.
  const tAbout = await getTranslations({ locale, namespace: "about" });

  const graph = [
    webSiteSchema(locale),
    profilePageSchema({
      locale,
      path,
      title,
      description,
      awardName: (award) => tAbout(dynamicMessageKey(`awards.${award.id}`)),
    }),
    breadcrumbSchema(locale, path, (route) => t(dynamicMessageKey(route.key))),
  ];

  return (
    <script
      type="application/ld+json"
      // Nội dung sinh từ dữ liệu và catalog của chính chúng ta, không phải input người dùng.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
