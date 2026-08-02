import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import './IdRinglightCard.css'

export type IdRinglightCardProps = {
  blurStrength?: number
  color?: string
  metalness?: number
  roughness?: number
  overlayColor?: string
  displacementStrength?: number
  noiseScale?: number
  specularConstant?: number
  grayscale?: number
  glassDistortion?: number
  className?: string
  style?: CSSProperties
  visitorName?: string
  visitorRole?: string
  idNumber?: string
  flash?: boolean
}

type CamStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable'

export function IdRinglightCard({
  blurStrength = 8,
  color = '#f5f5f5',
  metalness = 0.9,
  roughness = 0.4,
  overlayColor = 'rgba(7, 11, 16, 0.5)',
  displacementStrength = 16,
  noiseScale = 1.2,
  specularConstant = 1.4,
  grayscale = 0.55,
  glassDistortion = 10,
  className = '',
  style = {},
  visitorName = 'VISITOR',
  visitorRole = 'INTAKE SUBJECT',
  idNumber = '8901-2345-6789',
  flash = false,
}: IdRinglightCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const reactId = useId().replace(/:/g, '')
  const filterId = `metallic-displacement-${reactId}`
  const [camStatus, setCamStatus] = useState<CamStatus>('idle')

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const enableCamera = useCallback(async () => {
    if (!window.isSecureContext) {
      setCamStatus('unavailable')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus('unavailable')
      return
    }

    setCamStatus('requesting')

    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        try {
          await video.play()
        } catch {
          // play() may need another user gesture in some embeds
        }
      }
      setCamStatus('live')
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      setCamStatus(
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'denied'
          : 'unavailable',
      )
    }
  }, [stopCamera])

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale)
  const saturation = 1 - Math.max(0, Math.min(1, grayscale))

  const cssVariables = {
    '--blur-strength': `${blurStrength}px`,
    '--metalness': metalness,
    '--roughness': roughness,
    '--overlay-color': overlayColor,
    '--text-color': color,
    '--saturation': saturation,
  } as CSSProperties

  return (
    <div
      className={['reflective-card-container', flash && 'is-flash', className].filter(Boolean).join(' ')}
      style={{ ...style, ...cssVariables }}
    >
      <svg className="reflective-svg-filters" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="turbulence"
              baseFrequency={baseFrequency}
              numOctaves={2}
              result="noise"
            />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rippled"
            />
            <feSpecularLighting
              in="noiseAlpha"
              surfaceScale={displacementStrength}
              specularConstant={specularConstant}
              specularExponent={20}
              lightingColor="#f5b8c4"
              result="light"
            >
              <fePointLight x={0} y={0} z={300} />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="solidAlpha"
            />
            <feMorphology in="solidAlpha" operator="erode" radius={45} result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation={10} result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope={0.5} intercept={0} />
            </feComponentTransfer>
            <feDisplacementMap
              in="metallic-result"
              in2="glassMap"
              scale={glassDistortion}
              xChannelSelector="A"
              yChannelSelector="A"
              result="final"
            />
          </filter>
        </defs>
      </svg>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="reflective-video"
        style={{
          filter: `saturate(var(--saturation, 0.45)) contrast(115%) brightness(105%) blur(var(--blur-strength, 8px)) url(#${filterId})`,
        }}
      />

      <div className="reflective-noise" />
      <div className="reflective-sheen" />

      <div className="reflective-viewfinder" aria-hidden="true">
        <div className="reflective-viewfinder__cross-v" />
        <div className="reflective-viewfinder__cross-h" />
        <div className="reflective-viewfinder__corner reflective-viewfinder__corner--tl" />
        <div className="reflective-viewfinder__corner reflective-viewfinder__corner--tr" />
        <div className="reflective-viewfinder__corner reflective-viewfinder__corner--bl" />
        <div className="reflective-viewfinder__corner reflective-viewfinder__corner--br" />
      </div>

      {camStatus !== 'live' && (
        <div className="reflective-cam-gate">
          {camStatus === 'requesting' ? (
            <p className="reflective-cam-gate__msg">Waiting for camera permission…</p>
          ) : (
            <>
              <p className="reflective-cam-gate__msg">
                {camStatus === 'denied'
                  ? 'Camera blocked. Allow access in the browser bar, then retry.'
                  : camStatus === 'unavailable'
                    ? 'Camera unavailable. Open localhost in Chrome or Safari.'
                    : 'Activate the ringlight to mirror your reflection.'}
              </p>
              <button
                type="button"
                className="reflective-cam-gate__btn"
                onClick={() => void enableCamera()}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden>
                  videocam
                </span>
                {camStatus === 'denied' || camStatus === 'unavailable'
                  ? 'Retry camera'
                  : 'Enable camera'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="reflective-content">
        <div className="card-header">
          <div className="security-badge">
            <span className="material-symbols-outlined text-[12px]" aria-hidden>
              lock
            </span>
            <span>Secure access</span>
          </div>
          <span className="material-symbols-outlined status-icon" aria-hidden>
            monitoring
          </span>
        </div>

        <div className="card-body">
          <div className="user-info">
            <h2 className="user-name">{visitorName}</h2>
            <p className="user-role">{visitorRole}</p>
          </div>
        </div>

        <div className="card-footer">
          <div className="id-section">
            <span className="label">ID number</span>
            <span className="value">{idNumber}</span>
          </div>
          <span className="material-symbols-outlined fingerprint-icon" aria-hidden>
            fingerprint
          </span>
        </div>
      </div>
    </div>
  )
}
