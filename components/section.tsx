import { SectionLabel } from "@/components/section-label";
import { cn } from "@/lib/utils";

type SectionProps = { className?: string; children: React.ReactNode } & (
  | { id: string; index: number; label: string }
  | { id?: string; index?: never; label?: never }
);

export function Section({ id, className, children, index, label }: SectionProps) {
  const labelled = index != null && label != null;
  // A labelled section always carries a required `id` (enforced by SectionProps),
  // so headingId is only ever undefined when the section has no label at all.
  const headingId = labelled ? `${id}-label` : undefined;

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
          <SectionLabel index={index} name={label} id={headingId} />
        </div>
      ) : null}
      {children}
    </section>
  );
}
