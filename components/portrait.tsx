import Image from "next/image";
import { IDENTITY } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function Portrait({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/portrait.jpg"
      alt={`${IDENTITY.fullName} — ${IDENTITY.jobTitle}`}
      width={864}
      height={1184}
      priority={priority}
      sizes="(min-width: 768px) 20rem, 12rem"
      className={cn("h-auto w-full rounded-sm object-cover", className)}
    />
  );
}
