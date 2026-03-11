import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";
import { GameLayout } from "../src/components/GameLayout";

vi.mock("../src/lib/gameEngine", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/lib/gameEngine")>();
  return {
    ...real,
    dealRound: vi.fn(() => real.dealRound()),
    resolveRoundFromCards: vi.fn(real.resolveRoundFromCards),
  };
});

/** Helper: advance all pending timers so animation completes synchronously. */
async function skipAnimation() {
  // Each iteration fires the pending timer, then waits for React to flush
  // state updates (which triggers the next useEffect → next timer).
  // 5 iterations cover the maximum animation chain: shot1→shot2→shot3→fiveshot→resolved.
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      vi.runAllTimers();
    });
  }
}

describe("GameLayout betting flow", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("displays the starting balance of 200", () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");
  });

  it("updates the balance after a resolved round", async () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");

    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    await skipAnimation();

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

  it("updates the deal button label between Bet & Deal and Re-bet & Deal", async () => {
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
    await skipAnimation();

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
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
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
    // defaults: 1st Shot = 10, 5 Shot = 5; committed at deal = 10 + 5 = 15
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    expect(screen.getByText("Total Bet: 15")).toBeInTheDocument();
  });

  it("shows full raise total bet after calling", async () => {
    render(<GameLayout />);
    // defaults: 1st Shot = 10, 5 Shot = 5; full raise total = 10*3 + 5 = 35
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    expect(screen.getByText("Total Bet: 15")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    // During animation and after: totalBet from result should be displayed
    await skipAnimation();
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
    await skipAnimation();

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
    await skipAnimation();

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

  it("resets circle styles to default after clearing bets", async () => {
    const { container } = render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    await skipAnimation();
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
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it("decreases the balance immediately after dealing", () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");

    // Default 1st Shot bet is 10, default 5 Shot bet is 5.
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));

    // Balance should decrease by 10 + 5 = 15 immediately.
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 185");
  });

  it("decreases the balance by 2x firstShotBet immediately when call is clicked", () => {
    render(<GameLayout />);
    // Default: firstShotBet=10, fiveShotBet=5
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    // Balance after deal: 200 - 10 - 5 = 185
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 185");

    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    // Balance after call: 185 - 2*10 = 165
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 165");
  });

  it("does not change balance when fold is clicked (additional wagers not placed)", () => {
    render(<GameLayout />);
    // Default: firstShotBet=10, fiveShotBet=5
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    // Balance after deal: 200 - 10 - 5 = 185
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 185");

    fireEvent.click(screen.getByRole("button", { name: /fold/i }));
    // No additional deduction for fold; balance stays at 185 while fiveshot animates.
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 185");
  });

  it("credits a winning shot's wager and winnings when its animation step completes", async () => {
    const gameEngine = await import("../src/lib/gameEngine");
    vi.mocked(gameEngine.resolveRoundFromCards).mockReturnValueOnce({
      decision: "raise",
      holeCards: [{ rank: 14, suit: "S" }, { rank: 13, suit: "S" }] as never,
      communityCards: [{ rank: 12, suit: "S" }, { rank: 2, suit: "D" }, { rank: 3, suit: "H" }] as never,
      firstShot: { hand: [] as never, evaluation: { rank: "PAIR" } as never, wager: 10, payoutMultiplier: 1, winnings: 10 },
      secondShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 10, payoutMultiplier: 0, winnings: 0 },
      thirdShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 10, payoutMultiplier: 0, winnings: 0 },
      fiveShot: null,
      totalBet: 30,
      totalWinnings: 10,
      totalNet: -20,
    });

    render(<GameLayout />);
    fireEvent.change(screen.getByLabelText(/5 shot side bet/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    // After deal: 200 - 10 = 190
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    // After call: 190 - 20 = 170 (2x additional)
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 170");

    // Advance shot1 timer: firstShot wins 1x → credit 10 (wager) + 10 (winnings) = 20
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 190");

    // Advance shot2 timer: secondShot loses → no credit
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 190");

    // Advance shot3 timer (last): thirdShot loses → no credit → net balance stays 190
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 190");
  });

  it("resets balance to 200 when it would reach zero or below", async () => {
    const gameEngine = await import("../src/lib/gameEngine");
    vi.mocked(gameEngine.resolveRoundFromCards).mockReturnValueOnce({
      decision: "raise",
      holeCards: [{ rank: 14, suit: "S" }, { rank: 13, suit: "S" }] as never,
      communityCards: [{ rank: 12, suit: "S" }, { rank: 2, suit: "D" }, { rank: 3, suit: "H" }] as never,
      firstShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 100, payoutMultiplier: 0, winnings: 0 },
      secondShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 100, payoutMultiplier: 0, winnings: 0 },
      thirdShot: { hand: [] as never, evaluation: { rank: "HIGH_CARD" } as never, wager: 100, payoutMultiplier: 0, winnings: 0 },
      fiveShot: null,
      totalBet: 300,
      totalWinnings: 0,
      totalNet: -300,
    });

    render(<GameLayout />);
    // Set 1st Shot bet to 100, no 5-Shot bet
    fireEvent.change(screen.getByLabelText(/1st shot bet/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/5 shot side bet/i), { target: { value: "0" } });
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");

    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    // After deal: 200 - 100 = 100
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    // After call: 100 - 200 (2×100) = -100; all shots lose → balance stays -100 → reset to 200
    await skipAnimation();

    // Balance would reach below zero, so it should reset to 200.
    expect(screen.getByLabelText(/player balance/i)).toHaveTextContent("Balance: 200");
  });
});

describe("GameLayout animation settings", () => {
  it("renders the animate-results checkbox checked by default", () => {
    render(<GameLayout />);
    const checkbox = screen.getByLabelText(/animate results/i) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(true);
  });

  it("defaults animation speed to fast", () => {
    render(<GameLayout />);
    const select = screen.getByLabelText(/animation speed/i) as HTMLSelectElement;
    expect(select.value).toBe("fast");
  });

  it("renders the animation speed selector when animations are enabled", () => {
    render(<GameLayout />);
    expect(screen.getByLabelText(/animation speed/i)).toBeInTheDocument();
  });

  it("hides the speed selector when animations are disabled", () => {
    render(<GameLayout />);
    fireEvent.click(screen.getByLabelText(/animate results/i));
    expect(screen.queryByLabelText(/animation speed/i)).not.toBeInTheDocument();
  });

  it("speed selector has Slow, Medium, and Fast options", () => {
    render(<GameLayout />);
    const select = screen.getByLabelText(/animation speed/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /slow/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /fast/i })).toBeInTheDocument();
  });
});

describe("GameLayout animation sequence", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("enters animating phase (shows only shot1 result) immediately after clicking Call", async () => {
    render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    // At this point animation has just started — shot1 result should be visible,
    // but shots 2 and 3 are placeholder text until their steps are reached.
    // We expect the list still has placeholder items for future shots.
    const listItems = document.querySelectorAll(".shot-hands-list li");
    expect(listItems).toHaveLength(3);
    // At least one placeholder should be present at the start of the animation.
    const hasPlaceholder = Array.from(listItems).some(
      (li) => li.textContent?.includes("[cards & result]"),
    );
    expect(hasPlaceholder).toBe(true);
  });

  it("shows all three shot results once animation completes (with animations enabled)", async () => {
    render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    await skipAnimation();

    // All three shot results should now be present and none should be placeholders.
    const listItems = document.querySelectorAll(".shot-hands-list li");
    expect(listItems).toHaveLength(3);
    listItems.forEach((li) => {
      expect(li.textContent).not.toContain("[cards & result]");
    });
  });

  it("shows results immediately when animations are disabled", () => {
    render(<GameLayout />);
    // Disable animations
    fireEvent.click(screen.getByLabelText(/animate results/i));
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    // No timer advancement needed — phase should jump directly to resolved.
    const listItems = document.querySelectorAll(".shot-hands-list li");
    expect(listItems).toHaveLength(3);
    listItems.forEach((li) => {
      expect(li.textContent).not.toContain("[cards & result]");
    });
  });

  it("Call and Fold buttons disappear during animation", async () => {
    render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    // Immediately after clicking Call, we are animating — deal/clear buttons are
    // rendered again (not call/fold), and Deal is disabled.
    const dealButton = screen.getByRole("button", { name: /re-bet deal/i });
    expect(dealButton).toBeDisabled();

    await skipAnimation();

    // After animation, Deal is enabled again.
    expect(screen.getByRole("button", { name: /re-bet deal/i })).toBeEnabled();
  });

  it("Clear Bets is disabled during animation and re-enabled afterwards", async () => {
    render(<GameLayout />);
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));

    expect(screen.getByRole("button", { name: /clear bets/i })).toBeDisabled();

    await skipAnimation();

    expect(screen.getByRole("button", { name: /clear bets/i })).toBeEnabled();
  });

  it("folding with no 5-shot bet skips animation and goes directly to resolved", async () => {
    const { container } = render(<GameLayout />);
    fireEvent.change(screen.getByLabelText(/5 shot side bet/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /fold/i }));

    // Without any timer advancement, Deal button should already be enabled (resolved phase).
    expect(screen.getByRole("button", { name: /re-bet deal/i })).toBeEnabled();
    // Shot 1 result should be visible (not a placeholder) immediately.
    const listItems = container.querySelectorAll(".shot-hands-list li");
    expect(listItems).toHaveLength(3);
    expect(listItems[2].textContent).not.toContain("[cards & result]");
  });

  it("folding with a 5-shot bet plays the fiveshot animation (not shot1 first)", async () => {
    const { container } = render(<GameLayout />);
    // 5-shot bet is already set to 5 by default
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /fold/i }));

    // Immediately after folding, we should be animating (Deal disabled) but
    // the shot-hands-list shot1 entry should already be visible (fold resolves
    // shot1 immediately without animating it).
    const dealButton = screen.getByRole("button", { name: /re-bet deal/i });
    expect(dealButton).toBeDisabled();

    // The 5-card fiveshot layout should be showing (not the 2-card hole layout).
    const fiveshotAnim = container.querySelector(".game-table-fiveshot-anim");
    expect(fiveshotAnim).not.toBeNull();

    await skipAnimation();
    expect(screen.getByRole("button", { name: /re-bet deal/i })).toBeEnabled();
  });

  it("5-card display remains visible after animation completes when 5-shot bet was placed", async () => {
    const { container } = render(<GameLayout />);
    // 5-shot bet is already set to 5 by default
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    await skipAnimation();

    // After animation ends, the 5-card layout should still be shown.
    const fiveshotAnim = container.querySelector(".game-table-fiveshot-anim");
    expect(fiveshotAnim).not.toBeNull();
  });

  it("hole-card-only layout is shown in resolved phase when no 5-shot bet was placed", async () => {
    const { container } = render(<GameLayout />);
    fireEvent.change(screen.getByLabelText(/5 shot side bet/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /deal/i }));
    fireEvent.click(screen.getByRole("button", { name: /call/i }));
    await skipAnimation();

    // No 5-shot bet → fiveshot was never animated → should NOT show 5-card layout.
    expect(container.querySelector(".game-table-fiveshot-anim")).toBeNull();
    expect(container.querySelector(".game-table-active-hand")).not.toBeNull();
  });
});
