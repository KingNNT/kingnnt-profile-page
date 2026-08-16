import { cn } from "@/lib/utils";

export function SectionLabel({
  index,
  name,
  className,
  id,
}: {
  index: number;
  name: string;
  className?: string;
  /** Đặt trên chính span tên, để `Section` trỏ `aria-labelledby` vào đây thay vì
   * nhân đôi tên section bằng một span sr-only riêng. */
  id?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      <span className="text-primary">{String(index).padStart(2, "0")}</span>
      <span aria-hidden className="h-px w-6 bg-rule" />
      <span id={id}>{name}</span>
    </span>
  );
}
