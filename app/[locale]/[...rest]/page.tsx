import { notFound } from "next/navigation";

/**
 * Catch-all for any path under a locale that doesn't match a real route.
 * Without this, the App Router never considers `[locale]` "matched" for an
 * arbitrary bad URL (there is no leaf segment to resolve), so it renders the
 * bare root `not-found` instead of `app/[locale]/not-found.tsx` — the exact
 * unstyled, English-only, chrome-less page this route exists to avoid. This
 * file's only job is to force the segment to resolve and immediately call
 * `notFound()`, which then bubbles up to the localized boundary.
 */
export default function CatchAll() {
  notFound();
}
