import Spinner from './Spinner'

const RouteFallback = () => (
  <div
    className="min-h-screen flex items-center justify-center font-mono text-xs gap-2"
    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
  >
    <Spinner label="Loading page" /> loading...
  </div>
)

export default RouteFallback
