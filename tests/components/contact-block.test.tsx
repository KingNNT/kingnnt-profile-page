import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactBlock } from "@/components/contact-block";

describe("ContactBlock", () => {
  it("renders an email channel as a mailto link showing the address", () => {
    render(<ContactBlock ids={["dev-email"]} />);
    const link = screen.getByRole("link", { name: "Dev.KingNNT@gmail.com" });
    expect(link).toHaveAttribute("href", "mailto:Dev.KingNNT@gmail.com");
  });

  it("renders a profile channel as an external link showing its label", () => {
    render(<ContactBlock ids={["github"]} />);
    const link = screen.getByRole("link", { name: "GitHub" });
    expect(link).toHaveAttribute("href", "https://github.com/KingNNT");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "me noreferrer");
  });

  /** Một profile không bao giờ được biến thành mailto — union `kind` là để chặn đúng chuyện này. */
  it("never turns a profile into a mailto", () => {
    render(<ContactBlock ids={["linkedin"]} />);
    expect(screen.getByRole("link", { name: "LinkedIn" }).getAttribute("href")).not.toMatch(
      /^mailto:/,
    );
  });

  it("keeps the order it is given", () => {
    render(<ContactBlock ids={["github", "dev-email"]} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["GitHub", "Dev.KingNNT@gmail.com"]);
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<ContactBlock ids={[]} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});
