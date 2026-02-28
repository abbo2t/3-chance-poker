import { Card, FiveCardHandPayoutRank, Rank, Suit, ThreeCardHandRank } from "./pokerTypes";

export interface ThreeCardHandEvaluation {
  rank: ThreeCardHandRank;
}

export interface FiveCardHandEvaluation {
  rank: FiveCardHandPayoutRank;
}

function sortRanksAscending(cards: Card[]): number[] {
  return cards
    .map((c) => c.rank)
    .slice()
    .sort((a, b) => a - b);
}

function isFlush(cards: Card[]): boolean {
  return cards.every((c) => c.suit === cards[0]?.suit);
}

function isThreeOfAKind(cards: Card[]): boolean {
  const [a, b, c] = cards.map((card) => card.rank);
  return a === b && b === c;
}

function isPair(cards: Card[]): boolean {
  const [a, b, c] = cards.map((card) => card.rank).sort((x, y) => x - y);
  return a === b || b === c;
}

// In this game, "Mini Royal" is treated as suited A-K-Q.
function isMiniRoyal(cards: Card[]): boolean {
  if (!isFlush(cards)) return false;
  const ranks = sortRanksAscending(cards);
  const needed = [Rank.Queen, Rank.King, Rank.Ace].sort((a, b) => a - b);
  return (
    ranks.length === 3 &&
    ranks[0] === needed[0] &&
    ranks[1] === needed[1] &&
    ranks[2] === needed[2]
  );
}

// Determine whether three cards form a straight, treating A-2-3 and Q-K-A as valid.
function isStraightThreeCard(cards: Card[]): boolean {
  const ranks = sortRanksAscending(cards);
  const [r0, r1, r2] = ranks;

  // Handle duplicates early.
  if (r0 === r1 || r1 === r2) return false;

  // Normal consecutive pattern.
  if (r0 + 1 === r1 && r1 + 1 === r2) return true;

  // A-2-3 (2,3,14) low straight.
  if (r0 === Rank.Two && r1 === Rank.Three && r2 === Rank.Ace) return true;

  // Q-K-A (12,13,14) high straight.
  if (r0 === Rank.Queen && r1 === Rank.King && r2 === Rank.Ace) return true;

  return false;
}

export function evaluateThreeCardHand(cards: Card[]): ThreeCardHandEvaluation {
  if (cards.length !== 3) {
    throw new Error("Three-card hand must contain exactly 3 cards");
  }

  const flush = isFlush(cards);
  const straight = isStraightThreeCard(cards);

  if (isMiniRoyal(cards)) {
    return { rank: ThreeCardHandRank.MiniRoyal };
  }

  if (flush && straight) {
    return { rank: ThreeCardHandRank.StraightFlush };
  }

  if (isThreeOfAKind(cards)) {
    return { rank: ThreeCardHandRank.ThreeOfAKind };
  }

  if (straight) {
    return { rank: ThreeCardHandRank.Straight };
  }

  if (flush) {
    return { rank: ThreeCardHandRank.Flush };
  }

  if (isPair(cards)) {
    return { rank: ThreeCardHandRank.Pair };
  }

  return { rank: ThreeCardHandRank.HighCard };
}

// 5-card evaluation will be added in the next step.
export function evaluateFiveCardHand(_cards: Card[]): FiveCardHandEvaluation {
  throw new Error("5-card evaluation not implemented yet");
}
