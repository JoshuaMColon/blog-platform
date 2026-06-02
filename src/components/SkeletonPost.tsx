import Navbar from './Navbar'

const SkeletonPost = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div
          className="rounded-lg border p-6 sm:p-8 animate-pulse"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Terminal bar */}
          <div className="flex items-center gap-1.5 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-30" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-30" />
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-30" />
            <div className="h-3 rounded w-32 ml-2" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          </div>

          {/* Cover image placeholder */}
          <div className="w-full h-64 rounded-lg mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }} />

          {/* Title */}
          <div className="h-8 rounded w-3/4 mb-3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />

          {/* Author and date */}
          <div className="h-3 rounded w-1/3 mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }} />

          {/* Tags */}
          <div className="flex gap-2 mb-6">
            <div className="h-5 rounded w-14" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            <div className="h-5 rounded w-18" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          </div>

          {/* Like and bookmark */}
          <div className="flex gap-3 mb-8">
            <div className="h-7 rounded w-16" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
            <div className="h-7 rounded w-20" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
          </div>

          {/* Content */}
          <div className="space-y-3">
            {['100%', '90%', '95%', '85%', '92%', '78%'].map((width, i) => (
              <div
                key={i}
                className="h-4 rounded"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  width,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonPost