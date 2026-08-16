import { channelsFor, type ContactChannelId } from "@/lib/profile/contact";
import { cn } from "@/lib/utils";

interface ContactBlockProps {
  ids: readonly ContactChannelId[];
  /** `inline` cho dải footer, `block` cho một section liên hệ. */
  variant?: "block" | "inline";
  className?: string;
}

/**
 * Nhận danh sách id chứ không nhận facet: nhờ vậy đúng một component phục vụ
 * cả khối chung ở hub, khối riêng trên trang nhánh, bốn khối trong `/contact`,
 * và dải liên hệ ở footer.
 *
 * Không gọi i18n — thứ nó hiển thị là địa chỉ email và tên profile, không có
 * gì để dịch.
 */
export function ContactBlock({ ids, variant = "block", className }: ContactBlockProps) {
  const channels = channelsFor(ids);
  if (channels.length === 0) return null;

  return (
    <ul
      className={cn(
        "font-mono",
        variant === "inline" ? "flex items-center gap-4 text-xs" : "space-y-3 text-sm",
        className,
      )}
    >
      {channels.map((channel) =>
        channel.kind === "email" ? (
          <li key={channel.id}>
            <a
              className="border-b border-primary pb-0.5 text-primary transition-colors hover:text-foreground"
              href={`mailto:${channel.address}`}
            >
              {channel.address}
            </a>
          </li>
        ) : (
          <li key={channel.id}>
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={channel.url}
              rel="me noreferrer"
              target="_blank"
            >
              {channel.label}
            </a>
          </li>
        ),
      )}
    </ul>
  );
}
