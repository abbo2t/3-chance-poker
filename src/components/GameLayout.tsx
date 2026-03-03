"use client";

import React, { useMemo, useState } from "react";
import {
  dealRound,
  resolveRoundFromCards,
  type DealtRoundCards,
  type RoundResult,
} from "../lib/gameEngine";
import type { Card } from "../lib/pokerTypes";
import { CardRow, PlayingCard } from "./Card";
import { PullToRefresh } from "./PullToRefresh";

type Phase = "betting" | "decision" | "resolved";

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

  const parsedFirstShotBet = useMemo(
    () => Number.parseInt(firstShotBetInput, 10) || 0,
    [firstShotBetInput],
  );
  const parsedFiveShotBet = useMemo(
    () => Number.parseInt(fiveShotBetInput, 10) || 0,
    [fiveShotBetInput],
  );

  const canRebetDeal = phase === "betting" || phase === "resolved";
  const canChooseDecision = phase === "decision";
  const hasResult = phase === "resolved" && roundResult !== null;
  const dealButtonLabel = betsLocked ? "Re-bet Deal" : "Deal";

  const fiveShotHasBet = parsedFiveShotBet > 0;

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
    if (phase === "resolved" && roundResult) {
      if (roundResult.decision === "fold" && shotNumber !== 1) return {};
      const shot =
        shotNumber === 1
          ? roundResult.firstShot
          : shotNumber === 2
            ? roundResult.secondShot
            : roundResult.thirdShot;
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
    if (phase === "resolved" && roundResult?.fiveShot) {
      const color =
        roundResult.fiveShot.payoutMultiplier > 0 ? WINNING_COLOR : LOSING_COLOR;
      return { background: color, borderColor: color };
    }
    return {};
  }

  function getFiveShotTextStyle(): React.CSSProperties {
    if (!fiveShotHasBet) return {};
    if (phase === "decision") return { color: "black" };
    if (phase === "resolved" && roundResult?.fiveShot) return { color: "black" };
    return {};
  }

  function handleRebetDeal() {
    setError(null);
    setRoundResult(null);

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
    // Deduct the wagers placed at deal time; resolveRound adds back this amount
    // so the final net effect equals result.totalNet.
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
      setPhase("resolved");
      setPlayerBalance((prev) => {
        const updated = prev + result.totalNet + parsedFirstShotBet + parsedFiveShotBet;
        return updated <= 0 ? STARTING_BALANCE : updated;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    }
  }

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
      </section>

      <section aria-label="Cards and results" className="game-panel game-table">
        <h2 className="sr-only">Cards &amp; Results</h2>

        <div className="game-table-board">
          {/* Top: community cards (3 Shot) */}
          <div className="game-table-community">
            {currentCards && hasResult ? (
              <CardRow
                cards={[
                  currentCards.communityCards[2],
                  currentCards.communityCards[1],
                  currentCards.communityCards[0],
                ]}
              />
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
              <CardRow cards={currentCards.holeCards} />
            ) : (
              <CardRow cards={[]} hiddenCount={2} />
            )}
          </div>
        </div>

        {/* Balance display just above action buttons */}
        <p aria-label="Player balance" style={{ textAlign: "center", margin: "1rem 0 0" }}>
          Balance: <strong>{playerBalance}</strong>
        </p>

        {/* Bottom action bar, similar to the physical felt layout */}
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
                  setError(null);
                }}
                disabled={!betsLocked}
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
            {hasResult ? (
              <ul>
                <li>
                  1st Shot: <span style={{ color: threeCardRankColor(roundResult.firstShot.evaluation.rank) }}>{roundResult.firstShot.evaluation.rank}</span> — Wager {" "}
                  {roundResult.firstShot.wager}, Win {roundResult.firstShot.winnings}
                </li>
                <li>
                  2nd Shot: <span style={{ color: threeCardRankColor(roundResult.secondShot.evaluation.rank) }}>{roundResult.secondShot.evaluation.rank}</span> — Wager {" "}
                  {roundResult.secondShot.wager}, Win {" "}
                  {roundResult.secondShot.winnings}
                </li>
                <li>
                  3rd Shot: <span style={{ color: threeCardRankColor(roundResult.thirdShot.evaluation.rank) }}>{roundResult.thirdShot.evaluation.rank}</span> — Wager {" "}
                  {roundResult.thirdShot.wager}, Win {" "}
                  {roundResult.thirdShot.winnings}
                </li>
              </ul>
            ) : (
              <ul>
                <li>1st Shot: [cards &amp; result]</li>
                <li>2nd Shot: [cards &amp; result]</li>
                <li>3rd Shot: [cards &amp; result]</li>
              </ul>
            )}
          </div>
          <div className="game-table-info-column">
            <h3>5 Shot Result</h3>
            {hasResult && roundResult.fiveShot ? (
              <div>
                <span style={{ color: fiveCardRankColor(roundResult.fiveShot.evaluation.rank) }}>{roundResult.fiveShot.evaluation.rank}</span> — Wager {" "}
                {roundResult.fiveShot.wager}, Win {roundResult.fiveShot.winnings}
              </div>
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
