"use client";

import React from "react";

export function GameLayout() {
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
          Grand Sierra pay tables. This screen is a wireframe for the final
          interactive UI.
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
              defaultValue={5}
              style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
              disabled
            />
          </label>
          <label>
            5 Shot Side Bet (optional)
            <input
              aria-label="5 Shot Side Bet"
              type="number"
              min={0}
              step={1}
              defaultValue={5}
              style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
              disabled
            />
          </label>
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          <h3>Actions</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" disabled>
              Deal
            </button>
            <button type="button" disabled>
              Raise
            </button>
            <button type="button" disabled>
              Fold
            </button>
            <button type="button" disabled>
              New Hand
            </button>
          </div>
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
            <div aria-label="Player cards placeholder">[Player cards]</div>
          </div>
          <div>
            <h3>Community Cards</h3>
            <div aria-label="Community cards placeholder">[Community cards]</div>
          </div>
          <div>
            <h3>Shot Hands</h3>
            <ul>
              <li>1st Shot: [cards &amp; result]</li>
              <li>2nd Shot: [cards &amp; result]</li>
              <li>3rd Shot: [cards &amp; result]</li>
            </ul>
          </div>
          <div>
            <h3>5 Shot Result</h3>
            <div>[5-card hand &amp; payout]</div>
          </div>
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          <h3>Totals</h3>
          <ul>
            <li>Total Bet: [amount]</li>
            <li>Total Winnings: [amount]</li>
            <li>Net: [amount]</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
