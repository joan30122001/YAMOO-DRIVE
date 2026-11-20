import { Copy, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/ui/Button.jsx'
import ContactLink from '../components/ui/ContactLink.jsx'
import Field from '../components/ui/Field.jsx'
import FeaturePanel from '../components/home/FeaturePanel.jsx'
import { LINE_FIELDS } from '../components/ui/lineFields.js'
import PageHero from '../components/ui/PageHero.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import agencyConfig from '../data/agency.config.js'
import copy from '../data/copy.js'
import seo from '../data/seo.js'
import { buildWhatsAppUrl } from '../utils/booking.js'
import SocialIcon from '../components/ui/SocialIcon.jsx'
import { buildContactHref, hasValue } from '../utils/contact.js'
import { buildContactMessage, buildMailtoUrl, SUBJECTS, validateContactForm } from '../utils/contactForm.js'

const FIELD_ORDER = ['fullName', 'email', 'subject', 'message']
const SOCIALS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
]

function Item({ icon: Icon, title, children }) {
  return (
    <li className="flex items-start gap-4">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center text-gold">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-body-sm text-silver">{title}</p>
        {children}
      </div>
    </li>
  )
}

export default function Contact() {
  const [values, setValues] = useState({ fullName: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    setResult(null)
  }

  function onSubmit(event) {
    event.preventDefault()
    const found = validateContactForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(`contact-${FIELD_ORDER.find((k) => found[k])}`)?.focus()
      setResult(null)
      return
    }
    const message = buildContactMessage(values)
    setResult({
      message,
      whatsapp: buildWhatsAppUrl(agencyConfig.whatsappNumber, message),
      mailto: buildMailtoUrl(agencyConfig.email, values.subject, message),
    })
    setCopied(false)
    requestAnimationFrame(() => document.getElementById('contact-result')?.focus())
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(result.message)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const socials = SOCIALS.filter(({ key }) => hasValue(agencyConfig.socials[key]))

  return (
    <>
      <PageMeta title={seo.contact.title} description={seo.contact.description} />
      <PageHero
        title="Contactez-nous"
        accent="nous"
        intro="Une question, un besoin spécifique ou une demande de location ? Écrivez à l’agence : le message est préparé ici, puis envoyé depuis WhatsApp ou votre messagerie."
        image="/vehicles/jetour-dashing-lg.webp"
      />

      <div className="bg-surface">
      <div className={`mx-auto grid max-w-[1900px] grid-cols-[minmax(0,1fr)] gap-10 px-4 py-16 md:px-[4.9vw] lg:grid-cols-[24rem_minmax(0,1fr)] ${LINE_FIELDS}`}>
        <section aria-labelledby="coordonnees" className="bg-surface-panel p-6 md:p-10">
          <h2 id="coordonnees" className="font-display text-[1.375rem] font-light text-ivory">
            Coordonnées
          </h2>
          <ul className="mt-6 space-y-6">
            <Item icon={Phone} title="Téléphone">
              <ContactLink kind="phone" value={agencyConfig.phone} label={agencyConfig.phone || 'Téléphone'} />
            </Item>
            <Item icon={MessageCircle} title="WhatsApp">
              <ContactLink kind="whatsapp" value={agencyConfig.whatsappNumber} label="Discuter avec l’agence" />
            </Item>
            <Item icon={Mail} title="E-mail">
              <ContactLink kind="email" value={agencyConfig.email} label={agencyConfig.email || 'E-mail'} />
            </Item>
            <Item icon={MapPin} title="Adresse">
              <p className="min-h-11 py-2 text-ivory">
                {hasValue(agencyConfig.address) ? agencyConfig.address : <span className="text-silver italic">({copy.toComplete})</span>}
              </p>
            </Item>
          </ul>
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="text-body-sm text-silver">Suivez-nous</h3>
            {socials.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-x-2">
                {socials.map(({ key, label }) => (
                  <li key={key}>
                    <a
                      href={buildContactHref('url', agencyConfig.socials[key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center text-ivory transition-colors hover:text-gold"
                    >
                      <SocialIcon name={key} className="size-5" />
                      <span className="sr-only"> {copy.opensNewTab}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-body-sm text-silver italic">Réseaux sociaux ({copy.toComplete})</p>
            )}
          </div>
        </section>

        <section aria-labelledby="formulaire">
          <form onSubmit={onSubmit} noValidate className="bg-surface-panel p-6 md:p-10">
            <h2 id="formulaire" className="font-display text-[1.375rem] font-light text-ivory">
              Envoyez-nous un message
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field id="contact-fullName" label="Nom complet" required autoComplete="name" placeholder="Ex. : Jean Kouam" value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
              <Field id="contact-email" type="email" label="E-mail" required autoComplete="email" placeholder="Ex. : jean@mail.com" value={values.email} onChange={set('email')} error={errors.email} />
              <Field id="contact-subject" as="select" label="Objet" required value={values.subject} onChange={set('subject')} error={errors.subject} className="sm:col-span-2">
                <option value="">Sélectionnez un objet</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </Field>
              <Field id="contact-message" as="textarea" label="Message" required placeholder="Votre message…" value={values.message} onChange={set('message')} error={errors.message} className="sm:col-span-2" />
            </div>
            <Button type="submit" className="mt-6 w-full sm:w-auto" iconStart={<Send aria-hidden="true" className="size-4" />}>
              Préparer le message
            </Button>
          </form>

          {result && (
            <div id="contact-result" tabIndex={-1} className="mt-6 bg-surface-panel p-6 outline-none md:p-10">
              <h3 className="font-display text-[1.375rem] font-light text-gold">{copy.contact.prepared}</h3>
              <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-field p-4 font-body text-body-sm whitespace-pre-wrap text-ivory">{result.message}</pre>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button href={result.whatsapp ?? undefined} target="_blank" disabled={!result.whatsapp} iconStart={<MessageCircle aria-hidden="true" className="size-4" />}>
                  {result.whatsapp ? 'Envoyer sur WhatsApp' : `WhatsApp (${copy.toComplete})`}
                </Button>
                <Button variant="outline" href={result.mailto ?? undefined} disabled={!result.mailto} iconStart={<Mail aria-hidden="true" className="size-4" />}>
                  {result.mailto ? 'Envoyer par e-mail' : `E-mail (${copy.toComplete})`}
                </Button>
                <Button variant="whatsapp" onClick={copyMessage} iconStart={<Copy aria-hidden="true" className="size-4" />}>
                  Copier le message
                </Button>
                <span role="status" className="text-body-sm text-silver">
                  {copied ? 'Message copié.' : ''}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
      </div>
      <FeaturePanel
        id="panneau-fin"
        image="/vehicles/jmc-grand-avenue-lg.webp"
        label={copy.closing.contact.label}
        title={copy.closing.contact.title}
        text={copy.closing.contact.text}
        cta={{ label: copy.closing.contact.cta, to: '/reservation' }}
        align="right"
      />
    </>
  )
}
