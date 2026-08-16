# Debra Voice Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play the seven supplied Debra recordings in sync with their matching Station II and III text states.

**Architecture:** A focused `DebraVoice` component owns clip selection, playback, autoplay recovery, and cleanup. Station II passes its reducer phase and question index into that component and retains its existing visitor-controlled question flow.

**Tech Stack:** React 19, TypeScript 5.9, HTMLAudioElement, Vitest 4, jsdom, Vite 8

## Global Constraints

- Keep the percentile result silent. Start the Debra introduction clip when its companion-introduction text appears and retain it through the adjacent Debra briefing phase without restarting it.
- Start the Station I self-check clip only when “Do you like what you see?” appears.
- Map clips 1–5 to the three questions, height, and Station II completion; map clips 6–7 to Station III intro and prompt.
- Copy assets into `public/audio/debra`; runtime code must not reference `C:\Users\Martin\Downloads`.
- Stop and rewind the previous clip whenever visible text changes.
- Audio failure must never block or advance the journey.
- Retry blocked autoplay on the first pointer or keyboard gesture.
- Preserve `phaseDurationMs` as an explicit uniform override; use the original `3000ms` default for all three opening phases.
- Do not commit or push changes.

---

### Task 1: Add test-covered Debra clip selection and playback

**Files:**
- Create: `orb-platform/src/components/DebraVoice.tsx`
- Create: `orb-platform/src/components/DebraVoice.runtime.test.tsx`
- Create: `orb-platform/public/audio/debra/01-is-attractiveness-important-to-you.mp3`
- Create: `orb-platform/public/audio/debra/02-should-your-companion-challenge-you.mp3`
- Create: `orb-platform/public/audio/debra/03-would-you-choose-companionship-over-independence.mp3`
- Create: `orb-platform/public/audio/debra/04-how-tall-is-your-ideal-partner.mp3`
- Create: `orb-platform/public/audio/debra/05-youre-good-to-go-now.mp3`
- Create: `orb-platform/public/audio/debra/06-now-is-your-chance.mp3`
- Create: `orb-platform/public/audio/debra/07-introduce-yourself-to-your-future-partner.mp3`
- Create: `orb-platform/public/audio/debra/08-do-you-like-what-you-see.mp3`
- Create: `orb-platform/public/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3`

**Interfaces:**
- Consumes: `StationTwoPhase` and zero-based `questionIndex`.
- Produces: `DebraVoice({ phase, questionIndex })` and `debraVoiceClipFor(phase, questionIndex): string | null`.

- [ ] Write a failing table-driven test with literal expected URLs for all seven text states and `null` for completion.
- [ ] Write a failing runtime test proving the rendered audio source changes, `play()` is attempted, and the previous element is paused and rewound during cleanup.
- [ ] Run `npm test -- src/components/DebraVoice.runtime.test.tsx` and confirm failures are caused by the missing component.
- [ ] Implement the mapping, hidden semantic audio element, non-blocking playback, gesture retry, and cleanup.
- [ ] Copy the seven MP3 files in chronological order to their stable public names.
- [ ] Re-run `npm test -- src/components/DebraVoice.runtime.test.tsx` and confirm it passes.

### Task 2: Integrate voice and recording-aware opening timing

**Files:**
- Modify: `orb-platform/src/components/StationTwo.tsx`
- Modify: `orb-platform/src/components/StationTwo.runtime.test.tsx`

**Interfaces:**
- Consumes: `DebraVoice({ phase, questionIndex })` from Task 1.
- Produces: Station II rendering one matching voice clip for every spoken text state.

- [ ] Extend the Station II runtime test to require no opening audio, then literal audio URLs at all three questions, height, and completion.
- [ ] Run `npm test -- src/components/StationTwo.runtime.test.tsx` and confirm the audio assertions fail before integration.
- [ ] Render `DebraVoice` from Station II and retain the three-second opening cadence when `phaseDurationMs` is omitted.
- [ ] Re-run the focused Station II and DebraVoice tests and confirm they pass.

### Task 3: Verify real assets and the complete application

**Files:**
- Modify: `orb-platform/design-qa.md`

**Interfaces:**
- Consumes: `http://127.0.0.1:5176/#/station-2` and the seven public MP3 assets.
- Produces: documented browser, test, and build evidence.

- [ ] Run `ffprobe` against every copied asset and confirm the destination durations match `2.925688`, `2.586063`, `5.407313`, `3.631000`, `4.048938`, `2.194250`, and `3.474250` seconds in order.
- [ ] Inspect Station II in the in-app browser and confirm the opening screens contain no audio element, clip 1 appears with the attractiveness question, and no new console errors appear.
- [ ] Run `git diff --check`, `npm test`, and `npm run build`; require zero test or build failures.
- [ ] Add the verified mapping, timing, browser result, and test/build totals to `design-qa.md`.
