import { useState, type ReactNode } from 'react'
import {
  readMirrorPreviewMode,
  writeMirrorPreviewMode,
  type MirrorPreviewMode,
} from '../lib/mirrorPreviewMode'

export function MirrorPreviewFrame({
  children,
  showToggle = true,
}: {
  children: ReactNode
  showToggle?: boolean
}) {
  const [mode, setMode] = useState<MirrorPreviewMode>(readMirrorPreviewMode)
  const changeMode = (nextMode: MirrorPreviewMode) => {
    setMode(nextMode)
    writeMirrorPreviewMode(nextMode)
  }

  return (
    <div className={`mirror-preview-frame experience-mirror-preview-${mode}`}>
      {children}
      {showToggle ? <MirrorPreviewToggle mode={mode} onChange={changeMode} /> : null}
    </div>
  )
}

export function MirrorPreviewToggle({
  mode,
  onChange,
}: {
  mode: MirrorPreviewMode
  onChange: (mode: MirrorPreviewMode) => void
}) {
  const nextMode = mode === 'portrait' ? 'fill' : 'portrait'
  const label = nextMode === 'fill' ? 'Fill screen' : 'Portrait 9:16'

  return (
    <button
      className="mirror-preview-toggle"
      type="button"
      onClick={() => onChange(nextMode)}
      aria-label={`Switch mirror preview to ${label}`}
    >
      {label}
    </button>
  )
}
