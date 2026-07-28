# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary user:** Solo visitors to an Ars Electronica 2026 installation — culturally curious adults (often 25–35), art- and tech-literate, who have seen many exhibitions and arrive skeptical but open to something memorable.

**Situation:** They enter a darkened, guided physical space alone. At each station they interact with a smart mirror (keyboard + touchscreen) while an AI guide voice (Debra) reads questions and responds to input.

**Job to be done:** Complete an intake flow that feels like building a companion/partner, then encounter the generated result — and leave with a reflection on autonomy vs. machine representation.

## Product Purpose

**House of Negotiated Selves** is an interactive solo installation about the line between human autonomy and machine representation, framed as a funhouse mirror.

The digital UI (this repo's `mock-ui/`) prototypes the **Soft Future Companion** intake kiosk: a survey that extracts personal data under warm, sycophantic guidance, then reveals a "forged" companion. The extraction should feel safe; the forced quality is revealed retroactively when the system keeps using what was given.

**Success for the mock UI:** A clickable, landscape kiosk prototype that faithfully represents the station journey (Self → Desire → Matches → Generating → Reveal) and can be shown to the team and used as the basis for production mirror screens.

## Positioning

Unlike a generic dating-app mockup, this UI is **theatre**: Debra is warm and non-human (glass orb, not a face), questions escalate from playful to unsettling, system logs accumulate behind the scenes, and the companion reveal is the emotional peak. The UI must support that narrative arc, not optimize for conversion.

## Operating Context

- **Physical install:** 8.6 × 4.8 × 2.8 m room; corridor with three right turns; hexagonal revealing chamber; 3 interactive smart mirrors (24″ portrait in production; mock runs landscape in browser).
- **Solo flow:** One active participant at a time; stations gate on prior completion.
- **Production targets:** Raspberry Pi mirror clients (`mirror/` Flutter app, future); Mac Mini orchestration hub (not in repo).
- **Festival:** Ars Electronica 2026, theme *Future Begins – Negotiating Humanity*, opens 9 September 2026.
- **Handoff docs:** `CONTEXT.md`, `userjourney2.pdf` (canonical station script) at repo root.

## Capabilities and Constraints

**In scope for `mock-ui/` (confirmed primary surface):**
- Welcome / entry screen (on-screen copy only; entrance vocal monologue is out of mock UI)
- Station 1 — Self (government name, DOB, orientation, hobbies, occupation, religion, nationality, ID photo)
- Station 2 — Desire (partner preferences via chips + height slider; Debra coaching; avatar pipeline implied in logs)
- Station 3 — Matches (life-vision fill-blanks, dealbreaker text, three yes/no polygraph questions; persona seed for reveal only)
- Generating — companion being forged
- Reveal — companion card / avatar presentation

**Out of scope for current mock (future phases):**
- Outside approach signage and consent poster
- Entrance orientation (spatial/audio/lighting only)
- Transition animations on non-interactive mirrors
- Revealing chamber multi-screen avatar encounter
- Exit / souvenir photocard pickup
- Session reset orchestration

**Technical constraints:**
- Vite + React 19 + TypeScript
- Kiosk landscape aspect (~1440×900 reference from Figma)
- Webcam for ID photo (requires user gesture; Chrome/Safari on localhost)
- Debra voice is pre-recorded (ElevenLabs v3); not live TTS in stations
- No live face biometrics; no live visitor scraping
- EU AI Act disclosure planned for physical QR receipt (not in mock yet)

**Content constraint (confirmed):** SFW — unsettling but gallery-safe. No explicit 18+ content in copy or interactions.

**Visual direction:** Institutional Mirror Terminal (confirmed) — charcoal void, phosphor instrumentation, amber Debra orb. Replaces Soft Future blush/coral mock.

## Brand Commitments

- **Name:** House of Negotiated Selves (package: `house-of-negotiated-selves`)
- **Guide:** Debra — non-human glass orb, warm and sycophantic, pre-recorded voice with emotion tags
- **Digital framing:** Soft Future Companion intake (partner/companion, not "new self")
- **Typography:** Syne (display/questions) · Archivo (body UI) · Fragment Mono (logs/IDs). No serif typefaces.
- **Debra asset:** `mock-ui/public/stitch/debra-orb.jpg`
- **Design sources:** Stitch project `695494198560560923`; Figma [Soft Future Companion Intake](https://www.figma.com/design/7Aas74MjjERLHKuc9blj8y)
- **Copy rule:** No em dashes in UI copy

## Evidence on Hand

| Asset | Path |
|-------|------|
| Full concept handoff | `CONTEXT.md` |
| User journey map (canonical script) | `userjourney2.pdf` |
| Debra intro monologue | `scripts/debra-intro.txt` |
| Stitch HTML + screenshots | `mock-ui/stitch/` |
| Runtime stitch assets | `mock-ui/public/stitch/` |
| Screen content/copy | `mock-ui/src/data/content.ts` |
| Design tokens | `mock-ui/src/styles/tokens.css` |

**Not in repo (do not fabricate):** generated Debra voice samples (`samples/*.mp3`, gitignored), Unity avatar pipeline, production MQTT/server, physical lighting control.

## Product Principles

1. **Warm extraction** — Debra makes sharing feel safe; unease is retroactive, not upfront.
2. **Progressive intimacy** — questions escalate from playful to personal; Station 3 is the vulnerability peak.
3. **Theatre over utility** — UI serves the narrative arc (heard → closer → matched → forged → revealed), not app-like efficiency.
4. **Solo immersion** — one visitor, no social proof, no skip-ahead; incomplete stations block progress.
5. **Honest unsettling** — system logs and confidence meters surface the machine behind the warmth without breaking SFW bounds.

## Accessibility & Inclusion

- Kiosk must work with keyboard-only input (production uses physical keyboard on shelf).
- Photo/voice steps need clear on-screen instructions and fallbacks if permissions denied.
- No reliance on color alone for state (active station, progress, errors).
- Gallery context: consider low-light viewing, standing use, no audio-only critical information (Debra voice supplements, does not replace, on-screen text).
