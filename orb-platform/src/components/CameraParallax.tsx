import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, PARALLAX } from '../config'
import { useOrbContext } from '../context/OrbContext'
import { computeOrbit } from '../lib/faceParallax'
import { facePose } from '../lib/facePose'

/**
 * Camera-only window parallax driven by shared facePose.
 * The orb, room, and shaders remain unaware of face tracking.
 */
type Props = {
  enabled: boolean
}

export function CameraParallax({ enabled }: Props) {
  const { camera, size } = useThree()
  const { reducedMotion } = useOrbContext()
  const lookAt = useMemo(() => new THREE.Vector3(...CAMERA.lookAt), [])
  const current = useRef({ yaw: 0, pitch: 0, radius: CAMERA.position[2] })
  const base = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const upAxis = useRef(new THREE.Vector3(0, 1, 0))
  const qYaw = useRef(new THREE.Quaternion())
  const qPitch = useRef(new THREE.Quaternion())
  const right = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05)
    const narrow = size.width < CAMERA.narrowBreakpoint
    const baseZ = narrow ? CAMERA.narrowZ : CAMERA.position[2]

    base.current.set(
      CAMERA.position[0] - CAMERA.lookAt[0],
      CAMERA.position[1] - CAMERA.lookAt[1],
      baseZ - CAMERA.lookAt[2],
    )
    const baseRadius = base.current.length()

    const target = computeOrbit(
      {
        x: facePose.x,
        y: facePose.y,
        z: facePose.z,
        present: facePose.present && facePose.active,
      },
      baseRadius,
      reducedMotion,
      enabled,
    )

    const lambda = enabled && facePose.present && facePose.active ? PARALLAX.damp : PARALLAX.lostDamp
    current.current.yaw = THREE.MathUtils.damp(current.current.yaw, target.yaw, lambda, d)
    current.current.pitch = THREE.MathUtils.damp(
      current.current.pitch,
      target.pitch,
      lambda,
      d,
    )
    current.current.radius = THREE.MathUtils.damp(
      current.current.radius,
      target.radius,
      lambda,
      d,
    )

    qYaw.current.setFromAxisAngle(upAxis.current, current.current.yaw)
    right.current.set(1, 0, 0).applyQuaternion(qYaw.current)
    qPitch.current.setFromAxisAngle(right.current, current.current.pitch)
    direction.current
      .copy(base.current)
      .normalize()
      .applyQuaternion(qYaw.current)
      .applyQuaternion(qPitch.current)

    camera.position.copy(lookAt).addScaledVector(direction.current, current.current.radius)
    camera.lookAt(lookAt)
  })

  return null
}
