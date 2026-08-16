import { SectionLabel } from "@/components/section-label";
import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
  index,
  label,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  index?: number;
  label?: string;
}) {
  const labelled = index != null && label != null;
  const headingId = id ? `${id}-label` : undefined;

  return (
    <section
      id={id}
      // Chỉ nhận vai trò landmark khi có nhãn — một region không tên là tiếng ồn
      // với screen reader, không phải trợ giúp.
      aria-labelledby={labelled ? headingId : undefined}
      className={cn("mx-auto w-full max-w-5xl px-6 py-16 md:py-24", className)}
    >
      {labelled ? (
        <div className="mb-8">
          <SectionLabel index={index} name={label} className="" />
          <span id={headingId} className="sr-only">
            {label}
          </span>
        </div>
      ) : null}
      {children}
    </section>
  );
}
