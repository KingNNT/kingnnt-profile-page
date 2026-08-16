import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "@/components/reveal";

describe("Reveal", () => {
  /**
   * Điều kiện quan trọng nhất của cả component: nội dung phải nằm trong HTML
   * ngay cả khi chưa vào viewport. Crawler của answer engine không chạy
   * JavaScript — chữ chỉ xuất hiện sau khi IntersectionObserver bắn là chữ vô
   * hình với chúng.
   */
  it("renders its children even before they enter the viewport", () => {
    render(<Reveal>indexable copy</Reveal>);
    expect(screen.getByText("indexable copy")).toBeInTheDocument();
  });

  it("shows content immediately when the user prefers reduced motion", () => {
    // vitest.setup.ts trả về matchMedia matches: true cho mọi query.
    // getByText trả về chính div của Reveal (text node không phải element),
    // nên assert thẳng trên nó — `.parentElement` sẽ là container của RTL.
    render(<Reveal>copy</Reveal>);
    expect(screen.getByText("copy")).toHaveClass("opacity-100");
  });
});
