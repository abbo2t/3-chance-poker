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

export function GameLayout() {
  const [phase, setPhase] = useState<Phase>("betting");
  const [firstShotBetInput, setFirstShotBetInput] = useState("5");
  const [fiveShotBetInput, setFiveShotBetInput] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [betsLocked, setBetsLocked] = useState(false);
  const [currentCards, setCurrentCards] = useState<DealtRoundCards | null>(
    null,
  );
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

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
  const dealButtonLabel = betsLocked ? "Re-bet & Deal" : "Bet & Deal";

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
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
    }
  }

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
        alignItems: "flex-start",
      }}
    >
      <header style={{ gridColumn: "1 / -1" }}>
        <h1>3 Shot Poker Simulator</h1>
        <p style={{ maxWidth: "40rem" }}>
          Configure your bets, then play rounds of 3 Shot Poker using the
          Grand Sierra pay tables.
        </p>
      </header>

      <section aria-label="Bet configuration">
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

        <div style={{ marginTop: "1.25rem" }}>
          <h3>Actions</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleRebetDeal}
              disabled={!canRebetDeal}
            >
              {dealButtonLabel}
            </button>
            <button
              type="button"
              onClick={() => resolveRound("raise")}
              disabled={!canChooseDecision}
            >
              Call
            </button>
            <button
              type="button"
              onClick={() => resolveRound("fold")}
              disabled={!canChooseDecision}
            >
              Fold
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
              disabled={!betsLocked || phase === "decision"}
            >
              Clear Bets
            </button>
          </div>
          {error && (
            <p style={{ color: "red", marginTop: "0.75rem" }} role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      <section aria-label="Cards and results">
        <h2>Cards &amp; Results</h2>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div>
            <h3>Player Hole Cards</h3>
            {currentCards ? (
              <CardRow cards={currentCards.holeCards} />
            ) : (
              <div aria-label="Player cards placeholder">[Deal to see cards]</div>
            )}
          </div>
          <div>
            <h3>Community Cards</h3>
            {currentCards && hasResult ? (
              <CardRow cards={currentCards.communityCards} />
            ) : (
              <div aria-label="Community cards placeholder">
                [Revealed after decision]
              </div>
            )}
          </div>
          <div>
            <h3>Shot Hands</h3>
            {hasResult ? (
              <ul>
                <li>
                  1st Shot: {roundResult.firstShot.evaluation.rank} — Wager {" "}
                  {roundResult.firstShot.wager}, Win {roundResult.firstShot.winnings}
                </li>
                <li>
                  2nd Shot: {roundResult.secondShot.evaluation.rank} — Wager {" "}
                  {roundResult.secondShot.wager}, Win {" "}
                  {roundResult.secondShot.winnings}
                </li>
                <li>
                  3rd Shot: {roundResult.thirdShot.evaluation.rank} — Wager {" "}
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
          <div>
            <h3>5 Shot Result</h3>
            {hasResult && roundResult.fiveShot ? (
              <div>
                Rank {roundResult.fiveShot.evaluation.rank} — Wager {" "}
                {roundResult.fiveShot.wager}, Win {roundResult.fiveShot.winnings}
              </div>
            ) : (
              <div>[5-card hand &amp; payout]</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          <h3>Totals</h3>
          {hasResult ? (
            <ul>
              <li>Total Bet: {roundResult.totalBet}</li>
              <li>Total Winnings: {roundResult.totalWinnings}</li>
              <li>Net: {roundResult.totalNet}</li>
            </ul>
          ) : (
            <ul>
              <li>Total Bet: [amount]</li>
              <li>Total Winnings: [amount]</li>
              <li>Net: [amount]</li>
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
