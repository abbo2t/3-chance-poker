import React from "react";
import { render, screen } from "@testing-library/react";
import { GameLayout } from "../src/components/GameLayout";

describe("GameLayout wireframe", () => {
  it("renders the main sections for bets, cards, and results", () => {
    render(<GameLayout />);

    expect(
      screen.getByRole("heading", { name: /3 shot poker simulator/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /bets/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /cards & results/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /deal/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /raise/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /fold/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /new hand/i })).toBeDisabled();

    expect(
      screen.getByLabelText(/player cards placeholder/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/community cards placeholder/i),
    ).toBeInTheDocument();
  });
});
