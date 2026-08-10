/**
 * Shared typing flag, written by App as the visitor types an answer, read
 * by Orb to gate the room's scan effect (only sweeps once someone's
 * actually answering, not idle).
 */
export const typingState = {
  active: false,
}
