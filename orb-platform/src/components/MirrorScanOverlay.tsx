import type { MirrorOverlayMode } from './MirrorCameraLayer'
import { CodePanel, MiniBar } from './HudDebris'
import './MirrorScanOverlay.css'

/** Purely visual for now — a fixed list, not derived from any real
 * analysis. The point is the read: a "subject profile" readout that mixes
 * neutral descriptors with a few pointedly unflattering ones, like the
 * system is passing silent judgment while it scans. Wiring this to actual
 * face-signal output is a later step. */
const PROFILE_TRAITS = [
  'young',
  'blonde',
  'facial piercings',
  'negative canthal tilt',
  'recessed jawline',
  'asymmetric brow height',
  'thin upper lip ratio',
  'wide-set eyes',
]

function SubjectProfilePanel() {
  return (
    <div className="journey-profile-panel" aria-hidden="true">
      <div className="journey-profile-header">
        <span className="journey-profile-marker" />
        SUBJECT PROFILE
      </div>
      <ul>
        {PROFILE_TRAITS.map((trait) => (
          <li key={trait}>{trait}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The fake technical debris + progress bars from the Mirror station (III),
 * reused here so Station I's scan screen carries the same "leaked debug
 * overlay" texture, plus a left-docked subject-profile readout. Only shown
 * while the camera is actually focused on the face or eyes — not during
 * the intake form, the dissolve wind-down, or when the camera is off.
 * Keyed by mode so the debris relocates/rewrites itself on the face→eyes
 * zoom change, same pattern as Station III's per-phase layouts.
 */
export function MirrorScanOverlay({ mode }: { mode: MirrorOverlayMode }) {
  if (mode !== 'face' && mode !== 'eyes') return null

  return (
    <div className="journey-scan-overlay" aria-hidden="true">
      <SubjectProfilePanel />
      <div className="mirror-hud-debris" key={mode}>
        <CodePanel
          seed={mode === 'eyes' ? 20 : 21}
          blockCount={2}
          visibleRows={7}
          large
          hasAlert
          duration={7}
          style={{ top: '96px', right: '-14px', opacity: 0.3 }}
        />
        <CodePanel
          seed={mode === 'eyes' ? 22 : 23}
          blockCount={2}
          visibleRows={5}
          ghost
          duration={11}
          style={{ bottom: '20%', right: '8px', opacity: 0.16 }}
        />
        <MiniBar style={{ top: '58px', right: '22%', opacity: 0.24 }} fill={38} />
        <MiniBar style={{ top: '150px', right: '30px', opacity: 0.2 }} fill={64} />
        <MiniBar style={{ bottom: '32%', right: '-4px', opacity: 0.22 }} fill={22} />
        <MiniBar style={{ bottom: '12%', right: '46px', opacity: 0.18 }} fill={50} />
        <MiniBar style={{ top: '210px', right: '90px', opacity: 0.16 }} fill={44} />
      </div>
    </div>
  )
}
