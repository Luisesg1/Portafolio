import { useState, type MouseEvent } from 'react'
import { Sparkles } from 'lucide-react'
import { Reveal, MaskLine } from './Reveal'
import { Magnetic } from './Magnetic'
import { FooterWordmark } from './FooterWordmark'
import { useT } from '../i18n/i18n'
import { scrollToY } from '../lib/scroll'
import { notify } from '../lib/track'
import './Footer.css'

/* ---- random "surprise me" effects (cosmos palette, no emoji) ---- */
type Origin = { x: number; y: number }
const ACCENTS = ['--violet', '--cyan', '--blue', '--magenta', '--amber']
const spawnEl = (el: HTMLElement, life = 1300) => {
  document.body.appendChild(el)
  el.addEventListener('animationend', () => el.remove())
  setTimeout(() => el.remove(), life)
}
const HEART_SVG =
  '<svg viewBox="0 0 16 16"><path d="M8 14 L2 8 C0 6 1 2.5 4 2.5 C6 2.5 7 4 8 5 C9 4 10 2.5 12 2.5 C15 2.5 16 6 14 8 Z"/></svg>'

/* effects fill the whole viewport (position: fixed) — same on desktop & mobile */
function fxBurst() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cx = vw / 2
  const cy = vh / 2
  const R = Math.hypot(vw, vh) / 2
  const flash = document.createElement('span')
  flash.className = 'footer-flash'
  flash.style.left = cx + 'px'
  flash.style.top = cy + 'px'
  spawnEl(flash, 800)
  const n = Math.round(48 + vw / 24)
  for (let i = 0; i < n; i++) {
    const d = document.createElement('span')
    d.className = 'footer-burst-dot'
    const a = Math.random() * Math.PI * 2
    const dist = R * (0.35 + Math.random() * 0.7)
    const s = 3 + Math.random() * 7
    d.style.left = cx + 'px'
    d.style.top = cy + 'px'
    d.style.width = d.style.height = s + 'px'
    d.style.setProperty('--tx', Math.cos(a) * dist + 'px')
    d.style.setProperty('--ty', Math.sin(a) * dist + 'px')
    d.style.setProperty('--c', `var(${ACCENTS[i % ACCENTS.length]})`)
    d.style.animationDelay = Math.random() * 0.08 + 's'
    spawnEl(d, 1300)
  }
}
function fxRain() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const n = Math.round(40 + vw / 22)
  for (let i = 0; i < n; i++) {
    const d = document.createElement('span')
    d.className = 'footer-rain-dot'
    const s = 2 + Math.random() * 4
    d.style.left = Math.random() * vw + 'px'
    d.style.top = -20 + 'px'
    d.style.width = d.style.height = s + 'px'
    d.style.setProperty('--fall', vh + 40 + Math.random() * 120 + 'px')
    d.style.setProperty('--drift', (Math.random() - 0.5) * 90 + 'px')
    d.style.setProperty('--c', `var(${ACCENTS[(Math.random() * ACCENTS.length) | 0]})`)
    d.style.animationDelay = Math.random() * 0.6 + 's'
    spawnEl(d, 1900)
  }
}
function fxHearts() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const n = Math.round(14 + vw / 90)
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span')
    h.className = 'globalcat-heart globalcat-heart--fixed'
    h.innerHTML = HEART_SVG
    const sz = 16 + Math.random() * 16
    h.style.width = h.style.height = sz + 'px'
    h.style.left = Math.random() * vw + 'px'
    h.style.top = vh * (0.15 + Math.random() * 0.75) + 'px'
    h.style.animationDelay = Math.random() * 0.5 + 's'
    spawnEl(h, 1700)
  }
}
function fxRings() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cx = vw / 2
  const cy = vh / 2
  const scale = Math.hypot(vw, vh) / 14
  const cols = ['--violet', '--cyan', '--blue', '--magenta', '--amber']
  for (let i = 0; i < 5; i++) {
    const g = document.createElement('span')
    g.className = 'footer-ring'
    g.style.left = cx + 'px'
    g.style.top = cy + 'px'
    g.style.animationDelay = i * 0.16 + 's'
    g.style.setProperty('--scale', String(scale))
    g.style.setProperty('--c', `var(${cols[i]})`)
    spawnEl(g, 1700)
  }
}
let lastFortune = -1
function fxFortune(origin?: Origin) {
  // spawn from the "surprise" button, not the middle of the screen
  const x = origin ? origin.x : window.innerWidth / 2
  const y = origin ? origin.y : window.innerHeight / 2
  let lang = 'es'
  try {
    lang = localStorage.getItem('ls-lang') || 'es'
  } catch {
    /* ignore */
  }
  const lines =
    lang === 'en'
      ? [
          'Follow @Luchoesg_ on Instagram',
          'Follow @LeDu3D_ on Instagram',
          'Something had to go here',
          'Drink some water',
          'Stretch a little',
          'Breathe. Now keep going',
          'You got this',
          'Save your work',
          'Coffee or more code?',
          'commit && push',
          'Yes, you made it here',
          'star stuff & code',
          'built between stars',
          'thanks, really',
          'rm -rf sadness',
          'ship it. no emoji though',
          'have you tried turning it off?',
          'the bug was you all along',
          'touch grass, then touch code',
          '99 little bugs in the code',
          "it works on my machine",
          'go hire this guy',
          'sudo make me a sandwich',
          'today is a good day to deploy',
          'trust the process',
          'you are the main character',
          'one more commit, then sleep',
          '404: excuses not found',
          // fútbol
          'Messi is the GOAT 🐐',
          'football is life ⚽',
          'no VAR can stop this deploy',
          'gooool de media cancha ⚽',
          // gym
          'no skip leg day 🏋️',
          'one more rep 💪',
          'we go gym 🏋️',
          'protein loaded, code deployed',
          'sets, reps, commits 💪',
          // espacio
          'we are made of star stuff ✨',
          'to the moon 🌕',
          'lost in the cosmos 🌌',
          'gravity optional 🚀',
          'ad astra ✨',
        ]
      : [
          'Sigue a @Luchoesg_ en Instagram',
          'Sigue a @LeDu3D_ en Instagram',
          'Algo debía poner aquí',
          'Toma agua',
          'Estírate un poco',
          'Respira. Ahora sigue',
          'Tú puedes con esto',
          'Guarda tu trabajo',
          '¿Café o más código?',
          'commit && push',
          'Sí, llegaste hasta acá',
          'polvo de estrellas y código',
          'hecho entre estrellas',
          'gracias, de verdad',
          'rm -rf tristeza',
          'contrata a este ingeniero',
          '¿ya probaste apagar y prender?',
          'el bug eras tú',
          'toca pasto, luego toca código',
          'funciona en mi máquina',
          'hoy es buen día para desplegar',
          'confía en el proceso',
          'tú eres el protagonista',
          'un commit más y a dormir',
          '404: excusas no encontradas',
          'sí, lo hice yo',
          'guarda antes de que se caiga',
          'respira hondo, crack',
          // fútbol
          'Messi es el GOAT 🐐',
          'el fútbol es vida ⚽',
          'ningún VAR frena este deploy',
          'gol de media cancha ⚽',
          'dale campeón ⚽',
          // gym
          'no te saltes pierna 🏋️',
          'una repetición más 💪',
          'vamos al gym 🏋️',
          'proteína cargada, código desplegado',
          'series, reps, commits 💪',
          // espacio
          'somos polvo de estrellas ✨',
          'rumbo a la luna 🌕',
          'perdido en el cosmos 🌌',
          'gravedad opcional 🚀',
          'ad astra ✨',
        ]
  // pick a line, avoiding an immediate repeat
  let li = (Math.random() * lines.length) | 0
  if (li === lastFortune) li = (li + 1) % lines.length
  lastFortune = li
  const p = document.createElement('span')
  p.className = 'footer-fortune'
  p.textContent = lines[li]
  // document coords (absolute) so the pill stays anchored to the page where it
  // spawned and scrolls away with it — never glued to the viewport.
  p.style.left = x + window.scrollX + 'px'
  // sit the pill just above the button and let it rise from there (never dips down)
  p.style.top = y - 44 + window.scrollY + 'px'
  spawnEl(p, 2400)
}
/* black hole — swallows everything, then restarts from the top */
function fxBlackHole() {
  const hole = document.createElement('div')
  hole.className = 'footer-hole'
  document.body.appendChild(hole)
  // Tito (real walk-sprite) spirals into the center as if the hole swallows him
  const cat = document.createElement('span')
  cat.className = 'footer-hole-cat'
  document.body.appendChild(cat)
  cat.addEventListener('animationend', () => cat.remove())
  window.setTimeout(() => cat.remove(), 2000)
  // when the screen is fully black, jump back to the top so it "restarts"
  // (scrollToY forces `auto`; a plain scrollTo no-ops under the global smooth)
  window.setTimeout(() => scrollToY(0), 1450)
  // as the darkness clears, Tito re-emerges near the top
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('tito:show', { detail: { top: true } }))
  }, 2300)
  hole.addEventListener('animationend', () => hole.remove())
  window.setTimeout(() => hole.remove(), 3600)
}
// visual effects picked uniformly; fortune + black hole are special-cased in surprise()
const FX: Array<(o?: Origin) => void> = [fxBurst, fxRain, fxHearts, fxRings]

const socials = [
  { label: 'GitHub', href: 'https://github.com/Luisesg1' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luis-eduardo-soto-guti%C3%A9rrez-99a53a256' },
  { label: 'Email', href: 'mailto:luiseduardosotoguti@gmail.com' },
]

export function Footer() {
  const t = useT()
  const [catOpen, setCatOpen] = useState(false)

  // random full-screen cosmos effect each click
  const lastFx = useState({ i: -1 })[0]
  const surprise = (e: MouseEvent<HTMLButtonElement>) => {
    // ping Telegram once per session (Analytics still counts every click)
    notify('surprise_click')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // origin = the button itself, so the fortune line rises from here (not screen center)
    const r = e.currentTarget.getBoundingClientRect()
    const origin: Origin = { x: r.left + r.width / 2, y: r.top }
    // black hole is very rare (~1%) — it resets the scroll, too disruptive to hit often
    const roll = Math.random()
    if (roll < 0.01) {
      fxBlackHole()
      return
    }
    // fortune line dominates (~72%) — user wants more phrases than effects
    if (roll < 0.73) {
      fxFortune(origin)
      return
    }
    // otherwise pick a visual effect, avoiding an immediate repeat
    let i = (Math.random() * FX.length) | 0
    if (i === lastFx.i) i = (i + 1) % FX.length
    lastFx.i = i
    FX[i](origin)
  }

  const nav = [
    { id: 'work', label: t.footer.nav.work },
    { id: 'services', label: t.footer.nav.services },
    { id: 'about', label: t.footer.nav.about },
    { id: 'contact', label: t.footer.nav.contact },
  ]

  return (
    <footer className="footer" id="footer">
      <FooterWordmark />

      <div className="shell footer__inner">
        {/* ---- closing CTA ---- */}
        <Reveal className="footer__cta">
          <span className="tag footer__eyebrow">{t.footer.ctaEyebrow}</span>
          <h2 className="footer__cta-title">
            <MaskLine>{t.footer.ctaTitle[0]}</MaskLine>
            <MaskLine delay={0.08}>
              <span className="c-violet">{t.footer.ctaTitle[1]}</span>
            </MaskLine>
          </h2>
          <div className="footer__cta-row">
            <span className="footer__avail">
              <span className="footer__availdot" />
              {t.footer.ctaSub}
            </span>
            <Magnetic strength={10}>
              <a href="#contact" className="footer__cta-btn" data-cursor="link">
                <span className="footer__cta-btn-label">{t.footer.ctaBtn}</span>
                <span className="footer__cta-btn-arrow" aria-hidden>→</span>
              </a>
            </Magnetic>
          </div>
        </Reveal>

        {/* ---- thanks + copy email ---- */}
        <Reveal className="footer__thanks" delay={0.05}>
          <span className="footer__thanks-txt">{t.footer.thanks}</span>
          <span className="footer__surprise-hint">{t.footer.surpriseHint}</span>
          <div className="footer__thanks-actions">
            <button className="footer__act footer__act--surprise" onClick={surprise} data-cursor="link">
              <Sparkles size={15} strokeWidth={1.7} />
              {t.footer.surprise}
            </button>
          </div>
        </Reveal>

        <div className="footer__rule" />

        {/* ---- identity · nav · social ---- */}
        <div className="footer__grid">
          <Reveal className="footer__col footer__id" delay={0.05}>
            <span className="meta footer__col-label">{t.footer.identityLabel}</span>
            <span className="footer__id-full">{t.footer.fullName}</span>
            <span className="meta footer__id-role">{t.footer.role}</span>
          </Reveal>

          <Reveal className="footer__col" delay={0.12}>
            <span className="meta footer__col-label">{t.footer.navLabel}</span>
            <nav className="footer__links" aria-label="Footer">
              {nav.map((n) => (
                <a key={n.id} href={`#${n.id}`} className="footer__link ul" data-cursor="link">
                  {n.label}
                </a>
              ))}
            </nav>
          </Reveal>

          <Reveal className="footer__col" delay={0.19}>
            <span className="meta footer__col-label">{t.footer.socialLabel}</span>
            <div className="footer__links">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="footer__link footer__link--ext ul"
                  data-cursor="link"
                >
                  {s.label}
                  <span className="footer__link-ext" aria-hidden>↗</span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ---- bottom row ---- */}
        <Reveal className="footer__bottom" delay={0.26}>
          <span className="meta footer__copy">
            {t.footer.rights}
            <span className="footer__copy-sub"> — {t.footer.rightsSub}</span>
          </span>

          <button
            className={`footer__cats ${catOpen ? 'is-open' : ''}`}
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
            onClick={() => {
              setCatOpen((v) => !v)
              // resummon Tito if he was hidden
              window.dispatchEvent(new Event('tito:show'))
            }}
            aria-label="cat.exe"
            data-cursor="link"
          >
            <svg className="footer__cat" viewBox="0 0 40 34" aria-hidden>
              <path d="M11 12 L8 3 L15 10 C18 8.6 22 8.6 25 10 L32 3 L29 12 C34 19 34 28 30 30 L10 30 C6 28 6 19 11 12 Z" />
              <path className="footer__cat-tail" d="M30 28 C38 28 38 18 33 16" />
              <circle className="footer__cat-eye" cx="16" cy="20" r="1.1" />
              <circle className="footer__cat-eye" cx="24" cy="20" r="1.1" />
            </svg>
            {catOpen ? (
              <span className="footer__catexe">
                <span className="footer__catexe-name">{t.footer.catExe}</span>
                <span className="footer__catexe-status">
                  {t.footer.catExeStatus}
                  <span className="footer__catcaret" />
                </span>
              </span>
            ) : (
              <span className="meta footer__cats-label">{t.footer.cats}</span>
            )}
          </button>

          <a href="#index" className="footer__top ul" data-cursor="link">
            <span className="footer__top-arrow" aria-hidden>↑</span>
            {t.footer.top}
          </a>
        </Reveal>
      </div>
    </footer>
  )
}
