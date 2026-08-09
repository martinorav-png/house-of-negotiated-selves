# Second Station Card Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the second station's static seven-card fan with the exact registry-installed React Bits `CardSwap`, visually limited to three cards while cycling all seven existing questions.

**Architecture:** Install the registry component without patching its generated JavaScript or CSS. A station-owned `QuestionCardDeck` passes all seven `stationCards` to `CardSwap`, while an outer clipped viewport exposes only the first three depth slots and supplies the installation-specific card design. `SecondStation` keeps the current `GridScan` background and swaps only the foreground card system.

**Tech Stack:** React 19, TypeScript 5.9, CSS, GSAP 3.15, Vite 8, Vitest 4, shadcn registry CLI

## Global Constraints

- Run the exact installation command `npx shadcn@latest add @react-bits/CardSwap-JS-CSS` from `orb-platform`.
- Do not modify the JavaScript or CSS files generated for `CardSwap`.
- Keep the existing `GridScan` background configuration unchanged.
- Use all seven entries from `stationCards` in their current order and wording.
- Show no more than three cards at once: front, middle, and back.
- Use `pauseOnHover={true}` and the component's built-in circular GSAP animation.
- Render a stable three-card composition instead of `CardSwap` when reduced motion is requested.
- Do not change the orb station, avatar station, station navigation, or shared question content.

---

## File Structure

- Create from registry: `orb-platform/src/components/CardSwap.jsx` — exact React Bits animation component.
- Create from registry: `orb-platform/src/components/CardSwap.css` — exact React Bits base styles.
- Create if TypeScript requires it: `orb-platform/src/components/CardSwap.d.ts` — declaration-only bridge for the generated JavaScript module; it must not alter runtime behavior.
- Create: `orb-platform/src/components/QuestionCardDeck.tsx` — maps the seven station questions into React Bits `Card` children and selects animated or reduced-motion rendering.
- Create: `orb-platform/src/components/QuestionCardDeck.css` — station-specific card visuals, three-slot clipping, layout, and responsive behavior.
- Modify: `orb-platform/src/components/SecondStation.tsx` — replace `AutoCardStack` with `QuestionCardDeck` while leaving `GridScan` unchanged.
- Modify: `orb-platform/src/components/SecondStation.css` — retain background rules and card art variables; remove no background behavior.
- Modify: `orb-platform/src/components/stationComposition.test.ts` — assert the exact component integration, all-question mapping, and replacement of the old stack.

### Task 1: Install and lock the exact React Bits component

**Files:**
- Create: `orb-platform/src/components/CardSwap.jsx`
- Create: `orb-platform/src/components/CardSwap.css`
- Create if required: `orb-platform/src/components/CardSwap.d.ts`
- Modify or create as generated: `orb-platform/components.json`
- Modify as generated: `orb-platform/package.json`
- Modify as generated: `orb-platform/package-lock.json`
- Test: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: the official `@react-bits/CardSwap-JS-CSS` shadcn registry item and existing `gsap` dependency.
- Produces: default export `CardSwap` and named export `Card`, with the registry-defined props `width`, `height`, `cardDistance`, `verticalDistance`, `delay`, `pauseOnHover`, `onCardClick`, `skewAmount`, `easing`, and `children`.

- [ ] **Step 1: Add a failing registry-integrity test**

Update `stationComposition.test.ts` with raw imports and a test that identifies the supplied implementation without copying it into application logic:

```ts
import cardSwapSource from './CardSwap.jsx?raw'
import cardSwapStyles from './CardSwap.css?raw'

it('uses the registry CardSwap implementation and stylesheet', () => {
  expect(cardSwapSource).toContain("import gsap from 'gsap'")
  expect(cardSwapSource).toContain('const makeSlot =')
  expect(cardSwapSource).toContain("ease: 'elastic.out(0.6,0.9)'")
  expect(cardSwapSource).toContain('export default CardSwap')
  expect(cardSwapStyles).toContain('.card-swap-container')
  expect(cardSwapStyles).toContain('perspective: 900px')
})
```

- [ ] **Step 2: Run the focused test and verify the registry files are missing**

Run:

```bash
npm test -- src/components/stationComposition.test.ts
```

Expected: FAIL because `CardSwap.jsx` and `CardSwap.css` do not exist yet.

- [ ] **Step 3: Run the user's exact registry command**

From `orb-platform`, run exactly:

```bash
npx shadcn@latest add @react-bits/CardSwap-JS-CSS
```

Accept only configuration prompts required to place the component under `src/components`. Do not hand-create or substitute the component if the registry command fails. After completion, inspect the generated paths and confirm the files match the registry implementation named by the test.

- [ ] **Step 4: Add a declaration bridge only if the strict TypeScript build reports TS7016**

If `npm run build` reports that `CardSwap.jsx` lacks declarations, create `CardSwap.d.ts` alongside it:

```ts
import type {
  ComponentPropsWithoutRef,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from 'react'

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  customClass?: string
}

export type CardSwapProps = {
  width?: number | string
  height?: number | string
  cardDistance?: number
  verticalDistance?: number
  delay?: number
  pauseOnHover?: boolean
  onCardClick?: (index: number) => void
  skewAmount?: number
  easing?: 'linear' | 'elastic'
  children: ReactNode
}

export const Card: ForwardRefExoticComponent<CardProps & RefAttributes<HTMLDivElement>>

export default function CardSwap(props: CardSwapProps): ReactNode
```

Use explicit `ForwardRefExoticComponent` and `RefAttributes` imports instead of the `React` namespace if required by the project's JSX typing. Do not edit `CardSwap.jsx` or `CardSwap.css`.

- [ ] **Step 5: Run the focused test and build**

Run:

```bash
npm test -- src/components/stationComposition.test.ts
npm run build
```

Expected: the registry-integrity test passes; the build either passes or reveals only integration work deferred to Task 2. It must not report missing registry files or GSAP.

- [ ] **Step 6: Commit the exact component installation**

```bash
git add orb-platform/components.json orb-platform/package.json orb-platform/package-lock.json orb-platform/src/components/CardSwap.jsx orb-platform/src/components/CardSwap.css orb-platform/src/components/CardSwap.d.ts orb-platform/src/components/stationComposition.test.ts
git commit -m "chore: install React Bits card swap"
```

Omit `components.json`, package files, or the declaration file from `git add` when the registry command did not create or modify them.

### Task 2: Build the three-visible-card station composition

**Files:**
- Create: `orb-platform/src/components/QuestionCardDeck.tsx`
- Create: `orb-platform/src/components/QuestionCardDeck.css`
- Modify: `orb-platform/src/components/SecondStation.tsx`
- Modify: `orb-platform/src/components/SecondStation.css`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: `CardSwap`, `Card`, `stationCards`, and `usePrefersReducedMotion()`.
- Produces: `QuestionCardDeck(): JSX.Element`, rendering seven animated `Card` children normally and three stable cards under reduced motion.

- [ ] **Step 1: Replace obsolete composition expectations with failing CardSwap expectations**

Import the future deck sources as raw text in `stationComposition.test.ts` and replace the tests describing the static `AutoCardStack`:

```ts
import questionCardDeck from './QuestionCardDeck.tsx?raw'
import questionCardDeckStyles from './QuestionCardDeck.css?raw'

it('keeps GridScan and mounts the React Bits question deck', () => {
  expect(secondStation).toContain('GridScan')
  expect(secondStation).toContain('QuestionCardDeck')
  expect(secondStation).not.toContain('AutoCardStack')
})

it('passes every existing question to the exact CardSwap component', () => {
  expect(questionCardDeck).toContain("import CardSwap, { Card } from './CardSwap'")
  expect(questionCardDeck).toContain('stationCards.map')
  expect(questionCardDeck).toContain('<CardSwap')
  expect(questionCardDeck).toContain('pauseOnHover={true}')
  expect(questionCardDeck).toContain('easing="linear"')
})

it('limits the presentation to three visible depth slots', () => {
  expect(questionCardDeck).toContain('question-deck-viewport')
  expect(questionCardDeckStyles).toContain('overflow: hidden')
  expect(questionCardDeckStyles).toContain('--deck-visible-slots: 3')
})

it('uses a stable three-card fallback for reduced motion', () => {
  expect(questionCardDeck).toContain('usePrefersReducedMotion')
  expect(questionCardDeck).toContain('stationCards.slice(0, 3)')
  expect(questionCardDeck).toContain('question-deck-static')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- src/components/stationComposition.test.ts
```

Expected: FAIL because `QuestionCardDeck.tsx`, its stylesheet, and the updated `SecondStation` integration do not exist.

- [ ] **Step 3: Create the question deck component**

Create `QuestionCardDeck.tsx` with the exact component import, the existing data source, and reduced-motion fallback:

```tsx
import type { CSSProperties } from 'react'
import CardSwap, { Card } from './CardSwap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { stationCards, type StationCard } from '../lib/cardStation'
import './QuestionCardDeck.css'

function QuestionCardContent({ card }: { card: StationCard }) {
  return (
    <>
      <span className="question-swap-kicker">{card.kicker}</span>
      <h2 className="question-swap-title">{card.title}</h2>
    </>
  )
}

export function QuestionCardDeck() {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    return (
      <div className="question-deck-viewport question-deck-static" aria-label="Question cards">
        {stationCards.slice(0, 3).map((card, index) => (
          <article
            className={`question-swap-card station-card-${index + 1}`}
            key={card.kicker}
            style={{ '--static-slot': index } as CSSProperties}
          >
            <QuestionCardContent card={card} />
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="question-deck-viewport" aria-label="Cycling question cards">
      <CardSwap
        width="var(--deck-card-width)"
        height="var(--deck-card-height)"
        cardDistance={28}
        verticalDistance={44}
        delay={4200}
        pauseOnHover={true}
        skewAmount={4}
        easing="linear"
      >
        {stationCards.map((card, index) => (
          <Card
            customClass={`question-swap-card station-card-${index + 1}`}
            key={card.kicker}
            aria-label={card.title}
          >
            <QuestionCardContent card={card} />
          </Card>
        ))}
      </CardSwap>
    </div>
  )
}
```

Keep the `CSSProperties` type import rather than enabling a global React namespace or weakening strict compiler settings.

- [ ] **Step 4: Implement the station-owned three-slot viewport and card design**

Create `QuestionCardDeck.css` using the existing card art variables and these layout invariants:

```css
.question-deck-viewport {
  --deck-visible-slots: 3;
  --deck-card-width: clamp(260px, 34vw, 430px);
  --deck-card-height: clamp(360px, 52vw, 610px);
  position: absolute;
  left: 50%;
  top: 52%;
  z-index: 2;
  width: calc(var(--deck-card-width) + 56px);
  height: calc(var(--deck-card-height) + 88px);
  overflow: hidden;
  transform: translate(-50%, -50%);
  isolation: isolate;
}

.question-deck-viewport .card-swap-container {
  position: absolute;
  left: 0;
  right: auto;
  bottom: 0;
  transform: none;
  transform-origin: center;
}

.question-deck-viewport .question-swap-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(24px, 3vw, 42px);
  overflow: hidden;
  border: 1px solid rgba(232, 244, 234, 0.34);
  border-radius: 12px;
  background: var(--card-art), #101411;
  color: #f3f7f3;
}
```

Complete the stylesheet with a quiet inset veil for legibility, uppercase question kicker, readable serif question title, three static transforms derived from `--static-slot`, and mobile overrides that reduce card dimensions while preserving all three slots. Do not introduce new colors outside the existing pale green, sage, charcoal, muted gold, white, and black palette.

- [ ] **Step 5: Integrate the deck without changing the background**

Modify only the foreground import and render in `SecondStation.tsx`:

```tsx
import { QuestionCardDeck } from './QuestionCardDeck'

// Keep the existing GridScan props byte-for-byte unchanged.
<QuestionCardDeck />
```

Remove the `AutoCardStack` import and `<AutoCardStack />`. Keep the `GridScan`, `CARD_PALETTE`, section label, and all background props unchanged. Retain the `.station-card-1` through `.station-card-7` art variables in `SecondStation.css` so the new cards reuse the current visual palette.

- [ ] **Step 6: Run the focused test and full automated verification**

Run:

```bash
npm test -- src/components/stationComposition.test.ts
npm test
npm run build
```

Expected: all tests pass and TypeScript/Vite produces the production bundle without missing declaration, import, or CSS errors.

- [ ] **Step 7: Verify the live card cycle in the browser**

At `http://127.0.0.1:5175/#/cards`, verify at desktop and mobile widths:

- the original scan background is unchanged;
- only three card edges/surfaces are visible at rest and throughout swaps;
- the leading question advances through all seven current questions and wraps to question one;
- the fourth question becomes the visible rear card after the first departure;
- hover pauses and leaving resumes the built-in animation;
- the front card and question text are not clipped;
- the browser console has no runtime errors.

Temporarily emulate `prefers-reduced-motion: reduce` and verify that the stable three-card fallback renders with no GSAP swap.

- [ ] **Step 8: Commit the second station rebuild**

```bash
git add orb-platform/src/components/QuestionCardDeck.tsx orb-platform/src/components/QuestionCardDeck.css orb-platform/src/components/SecondStation.tsx orb-platform/src/components/SecondStation.css orb-platform/src/components/stationComposition.test.ts
git commit -m "feat: rebuild second station card cycle"
```

Do not stage the pre-existing untracked `orb-platform/vite-5176.log` or `orb-platform/vite-5176.err.log` files.
