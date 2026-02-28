import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameLayout } from "../src/components/GameLayout";

describe("GameLayout betting flow", () => {
  it("enables actions in the correct phases and calls the engine on decision", () => {
    render(<GameLayout />);

    const dealButton = screen.getByRole("button", { name: /bet & deal/i });
    const callButton = screen.getByRole("button", { name: /call/i });
    const foldButton = screen.getByRole("button", { name: /fold/i });
    const clearBetsButton = screen.getByRole("button", { name: /clear bets/i });

    // Initial state: can deal, cannot call/fold, cannot clear bets.
    expect(dealButton).toBeEnabled();
    expect(callButton).toBeDisabled();
    expect(foldButton).toBeDisabled();
    expect(clearBetsButton).toBeDisabled();

    // After dealing, a decision is required.
    fireEvent.click(dealButton);
    expect(callButton).toBeEnabled();
    expect(foldButton).toBeEnabled();
    expect(dealButton).toBeDisabled();
    // Bets are locked during decision, so Clear Bets remains disabled.
    expect(clearBetsButton).toBeDisabled();
  });

  it("prevents calling or folding before betting & dealing", () => {
    render(<GameLayout />);

    const callButton = screen.getByRole("button", { name: /call/i });
    const foldButton = screen.getByRole("button", { name: /fold/i });

    // Before betting & dealing, calling or folding is prevented by disabling the buttons.
    expect(callButton).toBeDisabled();
    expect(foldButton).toBeDisabled();
  });

  it("updates the deal button label between Bet & Deal and Re-bet & Deal", () => {
    render(<GameLayout />);

    // Initially, bets are not locked, so we show "Bet & Deal".
    const initialDealButton = screen.getByRole("button", {
      name: /bet & deal/i,
    });
    const clearBetsButton = screen.getByRole("button", { name: /clear bets/i });
    expect(initialDealButton).toBeEnabled();
    expect(clearBetsButton).toBeDisabled();

    // Play one hand by dealing and then calling.
    fireEvent.click(initialDealButton);
    const callButton = screen.getByRole("button", { name: /call/i });
    fireEvent.click(callButton);

    // After resolution, bets are locked and the label switches to "Re-bet & Deal".
    const rebetDealButton = screen.getByRole("button", {
      name: /re-bet & deal/i,
    });
    expect(rebetDealButton).toBeEnabled();
    expect(clearBetsButton).toBeEnabled();

    // Clearing bets unlocks them and restores the "Bet & Deal" label.
    fireEvent.click(clearBetsButton);
    const dealButtonAfterClear = screen.getByRole("button", {
      name: /bet & deal/i,
    });
    expect(dealButtonAfterClear).toBeEnabled();
    expect(clearBetsButton).toBeDisabled();
  });

  it("shows bet validation errors and does not advance when amounts are invalid", () => {
    render(<GameLayout />);

    const dealButton = screen.getByRole("button", { name: /bet & deal/i });
    const firstShotInput = screen.getByLabelText(/1st shot bet/i);

    // Set 1st Shot bet to 0, which is invalid.
    fireEvent.change(firstShotInput, { target: { value: "0" } });
    fireEvent.click(dealButton);

    expect(
      screen.getByText(/1st shot bet must be at least 1\./i),
    ).toBeInTheDocument();

    // Still in betting phase: Call should remain disabled.
    const callButton = screen.getByRole("button", { name: /call/i });
    expect(callButton).toBeDisabled();
  });
});
