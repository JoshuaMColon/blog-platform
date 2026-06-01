import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ThemeSelector from './ThemeSelector'

const Navbar = () => {
  const { user, signOut } = useAuth()

  return (
    <nav
      className="px-4 sm:px-8 py-4 sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
        <Link
          to="/"
          className="font-mono font-bold text-sm sm:text-base transition-colors flex-shrink-0"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        >
          &lt;<span style={{ color: 'var(--accent)' }}>Blog</span>Platform /&gt;
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <ThemeSelector />

          {user ? (
            <>
            <Link
                to="/search"
                className="text-xs font-mono transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                search()
              </Link>
            <Link
                to="/my-posts"
                className="text-xs font-mono transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                my_posts()
              </Link>
              <Link
                to="/create"
                className="px-3 sm:px-4 py-1.5 rounded font-mono text-xs sm:text-sm font-bold transition-all tracking-wide"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--btn-text)',
                }}
              >
                + new_post()
              </Link>
              <span
                className="text-xs font-mono hidden md:block truncate max-w-32"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-xs font-mono transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                logout()
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded font-mono text-sm font-bold transition-all"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--btn-text)',
              }}
            >
              sign_in()
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar