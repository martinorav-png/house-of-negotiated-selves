/**
 * Live-tunable values for Station II's dev panel (see JourneyDevPanel).
 * Same pattern as mirrorSettingsStore.ts — a plain mutable object, no leva
 * dependency here, so it's always safe to import from production code.
 *
 * Colors mirror MirrorJourney.css's :root defaults exactly — the panel
 * only needs to override them when someone actually tunes a value.
 */
export const journeySettings = {
  colors: {
    ice: '#b9dceb',
    ink: '#ffffff',
    quiet: '#c6d6dc',
    frost: '#000000',
  },
  timing: {
    percentileMs: 3000,
    companionIntroMs: 3000,
    debraBriefMs: 3000,
  },
}
