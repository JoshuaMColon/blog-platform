import { useEffect } from 'react'

const SITE = 'BlogPlatform'
const DEFAULT_DESCRIPTION =
  'A full-stack blogging platform built with React, TypeScript and Supabase: rich-text posts, comments, likes, follows and a guest demo mode.'

const setMeta = (selector: string, value: string) => {
  document.querySelector(selector)?.setAttribute('content', value)
}

/**
 * Sets the document title (and description/OG text when given) for the
 * current page, restoring the site defaults on unmount.
 */
export const useDocumentTitle = (title?: string, description?: string) => {
  useEffect(() => {
    const full = title ? `${title} · ${SITE}` : `${SITE} · Write, share and discuss`
    const desc = description?.trim() || DEFAULT_DESCRIPTION
    document.title = full
    setMeta('meta[name="description"]', desc)
    setMeta('meta[property="og:title"]', full)
    setMeta('meta[property="og:description"]', desc)
    setMeta('meta[name="twitter:title"]', full)
    setMeta('meta[name="twitter:description"]', desc)
    setMeta('meta[property="og:url"]', window.location.href)
  }, [title, description])
}
