import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  period: string;
  role: string;
  summary: string;
  meta: readonly string[];
  ongoing: boolean;
}

/**
 * Thuần trình bày: trang truyền vào dữ liệu đã ghép với bản dịch. Component
 * không đọc `lib/profile` và không gọi i18n, nên nó test được mà không cần mock.
 */
export function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="relative border-l border-rule">
      {items.map((item) => (
        <li key={item.id} className="relative pb-10 pl-8 last:pb-0">
          <span
            data-testid={`marker-${item.id}`}
            data-ongoing={String(item.ongoing)}
            aria-hidden
            className={cn(
              "absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full",
              item.ongoing ? "bg-primary" : "bg-rule ring-1 ring-border",
            )}
          />
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {item.period}
          </p>
          <h2 className="mt-2 text-lg font-medium">{item.role}</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            {item.meta.join(" · ")}
          </p>
        </li>
      ))}
    </ol>
  );
}
