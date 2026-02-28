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

function getRankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

function isFlushFive(cards: Card[]): boolean {
  return cards.every((c) => c.suit === cards[0]?.suit);
}

function isStraightFive(cards: Card[]): boolean {
  const ranks = cards
    .map((c) => c.rank)
    .slice()
    .sort((a, b) => a - b);

  // Reject duplicates for straight purposes.
  for (let i = 1; i < ranks.length; i += 1) {
    if (ranks[i] === ranks[i - 1]) {
      return false;
    }
  }

  // Normal consecutive pattern.
  const isConsecutive = ranks.every((r, idx) => idx === 0 || r === ranks[0] + idx);
  if (isConsecutive) {
    return true;
  }

  // Wheel straight: A-2-3-4-5
  const wheel = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Ace].sort(
    (a, b) => a - b,
  );
  const isWheel = ranks.every((r, idx) => r === wheel[idx]);
  if (isWheel) {
    return true;
  }

  return false;
}

function isRoyalFlush(cards: Card[]): boolean {
  if (!isFlushFive(cards)) return false;

  const ranks = cards
    .map((c) => c.rank)
    .slice()
    .sort((a, b) => a - b);
  const royal = [Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
  return royal.every((r, idx) => r === ranks[idx]);
}

export function evaluateFiveCardHand(cards: Card[]): FiveCardHandEvaluation {
  if (cards.length !== 5) {
    throw new Error("Five-card hand must contain exactly 5 cards");
  }

  const flush = isFlushFive(cards);
  const straight = isStraightFive(cards);
  const rankCounts = getRankCounts(cards);
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  const hasFourOfAKind = counts[0] === 4;
  const hasThreeOfAKind = counts[0] === 3;
  const pairCount = counts.filter((c) => c === 2).length;
  const isFullHouse = hasThreeOfAKind && pairCount === 1;

  if (isRoyalFlush(cards)) {
    return { rank: FiveCardHandPayoutRank.RoyalFlush };
  }

  if (flush && straight) {
    return { rank: FiveCardHandPayoutRank.StraightFlush };
  }

  if (hasFourOfAKind) {
    return { rank: FiveCardHandPayoutRank.FourOfAKind };
  }

  if (isFullHouse) {
    return { rank: FiveCardHandPayoutRank.FullHouse };
  }

  if (flush) {
    return { rank: FiveCardHandPayoutRank.Flush };
  }

  if (straight) {
    return { rank: FiveCardHandPayoutRank.Straight };
  }

  if (hasThreeOfAKind) {
    return { rank: FiveCardHandPayoutRank.ThreeOfAKind };
  }

  if (pairCount === 2) {
    return { rank: FiveCardHandPayoutRank.TwoPair };
  }

  if (pairCount === 1) {
    // Exactly one pair: check if it's Tens or better.
    let pairRank: Rank | null = null;
    for (const [rank, count] of rankCounts.entries()) {
      if (count === 2) {
        pairRank = rank;
        break;
      }
    }

    if (
      pairRank !== null &&
      (pairRank === Rank.Ten ||
        pairRank === Rank.Jack ||
        pairRank === Rank.Queen ||
        pairRank === Rank.King ||
        pairRank === Rank.Ace)
    ) {
      return { rank: FiveCardHandPayoutRank.PairTensOrBetter };
    }
  }

  return { rank: FiveCardHandPayoutRank.AllOther };
}
