// Daily digest cron: once a day, count the last 24h of events from Supabase
// and send one Telegram summary. Wired via the "crons" entry in vercel.json.
// Dormant unless TELEGRAM_* + Supabase service-role env vars are all set.

import { supaAuth, sendTelegram, loadEvents, renderDigest } from './_shared.js'

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
    const rows = await loadEvents(BASE, KEY, since)

    const day = new Date().toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
    const text = renderDigest('📊 *Resumen diario* · luisesg.com', `🗓️ ${day} · últimas 24h`, rows)
    await sendTelegram(TOKEN, CHAT, text)

    // Housekeeping: prune events older than the retention window. Keeps the
    // table small and drops old lead PII (data minimization). Best-effort.
    const RETENTION_DAYS = 90
    try {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      await fetch(`${BASE}/rest/v1/events?created_at=lt.${cutoff}`, {
        method: 'DELETE',
        headers: { ...supaAuth(KEY), Prefer: 'return=minimal' },
      })
    } catch {
      /* pruning must never fail the digest */
    }

    return res.status(200).json({ ok: true, counted: rows.length })
  } catch {
    return res.status(200).json({ ok: true, error: true })
  }
}
