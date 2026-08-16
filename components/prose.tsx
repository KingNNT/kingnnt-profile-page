import { cn } from "@/lib/utils";

/** Khối đọc dài. 68ch là chỗ dòng còn quét mắt được mà không cần lia đầu. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[68ch] space-y-5 text-base leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
