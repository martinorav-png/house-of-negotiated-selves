/**
 * Shared audio analysis levels — updated by the mic analyser, read in useFrame / shaders.
 * Values are smoothed 0–1.
 */
export const audioLevels = {
  /** overall RMS amplitude */
  level: 0,
  /** low frequencies — vertical bounce / scale */
  bass: 0,
  /** mids — surface agitation */
  mid: 0,
  /** highs — flicker / fine displacement */
  treble: 0,
  /** whether mic is active */
  active: false,
}
