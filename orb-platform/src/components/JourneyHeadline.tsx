import { MirrorHeadline } from './MirrorHeadline'

export function JourneyHeadline({
  as: Tag = 'h1',
  children,
  lines,
  className,
}: {
  as?: 'h1' | 'span'
  children: string
  lines: string[]
  className?: string
}) {
  return (
    <Tag className={`journey-textured-headline${className ? ` ${className}` : ''}`}>
      <span className="journey-headline-copy">{children}</span>
      <span className="journey-headline-art" aria-hidden="true">
        <MirrorHeadline lines={lines} className="journey-headline-canvas" />
      </span>
    </Tag>
  )
}
