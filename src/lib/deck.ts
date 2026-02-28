import { Card, Rank, Suit } from "./pokerTypes";

/**
 * Create a standard 52-card deck.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

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
      deck.push({ rank, suit });
    }
  }

  return deck;
}

/**
 * Return a new array containing a shuffled copy of the given items.
 * An optional RNG can be provided for determinism in tests/simulations.
 */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const array = [...items];

  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}
