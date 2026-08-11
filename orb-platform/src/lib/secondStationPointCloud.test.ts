import { describe, expect, it } from 'vitest'
import {
  SECOND_STATION_POINT_CLOUD_CONFIG,
  buildScannedPlane,
  buildSecondStationPlatformCloud,
  buildSecondStationRoomCloud,
  type ScannedPlaneSpec,
} from './secondStationPointCloud'

const TEST_PLANE: ScannedPlaneSpec = {
  seed: 9137,
  count: 2_500,
  center: [0, 0, 0],
  axisU: [1, 0, 0],
  axisV: [0, 1, 0],
  normal: [0, 0, 1],
  sizeU: 8,
  sizeV: 6,
  thickness: 0.06,
  edgeNoise: true,
}

describe('second-station stochastic surface sampler', () => {
  it('uses the approved quality budgets', () => {
    expect(SECOND_STATION_POINT_CLOUD_CONFIG.desktop.pointCount).toBe(150_000)
    expect(SECOND_STATION_POINT_CLOUD_CONFIG.mobile.pointCount).toBe(60_000)
  })

  it('is deterministic for a seed and changes for a different seed', () => {
    const a = buildScannedPlane({ ...TEST_PLANE, count: 384 }, 'desktop')
    const b = buildScannedPlane({ ...TEST_PLANE, count: 384 }, 'desktop')
    const c = buildScannedPlane(
      { ...TEST_PLANE, seed: TEST_PLANE.seed + 1, count: 384 },
      'desktop',
    )

    expect(a.positions).toEqual(b.positions)
    expect(a.positions).not.toEqual(c.positions)
  })

  it('fills every point attribute exactly and keeps point sizes in range', () => {
    const requestedCount = 1_073
    const result = buildScannedPlane(
      { ...TEST_PLANE, count: requestedCount },
      'mobile',
    )

    expect(result.count).toBe(requestedCount)
    expect(result.positions).toHaveLength(requestedCount * 3)
    expect(result.normals).toHaveLength(requestedCount * 3)
    expect(result.seeds).toHaveLength(requestedCount)
    expect(result.sizes).toHaveLength(requestedCount)
    expect(result.brightness).toHaveLength(requestedCount)
    expect(result.visibility).toHaveLength(requestedCount)
    expect(result.displace).toHaveLength(requestedCount)
    expect(Math.min(...result.sizes)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...result.sizes)).toBeLessThanOrEqual(
      SECOND_STATION_POINT_CLOUD_CONFIG.pointSize.max,
    )
  })

  it('creates irregular density, unique tangents, and signed thickness', () => {
    const result = buildScannedPlane(TEST_PLANE, 'desktop')
    const buckets = new Array<number>(12 * 12).fill(0)
    const xCoordinates = new Map<number, number>()
    const yCoordinates = new Map<number, number>()
    let negativeNormalOffsets = 0
    let positiveNormalOffsets = 0
    let maximumNormalOffset = 0

    for (let point = 0; point < result.count; point += 1) {
      const offset = point * 3
      const x = result.positions[offset]
      const y = result.positions[offset + 1]
      const z = result.positions[offset + 2]
      const bucketX = Math.max(0, Math.min(11, Math.floor(((x + 4) / 8) * 12)))
      const bucketY = Math.max(0, Math.min(11, Math.floor(((y + 3) / 6) * 12)))

      buckets[bucketY * 12 + bucketX] += 1
      xCoordinates.set(Math.round(x * 10_000), (xCoordinates.get(Math.round(x * 10_000)) ?? 0) + 1)
      yCoordinates.set(Math.round(y * 10_000), (yCoordinates.get(Math.round(y * 10_000)) ?? 0) + 1)
      if (z < 0) negativeNormalOffsets += 1
      if (z > 0) positiveNormalOffsets += 1
      maximumNormalOffset = Math.max(maximumNormalOffset, Math.abs(z))
    }

    const nonEmptyBuckets = buckets.filter((count) => count > 0)
    const emptyBucketCount = buckets.length - nonEmptyBuckets.length
    const sparseBucketCount = Math.min(...nonEmptyBuckets)
    const denseBucketCount = Math.max(...nonEmptyBuckets)
    const repeatedX = Math.max(...xCoordinates.values())
    const repeatedY = Math.max(...yCoordinates.values())

    console.info('second-station sampler distribution', {
      emptyBucketCount,
      sparseBucketCount,
      denseBucketCount,
      densityRatio: denseBucketCount / sparseBucketCount,
      repeatedX,
      repeatedY,
      negativeNormalOffsets,
      positiveNormalOffsets,
      maximumNormalOffset,
    })

    expect(emptyBucketCount).toBeGreaterThan(0)
    expect(denseBucketCount).toBeGreaterThanOrEqual(sparseBucketCount * 3)
    expect(repeatedX).toBeLessThanOrEqual(3)
    expect(repeatedY).toBeLessThanOrEqual(3)
    expect(negativeNormalOffsets).toBeGreaterThan(0)
    expect(positiveNormalOffsets).toBeGreaterThan(0)
    expect(maximumNormalOffset).toBeLessThanOrEqual(TEST_PLANE.thickness)
  })

  it('assembles exact room and platform budgets', () => {
    const desktopStart = performance.now()
    const desktopRoom = buildSecondStationRoomCloud('desktop')
    const desktopDurationMs = performance.now() - desktopStart
    const room = buildSecondStationRoomCloud('mobile')
    const platform = buildSecondStationPlatformCloud('mobile')
    const expectedPlatformCount = Math.round(
      SECOND_STATION_POINT_CLOUD_CONFIG.mobile.pointCount *
        SECOND_STATION_POINT_CLOUD_CONFIG.platformPointShare,
    )

    console.info('second-station desktop room generation', {
      pointCount: desktopRoom.count,
      durationMs: desktopDurationMs,
    })

    expect(desktopRoom.count).toBe(SECOND_STATION_POINT_CLOUD_CONFIG.desktop.pointCount)
    expect(room.count).toBe(SECOND_STATION_POINT_CLOUD_CONFIG.mobile.pointCount)
    expect(platform.count).toBe(expectedPlatformCount)
  })
})
