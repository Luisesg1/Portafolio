import { useEffect, useRef, useState } from 'react'
import { X, Github, Maximize2, ExternalLink } from 'lucide-react'
import type { projects } from '../data/content'
import type { dict } from '../i18n/dict'
import { scrollToId } from '../lib/scroll'
import { PhoneShowcase } from './PhoneShowcase'
import { ProjectViewer } from './ProjectViewer'
import './CaseStudy.css'

type Project = (typeof projects)[number]
type ProjText = (typeof dict)['es']['projects']['items'][number]
type Labels = (typeof dict)['es']['projects']

/**
 * Screenshot carousel with a 3D "slab" slide between images, mounted inside the
 * on-brand preview frame: the outgoing shot tilts and slides away in
 * perspective while the incoming one arrives tilted and straightens. Arrows +
 * dots signal that more shots exist. Exit is driven by CSS keyframes + the
 * incoming image's animationend (AnimatePresence exit is unreliable here).
 */
function SlabShot({
  images,
  screens,
  accent,
  title,
  unit,
  hint,
  prev,
  next,
}: {
  images: readonly string[]
  screens: readonly string[]
  accent: string
  title: string
  unit: string
  hint: string
  prev: string
  next: string
}) {
  const [index, setIndex] = useState(0)
  const [turn, setTurn] = useState<{ to: number; dir: 1 | -1 } | null>(null)
  const [zoom, setZoom] = useState(false)

  const go = (dir: 1 | -1) => {
    if (turn || images.length < 2) return
    const to = (index + dir + images.length) % images.length
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(to)
      return
    }
    setTurn({ to, dir })
  }

  // In the lightbox there is no slab animation — swap instantly.
  const jump = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length)

  const settle = () => {
    if (!turn) return
    setIndex(turn.to)
    setTurn(null)
  }

  const active = turn ? turn.to : index

  return (
    <div className="cs__slab-wrap">
      <button
        className="cs__slab-vp"
        data-cursor="shot"
        onClick={() => setZoom(true)}
        aria-label={`${title} — ${hint}`}
      >
        {turn ? (
          <>
            <img
              className={`cs__slab cs__slab--leave-${turn.dir > 0 ? 'next' : 'prev'}`}
              src={images[index]}
              alt={`${title} — ${index + 1}`}
            />
            <img
              className={`cs__slab cs__slab--enter-${turn.dir > 0 ? 'next' : 'prev'}`}
              src={images[turn.to]}
              alt={`${title} — ${turn.to + 1}`}
              onAnimationEnd={settle}
            />
          </>
        ) : (
          <img className="cs__slab" src={images[index]} alt={`${title} — ${index + 1}`} loading="lazy" />
        )}
        <span className="cs__shot-hint" aria-hidden>
          <span className="cs__shot-hint-chip">
            <Maximize2 size={14} strokeWidth={1.7} />
            {hint}
          </span>
        </span>
      </button>

      {images.length > 1 && (
        <>
          <button
            className="cs__shotnav cs__shotnav--prev"
            onClick={() => go(-1)}
            aria-label={prev}
            data-cursor="link"
          >
            ‹
          </button>
          <button
            className="cs__shotnav cs__shotnav--next"
            onClick={() => go(1)}
            aria-label={next}
            data-cursor="link"
          >
            ›
          </button>
          <div className="cs__shotbar">
            <span className="cs__shotcount" aria-hidden>
              {String(active + 1).padStart(2, '0')} <i>/</i> {String(images.length).padStart(2, '0')}
            </span>
            <div className="cs__dots" aria-hidden>
              {images.map((src, i) => (
                <span key={src} className={`cs__dot ${i === active ? 'is-on' : ''}`} />
              ))}
            </div>
          </div>
        </>
      )}

      {zoom && (
        <ProjectViewer
          images={images}
          screens={screens}
          accent={accent}
          title={title}
          unit={unit}
          index={index}
          onPrev={() => jump(-1)}
          onNext={() => jump(1)}
          onClose={() => setZoom(false)}
          labels={{ prev, next }}
        />
      )}
    </div>
  )
}

/**
 * Project case study overlay. Self-contained enter/exit via CSS keyframes
 * (AnimatePresence exit proved unreliable in this project). On close it plays
 * the out animation, then calls the parent's onClose to unmount.
 */
export function CaseStudy({
  project,
  text,
  num,
  labels,
  onClose,
}: {
  project: Project
  text: ProjText
  num: string
  labels: Labels
  onClose: () => void
}) {
  const [closing, setClosing] = useState(false)
  const panelRef = useRef<HTMLElement>(null)

  const close = () => {
    setClosing(true)
    setTimeout(onClose, 420)
  }

  // The modal locks body scroll while open, so a native `#contact` jump on click
  // fires while scrolling is blocked and never lands. Close first, then — once
  // the dialog has unmounted and overflow is restored — jump to the section.
  const goContact = (e: React.MouseEvent) => {
    e.preventDefault()
    close()
    window.setTimeout(() => scrollToId('contact'), 460)
  }

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    // move focus into the dialog
    panel?.querySelector<HTMLElement>('.cs__close')?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      // focus trap — keep Tab cycling inside the dialog
      const nodes = panel.querySelectorAll<HTMLElement>(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prevFocus?.focus?.({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reveal the editorial chapters as they scroll into the dialog viewport.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const scroller = panel.querySelector('.cs__scroll')
    const items = panel.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { root: scroller, rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const blocks = [
    { n: '01', k: labels.blocks.context, v: text.problem },
    { n: '02', k: labels.blocks.solution, v: text.solution },
    { n: '03', k: labels.blocks.implementation, v: text.implementation },
  ]

  return (
    <div
      className={`cs ${closing ? 'is-out' : ''}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`${text.title} — case study`}
    >
      <article ref={panelRef} className="cs__panel" onClick={(e) => e.stopPropagation()}>
        <button className="cs__close" onClick={close} aria-label="Cerrar" data-cursor="link">
          <span className="cs__close-lbl">Close</span>
          <X size={18} strokeWidth={1.6} />
        </button>

        <div className="cs__scroll" data-lenis-prevent>
          <header className="cs__head">
            <span className="cs__catrow">
              <span className="meta cs__cat">
                {num} — {project.category}
              </span>
              {project.wip ? (
                <span className="cs__wip">{labels.wip}</span>
              ) : (
                <span className="cs__wip cs__wip--live">{labels.live}</span>
              )}
            </span>
            <h2 className="cs__title display-2">{text.title}</h2>
            <p className="cs__sub">{text.desc}</p>
            <div className="cs__facts">
              <div>
                <span className="meta">{labels.facts.year}</span>
                <span className="cs__fact">{project.year}</span>
              </div>
              <div>
                <span className="meta">{labels.facts.role}</span>
                <span className="cs__fact">{text.role}</span>
              </div>
              <div className="cs__facts-stack">
                <span className="meta">{labels.facts.stack}</span>
                <span className="cs__fact">{project.stack.join(' · ')}</span>
              </div>
            </div>
          </header>

          {project.device === 'phone' && project.images.length ? (
            <PhoneShowcase
              images={project.images}
              screens={project.screens}
              accent={project.accent}
              title={text.title}
              labels={{
                screen: labels.screen,
                prev: labels.prevScreen,
                next: labels.nextScreen,
                hint: labels.zoomHint,
              }}
            />
          ) : (
            <div
              className={`cs__preview ${project.images.length ? 'cs__preview--shot' : ''}`}
              style={{ '--accent': project.accent } as React.CSSProperties}
            >
              {/* The oversized ghost number only reads on the placeholder card;
                  a real screenshot fills the slab and hides it, so skip it there. */}
              {!project.images.length && (
                <span className="cs__preview-ghost display">{num}</span>
              )}
              <div className="cs__preview-bar">
                <i /><i /><i />
                <em className="meta">luis-soto / {project.title.toLowerCase().replace(/\s+/g, '-')}</em>
              </div>
              {project.images.length ? (
                <SlabShot
                  images={project.images}
                  screens={project.screens}
                  accent={project.accent}
                  title={text.title}
                  unit={labels.image}
                  hint={labels.zoomHint}
                  prev={labels.prevScreen}
                  next={labels.nextScreen}
                />
              ) : (
                <div className="cs__preview-body">
                  <span className="cs__preview-head" />
                  <span className="cs__preview-line" />
                  <span className="cs__preview-line short" />
                  <div className="cs__preview-grid">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="cs__story">
            {blocks.map((b) => (
              <section key={b.n} className="cs__chapter" data-reveal>
                <span className="cs__chapter-n" aria-hidden>{b.n}</span>
                <div className="cs__chapter-body">
                  <span className="meta cs__chapter-k">{b.k}</span>
                  <p className="cs__chapter-v">{b.v}</p>
                </div>
              </section>
            ))}

            <section className="cs__chapter cs__chapter--feats" data-reveal>
              <span className="cs__chapter-n" aria-hidden>04</span>
              <div className="cs__chapter-body">
                <span className="meta cs__chapter-k">{labels.blocks.features}</span>
                <ul className="cs__feats">
                  {text.features.map((f, i) => (
                    <li key={f} className="cs__feat" style={{ '--i': i } as React.CSSProperties}>
                      <span className="cs__feat-b" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="cs__chapter cs__chapter--stack" data-reveal>
              <span className="cs__chapter-n" aria-hidden>05</span>
              <div className="cs__chapter-body">
                <span className="meta cs__chapter-k">{labels.facts.stack}</span>
                <ul className="cs__stackrow">
                  {project.stack.map((s, i) => (
                    <li key={s} className="cs__stackitem" style={{ '--i': i } as React.CSSProperties}>
                      <span className="cs__stackitem-n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="cs__stackitem-t">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="cs__chapter" data-reveal>
              <span className="cs__chapter-n" aria-hidden>06</span>
              <div className="cs__chapter-body">
                <span className="meta cs__chapter-k">{labels.blocks.learnings}</span>
                <p className="cs__chapter-v">{text.learnings}</p>
              </div>
            </section>

            <section className="cs__chapter cs__chapter--evid" data-reveal>
              <span className="cs__chapter-n" aria-hidden>07</span>
              <div className="cs__chapter-body">
                <span className="meta cs__chapter-k">{labels.blocks.evidence}</span>
                <p className="cs__chapter-v">{labels.evidenceShots}</p>
                {(project.repo || project.demo) && (
                  <div className="cs__links">
                    {project.demo && (
                      <a
                        className="cs__link"
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                      >
                        <ExternalLink size={16} strokeWidth={1.6} aria-hidden />
                        {labels.viewDemo}
                      </a>
                    )}
                    {project.repo && (
                      <a
                        className="cs__link"
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                      >
                        <Github size={16} strokeWidth={1.6} aria-hidden />
                        {labels.viewRepo}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <a href="#contact" className="cs__cta" onClick={goContact} data-cursor="link">
            {labels.caseCta} <span aria-hidden>→</span>
          </a>
        </div>
      </article>
    </div>
  )
}
