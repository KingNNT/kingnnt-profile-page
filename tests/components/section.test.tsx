import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "@/components/section";
import { SectionLabel } from "@/components/section-label";

describe("SectionLabel", () => {
  it("zero-pads the index so the column stays aligned", () => {
    render(<SectionLabel index={3} name="Skills" />);
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("keeps the accessible name sentence case while styling it uppercase", () => {
    // The visual all-caps look comes from the `uppercase` Tailwind class on the
    // wrapping span, not from `.toUpperCase()` on the text node — some screen
    // readers spell an all-caps text node letter by letter, which would turn
    // "About" into "A-B-O-U-T" for a labelled landmark's accessible name.
    render(<SectionLabel index={1} name="About" />);
    const label = screen.getByText("About");
    expect(label).toBeInTheDocument();
    expect(label.parentElement?.className).toContain("uppercase");
  });
});

describe("Section", () => {
  it("renders its children", () => {
    render(<Section>body copy</Section>);
    expect(screen.getByText("body copy")).toBeInTheDocument();
  });

  it("exposes a landmark with an accessible name when labelled", () => {
    render(
      <Section id="skills" index={3} label="Skills">
        body
      </Section>,
    );
    expect(screen.getByRole("region", { name: /skills/i })).toBeInTheDocument();
  });

  it("omits the label row when no label is given", () => {
    const { container } = render(<Section>body</Section>);
    expect(container.querySelector(".font-mono")).toBeNull();
  });
});
