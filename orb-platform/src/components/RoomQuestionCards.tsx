import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { stationCards } from '../lib/cardStation'
import { getServedCardState } from '../lib/cardFlow'
import { getRoomCardLayout, getRoomServedCardTransform } from '../lib/roomCardLayout'

const CARD_WIDTH = 1.12
const CARD_HEIGHT = 1.62

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function easeInOutQuad(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  words.forEach((word, index) => {
    const test = line ? `${line} ${word}` : word
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, currentY)
      line = word
      currentY += lineHeight
    } else {
      line = test
    }

    if (index === words.length - 1) {
      context.fillText(line, x, currentY)
    }
  })
}

function makeCardTexture(cardIndex: number) {
  const card = stationCards[cardIndex]
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 1080
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  const palettes = [
    ['#e8f4ea', '#d2b57f', '#242d28'],
    ['#314035', '#a8cdb7', '#e8f4ea'],
    ['#d2b57f', '#738078', '#101411'],
    ['#c8dccd', '#a8cdb7', '#314035'],
    ['#3d4741', '#c8dccd', '#d2b57f'],
    ['#e8f4ea', '#738078', '#242d28'],
    ['#c8dccd', '#3d4741', '#101411'],
  ]
  const palette = palettes[cardIndex % palettes.length]
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, palette[0])
  gradient.addColorStop(0.48, palette[1])
  gradient.addColorStop(1, palette[2])

  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  const shine = context.createRadialGradient(540, 230, 10, 540, 230, 440)
  shine.addColorStop(0, 'rgba(255,255,255,0.48)')
  shine.addColorStop(0.42, 'rgba(255,255,255,0.08)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = shine
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = 'rgba(255,255,255,0.34)'
  context.lineWidth = 3
  context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56)

  context.fillStyle = 'rgba(10,14,12,0.82)'
  context.font = '28px system-ui, sans-serif'
  context.fillText(card.kicker, 62, 92)

  context.fillStyle = 'rgba(255,255,255,0.92)'
  context.font = '500 68px Georgia, serif'
  wrapText(context, card.title, 62, 220, 610, 74)

  context.fillStyle = 'rgba(255,255,255,0.14)'
  context.fillRect(62, 892, 300, 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

export function RoomQuestionCards() {
  const groups = useRef<Array<THREE.Group | null>>([])
  const frontMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([])
  const backMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([])
  const edgeMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([])

  const textures = useMemo(() => stationCards.map((_, index) => makeCardTexture(index)), [])

  useEffect(() => {
    return () => {
      textures.forEach((texture) => texture.dispose())
      frontMaterials.current.forEach((material) => material?.dispose())
      backMaterials.current.forEach((material) => material?.dispose())
      edgeMaterials.current.forEach((material) => material?.dispose())
    }
  }, [textures])

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime
    const flow = getServedCardState(elapsed, stationCards.length)
    const d = Math.min(delta, 0.05)

    stationCards.forEach((_, index) => {
      const group = groups.current[index]
      if (!group) return

      const rest = getRoomCardLayout(index, stationCards.length)
      const served = getRoomServedCardTransform(index, stationCards.length)
      let target = rest
      let glow = 0

      if (index === flow.activeIndex) {
        if (flow.phase === 'serving') {
          const eased = easeOutCubic(flow.progress)
          target = {
            position: [
              THREE.MathUtils.lerp(rest.position[0], served.position[0], eased),
              THREE.MathUtils.lerp(rest.position[1], served.position[1], eased),
              THREE.MathUtils.lerp(rest.position[2], served.position[2], eased),
            ],
            rotation: [
              THREE.MathUtils.lerp(rest.rotation[0], served.rotation[0], eased),
              THREE.MathUtils.lerp(rest.rotation[1], served.rotation[1], eased),
              THREE.MathUtils.lerp(rest.rotation[2], served.rotation[2], eased),
            ],
            scale: THREE.MathUtils.lerp(rest.scale, served.scale, eased),
            opacity: THREE.MathUtils.lerp(rest.opacity, served.opacity, eased),
          }
          glow = eased
        } else if (flow.phase === 'active') {
          target = served
          glow = 1
        } else if (flow.phase === 'returning') {
          const eased = easeInOutQuad(flow.progress)
          target = {
            position: [
              THREE.MathUtils.lerp(served.position[0], served.position[0] + 1.4, eased),
              THREE.MathUtils.lerp(served.position[1], served.position[1] + 0.18, eased),
              THREE.MathUtils.lerp(served.position[2], served.position[2] - 0.82, eased),
            ],
            rotation: [
              THREE.MathUtils.lerp(served.rotation[0], -0.12, eased),
              THREE.MathUtils.lerp(served.rotation[1], -0.32, eased),
              THREE.MathUtils.lerp(served.rotation[2], 0.08, eased),
            ],
            scale: THREE.MathUtils.lerp(served.scale, 0.88, eased),
            opacity: THREE.MathUtils.lerp(served.opacity, 0.16, eased),
          }
          glow = 1 - eased
        }
      }

      group.position.lerp(new THREE.Vector3(...target.position), 1 - Math.exp(-8 * d))
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, target.rotation[0], 8, d)
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, target.rotation[1], 8, d)
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target.rotation[2], 8, d)
      const scale = THREE.MathUtils.damp(group.scale.x, target.scale, 8, d)
      group.scale.setScalar(scale)

      const front = frontMaterials.current[index]
      const back = backMaterials.current[index]
      const edge = edgeMaterials.current[index]
      if (front) {
        front.opacity = THREE.MathUtils.damp(front.opacity, target.opacity, 8, d)
        front.emissiveIntensity = THREE.MathUtils.damp(
          front.emissiveIntensity,
          0.03 + glow * 0.16,
          8,
          d,
        )
      }
      if (back) back.opacity = THREE.MathUtils.damp(back.opacity, target.opacity * 0.44, 8, d)
      if (edge) edge.opacity = THREE.MathUtils.damp(edge.opacity, target.opacity * 0.28, 8, d)
    })
  })

  return (
    <group position={[0, 0, 0]}>
      {stationCards.map((card, index) => {
        const rest = getRoomCardLayout(index, stationCards.length)
        return (
          <group
            key={card.kicker}
            ref={(group) => {
              groups.current[index] = group
            }}
            position={rest.position}
            rotation={rest.rotation}
            scale={rest.scale}
          >
            <mesh position={[0, 0, 0.022]} renderOrder={12}>
              <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
              <meshStandardMaterial
                ref={(material) => {
                  frontMaterials.current[index] = material
                }}
                map={textures[index]}
                transparent
                opacity={rest.opacity}
                roughness={0.48}
                metalness={0.12}
                emissive="#9edabb"
                emissiveIntensity={0.03}
                side={THREE.FrontSide}
              />
            </mesh>
            <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]} renderOrder={11}>
              <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
              <meshStandardMaterial
                ref={(material) => {
                  backMaterials.current[index] = material
                }}
                color="#121814"
                transparent
                opacity={rest.opacity * 0.44}
                roughness={0.72}
                metalness={0.08}
                side={THREE.FrontSide}
              />
            </mesh>
            <mesh renderOrder={10}>
              <boxGeometry args={[CARD_WIDTH + 0.025, CARD_HEIGHT + 0.025, 0.045]} />
              <meshStandardMaterial
                ref={(material) => {
                  edgeMaterials.current[index] = material
                }}
                color="#d2b57f"
                transparent
                opacity={rest.opacity * 0.28}
                roughness={0.5}
                metalness={0.28}
                wireframe
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
