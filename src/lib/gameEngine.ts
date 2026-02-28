import { createDeck, shuffle } from "./deck";
import {
  evaluateFiveCardHand,
  evaluateThreeCardHand,
} from "./handEvaluation";
import {
  GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
  GRAND_SIERRA_SHOT_PAYTABLE,
} from "./paytables";
import {
  type Card,
  type FiveCardPaytableEntry,
  type ThreeCardPaytableEntry,
  FiveCardHandPayoutRank,
  ThreeCardHandRank,
} from "./pokerTypes";

export type PlayerDecision = "raise" | "fold";

export interface GameConfig {
  shotPaytable: readonly ThreeCardPaytableEntry[];
  fiveShotPaytable: readonly FiveCardPaytableEntry[];
}

export const GRAND_SIERRA_CONFIG: GameConfig = {
  shotPaytable: GRAND_SIERRA_SHOT_PAYTABLE,
  fiveShotPaytable: GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
};

export interface DealtRoundCards {
  holeCards: [Card, Card];
  communityCards: [Card, Card, Card];
}

export interface ShotResult {
  hand: [Card, Card, Card];
  evaluation: {
    rank: ThreeCardHandRank;
  };
  wager: number;
  payoutMultiplier: number;
  winnings: number; // to-one winnings (profit); 0 on loss
}

export interface FiveShotResult {
  hand: [Card, Card, Card, Card, Card];
  evaluation: {
    rank: FiveCardHandPayoutRank;
  };
  wager: number;
  payoutMultiplier: number;
  winnings: number; // to-one winnings (profit); 0 on loss
}

export interface RoundOptions {
  firstShotBet: number;
  fiveShotBet?: number;
  decision: PlayerDecision;
  config?: GameConfig;
  rng?: () => number;
  preDealt?: DealtRoundCards;
}

export interface RoundResult {
  decision: PlayerDecision;
  holeCards: [Card, Card];
  communityCards: [Card, Card, Card];
  firstShot: ShotResult;
  secondShot: ShotResult;
  thirdShot: ShotResult;
  fiveShot: FiveShotResult | null;
  totalBet: number;
  totalWinnings: number; // sum of to-one winnings
  totalNet: number; // totalWinnings - totalBet
}

function getThreeCardPayoutMultiplier(
  rank: ThreeCardHandRank,
  table: readonly ThreeCardPaytableEntry[],
): number {
  const entry = table.find((e) => e.hand === rank);
  return entry?.payout ?? 0;
}

function getFiveCardPayoutMultiplier(
  rank: FiveCardHandPayoutRank,
  table: readonly FiveCardPaytableEntry[],
): number {
  const entry = table.find((e) => e.hand === rank);
  return entry?.payout ?? 0;
}

export function dealRound(rng: () => number = Math.random): DealtRoundCards {
  const deck = shuffle(createDeck(), rng);
  const [h1, h2, c1, c2, c3] = deck;
  return {
    holeCards: [h1, h2],
    communityCards: [c1, c2, c3],
  };
}

interface InternalRoundComputeOptions {
  firstShotBet: number;
  fiveShotBet: number;
  decision: PlayerDecision;
  config: GameConfig;
}

function computeRoundFromCards(
  cards: DealtRoundCards,
  options: InternalRoundComputeOptions,
): RoundResult {
  const { firstShotBet, fiveShotBet, decision, config } = options;

  const { holeCards, communityCards } = cards;

  const [h1, h2] = holeCards;
  const [c1, c2, c3] = communityCards;

  const firstShotHand: [Card, Card, Card] = [h1, h2, c1];
  const secondShotHand: [Card, Card, Card] = [h1, h2, c2];
  const thirdShotHand: [Card, Card, Card] = [h1, h2, c3];

  const firstEval = evaluateThreeCardHand(firstShotHand);
  const secondEval = evaluateThreeCardHand(secondShotHand);
  const thirdEval = evaluateThreeCardHand(thirdShotHand);

  // On a fold, the 1st Shot wager is forfeited and 2nd/3rd are never placed.
  const firstWager = firstShotBet;
  const secondWager = decision === "raise" ? firstShotBet : 0;
  const thirdWager = decision === "raise" ? firstShotBet : 0;

  const firstMultiplier =
    decision === "fold"
      ? 0
      : getThreeCardPayoutMultiplier(firstEval.rank, config.shotPaytable);
  const secondMultiplier = getThreeCardPayoutMultiplier(
    secondEval.rank,
    config.shotPaytable,
  );
  const thirdMultiplier = getThreeCardPayoutMultiplier(
    thirdEval.rank,
    config.shotPaytable,
  );

  const firstWinnings = firstWager * firstMultiplier;
  const secondWinnings = secondWager * secondMultiplier;
  const thirdWinnings = thirdWager * thirdMultiplier;

  const firstShot: ShotResult = {
    hand: firstShotHand,
    evaluation: firstEval,
    wager: firstWager,
    payoutMultiplier: firstMultiplier,
    winnings: firstWinnings,
  };

  const secondShot: ShotResult = {
    hand: secondShotHand,
    evaluation: secondEval,
    wager: secondWager,
    payoutMultiplier: secondMultiplier,
    winnings: secondWinnings,
  };

  const thirdShot: ShotResult = {
    hand: thirdShotHand,
    evaluation: thirdEval,
    wager: thirdWager,
    payoutMultiplier: thirdMultiplier,
    winnings: thirdWinnings,
  };

  // 5 Shot wager always resolves (if placed), even if the player folds.
  const fiveShotHand: [Card, Card, Card, Card, Card] = [
    h1,
    h2,
    c1,
    c2,
    c3,
  ];
  const fiveEval = evaluateFiveCardHand(fiveShotHand);
  const fiveMultiplier = getFiveCardPayoutMultiplier(
    fiveEval.rank,
    config.fiveShotPaytable,
  );
  const fiveWinnings = fiveShotBet * fiveMultiplier;

  const fiveShot: FiveShotResult | null = {
    hand: fiveShotHand,
    evaluation: fiveEval,
    wager: fiveShotBet,
    payoutMultiplier: fiveMultiplier,
    winnings: fiveWinnings,
  };

  const totalBet = firstWager + secondWager + thirdWager + fiveShotBet;
  const totalWinnings =
    firstWinnings + secondWinnings + thirdWinnings + fiveWinnings;
  const totalNet = totalWinnings - totalBet;

  return {
    decision,
    holeCards,
    communityCards,
    firstShot,
    secondShot,
    thirdShot,
    fiveShot,
    totalBet,
    totalWinnings,
    totalNet,
  };
}

export interface ResolveRoundOptions {
  firstShotBet: number;
  fiveShotBet?: number;
  decision: PlayerDecision;
  config?: GameConfig;
}

export function resolveRoundFromCards(
  cards: DealtRoundCards,
  options: ResolveRoundOptions,
): RoundResult {
  const { firstShotBet, decision, config = GRAND_SIERRA_CONFIG } = options;
  const fiveShotBet = options.fiveShotBet ?? 0;

  if (firstShotBet <= 0) {
    throw new Error("firstShotBet must be > 0");
  }
  if (fiveShotBet < 0) {
    throw new Error("fiveShotBet cannot be negative");
  }

  return computeRoundFromCards(cards, {
    firstShotBet,
    fiveShotBet,
    decision,
    config,
  });
}

export function playRound(options: RoundOptions): RoundResult {
  const {
    firstShotBet,
    fiveShotBet = 0,
    decision,
    config = GRAND_SIERRA_CONFIG,
    rng = Math.random,
    preDealt,
  } = options;

  if (firstShotBet <= 0) {
    throw new Error("firstShotBet must be > 0");
  }
  if (fiveShotBet < 0) {
    throw new Error("fiveShotBet cannot be negative");
  }

  const cards: DealtRoundCards = preDealt ?? dealRound(rng);

  return computeRoundFromCards(cards, {
    firstShotBet,
    fiveShotBet,
    decision,
    config,
  });
}
