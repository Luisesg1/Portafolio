// Daily digest cron: once a day, count the last 24h of events from Supabase
// and send one Telegram summary. Wired via the "crons" entry in vercel.json.
// Dormant unless TELEGRAM_* + Supabase service-role env vars are all set.

function topCounts(map, n = 5) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN
    const CHAT = process.env.TELEGRAM_CHAT_ID
    const BASE = process.env.VITE_SUPABASE_URL
    const KEY = process.env.SUPABASE_SERVICE_ROLE
    if (!TOKEN || !CHAT || !BASE || !KEY) {
      return res.status(200).json({ ok: true, dormant: true })
    }

    // Vercel signs cron calls with Authorization: Bearer <CRON_SECRET> when the
    // env var is set — reject anything else so the digest can't be triggered by
    // outsiders. If no secret is configured, allow (still Telegram-gated).
    const SECRET = process.env.CRON_SECRET
    if (SECRET && req.headers.authorization !== `Bearer ${SECRET}`) {
      return res.status(401).json({ ok: false })
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const url =
      `${BASE}/rest/v1/events?select=event,label,country,meta,created_at` +
      `&created_at=gte.${since}&order=created_at.asc&limit=5000`
    const rows = await fetch(url, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    }).then((r) => (r.ok ? r.json() : []))

    let visits = 0
    let nuevos = 0
    let recurrentes = 0
    let cv = 0
    let wa = 0
    const projects = {}
    const countries = {}
    const leads = [] // contact_submit: {name, ptype}

    for (const row of rows) {
      const m = row.meta || {}
      switch (row.event) {
        case 'visit':
          visits++
          if (m.returning === 'returning') recurrentes++
          else nuevos++
          if (row.country) countries[row.country] = (countries[row.country] || 0) + 1
          break
        case 'project_open':
          if (row.label) projects[row.label] = (projects[row.label] || 0) + 1
          break
        case 'cv_download':
          cv++
          break
        case 'contact_submit':
          leads.push({ name: m.name || '¿?', ptype: m.ptype || '' })
          break
        case 'whatsapp_click':
          wa++
          break
        default:
          break
      }
    }

    const day = new Date().toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })

    const lines = [`📊 *Resumen diario* · luisesg.com`, `🗓️ ${day} · últimas 24h`, '']

    if (rows.length === 0) {
      lines.push('😴 Sin actividad en las últimas 24h.')
    } else {
      lines.push(`👀 *${visits}* visitas · 🆕 ${nuevos} nuevas · 🔁 ${recurrentes} recurrentes`)

      const topC = topCounts(countries, 4)
      if (topC.length) {
        lines.push('🌎 ' + topC.map(([c, n]) => `${c} ${n}`).join(' · '))
      }

      const topP = topCounts(projects, 5)
      if (topP.length) {
        lines.push('')
        lines.push('🔥 *Proyectos abiertos:*')
        for (const [p, n] of topP) lines.push(`   • ${p} — ${n}`)
      }

      lines.push('')
      lines.push(`📄 CV descargado: *${cv}*`)
      if (wa) lines.push(`💬 Clicks WhatsApp: *${wa}*`)

      if (leads.length) {
        lines.push('')
        lines.push(`✉️🔥 *${leads.length} lead(s) del formulario:*`)
        for (const l of leads.slice(0, 10)) {
          lines.push(`   • ${l.name}${l.ptype ? ` — ${l.ptype}` : ''}`)
        }
      }
    }

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: lines.join('\n'), parse_mode: 'Markdown' }),
    })

    return res.status(200).json({ ok: true, counted: rows.length })
  } catch {
    return res.status(200).json({ ok: true, error: true })
  }
}
