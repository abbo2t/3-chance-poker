// Core poker-related types and enums shared across the app.

export enum Suit {
  Clubs = "C",
  Diamonds = "D",
  Hearts = "H",
  Spades = "S",
}

export enum Rank {
  Two = 2,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
  Ace,
}

export type Card = {
  rank: Rank;
  suit: Suit;
};

// 3-card hand ranks for the 1st/2nd/3rd Shot wagers.
export enum ThreeCardHandRank {
  MiniRoyal = "MINI_ROYAL",
  StraightFlush = "STRAIGHT_FLUSH",
  ThreeOfAKind = "THREE_OF_A_KIND",
  Straight = "STRAIGHT",
  Flush = "FLUSH",
  Pair = "PAIR",
  HighCard = "HIGH_CARD", // "All other" for 3-card shots
}

// 5-card hand ranks / payout categories for the 5 Shot wager.
export enum FiveCardHandPayoutRank {
  RoyalFlush = "ROYAL_FLUSH",
  StraightFlush = "STRAIGHT_FLUSH",
  FourOfAKind = "FOUR_OF_A_KIND",
  FullHouse = "FULL_HOUSE",
  Flush = "FLUSH",
  Straight = "STRAIGHT",
  ThreeOfAKind = "THREE_OF_A_KIND",
  TwoPair = "TWO_PAIR",
  PairTensOrBetter = "PAIR_TENS_OR_BETTER",
  AllOther = "ALL_OTHER", // loss
}

// Generic paytable entry: a hand category mapped to a to-one payout multiple.
export interface PaytableEntry<RankType> {
  hand: RankType;
  payout: number; // 0 can be treated as a loss
}

export type ThreeCardPaytableEntry = PaytableEntry<ThreeCardHandRank>;
export type FiveCardPaytableEntry = PaytableEntry<FiveCardHandPayoutRank>;
