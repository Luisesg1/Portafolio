import { motion, useScroll, useTransform, useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { Github } from 'lucide-react'
import { lazy, Suspense, useRef, useState } from 'react'
import { Reveal, MaskLine } from './Reveal'
import { OutlineText } from './OutlineText'
import { projects } from '../data/content'
import { useT } from '../i18n/i18n'
import { notify } from '../lib/track'

// The case-study modal (with the phone showcase + image viewer) is heavy and
// only opens on click — load its chunk on demand to keep the initial bundle lean.
const CaseStudy = lazy(() => import('./CaseStudy').then((m) => ({ default: m.CaseStudy })))

// Display order (indices into `projects`) — lead with the shipped, in-production
// flagship. Data arrays stay in their canonical order so dict copy stays aligned
// by index; only the rendered order and the shown number derive from this.
const ORDER = [4, 0, 1, 2, 3] as const
const displayNum = (originalIndex: number) =>
  String(ORDER.indexOf(originalIndex as (typeof ORDER)[number]) + 1).padStart(2, '0')

function Mockup({
  accent,
  n,
  image,
  title,
  device,
}: {
  accent: string
  n: string
  image?: string
  title: string
  device: 'phone' | 'browser'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const amp = reduce ? 0 : 1

  // Scroll-driven vertical drift — the screenshot and the ghost number move on
  // slightly different tracks so the composition feels layered (subtle depth).
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const shotYs = useTransform(scrollYProgress, [0, 1], [26 * amp, -26 * amp])
  const ghostYs = useTransform(scrollYProgress, [0, 1], [-34 * amp, 34 * amp])

  // Desktop-only pointer parallax — a whisper of movement, spring-smoothed.
  const pxRaw = useMotionValue(0)
  const pyRaw = useMotionValue(0)
  const px = useSpring(pxRaw, { stiffness: 120, damping: 18, mass: 0.4 })
  const py = useSpring(pyRaw, { stiffness: 120, damping: 18, mass: 0.4 })

  // Combine scroll drift + pointer parallax into single x / y tracks (a motion
  // value can only own one translateY, so the two sources are summed here).
  const shotX = useTransform(px, [-0.5, 0.5], [-10, 10])
  const shotY = useTransform([shotYs, py], ([s, p]: number[]) => s + p * 16)
  const ghostX = useTransform(px, [-0.5, 0.5], [16, -16])
  const ghostY = useTransform([ghostYs, py], ([s, p]: number[]) => s - p * 24)

  const canHover = () =>
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || !canHover()) return
    const r = e.currentTarget.getBoundingClientRect()
    pxRaw.set((e.clientX - r.left) / r.width - 0.5)
    pyRaw.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    pxRaw.set(0)
    pyRaw.set(0)
  }

  const ghost = (
    <motion.span
      className="pj__ghost display"
      style={{ color: accent, x: ghostX, y: ghostY }}
      aria-hidden
    >
      {n}
    </motion.span>
  )

  if (device === 'phone' && image) {
    return (
      <div className="pj__frame pj__frame--phone" ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}>
        <div className="pj__block" style={{ background: accent }} />
        <motion.div className="pj__phone" style={{ x: shotX, y: shotY }}>
          <img src={image} alt={title} loading="lazy" draggable={false} />
        </motion.div>
        {ghost}
      </div>
    )
  }

  return (
    <div className="pj__frame" ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="pj__block" style={{ background: accent }} />
      <motion.div className="pj__screen" style={{ x: shotX, y: shotY }}>
        <div className="pj__bar">
          <span /><span /><span />
          <em className="meta">luis-soto / project-{n}</em>
        </div>
        {image ? (
          <div className="pj__shot">
            <img src={image} alt={title} loading="lazy" draggable={false} />
          </div>
        ) : (
          <div className="pj__ui">
            <div className="pj__uihead" style={{ background: accent }} />
            <div className="pj__uirow">
              <div className="pj__uicol" />
              <div className="pj__uicol pj__uicol--wide" />
            </div>
            <div className="pj__uigrid">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="pj__uifoot" style={{ borderColor: accent }} />
          </div>
        )}
      </motion.div>
      {ghost}
    </div>
  )
}

export function Projects() {
  const t = useT()
  const [active, setActive] = useState<number | null>(null)
  const openProject = (oi: number) => {
    setActive(oi)
    notify('project_open', t.projects.items[oi].title)
  }

  return (
    <section id="work" className="section projects">
      <div className="shell">
        <div className="projects__head">
          <Reveal>
            <span className="tag">{t.projects.tag}</span>
          </Reveal>
          <h2 className="display-2 projects__title">
            <MaskLine>{t.projects.t1}</MaskLine>
            <MaskLine delay={0.06}>
              <OutlineText>{t.projects.t2}</OutlineText>
            </MaskLine>
          </h2>
        </div>

        <div className="projects__list">
          {ORDER.map((oi, pos) => {
            const p = projects[oi]
            const it = t.projects.items[oi]
            const num = String(pos + 1).padStart(2, '0')
            return (
            <article
              key={p.n}
              className={`pj ${pos % 2 ? 'pj--rev' : ''}`}
              style={{ '--accent': p.accent } as React.CSSProperties}
            >
              <Reveal className="pj__media" y={40}>
                <button
                  className="pj__open"
                  onClick={() => openProject(oi)}
                  data-cursor="view"
                  aria-label={`${t.projects.viewCase}: ${it.title}`}
                >
                  <Mockup
                    accent={p.accent}
                    n={num}
                    image={p.images[0]}
                    title={it.title}
                    device={p.device}
                  />
                </button>
              </Reveal>

              <div className="pj__info">
                <Reveal className="pj__metawrap" delay={0.04}>
                  <div className="pj__meta">
                    <span className="pj__index meta">
                      {num} <i>/</i> {p.category}
                    </span>
                    <span className="pj__year meta">{p.year}</span>
                  </div>
                  {p.wip ? (
                    <span className="pj__wip">{t.projects.wip}</span>
                  ) : (
                    <span className="pj__wip pj__wip--live">{t.projects.live}</span>
                  )}
                </Reveal>

                <Reveal delay={0.1}>
                  <h3
                    className="pj__name h2"
                    onClick={() => openProject(oi)}
                    data-cursor="view"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openProject(oi)}
                  >
                    {it.title}
                  </h3>
                </Reveal>

                <Reveal delay={0.16}>
                  <p className="pj__desc lead">{it.desc}</p>
                </Reveal>

                <Reveal delay={0.22}>
                  <ul className="pj__tech">
                    {p.tech.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </Reveal>

                <Reveal delay={0.28}>
                  <div className="pj__actions">
                    <button className="pj__cta" onClick={() => openProject(oi)} data-cursor="view">
                      <span className="pj__cta-lbl">{t.projects.viewCase}</span>
                      <span className="pj__cta-arrow" aria-hidden>→</span>
                    </button>
                    {p.repo && (
                      <a
                        className="pj__repo"
                        href={p.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                        aria-label={`${t.projects.viewRepo}: ${it.title}`}
                      >
                        <Github size={15} strokeWidth={1.6} aria-hidden />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </Reveal>
              </div>
            </article>
            )
          })}
        </div>

        <Reveal className="projects__more">
          <span className="meta">{t.projects.more}</span>
          <span className="projects__line" />
        </Reveal>
      </div>

      {active !== null && (
        <Suspense fallback={null}>
          <CaseStudy
            project={projects[active]}
            text={t.projects.items[active]}
            num={displayNum(active)}
            labels={t.projects}
            onClose={() => setActive(null)}
          />
        </Suspense>
      )}
    </section>
  )
}
