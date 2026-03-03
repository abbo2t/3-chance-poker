# Copilot Instructions for 3-Chance Poker

## Project Overview

This is a **3-Chance Poker** simulator (also known as 3-Shot Poker) built with **Next.js 14**, **TypeScript**, and **React**. The game is a casino table game where players make a 1st Shot wager, receive hole and community cards, then decide to raise (adding 2nd and 3rd Shot wagers) or fold. An optional 5 Shot side bet is also available.

The app is deployed to GitHub Pages as a static export (`next build` outputs to `./out`).

## Repository Structure

```
src/
  lib/           # Pure game-logic modules (no React)
    pokerTypes.ts    – Core TypeScript types and enums (Card, Rank, Suit, hand ranks)
    deck.ts          – Deck generation and Fisher-Yates shuffle
    handEvaluation.ts – 3-card and 5-card hand evaluators
    paytables.ts     – Pay table configurations (Grand Sierra Pay Table 1 & 2)
    gameEngine.ts    – Pure game-engine: deal, raise/fold, payout calculations
  components/    # React components
    Card.tsx         – Displays a single playing card
    GameLayout.tsx   – Main game UI, wires React state to the game engine
    PullToRefresh.tsx – Mobile pull-to-refresh helper
app/             # Next.js App Router pages
__tests__/       # Vitest + React Testing Library tests mirroring src/ structure
```

## Tech Stack & Tooling

- **Framework**: Next.js 14 (App Router, static export)
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules / inline styles (no external CSS framework)
- **Testing**: Vitest + React Testing Library (`npm test`)
- **Linting**: ESLint via `next lint` (`npm run lint`)
- **Build**: `npm run build` (outputs static files to `./out`)
- **CI/CD**: GitHub Actions workflow deploys to GitHub Pages on every push to `main`

## Development Commands

```bash
npm run dev    # Start development server (localhost:3000)
npm run build  # Production build (static export to ./out)
npm run lint   # Run ESLint
npm test       # Run all Vitest tests (add -- --run for non-watch mode)
```

## Code Conventions

### TypeScript
- Use the enums and types defined in `src/lib/pokerTypes.ts` for all poker-domain values. Do not redefine them.
- Prefer explicit return types on exported functions.
- Keep game-logic modules (under `src/lib/`) free of React imports — they must be pure TypeScript.

### Game Logic
- The 3-card evaluator lives in `src/lib/handEvaluation.ts` and handles `ThreeCardHandRank` values.
- The 5-card evaluator in the same file handles `FiveCardHandPayoutRank` values.
- Pay tables are defined in `src/lib/paytables.ts` and referenced by `gameEngine.ts`. When adding a new casino configuration, add a new pay table object there rather than hardcoding values elsewhere.
- The game engine (`src/lib/gameEngine.ts`) is a pure module — it takes inputs and returns outputs with no side effects.

### React Components
- Keep components in `src/components/`.
- Use functional components and React hooks.
- Avoid adding new third-party UI libraries unless absolutely necessary.

### Testing
- Tests live in `__tests__/` and mirror the source structure (e.g. `deck.test.ts` tests `src/lib/deck.ts`).
- Use **table-driven tests** for hand evaluation and pay table scenarios.
- Component tests use `@testing-library/react`; check `__tests__/GameLayout.test.tsx` for the established pattern.
- When adding new game-logic, add corresponding unit tests in `__tests__/`.

### File Naming
- Library modules: `camelCase.ts`
- React components: `PascalCase.tsx`
- Test files: `<source-file>.test.ts` or `<source-file>.test.tsx`

## Game Rules Summary

| Bet | Description |
|-----|-------------|
| 1st Shot | Player hole cards + 1st community card (3-card hand) |
| 2nd Shot | Player hole cards + 2nd community card (3-card hand) |
| 3rd Shot | Player hole cards + 3rd community card (3-card hand) |
| 5 Shot | All 5 cards (standard 5-card poker hand, side bet) |

- Fold: forfeit 1st Shot wager; 5 Shot side bet still resolves.
- Raise: post equal 2nd and 3rd Shot wagers; all bets resolve.
- Grand Sierra uses **Pay Table 2** for 3-card shots and **Pay Table 1** for the 5 Shot side bet.
- All payouts are "to one" (win amount = payout multiplier × wager).
