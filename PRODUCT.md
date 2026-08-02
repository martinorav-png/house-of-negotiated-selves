# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary user:** Solo visitors to an Ars Electronica 2026 installation - culturally curious adults (often 25–35), art- and tech-literate, who have seen many exhibitions and arrive skeptical but open to something memorable.

**Situation:** They enter a darkened, guided physical space alone. At each station they interact with a smart mirror (keyboard + touchscreen) while an AI guide voice (Debra) reads questions and responds to input.

**Job to be done:** Complete an intake flow that feels like building a companion/partner, then encounter the generated result - and leave with a reflection on autonomy vs. machine representation.

## Product Purpose

**House of Negotiated Selves** is an interactive solo installation about the line between human autonomy and machine representation, framed as a funhouse mirror.

The digital UI prototypes a **companion-matching** intake: a survey that extracts personal data under warm, sycophantic guidance, then reveals a "forged" companion. Active implementation is **`datebooth-ui/`** (Datebooth). Legacy gallery/scripts remain in **`mock-ui/`**.

**Success for the UI:** A clickable portrait kiosk prototype of the station journey that can be shown to the team and used as the basis for production mirror screens.

## Positioning

Unlike a generic dating-app mockup, this UI is **theatre**: Debra is warm Companion Guide, questions escalate from playful to unsettling, and the companion reveal is the emotional peak. Romance language sits on uncanny retail chrome. The UI must support that narrative arc, not optimize for conversion.

## Operating Context

- **Physical install:** 8.6 × 4.8 × 2.8 m room; corridor with three right turns; hexagonal revealing chamber; 3 interactive smart mirrors (24″ portrait in production; mock runs landscape in browser).
- **Solo flow:** One active participant at a time; stations gate on prior completion.
- **Production targets:** Raspberry Pi mirror clients (`mirror/` Flutter app, future); Mac Mini orchestration hub (not in repo).
- **Festival:** Ars Electronica 2026, theme *Future Begins – Negotiating Humanity*, opens 9 September 2026.
- **Handoff docs:** `CONTEXT.md`, `userjourney2.pdf` (canonical station script) at repo root.

## Capabilities and Constraints

**In scope for `mock-ui/` (confirmed primary surface):**
- Welcome / entry screen (on-screen copy only; entrance vocal monologue is out of mock UI)
- Station 1 - Self (government name, DOB, orientation, hobbies, occupation, religion, nationality, ID photo)
- Station 2 - Desire (partner preferences via chips + height slider; Debra coaching; avatar pipeline implied in logs)
- Station 3 - Matches (life-vision fill-blanks, dealbreaker text, three yes/no polygraph questions; persona seed for reveal only)
- Generating - companion being forged
- Reveal - companion card / avatar presentation

**Out of scope for current mock (future phases):**
- Outside approach signage and consent poster
- Entrance orientation (spatial/audio/lighting only)
- Transition animations on non-interactive mirrors
- Revealing chamber multi-screen avatar encounter
- Exit / souvenir photocard pickup
- Session reset orchestration

**Technical constraints:**
- Vite + React 19 + TypeScript (`datebooth-ui/`, `mock-ui/`)
- Production targets **portrait** 24″ mirrors (Datebooth is 9:16 / pillarboxed)
- Webcam for ID photo (requires user gesture; Chrome/Safari on localhost)
- Debra voice is pre-recorded (ElevenLabs v3); not live TTS in stations
- No live face biometrics; no live visitor scraping
- EU AI Act disclosure planned for physical QR receipt (not in mock yet)

**Content constraint (confirmed):** SFW - unsettling but gallery-safe. No explicit 18+ content in copy or interactions.

**Visual direction:** **Datebooth** (confirmed) - charcoal void, soft rose boutique chrome, Debra as Companion Guide silhouette. Replaces Institutional Mirror Terminal and Soft Future blush as the active direction. Spec: `DESIGN.md`. Active app: `datebooth-ui/`.

## Brand Commitments

- **Name:** House of Negotiated Selves (package: `house-of-negotiated-selves`)
- **Guide:** Debra - Companion Guide; warm and sycophantic; Datebooth shows faceless rose-rim silhouette (not glass orb); pre-recorded voice with emotion tags
- **Digital framing:** Perfect AI companion / partner matching (not "new self")
- **Typography (Datebooth):** Cormorant Garamond (display) · Manrope (body/UI)
- **Design system:** `DESIGN.md` (Datebooth Entry lock: YOUR PERFECT COMPANION / AVAILABLE TONIGHT / BEGIN VIEWING)
- **Active UI:** `datebooth-ui/`
- **Legacy scripts:** `mock-ui/src/data/content.ts`
- **Copy rule:** No em dashes in UI copy

## Evidence on Hand

| Asset | Path |
|-------|------|
| Full concept handoff | `CONTEXT.md` |
| Design system (Datebooth) | `DESIGN.md` |
| Active Datebooth app | `datebooth-ui/` |
| User journey map (canonical script) | `userjourney2.pdf` (local only; gitignored if >100MB) |
| Debra intro monologue | `scripts/debra-intro.txt` |
| Legacy Stitch HTML + screenshots | `mock-ui/stitch/` |
| Station scripts (legacy mock) | `mock-ui/src/data/content.ts` |

**Not in repo (do not fabricate):** generated Debra voice samples (`samples/*.mp3`, gitignored), Unity avatar pipeline, production MQTT/server, physical lighting control.

## Product Principles

1. **Warm extraction** - Debra makes sharing feel safe; unease is retroactive, not upfront.
2. **Progressive intimacy** - questions escalate from playful to personal; Station 3 is the vulnerability peak.
3. **Theatre over utility** - UI serves the narrative arc (heard → closer → matched → forged → revealed), not app-like efficiency.
4. **Solo immersion** - one visitor, no social proof, no skip-ahead; incomplete stations block progress.
5. **Honest unsettling** - system logs and confidence meters surface the machine behind the warmth without breaking SFW bounds.

## Accessibility & Inclusion

- Kiosk must work with keyboard-only input (production uses physical keyboard on shelf).
- Photo/voice steps need clear on-screen instructions and fallbacks if permissions denied.
- No reliance on color alone for state (active station, progress, errors).
- Gallery context: consider low-light viewing, standing use, no audio-only critical information (Debra voice supplements, does not replace, on-screen text).
