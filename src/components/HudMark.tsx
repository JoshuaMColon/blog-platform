/**
 * Small HUD signal marker used in card and panel header bars
 * (replaces the old macOS-style traffic-light dots).
 */
const HudMark = ({ size = 'sm', dim = false }: { size?: 'sm' | 'lg'; dim?: boolean }) => (
  <span aria-hidden="true" className="hud-mark" data-size={size} data-dim={dim || undefined}>
    <span />
    <span />
    <span />
  </span>
)

export default HudMark
