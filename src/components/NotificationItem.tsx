import { Link } from 'react-router-dom'
import type { AppNotification } from '../lib/notifications'
import { notificationHref, notificationVerb, timeAgo } from '../lib/notifications'

const ICON: Record<AppNotification['type'], string> = { follow: '+', like: '♥', comment: '›' }

const snippet = (text: string, max = 80) => {
  const plain = text.replace(/\s+/g, ' ').trim()
  return plain.length > max ? plain.slice(0, max - 1) + '…' : plain
}

interface Props {
  n: AppNotification
  onOpen: (n: AppNotification) => void
  compact?: boolean
}

const NotificationItem = ({ n, onOpen, compact = false }: Props) => {
  const unread = !n.read_at
  const who = n.actor?.username ?? 'someone'
  return (
    <Link
      to={notificationHref(n)}
      onClick={() => onOpen(n)}
      className="hud-notif"
      data-unread={unread || undefined}
      data-compact={compact || undefined}
      data-testid="notification-item"
    >
      <span className="hud-notif-icon" data-type={n.type} aria-hidden="true">{ICON[n.type]}</span>
      <span className="min-w-0 flex-1">
        <span className="hud-notif-text">
          <strong>@{who}</strong> {notificationVerb(n)}
          {n.post && <> <em>“{n.post.title}”</em></>}
        </span>
        {n.type === 'comment' && n.comment && (
          <span className="hud-notif-snippet">“{snippet(n.comment.content, compact ? 60 : 140)}”</span>
        )}
        <span className="hud-notif-time">{timeAgo(n.created_at)}</span>
      </span>
      {unread && <span className="hud-notif-dot" aria-label="unread" />}
    </Link>
  )
}

export default NotificationItem
