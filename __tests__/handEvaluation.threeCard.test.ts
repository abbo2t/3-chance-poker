import { evaluateThreeCardHand } from "../src/lib/handEvaluation";
import { Card, Rank, Suit, ThreeCardHandRank } from "../src/lib/pokerTypes";

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

describe("three-card hand evaluation", () => {
  it("detects a Mini Royal (suited A-K-Q)", () => {
    const hand = [c(Rank.Ace, Suit.Hearts), c(Rank.King, Suit.Hearts), c(Rank.Queen, Suit.Hearts)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.MiniRoyal);
  });

  it("detects a straight flush that is not a Mini Royal", () => {
    const hand = [c(Rank.Seven, Suit.Clubs), c(Rank.Eight, Suit.Clubs), c(Rank.Nine, Suit.Clubs)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.StraightFlush);
  });

  it("detects three of a kind", () => {
    const hand = [c(Rank.Five, Suit.Clubs), c(Rank.Five, Suit.Diamonds), c(Rank.Five, Suit.Spades)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.ThreeOfAKind);
  });

  it("detects a straight (non-flush)", () => {
    const hand = [c(Rank.Four, Suit.Clubs), c(Rank.Five, Suit.Diamonds), c(Rank.Six, Suit.Hearts)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.Straight);
  });

  it("detects A-2-3 as a straight", () => {
    const hand = [c(Rank.Ace, Suit.Clubs), c(Rank.Two, Suit.Diamonds), c(Rank.Three, Suit.Hearts)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.Straight);
  });

  it("detects Q-K-A as a straight", () => {
    const hand = [c(Rank.Queen, Suit.Clubs), c(Rank.Ace, Suit.Diamonds), c(Rank.King, Suit.Hearts)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.Straight);
  });

  it("detects a flush (non-straight)", () => {
    const hand = [c(Rank.Two, Suit.Spades), c(Rank.Five, Suit.Spades), c(Rank.Nine, Suit.Spades)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.Flush);
  });

  it("detects a pair", () => {
    const hand = [c(Rank.Nine, Suit.Clubs), c(Rank.Nine, Suit.Hearts), c(Rank.Four, Suit.Spades)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.Pair);
  });

  it("falls back to high card when no other hand is present", () => {
    const hand = [c(Rank.Two, Suit.Clubs), c(Rank.Five, Suit.Diamonds), c(Rank.Nine, Suit.Hearts)];
    const result = evaluateThreeCardHand(hand);
    expect(result.rank).toBe(ThreeCardHandRank.HighCard);
  });

  it("throws if given a non-three-card hand", () => {
    const handTooSmall: Card[] = [c(Rank.Ace, Suit.Clubs)];
    const handTooLarge: Card[] = [
      c(Rank.Ace, Suit.Clubs),
      c(Rank.King, Suit.Clubs),
      c(Rank.Queen, Suit.Clubs),
      c(Rank.Jack, Suit.Clubs),
    ];

    expect(() => evaluateThreeCardHand(handTooSmall)).toThrow();
    expect(() => evaluateThreeCardHand(handTooLarge)).toThrow();
  });
});
