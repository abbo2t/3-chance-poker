import {
  GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
  GRAND_SIERRA_SHOT_PAYTABLE,
} from "../src/lib/paytables";
import {
  FiveCardHandPayoutRank,
  ThreeCardHandRank,
} from "../src/lib/pokerTypes";

function findPayout<T extends { hand: unknown; payout: number }>(
  table: readonly T[],
  hand: T["hand"],
): number | undefined {
  const entry = table.find((e) => e.hand === hand);
  return entry?.payout;
}

describe("Grand Sierra paytables", () => {
  it("matches Pay Table 2 for 1st/2nd/3rd Shot", () => {
    expect(findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.MiniRoyal)).toBe(
      50,
    );
    expect(
      findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.StraightFlush),
    ).toBe(30);
    expect(
      findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.ThreeOfAKind),
    ).toBe(20);
    expect(findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.Straight)).toBe(
      4,
    );
    expect(findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.Flush)).toBe(2);
    expect(findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.Pair)).toBe(1);
    // High card / all other should not appear in the winning paytable.
    expect(
      findPayout(GRAND_SIERRA_SHOT_PAYTABLE, ThreeCardHandRank.HighCard),
    ).toBeUndefined();
  });

  it("matches Pay Table 1 for 5 Shot", () => {
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.RoyalFlush,
      ),
    ).toBe(500);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.StraightFlush,
      ),
    ).toBe(200);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.FourOfAKind,
      ),
    ).toBe(50);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.FullHouse,
      ),
    ).toBe(40);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.Flush,
      ),
    ).toBe(30);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.Straight,
      ),
    ).toBe(20);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.ThreeOfAKind,
      ),
    ).toBe(10);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.TwoPair,
      ),
    ).toBe(2);
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.PairTensOrBetter,
      ),
    ).toBe(1);
    // All other should not appear in the winning paytable.
    expect(
      findPayout(
        GRAND_SIERRA_FIVE_SHOT_PAYTABLE,
        FiveCardHandPayoutRank.AllOther,
      ),
    ).toBeUndefined();
  });
});
