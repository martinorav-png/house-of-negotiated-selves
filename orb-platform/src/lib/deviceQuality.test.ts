import { describe, expect, it } from 'vitest'
import {
  detectDeviceQuality,
  kioskOrbCounts,
  mirrorCameraConstraints,
} from './deviceQuality'

describe('device quality', () => {
  it('keeps full quality on a typical desktop', () => {
    expect(
      detectDeviceQuality({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        platform: 'Win32',
        hardwareConcurrency: 8,
        deviceMemory: 16,
        search: '',
      }),
    ).toBe('full')
  })

  it('detects Raspberry Pi kiosks from the user agent', () => {
    expect(
      detectDeviceQuality({
        userAgent: 'Mozilla/5.0 (X11; Linux aarch64) Raspberry Pi Chromium',
        platform: 'Linux aarch64',
        hardwareConcurrency: 4,
        deviceMemory: 4,
        search: '',
      }),
    ).toBe('kiosk')
  })

  it('treats 4GB ARM Linux as a kiosk even without Raspberry in the UA', () => {
    expect(
      detectDeviceQuality({
        userAgent: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 Chrome/120',
        platform: 'Linux aarch64',
        hardwareConcurrency: 4,
        deviceMemory: 4,
        search: '',
      }),
    ).toBe('kiosk')
  })

  it('lets a query string force the kiosk profile on a fast machine', () => {
    expect(
      detectDeviceQuality({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120',
        platform: 'MacIntel',
        hardwareConcurrency: 10,
        deviceMemory: 16,
        search: '?quality=low',
      }),
    ).toBe('kiosk')
  })

  it('caps the mirror camera and guide-orb budget on kiosk', () => {
    expect(mirrorCameraConstraints('kiosk')).toMatchObject({
      width: { ideal: 480, max: 720 },
      frameRate: { ideal: 15, max: 20 },
    })
    expect(kioskOrbCounts({ shell: 2900, volume: 2425, halo: 1310 }, 'kiosk')).toEqual({
      shell: 812,
      volume: 679,
      halo: 367,
    })
  })
})
