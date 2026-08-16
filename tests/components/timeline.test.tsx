import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline, type TimelineItem } from "@/components/timeline";

const ITEMS: TimelineItem[] = [
  {
    id: "consultant",
    period: "07.2026 — now",
    role: "Solutions Consultant",
    summary: "Pre-sales and solution architecture.",
    meta: ["presales", "VN"],
    ongoing: true,
  },
  {
    id: "engineer-ai",
    period: "04.2024 — 10.2025",
    role: "Full-stack Engineer",
    summary: "AI document processing.",
    meta: ["ai", "JP"],
    ongoing: false,
  },
];

describe("Timeline", () => {
  it("renders an entry per item", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the role and the period for each entry", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByText("Solutions Consultant")).toBeInTheDocument();
    expect(screen.getByText("07.2026 — now")).toBeInTheDocument();
  });

  /**
   * Nhiều vai trò cùng đang diễn ra là sự thật của hồ sơ này, không phải lỗi dữ
   * liệu. Component phải chịu được, và phải đánh dấu được.
   */
  it("marks ongoing entries so concurrent roles read correctly", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByTestId("marker-consultant")).toHaveAttribute("data-ongoing", "true");
    expect(screen.getByTestId("marker-engineer-ai")).toHaveAttribute("data-ongoing", "false");
  });

  it("lists the meta tags of an entry", () => {
    render(<Timeline items={ITEMS} />);
    expect(screen.getByText("presales")).toBeInTheDocument();
  });

  it("renders nothing but an empty list when given no items", () => {
    render(<Timeline items={[]} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
