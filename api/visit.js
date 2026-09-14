// Serverless notifier: pings a Telegram chat when someone visits the site.
// Dormant unless TELEGRAM_TOKEN + TELEGRAM_CHAT_ID are set (Vercel env vars,
// server-side only — never shipped to the browser). Geo comes free from
// Vercel's edge headers; no IP is stored anywhere.

const BOT_UA = /bot|crawl|spider|slurp|bing|google|facebook|embed|preview|lighthouse|headless|monitor|pingdom|uptime/i

function flag(cc) {
  if (!cc || cc.length !== 2) return ''
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
}

function device(ua = '') {
  if (/mobile|iphone|android/i.test(ua) && !/ipad|tablet/i.test(ua)) return '📱 Móvil'
  if (/ipad|tablet/i.test(ua)) return '📱 Tablet'
  return '💻 Escritorio'
}

function browser(ua = '') {
  if (/edg/i.test(ua)) return 'Edge'
  if (/opr|opera|opgx/i.test(ua)) return 'Opera'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Navegador'
}

// Telegram Markdown (legacy) trips on these; strip them from visitor-supplied
// strings so a name like "Juan*" can't break formatting or inject markup.
function clean(s = '', max = 80) {
  return String(s).replace(/[*_`[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function human(seconds = 0) {
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export default async function handler(req, res) {
  // never block the visitor: respond OK no matter what
  try {
    if (req.method !== 'POST') return res.status(405).end()

    const TOKEN = process.env.TELEGRAM_TOKEN
    const CHAT = process.env.TELEGRAM_CHAT_ID
    if (!TOKEN || !CHAT) return res.status(200).json({ ok: true, dormant: true })

    // only accept pings coming from the site itself (casual-abuse guard)
    const origin = req.headers.origin || req.headers.referer || ''
    if (!/luisesg\.com|localhost|\.vercel\.app/i.test(origin)) {
      return res.status(200).json({ ok: true, skipped: 'origin' })
    }

    const ua = req.headers['user-agent'] || ''
    if (BOT_UA.test(ua)) return res.status(200).json({ ok: true, skipped: 'bot' })

    const country = req.headers['x-vercel-ip-country'] || ''
    const city = decodeURIComponent(req.headers['x-vercel-ip-city'] || '') || 'Desconocida'
    const body = typeof req.body === 'object' && req.body ? req.body : {}

    // visitor-supplied context (client-side, so it's THEIR locale/time/campaign)
    const lang = clean(body.lang, 12)
    const visitorTime = clean(body.localTime, 12) // their own clock
    const utm = clean(body.utm, 60)
    const hereTime = new Date().toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
    })

    const fl = flag(country) || '📍'
    const place = `${city}, ${country || '??'}`
    // one shared "where + when" footer for the action alerts
    const footer = [
      `${fl} ${place} · ${device(ua)} · ${browser(ua)}`,
      lang ? `🌐 ${lang}` : '',
      visitorTime ? `🕐 ${visitorTime} (su hora) · ${hereTime} (aquí)` : `🕐 ${hereTime}`,
    ]
      .filter(Boolean)
      .join('\n')

    let text
    if (body.event === 'session_summary') {
      const dur = human(body.seconds)
      const seen = clean(body.projects, 200)
      text = [
        `📊 *Resumen de sesión* · luisesg.com`,
        `${fl} ${place}`,
        `⏱️ Estuvo ${dur}`,
        seen ? `👁️ Vio: ${seen}` : `👁️ No abrió proyectos`,
        `📄 CV: ${body.cv ? 'sí ✅' : 'no'}`,
      ].join('\n')
    } else if (body.event) {
      // high-intent action alert, with context
      const label = clean(body.label, 60)
      let headline
      switch (body.event) {
        case 'project_open':
          headline = `🔥 *Abrió el proyecto* — ${label || '¿?'}`
          break
        case 'cv_download':
          headline = `📄🔥 *Descargó tu CV* — LEAD CALIENTE`
          break
        case 'contact_submit': {
          const name = clean(body.name, 60)
          const ptype = clean(body.ptype, 40)
          headline = [
            `✉️🔥 *Formulario enviado* — LEAD CALIENTE`,
            name ? `👤 ${name}` : '',
            ptype ? `🗂️ ${ptype}` : '',
          ]
            .filter(Boolean)
            .join('\n')
          break
        }
        case 'whatsapp_click':
          headline = `💬 *Click en tu WhatsApp*`
          break
        default:
          headline = `👉 ${clean(body.event, 40)}${label ? ` · ${label}` : ''}`
      }
      text = `${headline}\n${footer}`
    } else {
      // plain visit ping
      let ref = (body.ref || req.headers.referer || '').toString()
      try {
        ref = ref ? new URL(ref).hostname.replace(/^www\./, '') : ''
      } catch {
        ref = ''
      }
      if (/luisesg\.com/i.test(ref)) ref = ''
      const returning = body.returning === 'returning'
      const source = utm ? `📣 Campaña: ${utm}` : `🔗 ${ref || 'Directo'}`
      text = [
        `👀 *Nueva visita* · luisesg.com`,
        `${fl} *${place}*`,
        returning ? `🔁 Visitante recurrente` : `🆕 Nuevo visitante`,
        `${device(ua)} · ${browser(ua)}${lang ? ` · 🌐 ${lang}` : ''}`,
        source,
        visitorTime ? `🕐 ${visitorTime} (su hora) · ${hereTime} (aquí)` : `🕐 ${hereTime}`,
      ].join('\n')
    }

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'Markdown' }),
    })

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(200).json({ ok: true, error: true })
  }
}
