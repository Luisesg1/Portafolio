import { track as vercelTrack } from '@vercel/analytics'

/** Log an aggregate event to Vercel Analytics (shows up in the dashboard). */
export function track(event: string, props?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(event, props)
  } catch {
    /* analytics not ready / blocked — ignore */
  }
}

/**
 * A high-intent action: log it to Vercel Analytics AND fire a Telegram alert
 * (once per session per event+label, so repeated clicks don't spam). No-ops on
 * localhost; the /api/visit endpoint stays dormant without its env vars.
 */
export function notify(event: string, label?: string) {
  track(event, label ? { label } : undefined)
  const key = `n:${event}:${label || ''}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
  if (typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return
  fetch('/api/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, label }),
    keepalive: true,
  }).catch(() => {})
}
