/**
 * Shared face pose, written by media sensors and read by CameraParallax.
 * x/y are roughly -1..1 (mirrored); z is 0 far -> 1 near.
 */
export const facePose = {
  active: false,
  x: 0,
  y: 0,
  z: 0.5,
  present: false,
}
