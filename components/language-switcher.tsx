"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleSupport } from "@/enums";
import { usePathname, useRouter } from "@/i18n/navigation";

const LABELS: Record<string, string> = {
  [LocaleSupport.EN]: "English",
  [LocaleSupport.VI]: "Tiếng Việt",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(LABELS).map(([value, label]) => (
          <DropdownMenuItem
            key={value}
            disabled={value === locale}
            // `pathname` từ next-intl đã bỏ locale prefix, nên người đọc ở lại
            // đúng trang thay vì bị quăng về trang chủ.
            onClick={() => router.replace(pathname, { locale: value })}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
