import { track as vercelTrack } from '@vercel/analytics'

/** Log an aggregate event to Vercel Analytics (shows up in the dashboard). */
export function track(event: string, props?: Record<string, string | number | boolean>) {
  try {
    vercelTrack(event, props)
  } catch {
    /* analytics not ready / blocked — ignore */
  }
}

/** Extra context sent alongside each Telegram ping (no PII beyond what the
 *  visitor typed into the form themselves). Built client-side so we get the
 *  visitor's OWN language, local time and UTM campaign — things the server
 *  can't know from edge headers. */
type Meta = Record<string, string | number | boolean>

function isLocalhost() {
  return (
    typeof location !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  )
}

/** New vs returning: a flag in localStorage that outlives the session. */
function firstOrReturning(): 'new' | 'returning' {
  try {
    if (localStorage.getItem('vis-seen')) return 'returning'
    localStorage.setItem('vis-seen', '1')
  } catch {
    /* private mode / blocked — treat as new */
  }
  return 'new'
}

function clientMeta(): Meta {
  const m: Meta = {}
  try {
    m.lang = navigator.language || ''
    m.localTime = new Date().toLocaleTimeString(navigator.language || 'es', {
      hour: '2-digit',
      minute: '2-digit',
    })
    // UTM / campaign params, if the visitor arrived via a tagged link
    const q = new URLSearchParams(location.search)
    const src = q.get('utm_source') || ''
    const camp = q.get('utm_campaign') || q.get('utm_medium') || ''
    if (src || camp) m.utm = [src, camp].filter(Boolean).join('/')
  } catch {
    /* ignore */
  }
  return m
}

function post(payload: Record<string, unknown>) {
  if (isLocalhost()) return
  const body = JSON.stringify(payload)
  try {
    // sendBeacon survives page unload; fetch/keepalive is the fallback.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/visit', new Blob([body], { type: 'application/json' }))
      return
    }
  } catch {
    /* fall through */
  }
  fetch('/api/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

/** Fire the once-per-session "new visit" ping (called from App on mount). */
export function pingVisit() {
  try {
    if (sessionStorage.getItem('v-pinged')) return
    sessionStorage.setItem('v-pinged', '1')
  } catch {
    /* ignore */
  }
  let ref = ''
  try {
    ref = document.referrer || ''
  } catch {
    /* ignore */
  }
  post({
    ref,
    page: location.pathname + location.hash,
    returning: firstOrReturning(),
    ...clientMeta(),
  })
}

/** In-memory record of what this session did, for the leaving summary. */
const session = {
  start: Date.now(),
  projects: new Set<string>(),
  cv: false,
}

/**
 * A high-intent action: log it to Vercel Analytics AND fire a Telegram alert
 * (once per session per event+label, so repeated clicks don't spam). No-ops on
 * localhost; the /api/visit endpoint stays dormant without its env vars.
 * `data` carries extra context (e.g. contact name + project type).
 */
export function notify(event: string, label?: string, data?: Meta) {
  track(event, { ...(label ? { label } : {}), ...(data || {}) })

  // remember for the session summary
  if (event === 'project_open' && label) session.projects.add(label)
  if (event === 'cv_download') session.cv = true

  const key = `n:${event}:${label || ''}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
  post({ event, label, ...(data || {}), ...clientMeta() })
}

let summarySent = false
/** When the visitor leaves, send a one-shot session recap (what they saw,
 *  whether they grabbed the CV, how long they stayed). Uses sendBeacon so it
 *  goes out even as the tab closes. */
function sendSummary() {
  if (summarySent) return
  // only worth a ping if they actually did something beyond landing
  if (session.projects.size === 0 && !session.cv) return
  summarySent = true
  post({
    event: 'session_summary',
    seconds: Math.round((Date.now() - session.start) / 1000),
    projects: [...session.projects].join(', '),
    cv: session.cv,
    ...clientMeta(),
  })
}

export function initSessionSummary() {
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendSummary()
  })
  window.addEventListener('pagehide', sendSummary)
}
