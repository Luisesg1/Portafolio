import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Intro } from './components/Intro'
import { Services } from './components/Services'
import { Projects } from './components/Projects'
import { Tech } from './components/Tech'
import { Profile } from './components/Profile'
import { Process } from './components/Process'
import { GameBreak } from './components/GameBreak'
import { Contact } from './components/Contact'
import { GlobalCat } from './components/GlobalCat'
import { Footer } from './components/Footer'
import { ScrollProgress } from './components/ScrollProgress'
import { lazy, Suspense, useEffect, useState } from 'react'
import { CommandPalette } from './components/CommandPalette'

// Easter-egg mini-game — heavy-ish and rarely opened, so it's split out of the
// initial bundle and only fetched when the "game:open" event fires.
const CatchGame = lazy(() => import('./components/CatchGame').then((m) => ({ default: m.CatchGame })))

function GameHost() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const open = () => setOn(true)
    window.addEventListener('game:open', open)
    return () => window.removeEventListener('game:open', open)
  }, [])
  if (!on) return null
  return (
    <Suspense fallback={null}>
      <CatchGame onClose={() => setOn(false)} />
    </Suspense>
  )
}
import { Loader } from './components/Loader'
import { Hud } from './components/Hud'
import './styles/sections.css'

export default function App() {
  // Notify (Telegram) on a real visit — once per session, skip localhost/bots.
  // The endpoint is dormant unless its env vars are set on the server.
  useEffect(() => {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return
    try {
      if (sessionStorage.getItem('v-pinged')) return
      sessionStorage.setItem('v-pinged', '1')
    } catch {
      /* ignore */
    }
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: document.referrer || '', page: location.pathname + location.hash }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  return (
    <>
      <a href="#main" className="skip-link">Saltar al contenido</a>
      {/* shared ambient backdrop behind every section — keeps the starfield
          continuous so the hero never "cuts" into a flat section below */}
      <div className="page-stars" aria-hidden />
      <Loader />
      <ScrollProgress />
      <Nav />
      <main id="main">
        <Hero />
        <Intro />
        <Services />
        <Projects />
        <Tech />
        <Profile />
        <Process />
        <GameBreak />
        <Contact />
      </main>
      <Footer />
      <Hud />
      <CommandPalette />
      <GameHost />
      <GlobalCat />
    </>
  )
}
