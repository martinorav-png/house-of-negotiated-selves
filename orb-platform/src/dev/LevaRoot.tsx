import { Leva } from 'leva'

/**
 * The single global Leva panel UI. Mounted unconditionally so it's always
 * available to render whichever station's controls are currently
 * registered — DevPanel/CardsDevPanel/MirrorDevPanel each only mount
 * their useControls calls while their own station is active, so the panel
 * shows just that station's folders instead of all three at once.
 */
export function LevaRoot() {
  return <Leva collapsed={false} titleBar={{ title: 'Scene tuning' }} />
}
