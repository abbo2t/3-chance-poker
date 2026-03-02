import { playRound } from "../src/lib/gameEngine";
import { Rank, Suit, type Card } from "../src/lib/pokerTypes";

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

describe("game engine - single round", () => {
  it("handles a raise with winning shots and 5 Shot", () => {
    // Pre-dealt cards chosen so that:
    // - 1st Shot: A-K-Q suited hearts => Mini Royal
    // - 2nd/3rd Shots: suited non-straight hearts => Flush
    // - 5 Shot: 10-J-Q-K-A hearts => Royal Flush
    const holeCards: [Card, Card] = [
      c(Rank.Ace, Suit.Hearts),
      c(Rank.King, Suit.Hearts),
    ];
    const communityCards: [Card, Card, Card] = [
      c(Rank.Queen, Suit.Hearts),
      c(Rank.Jack, Suit.Hearts),
      c(Rank.Ten, Suit.Hearts),
    ];

    const result = playRound({
      firstShotBet: 10,
      fiveShotBet: 5,
      decision: "raise",
      preDealt: { holeCards, communityCards },
    });

    expect(result.totalBet).toBe(10 + 10 + 10 + 5);

    // 1st Shot: Mini Royal pays 50:1 on Pay Table 2
    expect(result.firstShot.wager).toBe(10);
    expect(result.firstShot.payoutMultiplier).toBe(50);
    expect(result.firstShot.winnings).toBe(10 * 50);

    // 2nd/3rd Shots: flush (non-straight) paying 2:1
    expect(result.secondShot.wager).toBe(10);
    expect(result.secondShot.payoutMultiplier).toBe(2);
    expect(result.secondShot.winnings).toBe(20);

    expect(result.thirdShot.wager).toBe(10);
    expect(result.thirdShot.payoutMultiplier).toBe(2);
    expect(result.thirdShot.winnings).toBe(20);

    // 5 Shot: Royal Flush paying 500:1 on Pay Table 1
    expect(result.fiveShot).not.toBeNull();
    expect(result.fiveShot!.wager).toBe(5);
    expect(result.fiveShot!.payoutMultiplier).toBe(500);
    expect(result.fiveShot!.winnings).toBe(5 * 500);

    const expectedTotalWinnings = 10 * 50 + 20 + 20 + 5 * 500;
    expect(result.totalWinnings).toBe(expectedTotalWinnings);
    // All shots won, so no losing wagers. Net equals total winnings.
    expect(result.totalNet).toBe(expectedTotalWinnings);
  });

  it("handles a fold: 1st Shot lost, 5 Shot still resolves", () => {
    const holeCards: [Card, Card] = [
      c(Rank.Ace, Suit.Hearts),
      c(Rank.King, Suit.Hearts),
    ];
    const communityCards: [Card, Card, Card] = [
      c(Rank.Queen, Suit.Hearts),
      c(Rank.Jack, Suit.Hearts),
      c(Rank.Ten, Suit.Hearts),
    ];

    const result = playRound({
      firstShotBet: 10,
      fiveShotBet: 5,
      decision: "fold",
      preDealt: { holeCards, communityCards },
    });

    // On fold: player forfeits 1st Shot wager, 2nd/3rd are not placed.
    expect(result.firstShot.wager).toBe(10);
    expect(result.secondShot.wager).toBe(0);
    expect(result.thirdShot.wager).toBe(0);

    // No payout on 1st Shot even though the cards form a Mini Royal.
    expect(result.firstShot.payoutMultiplier).toBe(0);
    expect(result.firstShot.winnings).toBe(0);

    // 5 Shot still resolves as Royal Flush.
    expect(result.fiveShot).not.toBeNull();
    expect(result.fiveShot!.wager).toBe(5);
    expect(result.fiveShot!.payoutMultiplier).toBe(500);
    expect(result.fiveShot!.winnings).toBe(5 * 500);

    const expectedTotalBet = 10 + 0 + 0 + 5;
    const expectedTotalWinnings = 5 * 500;
    expect(result.totalBet).toBe(expectedTotalBet);
    expect(result.totalWinnings).toBe(expectedTotalWinnings);
    // 1st Shot wager (10) is lost on fold; 5 Shot wins. Net = 2500 - 10.
    expect(result.totalNet).toBe(expectedTotalWinnings - 10);
  });

  it("handles a round with no 5 Shot bet", () => {
    const holeCards: [Card, Card] = [
      c(Rank.Five, Suit.Clubs),
      c(Rank.Five, Suit.Diamonds),
    ];
    const communityCards: [Card, Card, Card] = [
      c(Rank.Five, Suit.Hearts),
      c(Rank.Two, Suit.Spades),
      c(Rank.Three, Suit.Clubs),
    ];

    const result = playRound({
      firstShotBet: 5,
      decision: "raise",
      fiveShotBet: 0,
      preDealt: { holeCards, communityCards },
    });

    // 1st Shot: three of a kind (5-5-5)
    expect(result.firstShot.payoutMultiplier).toBeGreaterThan(0);

    // No 5 Shot wager placed.
    expect(result.fiveShot).not.toBeNull();
    expect(result.fiveShot!.wager).toBe(0);
    expect(result.fiveShot!.winnings).toBe(0);

    const expectedTotalBet = 5 + 5 + 5 + 0;
    expect(result.totalBet).toBe(expectedTotalBet);
  });

  it("correctly computes net when some shots win and some lose (bug regression)", () => {
    // Reproduces the scenario from the bug report:
    //   1st Shot: HIGH_CARD  — Wager 10, Win 0  (loss)
    //   2nd Shot: PAIR       — Wager 10, Win 10 (1:1)
    //   3rd Shot: FLUSH      — Wager 10, Win 20 (2:1)
    //   5 Shot:   PAIR T+    — Wager  5, Win  5 (1:1)
    // totalBet=35, totalWinnings=35, but net should be +25 (not 0).
    const holeCards: [Card, Card] = [
      c(Rank.King, Suit.Diamonds),
      c(Rank.Five, Suit.Diamonds),
    ];
    // c1=6♣ → 1st Shot (K♦,5♦,6♣) = HIGH_CARD
    // c2=K♥ → 2nd Shot (K♦,5♦,K♥) = PAIR
    // c3=3♦ → 3rd Shot (K♦,5♦,3♦) = FLUSH
    // 5 Shot (K♦,5♦,6♣,K♥,3♦)   = PAIR_TENS_OR_BETTER
    const communityCards: [Card, Card, Card] = [
      c(Rank.Six, Suit.Clubs),
      c(Rank.King, Suit.Hearts),
      c(Rank.Three, Suit.Diamonds),
    ];

    const result = playRound({
      firstShotBet: 10,
      fiveShotBet: 5,
      decision: "raise",
      preDealt: { holeCards, communityCards },
    });

    expect(result.totalBet).toBe(35);
    expect(result.totalWinnings).toBe(35); // 0 + 10 + 20 + 5
    // Net must be +25, not 0: losing wager (10) is deducted, not all bets.
    expect(result.totalNet).toBe(25);
  });
  it("rejects invalid firstShotBet and fiveShotBet values", () => {
    const holeCards: [Card, Card] = [
      c(Rank.Ace, Suit.Spades),
      c(Rank.King, Suit.Spades),
    ];
    const communityCards: [Card, Card, Card] = [
      c(Rank.Queen, Suit.Spades),
      c(Rank.Jack, Suit.Spades),
      c(Rank.Ten, Suit.Spades),
    ];

    // firstShotBet must be > 0
    expect(() =>
      playRound({
        firstShotBet: 0,
        fiveShotBet: 0,
        decision: "raise",
        preDealt: { holeCards, communityCards },
      }),
    ).toThrow(/firstShotBet must be > 0/i);

    // fiveShotBet cannot be negative
    expect(() =>
      playRound({
        firstShotBet: 5,
        fiveShotBet: -1,
        decision: "raise",
        preDealt: { holeCards, communityCards },
      }),
    ).toThrow(/fiveShotBet cannot be negative/i);
  });
});
