import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { Activity, Fingerprint, Lock, Video } from 'lucide-react'
import './ReflectiveCard.css'

export type ReflectiveCardProps = {
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
}

type CamStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable'

export function ReflectiveCard({
  blurStrength = 12,
  color = 'white',
  metalness = 1,
  roughness = 0.4,
  overlayColor = 'rgba(255, 255, 255, 0.1)',
  displacementStrength = 20,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 1,
  glassDistortion = 0,
  className = '',
  style = {},
  visitorName = 'VISITOR',
  visitorRole = 'INTAKE SUBJECT',
  idNumber = '8901-2345-6789',
}: ReflectiveCardProps) {
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
      console.error('Camera requires a secure context (https or localhost).')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus('unavailable')
      console.error('navigator.mediaDevices.getUserMedia is not available in this browser.')
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
        } catch (playErr) {
          console.warn('Video play() blocked:', playErr)
        }
      }
      setCamStatus('live')
    } catch (err) {
      console.error('Error accessing webcam:', err)
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
      className={`reflective-card-container ${className}`.trim()}
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
              lightingColor="white"
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
          filter: `saturate(var(--saturation, 0)) contrast(120%) brightness(110%) blur(var(--blur-strength, 12px)) url(#${filterId})`,
        }}
      />

      <div className="reflective-noise" />
      <div className="reflective-sheen" />
      <div className="reflective-border" />

      {camStatus !== 'live' && (
        <div className="reflective-cam-gate">
          {camStatus === 'requesting' ? (
            <p className="reflective-cam-gate__msg">Waiting for camera permission…</p>
          ) : (
            <>
              <p className="reflective-cam-gate__msg">
                {camStatus === 'denied'
                  ? 'Camera blocked. Allow access in the browser address bar, then try again.'
                  : camStatus === 'unavailable'
                    ? 'Camera unavailable here. Open http://localhost:5175 in Chrome or Safari.'
                    : 'Activate the ringlight to mirror your reflection.'}
              </p>
              <button
                type="button"
                className="reflective-cam-gate__btn"
                onClick={() => void enableCamera()}
              >
                <Video size={16} aria-hidden />
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
            <Lock size={14} className="security-icon" />
            <span>SECURE ACCESS</span>
          </div>
          <Activity className="status-icon" size={20} />
        </div>

        <div className="card-body">
          <div className="user-info">
            <h2 className="user-name">{visitorName}</h2>
            <p className="user-role">{visitorRole}</p>
          </div>
        </div>

        <div className="card-footer">
          <div className="id-section">
            <span className="label">ID NUMBER</span>
            <span className="value">{idNumber}</span>
          </div>
          <div className="fingerprint-section">
            <Fingerprint size={32} className="fingerprint-icon" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReflectiveCard
