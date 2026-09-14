import { useState, useEffect } from 'react'
import { Reveal, MaskLine } from './Reveal'
import { Github, Linkedin, Mail, MessageCircle, Check } from 'lucide-react'
import { track, notify } from '../lib/track'
import { ParticleField } from './ParticleField'
import { Magnetic } from './Magnetic'
import { useT } from '../i18n/i18n'
import './Contact.css'

const EMAIL = 'luiseduardosotoguti@gmail.com'

// Web3Forms access key — safe to expose in the client (it is tied to the
// destination email and protected against abuse on Web3Forms' side).
// Get one free at https://web3forms.com and paste it here.
const WEB3FORMS_KEY = '60b69fa9-93e6-46d1-a102-20af214f3227'

type Errors = Partial<Record<'name' | 'email' | 'message', boolean>>
type Status = 'idle' | 'sending' | 'sent' | 'error'

function ContactForm() {
  const t = useT()
  const f = t.contact.form
  const types = t.contact.types
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<string>(types[0])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = true
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = true
    if (message.trim().length < 8) e.message = true
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (status === 'sending') return
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setStatus('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          // sender + reply-to so you can answer straight from your inbox
          from_name: name,
          replyto: email,
          subject: `Nuevo contacto — ${type} · ${name}`,
          // clean, ordered, Spanish-labelled fields
          Nombre: name,
          Correo: email,
          'Tipo de proyecto': type,
          Mensaje: message,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('sent')
        notify('contact_submit')
        setName('')
        setEmail('')
        setMessage('')
        setType(types[0])
        setTimeout(() => setStatus('idle'), 6000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form className="cform" onSubmit={submit} noValidate>
      <div className="cform__grid">
        <Field id="name" label={f.name} value={name} onChange={setName} error={errors.name} errorMsg={f.errName} maxLength={60} />
        <Field
          id="email"
          label={f.email}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          errorMsg={f.errEmail}
          maxLength={120}
        />
      </div>

      <div className="cform__field cform__field--type">
        <span className="cform__label cform__label--static">{f.projectType}</span>
        <div className="cform__types">
          {types.map((ty) => (
            <button
              type="button"
              key={ty}
              className={`cform__chip ${type === ty ? 'is-on' : ''}`}
              onClick={() => setType(ty)}
              data-cursor="link"
            >
              {ty}
            </button>
          ))}
        </div>
      </div>

      <div className={`cform__field ${errors.message ? 'has-error' : ''}`}>
        <textarea
          id="message"
          className="cform__input cform__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={800}
          placeholder=" "
        />
        <label htmlFor="message" className="cform__label">
          {f.message}
        </label>
        <span className="cform__underline" />
        {errors.message && <span className="cform__err">{f.errMsg}</span>}
        <span className="cform__count meta" aria-hidden>
          {message.length} / 800
        </span>
      </div>

      <div className="cform__foot">
        <Magnetic strength={8}>
          <button
            type="submit"
            className={`cform__submit ${status === 'sent' ? 'is-sent' : ''}`}
            data-cursor="link"
            disabled={status === 'sending'}
          >
            {status === 'sent' ? (
              <>
                <Check size={16} strokeWidth={2} /> {f.sent}
              </>
            ) : status === 'sending' ? (
              <>
                <span className="cform__spinner" aria-hidden /> {f.sending}
              </>
            ) : (
              <>
                {f.submit} <span aria-hidden>→</span>
              </>
            )}
          </button>
        </Magnetic>
        <span
          className={`meta cform__note ${status === 'sent' ? 'is-ok' : ''} ${status === 'error' ? 'is-err' : ''}`}
          role={status === 'error' ? 'alert' : undefined}
        >
          {status === 'sent' ? f.sent : status === 'error' ? f.error : f.note}
        </span>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  errorMsg,
  maxLength,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  error?: boolean
  errorMsg?: string
  maxLength?: number
}) {
  return (
    <div className={`cform__field ${error ? 'has-error' : ''}`}>
      <input
        id={id}
        type={type}
        className="cform__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        maxLength={maxLength}
        autoComplete={id === 'email' ? 'email' : id === 'name' ? 'name' : 'off'}
      />
      <label htmlFor={id} className="cform__label">
        {label}
      </label>
      <span className="cform__underline" />
      {error && <span className="cform__err">{errorMsg}</span>}
      {maxLength && (
        <span className="cform__count meta" aria-hidden>
          {value.length} / {maxLength}
        </span>
      )}
    </div>
  )
}

export function Contact() {
  const t = useT()
  // The starfield here is purely decorative and the hero already showcases one.
  // On touch devices a second full-height canvas (≈375×1760 filled every frame)
  // spikes GPU/memory enough that mobile Chrome can discard + reload the tab when
  // you scroll into this section — so skip it entirely on touch.
  const [showViz, setShowViz] = useState(true)
  useEffect(() => {
    setShowViz(!window.matchMedia('(pointer: coarse)').matches)
  }, [])
  const channels = [
    { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: MessageCircle, label: 'WhatsApp', value: t.contact.whatsapp, href: 'https://wa.me/56988823245' },
    { icon: Linkedin, label: 'LinkedIn', value: '/luis-eduardo-soto', href: 'https://www.linkedin.com/in/luis-eduardo-soto-guti%C3%A9rrez-99a53a256' },
    { icon: Github, label: 'GitHub', value: '@Luisesg1', href: 'https://github.com/Luisesg1' },
  ]

  return (
    <section id="contact" className="section contact">
      {showViz && (
        <div className="contact__viz" aria-hidden>
          <ParticleField className="contact__canvas" density={0.5} interactive={false} />
        </div>
      )}
      <div className="shell">
        <Reveal>
          <span className="tag">{t.contact.tag}</span>
        </Reveal>

        <h2 className="display contact__title">
          <MaskLine>{t.contact.t1}</MaskLine>
          <MaskLine delay={0.08}>
            <span className="c-violet">{t.contact.t2}</span>
          </MaskLine>
          <MaskLine delay={0.16}>{t.contact.t3}</MaskLine>
        </h2>

        <div className="contact__lead-row">
          <Reveal delay={0.1} className="contact__leadwrap">
            <p className="lead contact__lead">{t.contact.lead}</p>
            <span className="contact__sign">
              <span className="contact__sign-name">{t.footer.fullName}</span>
              <span className="meta contact__sign-role">{t.footer.role}</span>
            </span>
            <span className="contact__cvwrap">
              <a
                href="/Luis-Eduardo-Soto-Gutierrez-CV.pdf"
                download="Luis-Eduardo-Soto-Gutierrez-CV.pdf"
                className="contact__cv"
                data-cursor="link"
                onClick={() => notify('cv_download')}
              >
                <span className="contact__cv-label">{t.contact.cv}</span>
                <span className="contact__cv-arrow" aria-hidden>↓</span>
              </a>
              <span className="meta contact__cv-note" aria-hidden>{t.contact.cvMeta}</span>
            </span>
          </Reveal>
          <Reveal delay={0.16} className="contact__availtag">
            <span className="contact__availdot" />
            {t.contact.available}
          </Reveal>
        </div>

        <div className="contact__body">
          <Reveal className="contact__formwrap" y={40}>
            <ContactForm />
          </Reveal>

          {/* One Reveal wraps the whole framed box — revealing each channel
              individually let the last row's transform (+ will-change layer)
              escape the box, leaving the bottom border open. */}
          <Reveal className="contact__channels" as="div">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="chan"
                data-cursor="link"
                onClick={() =>
                  c.label === 'WhatsApp'
                    ? notify('whatsapp_click')
                    : track('social_click', { network: c.label })
                }
              >
                <c.icon size={18} strokeWidth={1.6} className="chan__icon" />
                <span className="chan__label meta">{c.label}</span>
                <span className="chan__value">{c.value}</span>
                <span className="chan__arrow" aria-hidden>↗</span>
              </a>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
