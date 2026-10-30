import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { AppNotification } from '../lib/notifications'
import { fetchNotifications, markRead, useNotifications } from '../lib/notifications'
import NotificationItem from '../components/NotificationItem'
import Spinner from '../components/Spinner'

const PAGE = 20

const Notifications = () => {
  useDocumentTitle('Notifications')
  const { user } = useAuth()
  const { unread, version } = useNotifications(user?.id)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [total, setTotal] = useState(0)
  const [shown, setShown] = useState(PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Re-read whenever the filter / page size changes or a live ping arrives.
  useEffect(() => {
    let cancelled = false
    fetchNotifications(0, shown - 1, unreadOnly)
      .then(r => {
        if (cancelled) return
        setItems(r.items)
        setTotal(r.total)
        setError(null)
      })
      .catch(() => !cancelled && setError('Could not load notifications.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [shown, unreadOnly, version])

  const open = (n: AppNotification) => {
    if (!n.read_at) void markRead([n.id])
  }
  const markAll = async () => {
    setItems(list => list.map(n => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })))
    await markRead()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>// inbox</p>
      <h1 className="hud-title text-3xl mb-6">notifications</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="hud-segment" role="group" aria-label="Filter">
          <button type="button" className="hud-chip" aria-pressed={!unreadOnly} onClick={() => { setUnreadOnly(false); setShown(PAGE) }}>
            all
          </button>
          <button type="button" className="hud-chip" aria-pressed={unreadOnly} onClick={() => { setUnreadOnly(true); setShown(PAGE) }}>
            unread ({unread})
          </button>
        </div>
        <button type="button" className="hud-chip ml-auto" disabled={unread === 0} onClick={() => void markAll()}>
          mark_all_read()
        </button>
      </div>

      <div className="hud-panel p-2 sm:p-3">
        {loading ? (
          <p className="hud-notif-empty inline-flex items-center gap-2"><Spinner label="Loading notifications" /> loading…</p>
        ) : error ? (
          <p className="hud-notif-empty" style={{ color: 'var(--danger)' }}>{error}</p>
        ) : items.length === 0 ? (
          <p className="hud-notif-empty">
            {unreadOnly ? '// all caught up.' : '// no signals yet. Follows, likes and comments on your posts show up here.'}
          </p>
        ) : (
          items.map(n => <NotificationItem key={n.id} n={n} onOpen={open} />)
        )}
      </div>

      {items.length < total && (
        <div className="flex justify-center mt-4">
          <button type="button" className="hud-btn" onClick={() => setShown(s => s + PAGE)}>
            load_more() <span style={{ color: 'var(--text-secondary)' }}>· {total - items.length} left</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Notifications
