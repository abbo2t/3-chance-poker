import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

describe("HomePage", () => {
  it("renders the main heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /3 shot poker simulator/i })
    ).toBeInTheDocument();
  });
});
