import { Link } from "@/i18n/navigation";

export interface NavIndexEntry {
  path: string;
  label: string;
  blurb: string;
}

/**
 * Các lối vào, đánh số. Thay cho một dãy nút CTA — trang này không bán gì, nó
 * mời đọc tiếp, và một mục lục nói đúng điều đó.
 *
 * Thuần trình bày: nhận nội dung đã dịch qua props thay vì tự gọi
 * `useTranslations`, để test dựng được mà không cần mock i18n.
 */
export function NavIndex({ entries }: { entries: NavIndexEntry[] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-sm bg-rule sm:grid-cols-2">
      {entries.map((entry, i) => (
        <li key={entry.path} className="bg-background">
          <Link
            href={`/${entry.path}`}
            className="group flex h-full flex-col gap-2 p-6 transition-colors hover:bg-secondary"
          >
            <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
            <span className="font-mono text-sm uppercase tracking-[0.15em]">{entry.label}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">{entry.blurb}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
