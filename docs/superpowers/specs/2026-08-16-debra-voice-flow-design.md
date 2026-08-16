# Debra voice flow design

## Outcome

Station I remains silent until its self-check question. Station II remains silent through the percentile result, then Debra's introduction recording begins exactly when its matching text appears. The same audio element continues through the adjacent briefing phase so the line is not restarted or cut at the visual transition. The remaining recordings follow their matching Station II and Station III text screens.

## Assets and mapping

The MP3 files from `C:\Users\Martin\Downloads\Debra Flow` are copied into `orb-platform/public/audio/debra` under stable content-based names. Runtime code never depends on the Downloads directory.

| Screen | Asset |
| --- | --- |
| Attractiveness question | `/audio/debra/01-is-attractiveness-important-to-you.mp3` |
| Challenge question | `/audio/debra/02-should-your-companion-challenge-you.mp3` |
| Companionship question | `/audio/debra/03-would-you-choose-companionship-over-independence.mp3` |
| Height question | `/audio/debra/04-how-tall-is-your-ideal-partner.mp3` |
| Station II completion | `/audio/debra/05-youre-good-to-go-now.mp3` |
| Station III “Now is your chance” | `/audio/debra/06-now-is-your-chance.mp3` |
| Station III “Introduce yourself…” | `/audio/debra/07-introduce-yourself-to-your-future-partner.mp3` |
| Station I “Do you like what you see?” | `/audio/debra/08-do-you-like-what-you-see.mp3` |
| Station II Debra introduction | `/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3` |

## Playback behavior

- A dedicated `DebraVoice` component selects one clip from the current Station II phase and question index.
- Playback starts when the matching text is rendered.
- Phase or question changes pause and rewind the previous clip before starting the next one.
- The completion screen has no Debra clip.
- A rejected autoplay attempt adds one-time pointer and keyboard listeners that retry the current clip after the visitor's first gesture. Listener cleanup runs on every transition and unmount.
- Playback errors remain non-blocking and do not alter the journey.

## Timing

Explicit `phaseDurationMs` values continue to control every automatic phase in tests and development overrides. With no override, the three Station II opening phases retain their original `3000ms` cadence. Questions and height selection remain visitor-controlled.

## Testing and verification

Runtime tests assert the audio source changes with each visible text state, the previous clip is paused during transitions, completion removes the audio element, and the explicit short phase duration still works. Browser QA confirms the real MP3 files load without console errors and the longer briefing remains visible through its recording. The full Vitest suite and production build must pass.
