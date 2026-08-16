import type { Facet } from "@/enums";

export type ContactChannelId = "work-email" | "dev-email" | "trader-email" | "linkedin" | "github";

/**
 * Discriminated union, cùng lý do với `Project`: một entry LinkedIn không thể
 * có `address` để chỗ nào đó lỡ dựng `mailto:`, và một email không thể có
 * `url` để lọt vào `sameAs`. Trường URL bắt buộc tên là `url` — đó là tên duy
 * nhất `stripUrls` trong test ẩn danh miễn trừ.
 */
export type ContactChannel =
  | { id: ContactChannelId; kind: "email"; address: string }
  | { id: ContactChannelId; kind: "profile"; label: string; url: string };

export type ProfileChannel = Extract<ContactChannel, { kind: "profile" }>;

/** Mỗi kênh đúng một bản ghi. Nhóm ở dưới tham chiếu bằng id, không sao chép. */
export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  { id: "work-email", kind: "email", address: "Work.KingNNT@gmail.com" },
  { id: "dev-email", kind: "email", address: "Dev.KingNNT@gmail.com" },
  { id: "trader-email", kind: "email", address: "Trader.KingNNT@gmail.com" },
  {
    id: "linkedin",
    kind: "profile",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/kingnnt/",
  },
  { id: "github", kind: "profile", label: "GitHub", url: "https://github.com/KingNNT" },
];

/** Cửa trước cho mọi mảng. Hiển thị ở hub và footer. */
export const GENERAL_CONTACT_IDS: readonly ContactChannelId[] = ["work-email"];

/**
 * `Record` chứ không `Partial`: thêm một nhánh mà quên khai kênh là lỗi biên
 * dịch, không phải một khối liên hệ rỗng render lặng lẽ.
 */
export const FACET_CONTACT_IDS: Record<Facet, readonly ContactChannelId[]> = {
  dev: ["dev-email", "linkedin", "github"],
  trading: ["trader-email"],
  creator: ["work-email"],
};

export function channelsFor(ids: readonly ContactChannelId[]): ContactChannel[] {
  return ids.map((id) => {
    const channel = CONTACT_CHANNELS.find((c) => c.id === id);
    if (!channel) throw new Error(`unknown contact channel id "${id}"`);
    return channel;
  });
}

/** Email chung — thứ `personSchema` và footer dùng. */
export function primaryEmail(): string {
  const channel = channelsFor(GENERAL_CONTACT_IDS).find((c) => c.kind === "email");
  if (channel === undefined || channel.kind !== "email") {
    throw new Error("GENERAL_CONTACT_IDS carries no email channel");
  }
  return channel.address;
}

/** Mọi profile công khai, bất kể nhánh — `sameAs` nói về danh tính, không về mảng. */
export function profileChannels(): ProfileChannel[] {
  return CONTACT_CHANNELS.filter((c): c is ProfileChannel => c.kind === "profile");
}
