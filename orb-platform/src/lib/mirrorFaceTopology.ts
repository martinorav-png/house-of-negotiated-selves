export type FaceTopologyConnection = {
  start: number
  end: number
}

export function sampleFaceTopologyConnections(
  connections: FaceTopologyConnection[],
  stride = 4,
) {
  const safeStride = Number.isInteger(stride) && stride > 0 ? stride : 4
  return connections
    .filter(
      ({ start, end }) =>
        Number.isInteger(start) &&
        Number.isInteger(end) &&
        start >= 0 &&
        end >= 0 &&
        start !== end,
    )
    .filter((_, index) => index % safeStride === 0)
}
