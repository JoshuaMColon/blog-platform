import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

// One shared, ref-counted Realtime channel per topic. supabase.channel() hands
// back the same object for a topic that is already open, so several components
// (the like button, comments and the "reading now" counter on a post page)
// must share it instead of each subscribing and removing it independently.
// Broadcast listeners are fanned out locally; the socket channel is removed
// when the last component lets go of it.

type Payload = Record<string, unknown>
type Handler = (payload: Payload) => void

interface Entry {
  topic: string
  channel: RealtimeChannel | null
  refs: number
  handlers: Map<string, Set<Handler>>
  presence: Set<(count: number) => void>
  trackers: number
  subscribed: boolean
  closeTimer: ReturnType<typeof setTimeout> | null
}

// Events the database triggers send (see supabase/migrations/*realtime*).
const EVENTS = ['likes', 'comments', 'new_post'] as const
export type LiveEvent = (typeof EVENTS)[number]

// Keep a channel open briefly after its last user unmounts, so StrictMode
// double-mounts and quick back/forward navigation reuse it.
const CLOSE_GRACE_MS = 1500

const entries = new Map<string, Entry>()
// Channels still being unsubscribed; a new channel for that topic waits for it.
const closing = new Map<string, Promise<unknown>>()
const presenceKey =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const syncTracking = (entry: Entry) => {
  if (!entry.channel || !entry.subscribed) return
  if (entry.trackers > 0) void entry.channel.track({ at: Date.now() })
  else void entry.channel.untrack()
}

const open = (entry: Entry) => {
  if (entries.get(entry.topic) !== entry) return // released before it opened
  const channel = supabase.channel(entry.topic, { config: { presence: { key: presenceKey } } })
  entry.channel = channel
  for (const event of EVENTS) {
    channel.on('broadcast', { event }, ({ payload }) => {
      entry.handlers.get(event)?.forEach(fn => fn((payload ?? {}) as Payload))
    })
  }
  channel.on('presence', { event: 'sync' }, () => {
    const n = Object.keys(channel.presenceState()).length
    entry.presence.forEach(fn => fn(n))
  })
  channel.subscribe(status => {
    entry.subscribed = status === 'SUBSCRIBED'
    if (entry.subscribed) syncTracking(entry)
  })
}

const acquire = (topic: string): Entry => {
  const existing = entries.get(topic)
  if (existing) {
    existing.refs += 1
    if (existing.closeTimer) {
      clearTimeout(existing.closeTimer)
      existing.closeTimer = null
    }
    return existing
  }
  const entry: Entry = {
    topic,
    channel: null,
    refs: 1,
    handlers: new Map(),
    presence: new Set(),
    trackers: 0,
    subscribed: false,
    closeTimer: null,
  }
  entries.set(topic, entry)
  const pending = closing.get(topic)
  if (pending) void pending.then(() => open(entry))
  else open(entry)
  return entry
}

const release = (entry: Entry) => {
  entry.refs -= 1
  if (entry.refs > 0) return
  entry.closeTimer = setTimeout(() => {
    if (entry.refs > 0 || entries.get(entry.topic) !== entry) return
    entries.delete(entry.topic)
    const channel = entry.channel
    if (!channel) return
    const done = supabase.removeChannel(channel).finally(() => {
      if (closing.get(entry.topic) === done) closing.delete(entry.topic)
    })
    closing.set(entry.topic, done)
  }, CLOSE_GRACE_MS)
}

/** Listen for one broadcast event on a topic. Returns the cleanup function. */
export const onLive = (topic: string, event: LiveEvent, handler: Handler) => {
  const entry = acquire(topic)
  let set = entry.handlers.get(event)
  if (!set) {
    set = new Set()
    entry.handlers.set(event, set)
  }
  set.add(handler)
  return () => {
    set.delete(handler)
    release(entry)
  }
}

/**
 * Join presence on a topic (counts this tab as a reader) and report how many
 * distinct tabs are present. Returns the cleanup function.
 */
export const joinPresence = (topic: string, onCount: (count: number) => void) => {
  const entry = acquire(topic)
  entry.presence.add(onCount)
  entry.trackers += 1
  syncTracking(entry)
  return () => {
    entry.presence.delete(onCount)
    entry.trackers -= 1
    syncTracking(entry)
    release(entry)
  }
}

export const postTopic = (postId: string) => `post:${postId}`
export const FEED_TOPIC = 'feed'

/** Test/debug helper: number of open shared channels. */
export const openChannelCount = () => entries.size
