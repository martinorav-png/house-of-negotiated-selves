import { useEffect } from 'react'
import { useControls } from 'leva'
import type { MirrorCameraHandle } from '../hooks/useMirrorCamera'

const AUTO = ''

/**
 * Webcam picker — Safari (unlike Chrome) has no built-in UI for choosing
 * between multiple cameras when a page just asks for `facingMode: 'user'`,
 * so it silently keeps using whichever one it picked first (usually the
 * built-in one). This exposes the enumerated device list as a leva
 * dropdown and reconnects the camera hook to whichever one is chosen.
 *
 * The `deps` array on useControls (camera.devices/selectedDeviceId) is
 * what makes leva rebuild the dropdown's option list once real device
 * labels come in — they're empty until permission has been granted once.
 */
export function CameraDevPanel({ camera }: { camera: MirrorCameraHandle }) {
  const options: Record<string, string> = { 'Auto (browser default)': AUTO }
  camera.devices.forEach((device) => {
    options[device.label] = device.deviceId
  })

  const { deviceId } = useControls(
    'Camera — Device',
    {
      deviceId: {
        label: 'webcam',
        value: camera.selectedDeviceId ?? AUTO,
        options,
      },
    },
    [camera.devices, camera.selectedDeviceId],
  )

  useEffect(() => {
    const next = deviceId === AUTO ? null : deviceId
    if (next !== camera.selectedDeviceId) camera.selectDevice(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  return null
}
