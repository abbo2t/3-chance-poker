import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { GameLayout } from "../src/components/GameLayout";

vi.mock("../src/lib/gameEngine", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/lib/gameEngine")>();
  return {
    ...real,
    dealRound: vi.fn(() => real.dealRound()),
    resolveRoundFromCards: vi.fn(real.resolveRoundFromCards),
  };
});

describe("GameLayout betting flow", () => {
  it("displays the starting balance of 200", () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");
  });

  it("updates the balance after a resolved round", () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");

    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    // After resolution the balance should still be displayed as a number.
    const balanceText = screen.getByLabelText(/player balance/i).textContent ?? "";
    expect(balanceText).toMatch(/Balance: \d+/);
  });
  it("enables actions in the correct phases and calls the engine on decision", () => {
    render(<GameLayout />);

    const dealButton = screen.getByRole("button", { name: /deal/i });
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
      screen.queryByRole("button", { name: /deal/i }),
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

    // Initially, bets are not locked, so we show "Deal".
    const initialDealButton = screen.getByRole("button", {
      name: /deal/i,
    });
    const clearBetsButton = screen.getByRole("button", { name: /clear bets/i });
    expect(initialDealButton).toBeEnabled();
    expect(clearBetsButton).toBeDisabled();

    // Play one hand by dealing and then calling.
    fireEvent.click(initialDealButton);
    const callButton = screen.getByRole("button", { name: /call/i });
    fireEvent.click(callButton);

    // After resolution, bets are locked and the label switches to "Re-bet Deal".
    const rebetDealButton = screen.getByRole("button", {
      name: /re-bet deal/i,
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
      name: /deal/i,
    });
    expect(dealButtonAfterClear).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /clear bets/i }),
    ).toBeDisabled();
  });

  it("shows bet validation errors and does not advance when amounts are invalid", () => {
    render(<GameLayout />);

    const dealButton = screen.getByRole("button", { name: /deal/i });
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

describe("GameLayout playing surface indicators", () => {
  it("shows no special circle styles in the betting phase", () => {
    const { container } = render(<GameLayout />);
    const markers = container.querySelectorAll(".shot-marker");
    markers.forEach((marker) => {
      expect((marker as HTMLElement).style.borderColor).toBe("");
    });
  });

  it("highlights circle 1 with a white border after dealing", () => {
    const { container } = render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    const markers = container.querySelectorAll(".shot-marker");
    // markers are rendered 3, 2, 1 — last one is circle 1
    const circle1 = markers[2] as HTMLElement;
    const circle2 = markers[1] as HTMLElement;
    const circle3 = markers[0] as HTMLElement;
    expect(circle1.style.borderColor).toBe("white");
    expect(circle2.style.borderColor).toBe("");
    expect(circle3.style.borderColor).toBe("");
  });

  it("fills the 5-shot badge gold after dealing when a 5-shot bet is placed", () => {
    const { container } = render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    const badge = container.querySelector(".five-shot-badge") as HTMLElement;
    expect(badge.style.background).toBe("rgb(251, 191, 36)");
  });

  it("does not change 5-shot badge style after dealing when no 5-shot bet is placed", () => {
    const { container } = render(<GameLayout />);
    fireEvent.change(screen.getByLabelText(/5 shot side bet/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    const badge = container.querySelector(".five-shot-badge") as HTMLElement;
    expect(badge.style.background).toBe("");
  });

  it("shows total bet amount right after deal", () => {
    render(<GameLayout />);
    // defaults: 1st Shot = 10, 5 Shot = 5; call total = 10*3 + 5 = 35
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    expect(screen.getByText("Total Bet: 35")).toBeInTheDocument();
  });

  it("fills all three circles with win/loss colors after calling", async () => {
    const gameEngine = await import("../src/lib/gameEngine");
    vi.mocked(gameEngine.resolveRoundFromCards).mockReturnValueOnce({
      decision: "raise",
      holeCards: [{ rank: 14, suit: "S" }, { rank: 13, suit: "S" }] as never,
      communityCards: [{ rank: 12, suit: "S" }, { rank: 2, suit: "D" }, { rank: 3, suit: "H" }] as never,
      firstShot: { hand: [] as never, evaluation: { rank: "PAIR" } as never, wager: 10, payoutMultiplier: 1, winnings: 10 },
      secondShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 10, payoutMultiplier: 0, winnings: 0 },
      thirdShot: { hand: [] as never, evaluation: { rank: "FLUSH" } as never, wager: 10, payoutMultiplier: 4, winnings: 40 },
      fiveShot: { hand: [] as never, evaluation: { rank: "ALL_OTHER" } as never, wager: 5, payoutMultiplier: 0, winnings: 0 },
      totalBet: 35,
      totalWinnings: 50,
      totalNet: 25,
    });

    const { container } = render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    const markers = container.querySelectorAll(".shot-marker");
    const circle1 = markers[2] as HTMLElement;
    const circle2 = markers[1] as HTMLElement;
    const circle3 = markers[0] as HTMLElement;
    // circle1 = firstShot (PAIR = win = green), circle2 = secondShot (HIGH_CARD = loss = red), circle3 = thirdShot (FLUSH = win = green)
    expect(circle1.style.background).toBe("rgb(74, 222, 128)");
    expect(circle2.style.background).toBe("rgb(249, 115, 115)");
    expect(circle3.style.background).toBe("rgb(74, 222, 128)");
    expect(circle1.style.borderColor).toBe("white");
    expect(circle2.style.borderColor).toBe("white");
    expect(circle3.style.borderColor).toBe("white");
  });

  it("only fills circle 1 with a result color after folding; circles 2 and 3 stay unstyled", async () => {
    const gameEngine = await import("../src/lib/gameEngine");
    vi.mocked(gameEngine.resolveRoundFromCards).mockReturnValueOnce({
      decision: "fold",
      holeCards: [{ rank: 14, suit: "S" }, { rank: 13, suit: "S" }] as never,
      communityCards: [{ rank: 12, suit: "S" }, { rank: 2, suit: "D" }, { rank: 3, suit: "H" }] as never,
      firstShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 10, payoutMultiplier: 0, winnings: 0 },
      secondShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 0, payoutMultiplier: 0, winnings: 0 },
      thirdShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 0, payoutMultiplier: 0, winnings: 0 },
      fiveShot: null,
      totalBet: 10,
      totalWinnings: 0,
      totalNet: -10,
    });

    const { container } = render(<GameLayout />);
    fireEvent.change(screen.getByLabelText(/5 shot side bet/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /fold/i }));

    const markers = container.querySelectorAll(".shot-marker");
    const circle1 = markers[2] as HTMLElement;
    const circle2 = markers[1] as HTMLElement;
    const circle3 = markers[0] as HTMLElement;
    expect(circle1.style.background).toBe("rgb(249, 115, 115)");
    expect(circle1.style.borderColor).toBe("white");
    expect(circle2.style.background).toBe("");
    expect(circle2.style.borderColor).toBe("");
    expect(circle3.style.background).toBe("");
    expect(circle3.style.borderColor).toBe("");
  });

  it("resets circle styles to default after clearing bets", () => {
    const { container } = render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    fireEvent.click(screen.getByRole("button", { name: /clear bets/i }));

    const markers = container.querySelectorAll(".shot-marker");
    markers.forEach((marker) => {
      expect((marker as HTMLElement).style.borderColor).toBe("");
      expect((marker as HTMLElement).style.background).toBe("");
    });
    const badge = container.querySelector(".five-shot-badge") as HTMLElement;
    expect(badge.style.background).toBe("");
  });
});

describe("GameLayout balance management", () => {
  it("decreases the balance immediately after dealing", () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");

    // Default 1st Shot bet is 10, default 5 Shot bet is 5.
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));

    // Balance should decrease by 10 + 5 = 15 immediately.
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 185");
  });

  it("resets balance to 200 when it would reach zero or below", async () => {
    const gameEngine = await import("../src/lib/gameEngine");
    vi.mocked(gameEngine.resolveRoundFromCards).mockReturnValueOnce({
      decision: "raise",
      holeCards: [{ rank: 14, suit: "S" }, { rank: 13, suit: "S" }] as never,
      communityCards: [{ rank: 12, suit: "S" }, { rank: 2, suit: "D" }, { rank: 3, suit: "H" }] as never,
      firstShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 5, payoutMultiplier: 0, winnings: 0 },
      secondShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 5, payoutMultiplier: 0, winnings: 0 },
      thirdShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 5, payoutMultiplier: 0, winnings: 0 },
      fiveShot: null,
      totalBet: 200,
      totalWinnings: 0,
      totalNet: -200,
    });

    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");

    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    // Balance would reach 0, so it should reset to 200.
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");
  });
});
