import React from "react";
import { render, screen } from "@testing-library/react";
import { PlayingCard, CardRow } from "../src/components/Card";
import type { Card } from "../src/lib/pokerTypes";

const sampleCard: Card = { rank: 14, suit: "H" };

describe("PlayingCard", () => {
  it("renders rank and suit for a face-up card", () => {
    render(<PlayingCard card={sampleCard} />);
    expect(screen.getByLabelText(/ace of hearts/i)).toBeInTheDocument();
  });

  it("renders a facedown card when hidden", () => {
    render(<PlayingCard card={sampleCard} hidden />);
    expect(screen.getByLabelText(/facedown card/i)).toBeInTheDocument();
  });
});

describe("CardRow", () => {
  it("renders all cards passed in", () => {
    const cards: Card[] = [
      { rank: 10, suit: "S" },
      { rank: 11, suit: "S" },
    ];
    render(<CardRow cards={cards} />);
    expect(screen.getByLabelText(/10 of spades/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/jack of spades/i)).toBeInTheDocument();
  });
});
