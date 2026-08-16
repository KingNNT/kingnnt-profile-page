import { defineRouting } from "next-intl/routing";
import { LocaleSupport } from "@/enums";

export const routing = defineRouting({
  locales: [LocaleSupport.EN, LocaleSupport.VI],
  defaultLocale: LocaleSupport.EN,
  localePrefix: "always",
});
