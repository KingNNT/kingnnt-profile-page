export const FACETS = ["dev", "trading", "creator"] as const;

export type Facet = (typeof FACETS)[number];

/**
 * Nhãn tiếng Anh của từng nhánh. Cố ý **không** nằm trong message catalog:
 * chúng không bao giờ render ra trang — chỗ dùng duy nhất là `llms.txt` và
 * `contactType` trong JSON-LD, cả hai đều chỉ có một bản tiếng Anh.
 */
export const FACET_LABEL_EN: Record<Facet, string> = {
  dev: "Software engineering",
  trading: "Trading",
  creator: "Content",
};

/** `contactType` của schema.org ContactPoint — chữ thường theo quy ước schema. */
export const FACET_CONTACT_TYPE: Record<Facet, string> = {
  dev: "software engineering",
  trading: "trading",
  creator: "content collaboration",
};
