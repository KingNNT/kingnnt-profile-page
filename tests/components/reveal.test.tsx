import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Reveal } from "@/components/reveal";
import * as hooks from "@/lib/hooks";

// Wrap the real hook so individual tests can override just one call while the
// rest still exercise the actual implementation (see the reduced-motion test).
vi.mock("@/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/hooks")>();
  return { ...actual, useReducedMotion: vi.fn(actual.useReducedMotion) };
});

describe("Reveal", () => {
  /**
   * Điều kiện quan trọng nhất của cả component: nội dung phải nằm trong HTML
   * ngay cả khi chưa vào viewport. Crawler của answer engine không chạy
   * JavaScript — chữ chỉ xuất hiện sau khi IntersectionObserver bắn là chữ vô
   * hình với chúng.
   *
   * vitest.setup.ts stub matchMedia trả về matches: true cho mọi query, nên
   * nếu không ép reduced-motion về false ở đây, `shown` sẽ luôn true và test
   * này sẽ không bao giờ bắt được một regression kiểu `{shown ? children :
   * null}` — chính lỗi mà test này tồn tại để chặn. Ép về false để `shown`
   * chỉ còn phụ thuộc vào `inView`, vốn bị stub IntersectionObserver no-op
   * giữ ở false.
   */
  it("renders its children even before they enter the viewport", () => {
    vi.mocked(hooks.useReducedMotion).mockReturnValueOnce(false);
    render(<Reveal>indexable copy</Reveal>);
    expect(screen.getByText("indexable copy")).toBeInTheDocument();
  });

  it("shows content immediately when the user prefers reduced motion", () => {
    // Không override ở đây — dùng thẳng hook thật, vốn đọc matchMedia stub
    // (matches: true) từ vitest.setup.ts.
    // getByText trả về chính div của Reveal (text node không phải element),
    // nên assert thẳng trên nó — `.parentElement` sẽ là container của RTL.
    render(<Reveal>copy</Reveal>);
    expect(screen.getByText("copy")).toHaveClass("opacity-100");
  });
});
