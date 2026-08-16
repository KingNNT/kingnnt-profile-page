import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/profile";

export function ProjectCard({
  project,
  title,
  description,
  period,
}: {
  project: Project;
  /** Tên hiển thị đã giải quyết: tên thật, hoặc nhãn ẩn danh đã dịch. */
  title: string;
  description: string;
  period: string;
}) {
  const heading =
    project.url !== null ? (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-lg font-medium hover:text-primary"
      >
        {/* Nhãn là tên sản phẩm, luôn luôn — không bao giờ url hay hostname. Xem test. */}
        {title}
        <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden />
      </a>
    ) : (
      <span className="text-lg font-medium text-muted-foreground">{title}</span>
    );

  return (
    <article className="border-t border-rule py-8">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {period}
      </p>
      <h2 className="mt-2">{heading}</h2>
      <p className="mt-1 font-mono text-xs text-primary">{project.role}</p>
      <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {project.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
    </article>
  );
}
