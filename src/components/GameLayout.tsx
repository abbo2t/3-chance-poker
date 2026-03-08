"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  dealRound,
  resolveRoundFromCards,
  type DealtRoundCards,
  type RoundResult,
} from "../lib/gameEngine";
import type { Card } from "../lib/pokerTypes";
import { CardRow, PlayingCard } from "./Card";
import { PullToRefresh } from "./PullToRefresh";

type Phase = "betting" | "decision" | "animating" | "resolved";
type AnimStep = "shot1" | "shot2" | "shot3" | "fiveshot";
type AnimSpeed = "slow" | "medium" | "fast";

/** Time (ms) between animation steps. */
const ANIM_STEP_MS: Record<AnimSpeed, number> = {
  slow: 1200,
  medium: 700,
  fast: 350,
};

/** Duration of the card-movement CSS animation (≈60 % of the step time). */
const CARD_ANIM_MS: Record<AnimSpeed, number> = {
  slow: 700,
  medium: 420,
  fast: 210,
};

const ANIM_STEP_ORDER: AnimStep[] = ["shot1", "shot2", "shot3", "fiveshot"];

function formatCard(card: Card): string {
  const rankMap: Record<number, string> = {
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "T",
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  };
  const suitMap: Record<string, string> = {
    C: "♣",
    D: "♦",
    H: "♥",
    S: "♠",
  };

  const rank = rankMap[card.rank] ?? String(card.rank);
  const suit = suitMap[card.suit] ?? card.suit;
  return `${rank}${suit}`;
}

function formatCards(cards: Card[]): string {
  return cards.map(formatCard).join(" ");
}

const STARTING_BALANCE = 200;
const WINNING_COLOR = "#4ade80";
const LOSING_COLOR = "#f97373";

export function GameLayout() {
  const [phase, setPhase] = useState<Phase>("betting");
  const [firstShotBetInput, setFirstShotBetInput] = useState("10");
  const [fiveShotBetInput, setFiveShotBetInput] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [betsLocked, setBetsLocked] = useState(false);
  const [currentCards, setCurrentCards] = useState<DealtRoundCards | null>(
    null,
  );
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [playerBalance, setPlayerBalance] = useState(STARTING_BALANCE);

  // Animation settings
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [animSpeed, setAnimSpeed] = useState<AnimSpeed>("medium");
  const [animStep, setAnimStep] = useState<AnimStep | null>(null);

  const parsedFirstShotBet = useMemo(
    () => Number.parseInt(firstShotBetInput, 10) || 0,
    [firstShotBetInput],
  );
  const parsedFiveShotBet = useMemo(
    () => Number.parseInt(fiveShotBetInput, 10) || 0,
    [fiveShotBetInput],
  );

  const isAnimating = phase === "animating";
  const canRebetDeal = phase === "betting" || phase === "resolved";
  const canChooseDecision = phase === "decision";
  const hasResult = phase === "resolved" && roundResult !== null;
  const dealButtonLabel = betsLocked ? "Re-bet Deal" : "Deal";

  const fiveShotHasBet = parsedFiveShotBet > 0;

  // ── Animation advancement ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAnimating || animStep === null || !roundResult) return;

    function nextAnimStep(current: AnimStep): AnimStep | null {
      const hasFiveShot = parsedFiveShotBet > 0;
      if (roundResult!.decision === "fold") {
        return current === "shot1" && hasFiveShot ? "fiveshot" : null;
      }
      if (current === "shot1") return "shot2";
      if (current === "shot2") return "shot3";
      if (current === "shot3") return hasFiveShot ? "fiveshot" : null;
      return null;
    }

    const timer = setTimeout(() => {
      const next = nextAnimStep(animStep);
      if (next !== null) {
        setAnimStep(next);
      } else {
        setAnimStep(null);
        setPhase("resolved");
      }
    }, ANIM_STEP_MS[animSpeed]);

    return () => clearTimeout(timer);
  }, [isAnimating, animStep, animSpeed, roundResult, parsedFiveShotBet]);

  // ── Display helpers ──────────────────────────────────────────────────────
  /** True once the given shot step has been reached (or we're fully resolved). */
  function isShotStepReached(target: AnimStep): boolean {
    if (hasResult) return true;
    if (!isAnimating || animStep === null) return false;
    return ANIM_STEP_ORDER.indexOf(animStep) >= ANIM_STEP_ORDER.indexOf(target);
  }

  /**
   * During animation, which community card (by index into communityCards[])
   * is currently being "played down" to the hole cards?
   */
  function getActiveCommCardIdx(): number | null {
    if (!isAnimating || animStep === null) return null;
    if (animStep === "shot1") return 0;
    if (animStep === "shot2") return 1;
    if (animStep === "shot3") return 2;
    return null; // "fiveshot" — hole cards are moving, not a community card
  }

  /**
   * Whether community card at `cardIdx` should be shown face-up.
   * Community[0] = shot1 card (rightmost display), [1] = shot2, [2] = shot3.
   */
  function isCommCardFaceUp(cardIdx: number): boolean {
    if (hasResult) return true;
    if (!isAnimating || animStep === null) return false;
    if (cardIdx === 0) return isShotStepReached("shot1");
    if (cardIdx === 1) return isShotStepReached("shot2");
    if (cardIdx === 2) return isShotStepReached("shot3");
    return false;
  }

  function threeCardRankColor(rank: string): string {
    return rank === "HIGH_CARD" ? LOSING_COLOR : WINNING_COLOR;
  }

  function fiveCardRankColor(rank: string): string {
    return rank === "ALL_OTHER" ? LOSING_COLOR : WINNING_COLOR;
  }

  function getShotMarkerStyle(shotNumber: 1 | 2 | 3): React.CSSProperties {
    if (phase === "decision" && shotNumber === 1) {
      return { borderColor: "white" };
    }
    if ((phase === "resolved" || isAnimating) && roundResult) {
      if (roundResult.decision === "fold" && shotNumber !== 1) return {};
      const shot =
        shotNumber === 1
          ? roundResult.firstShot
          : shotNumber === 2
            ? roundResult.secondShot
            : roundResult.thirdShot;

      // During animation, only light up markers for already-revealed shots
      if (isAnimating) {
        const targetStep = `shot${shotNumber}` as AnimStep;
        if (!isShotStepReached(targetStep)) return {};
      }

      return {
        borderColor: "white",
        background: shot.payoutMultiplier > 0 ? WINNING_COLOR : LOSING_COLOR,
      };
    }
    return {};
  }

  function getFiveShotBadgeStyle(): React.CSSProperties {
    if (!fiveShotHasBet) return {};
    if (phase === "decision") return { background: "#fbbf24" };
    if ((phase === "resolved" || isAnimating) && roundResult?.fiveShot) {
      const color =
        roundResult.fiveShot.payoutMultiplier > 0 ? WINNING_COLOR : LOSING_COLOR;
      if (isAnimating && animStep !== "fiveshot") return { background: "#fbbf24" };
      return { background: color, borderColor: color };
    }
    if (isAnimating && fiveShotHasBet) return { background: "#fbbf24" };
    return {};
  }

  function getFiveShotTextStyle(): React.CSSProperties {
    if (!fiveShotHasBet) return {};
    if (phase === "decision") return { color: "black" };
    if ((phase === "resolved" || isAnimating) && roundResult?.fiveShot) return { color: "black" };
    return {};
  }

  // ── Action handlers ──────────────────────────────────────────────────────
  function handleRebetDeal() {
    setError(null);
    setRoundResult(null);
    setAnimStep(null);

    if (parsedFirstShotBet <= 0) {
      setError("1st Shot bet must be at least 1.");
      return;
    }
    if (parsedFiveShotBet < 0) {
      setError("5 Shot bet cannot be negative.");
      return;
    }

    const cards = dealRound();
    setCurrentCards(cards);
    setBetsLocked(true);
    setPhase("decision");
    setPlayerBalance((prev) => prev - parsedFirstShotBet - parsedFiveShotBet);
  }

  function resolveRound(decision: "raise" | "fold") {
    setError(null);
    if (!currentCards) {
      setError("Deal cards before choosing to continue or fold.");
      return;
    }
    try {
      const result = resolveRoundFromCards(currentCards, {
        firstShotBet: parsedFirstShotBet,
        fiveShotBet: parsedFiveShotBet,
        decision,
      });
      setRoundResult(result);
      setPlayerBalance((prev) => {
        const updated = prev + result.totalNet + parsedFirstShotBet + parsedFiveShotBet;
        return updated <= 0 ? STARTING_BALANCE : updated;
      });

      if (animationsEnabled) {
        setPhase("animating");
        setAnimStep("shot1");
      } else {
        setPhase("resolved");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const cardAnimDuration = CARD_ANIM_MS[animSpeed];
  // CSS custom properties are not in React.CSSProperties by default;
  // the cast is the standard pattern for passing them as inline styles.
  const cardAnimStyle = {
    "--card-anim-duration": `${cardAnimDuration}ms`,
  } as React.CSSProperties;

  const activeCommCardIdx = getActiveCommCardIdx();

  return (
    <main className="game-layout">
      <PullToRefresh />
      <header className="game-header">
        <h1>3 Shot Poker Simulator</h1>
        <p style={{ maxWidth: "40rem" }}>
          Configure your bets, then play rounds of 3 Shot Poker using the
          Grand Sierra pay tables.
        </p>
      </header>

      <section aria-label="Bet configuration" className="game-panel">
        <h2>Bets</h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label>
            1st Shot Bet
            <input
              aria-label="1st Shot Bet"
              type="number"
              min={1}
              step={1}
              value={firstShotBetInput}
              onChange={(e) => setFirstShotBetInput(e.target.value)}
              style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
              disabled={betsLocked}
            />
          </label>
          <label>
            5 Shot Side Bet (optional)
            <input
              aria-label="5 Shot Side Bet"
              type="number"
              min={0}
              step={1}
              value={fiveShotBetInput}
              onChange={(e) => setFiveShotBetInput(e.target.value)}
              style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
              disabled={betsLocked}
            />
          </label>
        </div>

        {/* Animation settings */}
        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(148,163,184,0.2)" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>Animation</h3>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              aria-label="Animate results"
              checked={animationsEnabled}
              onChange={(e) => setAnimationsEnabled(e.target.checked)}
            />
            Animate results
          </label>
          {animationsEnabled && (
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              Speed
              <select
                aria-label="Animation speed"
                value={animSpeed}
                onChange={(e) => setAnimSpeed(e.target.value as AnimSpeed)}
                style={{
                  background: "#020617",
                  border: "1px solid rgba(148,163,184,0.7)",
                  borderRadius: "0.35rem",
                  color: "#e5e7eb",
                  padding: "0.2rem 0.4rem",
                }}
              >
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </label>
          )}
        </div>
      </section>

      <section aria-label="Cards and results" className="game-panel game-table">
        <h2 className="sr-only">Cards &amp; Results</h2>

        <div className="game-table-board">
          {/* Top: community cards (3 Shot) */}
          <div className="game-table-community">
            {currentCards && (hasResult || isAnimating) ? (
              /* During animation or resolved: show each card face-up/down based on what's been revealed */
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {/* Display order: community[2] (left), community[1] (middle), community[0] (right) */}
                {([2, 1, 0] as const).map((cardIdx) => {
                  const faceUp = isCommCardFaceUp(cardIdx);
                  return faceUp ? (
                    <PlayingCard
                      key={`comm-${cardIdx}`}
                      card={currentCards.communityCards[cardIdx]}
                    />
                  ) : (
                    <PlayingCard
                      key={`comm-hidden-${cardIdx}`}
                      card={currentCards.communityCards[cardIdx]}
                      hidden
                    />
                  );
                })}
              </div>
            ) : (
              <CardRow cards={[]} hiddenCount={3} />
            )}
          </div>

          {/* Middle: 5 Shot badge and shot markers */}
          <div className="game-table-center">
            <div className="five-shot-badge" aria-label="5 Shot" style={getFiveShotBadgeStyle()}>
              <span className="five-shot-text" style={getFiveShotTextStyle()}>5 Shot</span>
            </div>
            <div className="shot-markers" aria-hidden="true">
              <div className="shot-marker" style={getShotMarkerStyle(3)}>3</div>
              <div className="shot-marker" style={getShotMarkerStyle(2)}>2</div>
              <div className="shot-marker" style={getShotMarkerStyle(1)}>1</div>
            </div>
          </div>

          {/* Bottom: player hole cards */}
          <div className="game-table-hole">
            {currentCards ? (
              /* During the fiveshot animation step show all 5 cards here */
              isAnimating && animStep === "fiveshot" ? (
                <div className="game-table-fiveshot-anim" style={cardAnimStyle}>
                  {currentCards.holeCards.map((card, i) => (
                    <div key={`fiveshot-hole-${i}`} className="anim-deal-up">
                      <PlayingCard card={card} />
                    </div>
                  ))}
                  {([0, 1, 2] as const).map((ci) => (
                    <PlayingCard
                      key={`fiveshot-comm-${ci}`}
                      card={currentCards.communityCards[ci]}
                    />
                  ))}
                </div>
              ) : (
                /* Shots 1-3 animation or normal: show hole cards, append active community card */
                <div className="game-table-active-hand" style={isAnimating && activeCommCardIdx !== null ? cardAnimStyle : undefined}>
                  <PlayingCard key="hole-0" card={currentCards.holeCards[0]} />
                  <PlayingCard key="hole-1" card={currentCards.holeCards[1]} />
                  {isAnimating && activeCommCardIdx !== null && (
                    <div
                      key={`active-comm-${animStep}`}
                      className="anim-deal-down"
                    >
                      <PlayingCard
                        card={currentCards.communityCards[activeCommCardIdx]}
                      />
                    </div>
                  )}
                </div>
              )
            ) : (
              <CardRow cards={[]} hiddenCount={2} />
            )}
          </div>
        </div>

        {/* Balance display just above action buttons */}
        <p aria-label="Player balance" style={{ textAlign: "center", margin: "1rem 0 0" }}>
          Balance: <strong>{playerBalance}</strong>
        </p>

        {/* Bottom action bar */}
        <div className="game-table-actions">
          {canChooseDecision ? (
            <>
              <button
                type="button"
                onClick={() => resolveRound("raise")}
                className="game-table-button game-table-button-primary"
              >
                Call
              </button>
              <button
                type="button"
                onClick={() => resolveRound("fold")}
                className="game-table-button game-table-button-secondary"
              >
                Fold
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRebetDeal}
                disabled={!canRebetDeal}
                className="game-table-button game-table-button-primary"
              >
                {dealButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBetsLocked(false);
                  setPhase("betting");
                  setCurrentCards(null);
                  setRoundResult(null);
                  setAnimStep(null);
                  setError(null);
                }}
                disabled={!betsLocked || isAnimating}
                className="game-table-button game-table-button-secondary"
              >
                Clear Bets
              </button>
            </>
          )}

          {error && (
            <p className="game-table-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Right side / lower area: textual results */}
        <div className="game-table-info">
          <div className="game-table-info-column">
            <h3>Shot Hands</h3>
            {(hasResult || isAnimating) && roundResult ? (
              <ol className="shot-hands-list">
                {isShotStepReached("shot1") && (() => {
                  const entering = isAnimating && animStep === "shot1";
                  return (
                    <li key="shot1-result" className={entering ? "result-fade-in" : undefined} style={entering ? cardAnimStyle : undefined}>
                      <span style={{ color: threeCardRankColor(roundResult.firstShot.evaluation.rank) }}>{roundResult.firstShot.evaluation.rank}</span> — Bet{" "}
                      {roundResult.firstShot.wager}, Win {roundResult.firstShot.winnings}
                    </li>
                  );
                })()}
                {isShotStepReached("shot2") && (() => {
                  const entering = isAnimating && animStep === "shot2";
                  return (
                    <li key="shot2-result" className={entering ? "result-fade-in" : undefined} style={entering ? cardAnimStyle : undefined}>
                      <span style={{ color: threeCardRankColor(roundResult.secondShot.evaluation.rank) }}>{roundResult.secondShot.evaluation.rank}</span> — Bet{" "}
                      {roundResult.secondShot.wager}, Win{" "}
                      {roundResult.secondShot.winnings}
                    </li>
                  );
                })()}
                {isShotStepReached("shot3") && (() => {
                  const entering = isAnimating && animStep === "shot3";
                  return (
                    <li key="shot3-result" className={entering ? "result-fade-in" : undefined} style={entering ? cardAnimStyle : undefined}>
                      <span style={{ color: threeCardRankColor(roundResult.thirdShot.evaluation.rank) }}>{roundResult.thirdShot.evaluation.rank}</span> — Bet{" "}
                      {roundResult.thirdShot.wager}, Win{" "}
                      {roundResult.thirdShot.winnings}
                    </li>
                  );
                })()}
                {!isShotStepReached("shot1") && <li>[cards &amp; result]</li>}
                {!isShotStepReached("shot2") && <li>[cards &amp; result]</li>}
                {!isShotStepReached("shot3") && <li>[cards &amp; result]</li>}
              </ol>
            ) : (
              <ol className="shot-hands-list">
                <li>[cards &amp; result]</li>
                <li>[cards &amp; result]</li>
                <li>[cards &amp; result]</li>
              </ol>
            )}
          </div>
          <div className="game-table-info-column">
            <h3>5 Shot Result</h3>
            {(hasResult || (isAnimating && animStep === "fiveshot")) && roundResult?.fiveShot ? (
              (() => {
                const entering = isAnimating && animStep === "fiveshot";
                return (
                  <div className={entering ? "result-fade-in" : undefined} style={entering ? cardAnimStyle : undefined}>
                    <span style={{ color: fiveCardRankColor(roundResult.fiveShot.evaluation.rank) }}>{roundResult.fiveShot.evaluation.rank}</span> — Wager{" "}
                    {roundResult.fiveShot.wager}, Win {roundResult.fiveShot.winnings}
                  </div>
                );
              })()
            ) : (
              <div>[5-card hand &amp; payout]</div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <h3>Totals</h3>
              {hasResult ? (
                <ul className="game-totals-list">
                  <li>Total Bet: {roundResult.totalBet}</li>
                  <li style={{ color: WINNING_COLOR }}>Total Winnings: {roundResult.totalWinnings}</li>
                  <li style={{ color: LOSING_COLOR }}>Total Losses: {roundResult.totalWinnings - roundResult.totalNet}</li>
                  <li>Net: {roundResult.totalNet}</li>
                </ul>
              ) : phase === "decision" ? (
                <ul className="game-totals-list">
                  <li>Total Bet: {parsedFirstShotBet * 3 + parsedFiveShotBet}</li>
                  <li>Total Winnings: [amount]</li>
                  <li>Total Losses: [amount]</li>
                  <li>Net: [amount]</li>
                </ul>
              ) : (
                <ul className="game-totals-list">
                  <li>Total Bet: [amount]</li>
                  <li>Total Winnings: [amount]</li>
                  <li>Total Losses: [amount]</li>
                  <li>Net: [amount]</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

