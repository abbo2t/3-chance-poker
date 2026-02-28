import { evaluateFiveCardHand } from "../src/lib/handEvaluation";
import {
  Card,
  FiveCardHandPayoutRank,
  Rank,
  Suit,
} from "../src/lib/pokerTypes";

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

describe("five-card hand evaluation (5 Shot)", () => {
  it("detects a royal flush", () => {
    const hand = [
      c(Rank.Ten, Suit.Hearts),
      c(Rank.Jack, Suit.Hearts),
      c(Rank.Queen, Suit.Hearts),
      c(Rank.King, Suit.Hearts),
      c(Rank.Ace, Suit.Hearts),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.RoyalFlush);
  });

  it("detects a straight flush (non-royal)", () => {
    const hand = [
      c(Rank.Five, Suit.Clubs),
      c(Rank.Six, Suit.Clubs),
      c(Rank.Seven, Suit.Clubs),
      c(Rank.Eight, Suit.Clubs),
      c(Rank.Nine, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.StraightFlush);
  });

  it("detects four of a kind", () => {
    const hand = [
      c(Rank.Nine, Suit.Clubs),
      c(Rank.Nine, Suit.Diamonds),
      c(Rank.Nine, Suit.Hearts),
      c(Rank.Nine, Suit.Spades),
      c(Rank.Two, Suit.Hearts),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.FourOfAKind);
  });

  it("detects a full house", () => {
    const hand = [
      c(Rank.King, Suit.Clubs),
      c(Rank.King, Suit.Diamonds),
      c(Rank.King, Suit.Spades),
      c(Rank.Five, Suit.Clubs),
      c(Rank.Five, Suit.Diamonds),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.FullHouse);
  });

  it("detects a flush (non-straight)", () => {
    const hand = [
      c(Rank.Two, Suit.Spades),
      c(Rank.Five, Suit.Spades),
      c(Rank.Seven, Suit.Spades),
      c(Rank.Jack, Suit.Spades),
      c(Rank.King, Suit.Spades),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.Flush);
  });

  it("detects a straight", () => {
    const hand = [
      c(Rank.Four, Suit.Clubs),
      c(Rank.Five, Suit.Diamonds),
      c(Rank.Six, Suit.Hearts),
      c(Rank.Seven, Suit.Spades),
      c(Rank.Eight, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.Straight);
  });

  it("detects an A-2-3-4-5 wheel straight", () => {
    const hand = [
      c(Rank.Ace, Suit.Clubs),
      c(Rank.Two, Suit.Diamonds),
      c(Rank.Three, Suit.Hearts),
      c(Rank.Four, Suit.Spades),
      c(Rank.Five, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.Straight);
  });

  it("detects a non-flush 10-J-Q-K-A as a straight (not royal)", () => {
    const hand = [
      c(Rank.Ten, Suit.Clubs),
      c(Rank.Jack, Suit.Diamonds),
      c(Rank.Queen, Suit.Hearts),
      c(Rank.King, Suit.Spades),
      c(Rank.Ace, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.Straight);
  });

  it("detects three of a kind", () => {
    const hand = [
      c(Rank.Seven, Suit.Clubs),
      c(Rank.Seven, Suit.Diamonds),
      c(Rank.Seven, Suit.Hearts),
      c(Rank.Two, Suit.Spades),
      c(Rank.Nine, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.ThreeOfAKind);
  });

  it("detects two pair", () => {
    const hand = [
      c(Rank.Jack, Suit.Clubs),
      c(Rank.Jack, Suit.Hearts),
      c(Rank.Four, Suit.Diamonds),
      c(Rank.Four, Suit.Spades),
      c(Rank.Two, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.TwoPair);
  });

  it("detects a pair of Tens or better", () => {
    const hand = [
      c(Rank.Ten, Suit.Clubs),
      c(Rank.Ten, Suit.Hearts),
      c(Rank.Three, Suit.Diamonds),
      c(Rank.Six, Suit.Spades),
      c(Rank.Eight, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.PairTensOrBetter);
  });

  it("treats lower pairs as All Other", () => {
    const hand = [
      c(Rank.Nine, Suit.Clubs),
      c(Rank.Nine, Suit.Hearts),
      c(Rank.Three, Suit.Diamonds),
      c(Rank.Six, Suit.Spades),
      c(Rank.Eight, Suit.Clubs),
    ];
    const result = evaluateFiveCardHand(hand);
    expect(result.rank).toBe(FiveCardHandPayoutRank.AllOther);
  });

  it("throws if given a non-five-card hand", () => {
    const tooFew: Card[] = [c(Rank.Ace, Suit.Clubs), c(Rank.King, Suit.Clubs)];
    const tooMany: Card[] = [
      c(Rank.Ace, Suit.Clubs),
      c(Rank.King, Suit.Clubs),
      c(Rank.Queen, Suit.Clubs),
      c(Rank.Jack, Suit.Clubs),
      c(Rank.Ten, Suit.Clubs),
      c(Rank.Nine, Suit.Clubs),
    ];

    expect(() => evaluateFiveCardHand(tooFew)).toThrow();
    expect(() => evaluateFiveCardHand(tooMany)).toThrow();
  });
});
