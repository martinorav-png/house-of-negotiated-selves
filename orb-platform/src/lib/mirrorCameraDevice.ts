/**
 * Persists the operator's chosen webcam across reloads — same pattern as
 * mirrorPreviewMode.ts. Safari (unlike Chrome) has no built-in way to pick
 * a specific camera when a page just asks for `facingMode: 'user'`, so
 * this is what backs the device picker in CameraDevPanel.
 */
const STORAGE_KEY = 'mirror-camera-device-id'

export function readSelectedCameraId(
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function writeSelectedCameraId(
  deviceId: string | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = defaultStorage(),
) {
  try {
    if (deviceId) storage?.setItem(STORAGE_KEY, deviceId)
    else storage?.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted kiosk browsers.
  }
}

function defaultStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}
