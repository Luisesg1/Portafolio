// Shared helpers for the Telegram/Supabase serverless functions.
// Underscore-prefixed so Vercel treats it as a module, not a route.

/** Supabase auth headers. New secret keys (sb_secret_…, not JWTs) use the
 *  apikey header only; the legacy service_role JWT is also sent as Bearer. */
export function supaAuth(key) {
  const h = { apikey: key }
  if (/^eyJ/.test(key)) h.Authorization = `Bearer ${key}`
  return h
}

/** Telegram Markdown (legacy) trips on these — strip from user-supplied text. */
export function clean(s = '', max = 80) {
  return String(s).replace(/[*_`[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function sendTelegram(TOKEN, CHAT, text, extra = {}) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'Markdown', ...extra }),
  })
}

/** Fetch events in [sinceISO, untilISO) (ascending). Returns [] on any error.
 *  `untilISO` is optional — omit it for "everything since". */
export async function loadEvents(BASE, KEY, sinceISO, untilISO) {
  const until = untilISO ? `&created_at=lt.${untilISO}` : ''
  const url =
    `${BASE}/rest/v1/events?select=event,label,country,meta,created_at` +
    `&created_at=gte.${sinceISO}${until}&order=created_at.asc&limit=5000`
  try {
    const r = await fetch(url, { headers: supaAuth(KEY) })
    return r.ok ? r.json() : []
  } catch {
    return []
  }
}

/** How many events of a type since `sinceISO` (used for milestones). */
export async function countSince(BASE, KEY, event, sinceISO) {
  const url = `${BASE}/rest/v1/events?select=id&event=eq.${event}&created_at=gte.${sinceISO}`
  try {
    const r = await fetch(url, {
      headers: { ...supaAuth(KEY), Prefer: 'count=exact', Range: '0-0' },
    })
    const cr = r.headers.get('content-range') // "0-0/N" or "*/0"
    const total = cr ? parseInt(cr.split('/')[1] || '0', 10) : 0
    return Number.isNaN(total) ? 0 : total
  } catch {
    return 0
  }
}

function topCounts(map, n = 5) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

/** Roll rows up into totals for a digest. */
export function summarize(rows) {
  const s = { visits: 0, nuevos: 0, recurrentes: 0, cv: 0, wa: 0, projects: {}, countries: {}, leads: [] }
  for (const row of rows) {
    const m = row.meta || {}
    switch (row.event) {
      case 'visit':
        s.visits++
        if (m.returning === 'returning') s.recurrentes++
        else s.nuevos++
        if (row.country) s.countries[row.country] = (s.countries[row.country] || 0) + 1
        break
      case 'project_open':
        if (row.label) s.projects[row.label] = (s.projects[row.label] || 0) + 1
        break
      case 'cv_download':
        s.cv++
        break
      case 'contact_submit':
        s.leads.push({ name: m.name || '¿?', ptype: m.ptype || '' })
        break
      case 'whatsapp_click':
        s.wa++
        break
      default:
        break
    }
  }
  return s
}

/** Build the digest message text for a set of rows. */
export function renderDigest(title, subtitle, rows) {
  const lines = [title, subtitle, '']
  if (rows.length === 0) {
    lines.push('😴 Sin actividad en este período.')
    return lines.join('\n')
  }
  const s = summarize(rows)
  lines.push(`👀 *${s.visits}* visitas · 🆕 ${s.nuevos} nuevas · 🔁 ${s.recurrentes} recurrentes`)

  const topC = topCounts(s.countries, 4)
  if (topC.length) lines.push('🌎 ' + topC.map(([c, n]) => `${c} ${n}`).join(' · '))

  const topP = topCounts(s.projects, 5)
  if (topP.length) {
    lines.push('')
    lines.push('🔥 *Proyectos abiertos:*')
    for (const [p, n] of topP) lines.push(`   • ${p} — ${n}`)
  }

  lines.push('')
  lines.push(`📄 CV descargado: *${s.cv}*`)
  if (s.wa) lines.push(`💬 Clicks WhatsApp: *${s.wa}*`)

  if (s.leads.length) {
    lines.push('')
    lines.push(`✉️🔥 *${s.leads.length} lead(s) del formulario:*`)
    for (const l of s.leads.slice(0, 15)) {
      lines.push(`   • ${l.name}${l.ptype ? ` — ${l.ptype}` : ''}`)
    }
  }
  return lines.join('\n')
}
