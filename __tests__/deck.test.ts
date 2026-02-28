import { createDeck, shuffle } from "../src/lib/deck";
import { Rank, Suit } from "../src/lib/pokerTypes";

function cardKey(rank: Rank, suit: Suit): string {
  return `${rank}-${suit}`;
}

describe("deck utilities", () => {
  it("creates a standard 52-card deck with unique cards", () => {
    const deck = createDeck();

    expect(deck).toHaveLength(52);

    const seen = new Set<string>();
    for (const card of deck) {
      const key = cardKey(card.rank, card.suit);
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }

    // Ensure all rank/suit combinations are present
    const suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
    const ranks = [
      Rank.Two,
      Rank.Three,
      Rank.Four,
      Rank.Five,
      Rank.Six,
      Rank.Seven,
      Rank.Eight,
      Rank.Nine,
      Rank.Ten,
      Rank.Jack,
      Rank.Queen,
      Rank.King,
      Rank.Ace,
    ];

    for (const suit of suits) {
      for (const rank of ranks) {
        const key = cardKey(rank, suit);
        expect(seen.has(key)).toBe(true);
      }
    }
  });

  it("shuffles without mutating the original array and keeps all items", () => {
    const deck = createDeck();

    // Deterministic RNG for predictable behavior in tests.
    let seed = 1;
    const rng = () => {
      // Simple LCG-like generator just for determinism in tests.
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    const shuffled = shuffle(deck, rng);

    // Original deck should be unchanged in order.
    expect(deck).not.toBe(shuffled);
    expect(deck).toHaveLength(52);
    expect(shuffled).toHaveLength(52);

    // Same multiset of cards.
    const originalKeys = deck.map((c) => cardKey(c.rank, c.suit)).sort();
    const shuffledKeys = shuffled.map((c) => cardKey(c.rank, c.suit)).sort();
    expect(shuffledKeys).toEqual(originalKeys);
  });
});
