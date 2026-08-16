"use client";

import type { ReactNode } from "react";
import { useInView, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * Chỉ đổi opacity và transform của nội dung ĐÃ render. Không bao giờ quyết định
 * có render hay không: nội dung phải nằm sẵn trong HTML server-render, vì
 * crawler của answer engine không chạy JavaScript.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const shown = reduced || inView;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
