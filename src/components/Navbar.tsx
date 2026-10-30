import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ThemeSelector from './ThemeSelector'

const NAV_LINKS = [
  { to: '/', label: 'feed', end: true },
  { to: '/following', label: 'following' },
  { to: '/bookmarks', label: 'bookmarks' },
  { to: '/search', label: 'search' },
  { to: '/my-posts', label: 'my_posts' },
]

export const Logo = () => (
  <Link to="/" className="hud-logo" aria-label="BlogPlatform home">
    <span aria-hidden="true" className="hud-logo-mark" />
    <span className="glitch" data-text="BLOG//PLATFORM">
      <span className="hud-logo-accent">BLOG</span>
      <span className="hud-logo-sep">//</span>
      PLATFORM
    </span>
  </Link>
)

const Navbar = () => {
  const { user, isDemo, signOut } = useAuth()
  const { pathname } = useLocation()
  // The menu remembers the route it was opened on, so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuOpen = menuPath === pathname
  const setMenuOpen = (open: boolean) => setMenuPath(open ? pathname : null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuPath(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const userLabel = isDemo ? 'guest' : user?.email ?? ''

  return (
    <nav className="hud-nav" aria-label="Main">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Logo />

        {isDemo && (
          <span
            className="hud-badge flex-shrink-0"
            title="You're exploring as a guest. Guest posts and comments are removed after a day."
          >
            DEMO
          </span>
        )}

        {/* Desktop links */}
        {user && (
          <ul className="hidden md:flex items-center gap-1 ml-4">
            {NAV_LINKS.map(link => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="hud-navlink">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="hud-status hidden xl:inline-flex" aria-hidden="true">
            <span className="hud-status-dot" /> {user ? 'LINK·OK' : 'OFFLINE'}
          </span>

          <div className={user ? 'hidden md:block' : ''}>
            <ThemeSelector />
          </div>

          {user ? (
            <>
              <Link to="/create" className="hud-btn hud-btn-primary">
                <span aria-hidden="true">+</span>
                <span className="hidden sm:inline">new_post</span>
                <span className="sm:hidden">new</span>
              </Link>
              <Link
                to={`/profile/${user.id}`}
                className="hud-navlink hidden lg:block truncate max-w-40"
                title={userLabel}
              >
                {userLabel}
              </Link>
              <button type="button" onClick={signOut} className="hud-navlink hud-navlink-danger hidden md:block">
                {isDemo ? 'exit_demo' : 'logout'}
              </button>
              <button
                type="button"
                className="hud-chip md:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span aria-hidden="true" className="hud-burger" data-open={menuOpen || undefined}>
                  <span /><span /><span />
                </span>
              </button>
            </>
          ) : (
            <Link to="/login" className="hud-btn hud-btn-primary">
              sign_in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && menuOpen && (
        <div id="mobile-menu" className="md:hidden hud-mobile-menu">
          <ul className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map(link => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="hud-navlink hud-navlink-block">
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to={`/profile/${user.id}`} className="hud-navlink hud-navlink-block">
                profile
              </NavLink>
            </li>
          </ul>
          <div className="flex items-center justify-between gap-3 mt-3 pt-3 hud-divider">
            <span className="text-[11px] font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
              {userLabel}
            </span>
            <div className="flex items-center gap-2">
              <ThemeSelector compact />
              <button type="button" onClick={signOut} className="hud-navlink hud-navlink-danger">
                {isDemo ? 'exit_demo' : 'logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDemo && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-2 text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
          // demo mode: you're a guest. Post, like and comment freely (within small limits); your content clears after a day.
        </div>
      )}
    </nav>
  )
}

export default Navbar
