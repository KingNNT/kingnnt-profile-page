import { cn } from "@/lib/utils";

// Seven subpaths, all wound clockwise so the default nonzero fill unions them:
// the four bars of the frame (left, right, bottom, and a top edge split by a
// notch), the stem of the K hanging off the top-left bar, and the chevron.
// Mirrored by `assets/logo-mark.svg`, the vector original the app icons are
// generated from — `tests/components/logo.test.tsx` keeps the two in step.
export const LOGO_MARK_PATH =
  "M0 0h20v182h-20zM162 0h20v182h-20zM0 162h182v20h-182zM0 0h66v20h-66zM92 0h90v20h-90zM46 0h20v135h-20zM98 48h27l-42.5 42.5 43.5 43.5h-27l-43.5-43.5z";

// Inherits `currentColor` rather than baking in the brand's near-white: the
// mark sits on the page background in both themes, where a fixed colour would
// need a second asset. The icons under `app/` are the opposite case — a fixed
// dark plate, because a browser tab strip gives no colour context at all.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 182 182"
      className={cn("h-4 w-4", className)}
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d={LOGO_MARK_PATH} />
    </svg>
  );
}
