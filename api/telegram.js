// Telegram webhook: lets you query stats on demand by messaging the bot.
// Commands: /hoy  /semana  /leads  /stats  /help
//
// One-time setup (registers the webhook with Telegram) — visit in a browser:
//   https://luisesg.com/api/telegram?setup=<CRON_SECRET>
// (if CRON_SECRET isn't set, use ?setup=go). Dormant without the env vars.

import { sendTelegram, loadEvents, renderDigest, summarize } from './_shared.js'

const DAY = 24 * 60 * 60 * 1000
const sinceISO = (ms) => new Date(Date.now() - ms).toISOString()

export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN
    const CHAT = process.env.TELEGRAM_CHAT_ID
    const BASE = process.env.VITE_SUPABASE_URL
    const KEY = process.env.SUPABASE_SERVICE_ROLE
    if (!TOKEN || !CHAT || !BASE || !KEY) {
      return res.status(200).json({ ok: true, dormant: true })
    }
    const SECRET = process.env.CRON_SECRET

    // --- one-time webhook registration (GET ?setup=...) ---
    if (req.method === 'GET') {
      const want = SECRET || 'go'
      if ((req.query?.setup || '') !== want) return res.status(401).json({ ok: false })
      const host = req.headers['x-forwarded-host'] || req.headers.host
      const hook = `https://${host}/api/telegram`
      const r = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: hook,
          ...(SECRET ? { secret_token: SECRET } : {}),
          allowed_updates: ['message'],
        }),
      }).then((x) => x.json())
      return res.status(200).json({ ok: true, setWebhook: r, hook })
    }

    if (req.method !== 'POST') return res.status(405).end()

    // reject anything not signed with our secret (Telegram echoes it back)
    if (SECRET && req.headers['x-telegram-bot-api-secret-token'] !== SECRET) {
      return res.status(200).json({ ok: true, skipped: 'secret' })
    }

    const update = typeof req.body === 'object' && req.body ? req.body : {}
    const msg = update.message
    if (!msg || !msg.text) return res.status(200).json({ ok: true })

    // only answer the owner's chat — ignore everyone else
    if (String(msg.chat?.id) !== String(CHAT)) {
      return res.status(200).json({ ok: true, skipped: 'chat' })
    }

    const cmd = msg.text.trim().split(/\s+/)[0].replace(/@.*$/, '').toLowerCase()

    let reply
    if (cmd === '/hoy') {
      const rows = await loadEvents(BASE, KEY, sinceISO(DAY))
      reply = renderDigest('📊 *Hoy* · luisesg.com', '🗓️ últimas 24h', rows)
    } else if (cmd === '/semana') {
      const rows = await loadEvents(BASE, KEY, sinceISO(7 * DAY))
      reply = renderDigest('📊 *Semana* · luisesg.com', '🗓️ últimos 7 días', rows)
    } else if (cmd === '/stats') {
      const rows = await loadEvents(BASE, KEY, sinceISO(30 * DAY))
      reply = renderDigest('📊 *Stats* · luisesg.com', '🗓️ últimos 30 días', rows)
    } else if (cmd === '/leads') {
      const rows = await loadEvents(BASE, KEY, sinceISO(30 * DAY))
      const { leads } = summarize(rows)
      if (!leads.length) {
        reply = '✉️ Sin leads en los últimos 30 días.'
      } else {
        const lines = [`✉️🔥 *${leads.length} lead(s)* · últimos 30 días`, '']
        for (const l of leads.slice(0, 40)) {
          lines.push(`• ${l.name}${l.ptype ? ` — ${l.ptype}` : ''}`)
        }
        reply = lines.join('\n')
      }
    } else {
      reply = [
        '🤖 *Comandos*',
        '/hoy — resumen de las últimas 24h',
        '/semana — últimos 7 días',
        '/stats — últimos 30 días',
        '/leads — leads del formulario (30 días)',
      ].join('\n')
    }

    await sendTelegram(TOKEN, CHAT, reply)
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(200).json({ ok: true, error: true })
  }
}
