import { useEffect, useSyncExternalStore } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Notifications are written by database triggers (follow, like, comment) and
// are only readable by their recipient (RLS). The database pings a private
// Realtime channel `user:<uid>` whenever the recipient's rows change; the
// ping carries no content, we simply re-read through RLS.

export type NotificationType = 'follow' | 'like' | 'comment'

export interface AppNotification {
  id: string
  type: NotificationType
  read_at: string | null
  created_at: string
  post_id: string | null
  actor: { id: string; username: string; avatar_url: string | null } | null
  post: { title: string; slug: string } | null
  comment: { content: string } | null
}

export const NOTIFICATION_COLUMNS =
  'id, type, read_at, created_at, post_id, ' +
  'actor:profiles!notifications_actor_id_fkey(id, username, avatar_url), ' +
  'post:posts(title, slug), comment:comments(content)'

export const PREVIEW_LIMIT = 8

interface Snapshot {
  uid: string | null
  unread: number
  items: AppNotification[]
  loaded: boolean
  /** Bumps on every live change, so pages showing a longer list can re-read. */
  version: number
}

let snap: Snapshot = { uid: null, unread: 0, items: [], loaded: false, version: 0 }
const listeners = new Set<() => void>()
const emit = (next: Partial<Snapshot>) => {
  snap = { ...snap, ...next }
  listeners.forEach(fn => fn())
}

let channel: RealtimeChannel | null = null
let refs = 0
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null

export const fetchNotifications = async (from = 0, to = PREVIEW_LIMIT - 1, unreadOnly = false) => {
  let q = supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (unreadOnly) q = q.is('read_at', null)
  const { data, error, count } = await q
  if (error) throw error
  return { items: (data ?? []) as unknown as AppNotification[], total: count ?? 0 }
}

const refresh = async (uid: string) => {
  try {
    const [{ items }, { count }] = await Promise.all([
      fetchNotifications(),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
    ])
    if (snap.uid !== uid) return // signed out / switched user meanwhile
    emit({ items, unread: count ?? 0, loaded: true, version: snap.version + 1 })
  } catch {
    if (snap.uid === uid) emit({ loaded: true })
  }
}

const scheduleRefresh = () => {
  const uid = snap.uid
  if (!uid) return
  if (refreshTimer) clearTimeout(refreshTimer)
  // Coalesce bursts (e.g. several likes in a row) into one read.
  refreshTimer = setTimeout(() => void refresh(uid), 250)
}

const start = (uid: string) => {
  if (snap.uid === uid && channel) return
  stop()
  emit({ uid, unread: 0, items: [], loaded: false })
  void refresh(uid)
  const ch = supabase.channel(`user:${uid}`, { config: { private: true } })
  ch.on('broadcast', { event: 'notifications' }, scheduleRefresh)
  channel = ch
  // Make sure the socket carries the user's JWT before joining a private channel.
  void supabase.realtime.setAuth().finally(() => {
    if (channel === ch) ch.subscribe()
  })
}

const stop = () => {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = null
  if (channel) void supabase.removeChannel(channel)
  channel = null
  if (snap.uid) emit({ uid: null, unread: 0, items: [], loaded: false })
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getSnapshot = () => snap

/** Live notifications for the signed-in user (shared by every caller). */
export const useNotifications = (uid: string | null | undefined) => {
  useEffect(() => {
    if (!uid) return
    refs += 1
    if (stopTimer) clearTimeout(stopTimer)
    stopTimer = null
    start(uid)
    return () => {
      refs -= 1
      if (refs === 0) stopTimer = setTimeout(() => refs === 0 && stop(), 1500)
    }
  }, [uid])
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return s.uid === uid ? s : { ...s, unread: 0, items: [], loaded: false }
}

const nowIso = () => new Date().toISOString()

/** Mark some (or, with no ids, all) of your notifications read. */
export const markRead = async (ids?: string[]) => {
  const uid = snap.uid
  if (!uid) return
  // Optimistic: update the local preview and badge right away.
  const target = new Set(ids ?? snap.items.filter(n => !n.read_at).map(n => n.id))
  const newlyRead = ids ? snap.items.filter(n => target.has(n.id) && !n.read_at).length : snap.unread
  emit({
    items: snap.items.map(n => (target.has(n.id) && !n.read_at ? { ...n, read_at: nowIso() } : n)),
    unread: Math.max(0, snap.unread - newlyRead),
  })
  let q = supabase.from('notifications').update({ read_at: nowIso() }).is('read_at', null)
  if (ids) q = q.in('id', ids)
  const { error } = await q
  if (error) void refresh(uid) // roll back to the server's truth
}

export const notificationHref = (n: AppNotification) => {
  if (n.type === 'follow') return n.actor ? `/profile/${n.actor.id}` : '/'
  if (!n.post) return '/'
  return n.type === 'comment' ? `/post/${n.post.slug}#comments` : `/post/${n.post.slug}`
}

export const notificationVerb = (n: AppNotification) =>
  n.type === 'follow' ? 'followed you' : n.type === 'like' ? 'liked' : 'commented on'

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}
