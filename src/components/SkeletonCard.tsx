import HudMark from './HudMark'
const SkeletonCard = () => {
  return (
    <div
      className="hud-panel border p-4 sm:p-6 animate-pulse"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Terminal dots */}
      <div className="flex items-center gap-1.5 mb-4">
        <HudMark size="sm" dim />
        <div className="h-3 rounded w-20 ml-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-3 rounded w-16 ml-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>

      {/* Title */}
      <div className="h-5 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />

      {/* Author */}
      <div className="h-3 rounded w-1/3 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }} />

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <div className="h-5 rounded w-12" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-5 rounded w-16" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-5 rounded w-10" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>

      {/* Content preview */}
      <div className="space-y-2 mb-4">
        <div className="h-3 rounded w-full" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-3 rounded w-5/6" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="h-6 rounded w-12" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-4 rounded w-20" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>
    </div>
  )
}

export default SkeletonCard