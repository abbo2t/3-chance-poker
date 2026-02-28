import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameLayout } from "../src/components/GameLayout";

describe("GameLayout betting flow", () => {
  it("enables actions in the correct phases and calls the engine on decision", () => {
    render(<GameLayout />);

    const dealButton = screen.getByRole("button", { name: /deal/i });
    const raiseButton = screen.getByRole("button", { name: /raise/i });
    const foldButton = screen.getByRole("button", { name: /fold/i });
    const newHandButton = screen.getByRole("button", { name: /new hand/i });

    // Initial state: can deal, cannot raise/fold, cannot start a new hand.
    expect(dealButton).toBeEnabled();
    expect(raiseButton).toBeDisabled();
    expect(foldButton).toBeDisabled();
    expect(newHandButton).toBeDisabled();

    // After dealing, a decision is required.
    fireEvent.click(dealButton);
    expect(raiseButton).toBeEnabled();
    expect(foldButton).toBeEnabled();
    expect(dealButton).toBeDisabled();
    expect(newHandButton).toBeEnabled();
  });
});
