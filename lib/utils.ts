import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * next-intl's typed `Messages` (see `global.d.ts`) makes `t()` require a
 * literal catalog key, which is right for most call sites but can't be
 * satisfied by the handful built from a runtime id — `t(\`entries.${id}\`)`,
 * `t(route.key)`. Those stay covered at runtime by
 * `tests/messages/id-coverage.test.ts` instead of by `tsc`, which can't check
 * a template literal or a variable against a JSON shape. `never` is
 * assignable to every parameter type, so this cast opts a single call site
 * out of the literal-key check without widening `Messages` back to `any`
 * (which would opt every call site out silently, including the ~60 static
 * ones the augmentation exists to guard).
 */
export function dynamicMessageKey(key: string): never {
  return key as unknown as never;
}
