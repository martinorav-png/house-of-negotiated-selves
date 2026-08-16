export type MirrorPreviewMode = 'portrait' | 'fill'

const STORAGE_KEY = 'mirror-preview-mode'

export function readMirrorPreviewMode(
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
): MirrorPreviewMode {
  try {
    return storage?.getItem(STORAGE_KEY) === 'fill' ? 'fill' : 'portrait'
  } catch {
    return 'portrait'
  }
}

export function writeMirrorPreviewMode(
  mode: MirrorPreviewMode,
  storage: Pick<Storage, 'setItem'> | undefined = defaultStorage(),
) {
  try {
    storage?.setItem(STORAGE_KEY, mode)
  } catch {
    // Storage can be unavailable in privacy-restricted kiosk browsers.
  }
}

function defaultStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}
