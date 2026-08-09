# Second Station Card Swap Design

## Goal

Rebuild the second station's card presentation around the React Bits `CardSwap` interaction while preserving the existing full-screen `GridScan` background and all seven current question cards.

The station must show no more than three cards at once. When the front card leaves, the other two advance and the next question in the seven-card sequence enters at the back. The sequence loops continuously.

## Experience

The visitor encounters a focused three-card deck floating over the existing scanning field. The front card is the readable question. Two receding cards establish depth and preview that the deck continues without exposing the remaining queued questions.

The motion should feel deliberate and installation-like rather than playful. The front card exits, the middle and back cards advance, and the next queued card settles into the rear slot. After question seven, question one returns without a discontinuity.

## Visual Direction

The existing background, dark environment, question wording, and card palette remain the visual foundation. Card surfaces continue using the station's pale green, sage, charcoal, and muted gold colors. Typography stays restrained and readable, with the question as the dominant element and the numbered kicker as supporting information.

Depth comes from the three physical stack positions, perspective, subtle surface separation, and restrained shadowing. No additional decorative interface, fabricated content, progress dashboard, or swipe controls are introduced.

## Architecture

### Exact React Bits `CardSwap`

Install the official JavaScript + CSS React Bits component with:

```bash
npx shadcn@latest add @react-bits/CardSwap-JS-CSS
```

Keep the generated `CardSwap` component source and stylesheet intact. It owns:

- the physical card slots;
- GSAP timelines for exit, promotion, and return motion;
- automatic timing, pause-on-hover behavior, and cleanup.

All seven current question cards are passed to the exact component so its built-in circular ordering performs the full cycle.

### Three-slot station viewport

Add a station-owned wrapper around `CardSwap` that visually reveals only the front, middle, and back depth slots. Deeper cards remain outside the clipped presentation window. When the front card departs and the built-in React Bits timeline promotes the remaining cards, the fourth card crosses into the visible rear slot naturally.

This wrapper may position, size, and clip the generated component, but it must not modify the generated component source or stylesheet.

### `SecondStation`

`SecondStation` continues to own the station shell and the existing `GridScan`. It renders the new question-deck composition above the background.

### Question content

`stationCards` remains the single source of truth. The seven existing questions, kickers, and order are retained. The old static `AutoCardStack` presentation is removed from the second station, but unrelated components are not refactored.

## Data and Motion Flow

1. Pass all seven `stationCards` to the exact React Bits component in their current order.
2. Hold the front card long enough for the question to be read.
3. Animate the front card out of the deck.
4. Promote the middle card to front and the back card to middle.
5. Promote the next queued card from the clipped depth area into the visible rear slot.
6. Return the departed card to the deepest slot using the component's built-in circular order.
7. Repeat until all seven questions have led the deck, then continue from question one.

Only three cards are visible in the station viewport throughout the cycle, even though all seven remain mounted so the exact component can animate its own order.

## Interaction and Accessibility

- The deck advances automatically.
- The exact component receives `pauseOnHover={true}`, using its built-in pause and resume behavior without station-level timer logic.
- The deck exposes an accessible label, and each rendered card retains its full question text.
- With reduced motion enabled, the station renders a stable three-card composition instead of mounting the animated component.
- Animation setup and timer cleanup remain owned by the exact generated component.

## Responsive Behavior

Desktop and larger installation displays use the full three-dimensional stack. Card size scales within bounded minimum and maximum dimensions so question text remains readable.

On narrower screens, the stack remains centered and continues to show three cards, with reduced spacing and perspective rather than horizontal scrolling. The deck must stay within the viewport and avoid clipping the front card during its resting state.

## Failure Handling

- The station always supplies the seven validated `stationCards` entries.
- The generated component retains its built-in behavior for small child counts and timeline cleanup.
- The station wrapper uses fixed responsive bounds rather than browser measurements during render.
- If the registry command fails, implementation stops and reports the installation error instead of substituting a hand-written approximation.

The station does not fork or patch registry-owned logic to add behavior.

## Verification

Automated checks will cover:

- the exact registry component and CSS are installed and imported;
- all seven current `stationCards` are rendered as `Card` children;
- the station presentation applies the three-slot clipping wrapper;
- the old `AutoCardStack` is no longer rendered by `SecondStation`.

Project verification will run the existing test suite and production build. Browser verification at the card-station route will confirm:

- the original `GridScan` background remains intact;
- exactly three cards are visible at rest;
- every one of the seven existing questions reaches the front position;
- a replacement card enters at the back after each departure;
- layout remains usable at desktop and mobile viewport widths;
- no runtime errors, timer duplication, or visible content flashes occur.

## Scope

This change is limited to the second station's card presentation and the supporting card-swap logic and tests. It does not change the orb station, avatar station, navigation, question wording, or background implementation.
