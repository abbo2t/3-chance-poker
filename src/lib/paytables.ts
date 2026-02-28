import {
  FiveCardHandPayoutRank,
  ThreeCardHandRank,
  type FiveCardPaytableEntry,
  type ThreeCardPaytableEntry,
} from "./pokerTypes";

// Grand Sierra configuration
// - 1st/2nd/3rd Shot: Pay Table 2
// - 5 Shot: Pay Table 1

export const GRAND_SIERRA_SHOT_PAYTABLE: Readonly<ThreeCardPaytableEntry[]> = [
  { hand: ThreeCardHandRank.MiniRoyal, payout: 50 },
  { hand: ThreeCardHandRank.StraightFlush, payout: 30 },
  { hand: ThreeCardHandRank.ThreeOfAKind, payout: 20 },
  { hand: ThreeCardHandRank.Straight, payout: 4 },
  { hand: ThreeCardHandRank.Flush, payout: 2 },
  { hand: ThreeCardHandRank.Pair, payout: 1 },
  // High card / all other is a loss and omitted here.
];

export const GRAND_SIERRA_FIVE_SHOT_PAYTABLE: Readonly<FiveCardPaytableEntry[]> = [
  { hand: FiveCardHandPayoutRank.RoyalFlush, payout: 500 },
  { hand: FiveCardHandPayoutRank.StraightFlush, payout: 200 },
  { hand: FiveCardHandPayoutRank.FourOfAKind, payout: 50 },
  { hand: FiveCardHandPayoutRank.FullHouse, payout: 40 },
  { hand: FiveCardHandPayoutRank.Flush, payout: 30 },
  { hand: FiveCardHandPayoutRank.Straight, payout: 20 },
  { hand: FiveCardHandPayoutRank.ThreeOfAKind, payout: 10 },
  { hand: FiveCardHandPayoutRank.TwoPair, payout: 2 },
  { hand: FiveCardHandPayoutRank.PairTensOrBetter, payout: 1 },
  // All other is a loss and omitted here.
];
