import { test as base, expect } from '@playwright/test'
import { loadEnv } from 'vite'

// Guest (anonymous) tests sign in to the real Supabase project. This auto
// fixture runs after every test that imports `test` from here: if the page
// holds a guest session, it removes that guest's uploaded images through the
// Storage API (row-level security only lets a user touch their own folder) and
// then deletes the guest account itself via end_guest_session(), so CI runs
// leave no users or files behind. Regular accounts are never affected.

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const SUPABASE_URL = env.VITE_SUPABASE_URL as string
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string
const BUCKETS = ['covers', 'post-images']

type Session = { access_token: string; user: { id: string; is_anonymous?: boolean } }

export const test = base.extend<{ guestCleanup: void }>({
  guestCleanup: [
    async ({ page, request }, use) => {
      await use()
      if (!SUPABASE_URL || !ANON_KEY) return

      const session = await page
        .evaluate(() => {
          const key = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k))
          return key ? localStorage.getItem(key) : null
        })
        .catch(() => null)
      if (!session) return
      const { access_token, user } = JSON.parse(session) as Session
      if (!user?.is_anonymous || !access_token) return

      const headers = { apikey: ANON_KEY, Authorization: `Bearer ${access_token}` }
      for (const bucket of BUCKETS) {
        const list = await request.post(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
          headers,
          data: { prefix: user.id, limit: 100 },
        })
        expect(list.ok(), `list ${bucket} for guest cleanup`).toBe(true)
        const names = ((await list.json()) as { name: string; id: string | null }[])
          .filter((o) => o.id)
          .map((o) => `${user.id}/${o.name}`)
        if (!names.length) continue
        const rm = await request.delete(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
          headers,
          data: { prefixes: names },
        })
        expect(rm.ok(), `remove ${bucket} files for guest cleanup`).toBe(true)
      }

      const end = await request.post(`${SUPABASE_URL}/rest/v1/rpc/end_guest_session`, { headers, data: {} })
      expect(end.ok(), 'end_guest_session').toBe(true)
    },
    { auto: true },
  ],
})

export { expect }
