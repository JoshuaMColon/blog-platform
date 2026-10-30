import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { markRead, useNotifications } from '../lib/notifications'
import NotificationItem from './NotificationItem'

const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

const NotificationBell = () => {
  const { user } = useAuth()
  const { unread, items, loaded } = useNotifications(user?.id)
  const { pathname } = useLocation()
  // Remember the route the dropdown was opened on, so navigating closes it.
  const [openPath, setOpenPath] = useState<string | null>(null)
  const open = openPath === pathname
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenPath(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenPath(null)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null
  const badge = unread > 9 ? '9+' : String(unread)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="hud-chip hud-bell"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        data-testid="notification-bell"
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        <BellIcon />
        {unread > 0 && <span className="hud-bell-badge" data-testid="notification-badge">{badge}</span>}
      </button>

      {open && (
        <div className="hud-panel hud-menu hud-notif-menu" role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between gap-2 px-2 pb-1">
            <span className="hud-menu-label px-0">// notifications.feed()</span>
            <button
              type="button"
              className="hud-chip"
              disabled={unread === 0}
              onClick={() => void markRead()}
            >
              mark_all_read()
            </button>
          </div>
          <div className="hud-notif-list">
            {!loaded ? (
              <p className="hud-notif-empty">loading…</p>
            ) : items.length === 0 ? (
              <p className="hud-notif-empty">// no signals yet. Follows, likes and comments on your posts show up here.</p>
            ) : (
              items.map(n => (
                <NotificationItem key={n.id} n={n} compact onOpen={x => !x.read_at && void markRead([x.id])} />
              ))
            )}
          </div>
          <Link to="/notifications" className="hud-menu-item justify-center hud-divider mt-1">
            view_all() →
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
