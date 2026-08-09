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

### `CardSwap`

Add a local TypeScript React component adapted from the supplied React Bits JavaScript and CSS source. It owns:

- the three physical card slots;
- GSAP timelines for exit, promotion, and return motion;
- the index of the front question;
- the mapping from the seven-card data set into three rendered cards;
- automatic timing, hover/focus pausing, cleanup, and reduced-motion behavior.

Unlike the stock React Bits implementation, it will not render every child as a visible stack layer. It will maintain a circular queue over the full data set and render only the front, middle, and back entries.

### `SecondStation`

`SecondStation` continues to own the station shell and the existing `GridScan`. It renders the new question-deck composition above the background.

### Question content

`stationCards` remains the single source of truth. The seven existing questions, kickers, and order are retained. The old static `AutoCardStack` presentation is removed from the second station, but unrelated components are not refactored.

## Data and Motion Flow

1. Initialize visible indices as `[0, 1, 2]` and keep the next queued index at `3`.
2. Hold the front card long enough for the question to be read.
3. Animate the front card out of the deck.
4. Promote the middle card to front and the back card to middle.
5. Replace the departed card's content with the next queued question while it is outside the visible stack.
6. Position that recycled card in the rear slot and animate it into view.
7. Advance the queue index modulo seven and repeat.

Only three card elements exist in the visual deck throughout the cycle. Content replacement happens while the recycled element is out of view, preventing flashes or duplicate visible questions.

## Interaction and Accessibility

- The deck advances automatically.
- Hovering or keyboard-focusing the deck pauses both the active timeline and the next automatic advance. Leaving or blurring resumes it without creating duplicate timers.
- The deck exposes an accessible label, and each rendered card retains its full question text.
- With reduced motion enabled, questions still cycle but use an immediate or short cross-state transition instead of the full 3D travel animation.
- Animation setup and timers are fully cleaned up on unmount and React development-mode effect re-runs.

## Responsive Behavior

Desktop and larger installation displays use the full three-dimensional stack. Card size scales within bounded minimum and maximum dimensions so question text remains readable.

On narrower screens, the stack remains centered and continues to show three cards, with reduced spacing and perspective rather than horizontal scrolling. The deck must stay within the viewport and avoid clipping the front card during its resting state.

## Failure Handling

- With zero cards, the deck renders nothing.
- With one card, it renders a single stable card and does not start a swap timer.
- With two cards, it renders two slots and cycles safely.
- GSAP timelines and timers are killed before being recreated.
- Card sizing and slot calculations avoid depending on browser-only measurements during render.

The production station is expected to receive all seven `stationCards`, but these cases keep the component reusable and prevent interval errors.

## Verification

Automated checks will cover:

- initial visible indices;
- advancing a three-slot window through a larger circular data set;
- wraparound from the final question to the first;
- no more than three visible entries;
- one- and two-card behavior;
- reduced-motion state selection where practical.

Project verification will run the existing test suite and production build. Browser verification at the card-station route will confirm:

- the original `GridScan` background remains intact;
- exactly three cards are visible at rest;
- every one of the seven existing questions reaches the front position;
- a replacement card enters at the back after each departure;
- layout remains usable at desktop and mobile viewport widths;
- no runtime errors, timer duplication, or visible content flashes occur.

## Scope

This change is limited to the second station's card presentation and the supporting card-swap logic and tests. It does not change the orb station, avatar station, navigation, question wording, or background implementation.
