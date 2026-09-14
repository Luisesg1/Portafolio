import { useEffect, useRef } from 'react'
import './GlobalCat.css'

const CAT_SHEET = '/cat-walk.webp' // served from public/

/**
 * The AI-generated sprite sheet has stray specks/noise floating in the
 * "transparent" area. Keep only large connected blobs (the cats) and erase
 * everything else. Runs once at load.
 */
function cleanSheet(image: HTMLImageElement): HTMLCanvasElement {
  const W = image.naturalWidth
  const H = image.naturalHeight
  const off = document.createElement('canvas')
  off.width = W
  off.height = H
  const octx = off.getContext('2d')!
  octx.drawImage(image, 0, 0)

  const id = octx.getImageData(0, 0, W, H)
  const a = id.data
  const N = W * H
  const mask = new Uint8Array(N)
  for (let i = 0; i < N; i++) mask[i] = a[i * 4 + 3] > 30 ? 1 : 0

  const label = new Int32Array(N).fill(-1)
  const keep = new Uint8Array(N)
  const stack = new Int32Array(N)
  const MIN = 400 // min blob size to keep

  for (let s = 0; s < N; s++) {
    if (mask[s] === 0 || label[s] !== -1) continue
    let sp = 0
    stack[sp++] = s
    label[s] = s
    const comp: number[] = [s]
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % W
      const y = (p / W) | 0
      if (x > 0) { const q = p - 1; if (mask[q] && label[q] === -1) { label[q] = s; stack[sp++] = q; comp.push(q) } }
      if (x < W - 1) { const q = p + 1; if (mask[q] && label[q] === -1) { label[q] = s; stack[sp++] = q; comp.push(q) } }
      if (y > 0) { const q = p - W; if (mask[q] && label[q] === -1) { label[q] = s; stack[sp++] = q; comp.push(q) } }
      if (y < H - 1) { const q = p + W; if (mask[q] && label[q] === -1) { label[q] = s; stack[sp++] = q; comp.push(q) } }
    }
    if (comp.length >= MIN) for (const q of comp) keep[q] = 1
  }

  for (let i = 0; i < N; i++) if (!keep[i]) a[i * 4 + 3] = 0
  octx.putImageData(id, 0, 0)
  return off
}

/*
 * Site-wide pet cat that follows the pointer, using a 4-frame walk spritesheet.
 * Lives in DOCUMENT space (absolute) so it stays on the page as you scroll and
 * has to travel to reach the cursor. pointer-events: none so it never blocks
 * clicks. Disabled on touch / reduced-motion. A little heart pops when it
 * catches up to the pointer.
 */

const FRAMES = 4
const FRAME_W = 543
const FRAME_H = 724
const DISP_H = 74
const DISP_W = Math.round((DISP_H * FRAME_W) / FRAME_H) // ~56

export function GlobalCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Tito runs on touch too: he chases the finger on tap/drag and re-centres on
    // scroll, so he stays alive on mobile (previously hard-disabled on !pointer:fine).

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cw = DISP_W
    const ch = DISP_H
    // Backing-store resolution tracks the *effective* device pixel ratio, which
    // browser zoom changes — re-sync on resize so Tito never renders blurry when
    // the page is zoomed in (a fixed-resolution canvas would pixelate).
    let dpr = 0
    const syncDPR = () => {
      const d = Math.min(window.devicePixelRatio || 1, 3)
      if (d === dpr) return
      dpr = d
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      canvas.style.width = cw + 'px'
      canvas.style.height = ch + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      drawFrame()
    }

    const img = new Image()
    let sheet: HTMLCanvasElement | null = null
    let loaded = false
    syncDPR() // size the canvas now that `sheet` exists (drawFrame no-ops until loaded)

    const docW = () => document.documentElement.clientWidth
    const docH = () => document.documentElement.scrollHeight

    // document-space position + target
    let x = 90
    let y = window.scrollY + 200
    let tx = x
    let ty = y
    let lastCX = window.innerWidth * 0.5
    let lastCY = window.innerHeight * 0.5
    let facing = 1 // 1 = right (sheet faces right), -1 = left
    let frame = 0
    let frameT = 0
    let bob = 0
    let idleSince = performance.now()
    let reacted = false

    function drawFrame() {
      if (!sheet) return
      ctx!.clearRect(0, 0, cw, ch)
      ctx!.drawImage(sheet, frame * FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, cw, ch)
    }

    function place() {
      canvas!.style.transform = `translate(${Math.round(x - cw / 2)}px, ${Math.round(
        y - ch + bob,
      )}px) scaleX(${facing})`
    }

    function retarget() {
      tx = lastCX + window.scrollX
      ty = lastCY + window.scrollY + 30
      idleSince = performance.now()
      // resume the loop if it paused itself after going idle (saves battery/CPU
      // on mobile, where the rAF was previously running non-stop even at rest)
      start()
    }

    function spawnHeart() {
      const heart = document.createElement('span')
      heart.className = 'globalcat-heart'
      heart.innerHTML =
        '<svg viewBox="0 0 16 16"><path d="M8 14 L2 8 C0 6 1 2.5 4 2.5 C6 2.5 7 4 8 5 C9 4 10 2.5 12 2.5 C15 2.5 16 6 14 8 Z"/></svg>'
      heart.style.left = Math.round(x - 7) + 'px'
      heart.style.top = Math.round(y - ch - 4) + 'px'
      document.body.appendChild(heart)
      heart.addEventListener('animationend', () => heart.remove())
      window.setTimeout(() => heart.remove(), 1400)
    }

    const onMove = (e: PointerEvent) => {
      lastCX = e.clientX
      lastCY = e.clientY
      retarget()
    }
    const onScroll = () => retarget()

    const speed = 250 // px/s
    let last = performance.now()
    let raf = 0
    let running = false

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const dx = tx - x
      const dy = ty - y
      const dist = Math.hypot(dx, dy)

      if (dist > 28) {
        // walk toward the cursor
        if (Math.abs(dx) > 3) facing = dx > 0 ? 1 : -1
        const step = Math.min(dist, speed * dt)
        x += (dx / dist) * step
        y += (dy / dist) * step
        x = Math.max(cw / 2, Math.min(docW() - cw / 2, x))
        y = Math.max(ch, Math.min(docH() - 4, y))
        bob = -Math.abs(Math.sin(now * 0.009)) * 2
        frameT += dt * 1000
        if (frameT > 120) {
          frameT = 0
          frame = (frame + 1) % FRAMES
          drawFrame()
        }
        reacted = false
      } else {
        // caught the pointer → settle on a frame + a heart
        bob = 0
        if (frame !== 0) {
          frame = 0
          drawFrame()
        }
        if (!reacted && now - idleSince > 250) {
          reacted = true
          spawnHeart()
        }
      }

      place()
      // once the cat has caught the pointer and the heart has played, stop the
      // loop entirely until the next pointer move / scroll wakes it via
      // retarget(). No reason to burn frames on a cat that's standing still.
      if (dist <= 28 && reacted && now - idleSince > 1600) {
        running = false
        return
      }
      raf = requestAnimationFrame(tick)
    }

    function start() {
      // never run (or spawn hearts) while Tito is hidden — a pointer move/scroll
      // must not resurrect the loop behind the hidden canvas.
      if (running || !loaded || isHidden()) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    // NOTE: do not gate on the cat's own visibility — it must keep walking even
    // while off-screen so it can travel down to the cursor after you scroll.
    const onVis = () => {
      if (document.hidden) stop()
      else start()
    }
    const onResize = () => {
      syncDPR() // browser zoom changes the pixel ratio — keep Tito crisp
      x = Math.min(x, docW() - cw / 2)
      y = Math.min(y, docH() - 4)
    }

    // right-click Tito → "hide Tito?" menu (choice persists; footer cat resummons)
    const HIDE_KEY = 'tito-hidden'
    const isHidden = () => {
      try {
        return localStorage.getItem(HIDE_KEY) === '1'
      } catch {
        return false
      }
    }
    const removeMenu = () => document.querySelector('.globalcat-menu')?.remove()
    const removeSummonChip = () => document.querySelector('.tito-summon')?.remove()
    const summonChip = () => {
      if (document.querySelector('.tito-summon')) return
      let lang = 'es'
      try {
        lang = localStorage.getItem('ls-lang') || 'es'
      } catch {
        /* ignore */
      }
      const es = lang !== 'en'
      const b = document.createElement('button')
      b.className = 'tito-summon'
      b.type = 'button'
      b.setAttribute('aria-label', es ? 'Traer a Tito' : 'Bring Tito back')
      b.innerHTML =
        '<svg viewBox="0 0 40 34" aria-hidden><path d="M11 12 L8 3 L15 10 C18 8.6 22 8.6 25 10 L32 3 L29 12 C34 19 34 28 30 30 L10 30 C6 28 6 19 11 12 Z"/><path d="M30 28 C38 28 38 18 33 16"/></svg>' +
        `<span>${es ? 'Traer a Tito' : 'Bring Tito'}</span>`
      b.addEventListener('click', showCat)
      document.body.appendChild(b)
    }
    const hideCat = () => {
      try {
        localStorage.setItem(HIDE_KEY, '1')
      } catch {
        /* ignore */
      }
      stop()
      canvas!.style.display = 'none'
      summonChip()
    }
    const showCat = (e?: Event) => {
      try {
        localStorage.removeItem(HIDE_KEY)
      } catch {
        /* ignore */
      }
      removeSummonChip()
      // reappear in the current view, then walk to the cursor from there.
      // detail.top → enter from near the top (used after the black-hole reset);
      // otherwise near the summon chip (lower-left).
      const top = (e as CustomEvent | undefined)?.detail?.top === true
      x = window.scrollX + Math.round(cw / 2) + 40
      y = top ? window.scrollY + 80 : window.scrollY + window.innerHeight - 60
      tx = x
      ty = y
      canvas!.style.display = ''
      place()
      if (!reduce && loaded) start()
    }
    window.addEventListener('tito:show', showCat)

    // one-time hint so people know Tito can be dismissed
    const HINT_KEY = 'tito-hint-seen'
    const markHint = () => {
      try {
        localStorage.setItem(HINT_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    const showHint = () => {
      // shown on every visit (no `hintSeen` gate) so newcomers always spot Tito
      if (document.querySelector('.globalcat-hint')) return
      let lang = 'es'
      try {
        lang = localStorage.getItem('ls-lang') || 'es'
      } catch {
        /* ignore */
      }
      const es = lang !== 'en'
      const fine = window.matchMedia('(pointer: fine)').matches
      const verb = fine ? (es ? 'Clic en' : 'Click') : (es ? 'Toca a' : 'Tap')
      const tail = es ? 'para jugar u ocultarlo' : 'to play or hide him'
      const h = document.createElement('div')
      h.className = 'globalcat-hint'
      h.innerHTML =
        '<svg class="globalcat-hint__cat" viewBox="0 0 40 34" aria-hidden>' +
        '<path d="M11 12 L8 3 L15 10 C18 8.6 22 8.6 25 10 L32 3 L29 12 C34 19 34 28 30 30 L10 30 C6 28 6 19 11 12 Z"/>' +
        '<path d="M30 28 C38 28 38 18 33 16"/>' +
        '<circle cx="16" cy="20" r="1.2"/><circle cx="24" cy="20" r="1.2"/></svg>' +
        `<span class="globalcat-hint__txt">${verb} <b>Tito</b> ${tail}</span>` +
        '<span class="globalcat-hint__x" aria-hidden>&times;</span>'
      document.body.appendChild(h)
      const kill = () => {
        markHint()
        h.classList.add('is-out')
        window.setTimeout(() => h.remove(), 400)
      }
      window.setTimeout(kill, 7000)
      h.addEventListener('click', kill)
    }

    const hitTito = (clientX: number, clientY: number) => {
      // hidden Tito has no hitbox — never open the hide menu over empty space
      if (isHidden() || canvas!.style.display === 'none') return false
      const left = x - cw / 2 - window.scrollX
      const top = y - ch + bob - window.scrollY
      const pad = 16
      return (
        clientX >= left - pad &&
        clientX <= left + cw + pad &&
        clientY >= top - pad &&
        clientY <= top + ch + pad
      )
    }

    const openHideMenu = (clientX: number, clientY: number) => {
      removeMenu()
      markHint()
      document.querySelector('.globalcat-hint')?.remove()
      let lang = 'es'
      try {
        lang = localStorage.getItem('ls-lang') || 'es'
      } catch {
        /* ignore */
      }
      const es = lang !== 'en'
      const menu = document.createElement('div')
      menu.className = 'globalcat-menu'
      menu.style.left = Math.min(clientX, window.innerWidth - 200) + 'px'
      menu.style.top = Math.min(clientY, window.innerHeight - 90) + 'px'
      menu.innerHTML =
        `<span class="globalcat-menu__q">Tito</span>` +
        `<button class="globalcat-menu__btn globalcat-menu__btn--play" type="button" data-act="play">${
          es ? '🎮 Atrapa a Tito' : '🎮 Catch Tito'
        }</button>` +
        `<button class="globalcat-menu__btn" type="button" data-act="hide">${es ? 'Ocultar' : 'Hide'}</button>`
      document.body.appendChild(menu)
      menu.querySelector('[data-act="play"]')!.addEventListener('click', () => {
        removeMenu()
        window.dispatchEvent(new Event('game:open'))
      })
      menu.querySelector('[data-act="hide"]')!.addEventListener('click', () => {
        hideCat()
        removeMenu()
      })
      const away = (ev: Event) => {
        if (!menu.contains(ev.target as Node)) {
          removeMenu()
          document.removeEventListener('pointerdown', away)
        }
      }
      setTimeout(() => document.addEventListener('pointerdown', away), 0)
    }

    // right-click (desktop) or tap (mobile) on Tito → hide menu
    const onContext = (e: MouseEvent) => {
      if (!hitTito(e.clientX, e.clientY)) return
      e.preventDefault()
      openHideMenu(e.clientX, e.clientY)
    }
    const onTap = (e: PointerEvent) => {
      if (!hitTito(e.clientX, e.clientY)) return
      openHideMenu(e.clientX, e.clientY)
    }

    img.onload = () => {
      sheet = cleanSheet(img)
      loaded = true
      drawFrame()
      place()
      window.addEventListener('contextmenu', onContext)
      window.addEventListener('click', onTap)
      if (reduce) {
        if (isHidden()) {
          canvas!.style.display = 'none'
          summonChip()
        }
        return // static, no following
      }
      document.addEventListener('visibilitychange', onVis)
      window.addEventListener('resize', onResize)
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
      if (isHidden()) {
        canvas!.style.display = 'none'
        summonChip()
      } else {
        start()
        showHint()
      }
    }
    img.src = CAT_SHEET

    return () => {
      stop()
      removeMenu()
      removeSummonChip()
      window.removeEventListener('tito:show', showCat)
      window.removeEventListener('contextmenu', onContext)
      window.removeEventListener('click', onTap)
      document.querySelector('.globalcat-hint')?.remove()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return <canvas ref={canvasRef} className="globalcat" aria-hidden="true" />
}
