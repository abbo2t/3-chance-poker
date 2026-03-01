import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameLayout } from "../src/components/GameLayout";

describe("GameLayout betting flow", () => {
  it("enables actions in the correct phases and calls the engine on decision", () => {
    render(<GameLayout />);

    const dealButton = screen.getByRole("button", { name: /bet & deal/i });
    const clearBetsButton = screen.getByRole("button", { name: /clear bets/i });

    // Call/Fold are not rendered during the betting phase.
    expect(
      screen.queryByRole("button", { name: /call/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /fold/i }),
    ).not.toBeInTheDocument();

    // Initial state: can deal, cannot clear bets.
    expect(dealButton).toBeEnabled();
    expect(clearBetsButton).toBeDisabled();

    // After dealing, Deal and Clear Bets are hidden; Call and Fold appear.
    fireEvent.click(dealButton);
    expect(
      screen.queryByRole("button", { name: /bet & deal/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /clear bets/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /call/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /fold/i })).toBeEnabled();
  });

  it("prevents calling or folding before betting & dealing", () => {
    render(<GameLayout />);

    // Call/Fold are not rendered outside of the decision phase.
    expect(
      screen.queryByRole("button", { name: /call/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /fold/i }),
    ).not.toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: /clear bets/i })).toBeEnabled();

    // Call/Fold are hidden after resolution.
    expect(
      screen.queryByRole("button", { name: /call/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /fold/i }),
    ).not.toBeInTheDocument();

    // Clearing bets unlocks them and restores the "Bet & Deal" label.
    fireEvent.click(screen.getByRole("button", { name: /clear bets/i }));
    const dealButtonAfterClear = screen.getByRole("button", {
      name: /bet & deal/i,
    });
    expect(dealButtonAfterClear).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /clear bets/i }),
    ).toBeDisabled();
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

    // Still in betting phase: Call/Fold should not be rendered.
    expect(
      screen.queryByRole("button", { name: /call/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /fold/i }),
    ).not.toBeInTheDocument();
  });
});
