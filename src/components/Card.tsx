"use client";

import React from "react";
import { Suit } from "../lib/pokerTypes";
import type { Card as CardType } from "../lib/pokerTypes";

interface PlayingCardProps {
  card: CardType;
  /** When true, render a facedown card back instead of the rank/suit. */
  hidden?: boolean;
  /** Optional label for screen readers; falls back to a textual card name. */
  ariaLabel?: string;
}

const rankLabel: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

const suitSymbol: Record<string, string> = {
  C: "♣",
  D: "♦",
  H: "♥",
  S: "♠",
};

function describeCard(card: CardType): string {
  const rankNames: Record<number, string> = {
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "Jack",
    12: "Queen",
    13: "King",
    14: "Ace",
  };
  const rank = rankNames[card.rank] ?? String(card.rank);
  const suitNames: Record<string, string> = {
    C: "clubs",
    D: "diamonds",
    H: "hearts",
    S: "spades",
  };
  const suit = suitNames[card.suit] ?? card.suit;
  return `${rank} of ${suit}`;
}

export function PlayingCard({ card, hidden, ariaLabel }: PlayingCardProps) {
  const isRed = card.suit === "H" || card.suit === "D";
  const rank = rankLabel[card.rank] ?? String(card.rank);
  const suit = suitSymbol[card.suit] ?? card.suit;

  const label = ariaLabel ?? (hidden ? "Facedown card" : describeCard(card));

  return (
    <div
      aria-label={label}
      role="img"
      className="playing-card"
      style={{
        width: "3rem",
        height: "4.2rem",
        borderRadius: "0.4rem",
        border: "1px solid rgba(0,0,0,0.15)",
        background: hidden
          ? "linear-gradient(135deg, #1e293b, #0f172a)"
          : "#ffffff",
        color: hidden ? "#e5e7eb" : isRed ? "#b91c1c" : "#020617",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "0.25rem",
        boxShadow:
          "0 4px 10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.4)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "0.75rem",
        transition: "transform 160ms ease-out, box-shadow 160ms ease-out",
      }}
    >
      {hidden ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          3 Shot
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <span>{rank}</span>
            <span>{suit}</span>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
            }}
          >
            {suit}
          </div>
        </>
      )}
    </div>
  );
}

interface CardRowProps {
  cards: CardType[];
  hiddenCount?: number;
}

export function CardRow({ cards, hiddenCount = 0 }: CardRowProps) {
  const visibleCount = Math.max(cards.length - hiddenCount, 0);
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {cards.slice(0, visibleCount).map((card, index) => (
        <PlayingCard key={`${card.rank}-${card.suit}-${index}`} card={card} />
      ))}
      {Array.from({ length: hiddenCount }).map((_, index) => (
        <PlayingCard
          // eslint-disable-next-line react/no-array-index-key
          key={`hidden-${index}`}
          card={{ rank: 2, suit: Suit.Clubs }}
          hidden
        />
      ))}
    </div>
  );
}
