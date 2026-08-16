import { routing } from "@/i18n/routing";
import { buildLlmsTxt } from "@/lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(routing.defaultLocale), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
