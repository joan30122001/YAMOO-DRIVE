import { Copy, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import FeaturePanel from '../components/home/FeaturePanel.jsx'
import Notice from '../components/ui/Notice.jsx'
import { LINE_FIELDS } from '../components/ui/lineFields.js'
import PageHero from '../components/ui/PageHero.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import agencyConfig from '../data/agency.config.js'
import copy from '../data/copy.js'
import seo from '../data/seo.js'
import { getVehicleBySlug, getVehicles } from '../data/vehicleRepository.js'
import { buildBookingMessage, buildWhatsAppUrl, computeQuote, nowInDouala, validateBooking } from '../utils/booking.js'
import { formatPrice } from '../utils/format.js'

// Les dates venant de la recherche rapide (AAAA-MM-JJ) deviennent des dates-heures de départ et de retour à 09 h.
const toDateTime = (day) => (/^\d{4}-\d{2}-\d{2}$/.test(day ?? '') ? `${day}T09:00` : '')

const FIELD_ORDER = ['vehicle', 'city', 'start', 'end', 'withDriver', 'fullName', 'phone']

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-body-sm text-silver">{label}</dt>
      <dd className={strong ? 'font-display text-price font-medium text-gold' : 'text-body-md text-ivory'}>{value}</dd>
    </div>
  )
}

export default function Booking() {
  const [params] = useSearchParams()
  const vehicles = useMemo(() => getVehicles(), [])
  const cities = agencyConfig.cities

  const [values, setValues] = useState(() => ({
    slug: getVehicleBySlug(params.get('vehicule')) ? params.get('vehicule') : '',
    city: cities.includes(params.get('ville')) ? params.get('ville') : (cities[0] ?? ''),
    start: toDateTime(params.get('du')),
    end: toDateTime(params.get('au')),
    withDriver: false,
    fullName: '',
    phone: '',
    notes: '',
  }))
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const vehicle = getVehicleBySlug(values.slug)
  const quote = computeQuote(vehicle, values)
  const set = (key) => (event) => {
    const value = event.target.type === 'radio' ? event.target.value === 'true' : event.target.value
    setValues((current) => ({ ...current, [key]: value }))
    setResult(null)
  }

  function onSubmit(event) {
    event.preventDefault()
    const found = validateBooking({ ...values, vehicle }, { cities })
    setErrors(found)
    if (Object.keys(found).length > 0) {
      const first = FIELD_ORDER.find((key) => found[key])
      document.getElementById(`booking-${first}`)?.focus()
      setResult(null)
      return
    }
    const message = buildBookingMessage({ ...values, vehicle }, quote)
    setResult({ message, url: buildWhatsAppUrl(agencyConfig.whatsappNumber, message) })
    setCopied(false)
    requestAnimationFrame(() => document.getElementById('booking-result')?.focus())
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(result.message)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const minDate = nowInDouala()
  const driverOk = vehicle ? vehicle.services.withDriver : true
  const selfOk = vehicle ? vehicle.services.selfDrive : true

  return (
    <>
      <PageMeta title={seo.booking.title} description={seo.booking.description} />
      <PageHero title="Demande de réservation" accent="réservation" intro="Remplissez le formulaire : votre demande est préparée ici, puis envoyée à l’agence sur WhatsApp." image="/vehicles/jetour-x90-plus-lg.webp" />

      <div className="bg-surface">
      <form onSubmit={onSubmit} noValidate className={`mx-auto grid max-w-[1900px] grid-cols-[minmax(0,1fr)] gap-10 px-4 py-16 md:px-[4.9vw] lg:grid-cols-[minmax(0,1fr)_24rem] ${LINE_FIELDS}`}>
        <div className="space-y-8">
          <fieldset className="bg-surface-panel p-6 md:p-10">
            <legend className="float-left mb-8 w-full font-display text-[1.375rem] font-light text-ivory">Votre véhicule</legend>
            <div className="clear-both grid gap-6 sm:grid-cols-2">
              <Field
                id="booking-vehicle"
                as="select"
                label="Véhicule"
                required
                value={values.slug}
                onChange={set('slug')}
                error={errors.vehicle}
                className="sm:col-span-2"
              >
                <option value="">Choisir un véhicule</option>
                {vehicles.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.brand} {v.model}
                    {formatPrice(v.dailyRateXAF) ? ` — ${formatPrice(v.dailyRateXAF)} / jour` : ''}
                  </option>
                ))}
              </Field>
              <Field id="booking-city" as="select" label="Ville de prise en charge" required value={values.city} onChange={set('city')} error={errors.city}>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Field>
              <fieldset aria-describedby={errors.withDriver ? 'booking-driver-error' : undefined}>
                <legend className="mb-1 text-body-sm text-ivory">Location</legend>
                <div className="flex flex-wrap gap-x-6">
                  {[
                    { value: false, label: 'Sans chauffeur', ok: selfOk },
                    { value: true, label: 'Avec chauffeur', ok: driverOk },
                  ].map(({ value, label, ok }) => (
                    <label key={label} className={`flex min-h-11 items-center gap-3 text-body-md ${ok ? 'cursor-pointer text-ivory' : 'cursor-not-allowed text-silver'}`}>
                      <input
                        id={value ? 'booking-withDriver' : undefined}
                        type="radio"
                        name="chauffeur"
                        value={String(value)}
                        checked={values.withDriver === value}
                        disabled={!ok}
                        onChange={set('withDriver')}
                        className="size-5 accent-gold"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.withDriver && (
                  <p id="booking-driver-error" role="alert" className="text-body-sm text-ivory">
                    {errors.withDriver}
                  </p>
                )}
              </fieldset>
              <Field
                id="booking-start"
                type="datetime-local"
                label="Départ"
                required
                min={minDate}
                value={values.start}
                onChange={set('start')}
                error={errors.start}
              />
              <Field
                id="booking-end"
                type="datetime-local"
                label="Retour"
                required
                min={values.start || minDate}
                value={values.end}
                onChange={set('end')}
                error={errors.end}
              />
            </div>
          </fieldset>

          <fieldset className="bg-surface-panel p-6 md:p-10">
            <legend className="float-left mb-8 w-full font-display text-[1.375rem] font-light text-ivory">Vos informations</legend>
            <div className="clear-both grid gap-6 sm:grid-cols-2">
              <Field id="booking-fullName" label="Nom complet" required autoComplete="name" placeholder="Ex. : Jean Kouam" value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
              <Field
                id="booking-phone"
                type="tel"
                label="Numéro de téléphone"
                required
                autoComplete="tel"
                placeholder="Ex. : 6 99 00 00 00"
                value={values.phone}
                onChange={set('phone')}
                error={errors.phone}
              />
              <Field
                id="booking-notes"
                as="textarea"
                label="Instructions supplémentaires (facultatif)"
                placeholder="Ex. : siège enfant, lieu de livraison…"
                value={values.notes}
                onChange={set('notes')}
                className="sm:col-span-2"
              />
            </div>
          </fieldset>
        </div>

        <aside aria-label="Récapitulatif" className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden bg-surface-panel">
            {vehicle && (
              <img src={vehicle.images.main} alt={`${vehicle.brand} ${vehicle.model}`} width="800" height="450" className="aspect-video w-full object-cover" />
            )}
            <div className="space-y-5 p-6">
              <h2 className="font-display text-[1.375rem] font-light text-ivory">{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Récapitulatif'}</h2>
              {vehicle ? (
                <dl className="space-y-3">
                  <Row label="Tarif journalier" value={formatPrice(vehicle.dailyRateXAF) || copy.toComplete} />
                  <Row label="Durée" value={quote ? `${quote.days} ${quote.days > 1 ? 'jours' : 'jour'}` : '—'} />
                  {quote && quote.driver > 0 && <Row label="Chauffeur" value={formatPrice(quote.driver)} />}
                  <div className="border-t border-line pt-3">
                    <Row label="Montant estimé" value={quote ? formatPrice(quote.total) : '—'} strong />
                  </div>
                </dl>
              ) : (
                <p className="text-body-sm text-silver">Choisissez un véhicule pour voir l’estimation.</p>
              )}
              <p className="text-body-sm text-silver">{copy.booking.estimateNote}.</p>
              <Notice>{copy.booking.notConfirmed}.</Notice>
              <Button type="submit" className="w-full" iconStart={<MessageCircle aria-hidden="true" className="size-4" />}>
                Préparer ma demande
              </Button>
            </div>
          </div>
        </aside>
      </form>

      {result && (
        <section id="booking-result" tabIndex={-1} aria-labelledby="resultat" className="mx-auto mb-20 max-w-[1900px] px-4 outline-none md:px-[4.9vw]">
          <div className="bg-surface-panel p-6 md:p-10">
            <h2 id="resultat" className="font-display text-[1.375rem] font-light text-gold">
              {copy.booking.prepared}
            </h2>
            <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-field p-4 font-body text-body-sm whitespace-pre-wrap text-ivory">{result.message}</pre>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                href={result.url ?? undefined}
                target="_blank"
                disabled={!result.url}
                iconStart={<MessageCircle aria-hidden="true" className="size-4" />}
              >
                {result.url ? 'Envoyer sur WhatsApp' : `Envoyer sur WhatsApp (${copy.booking.numberMissing.toLowerCase()})`}
              </Button>
              <Button variant="outline" onClick={copyMessage} iconStart={<Copy aria-hidden="true" className="size-4" />}>
                Copier le message
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setResult(null)
                  document.getElementById('booking-vehicle')?.focus()
                }}
              >
                Modifier ma demande
              </Button>
              <span role="status" className="text-body-sm text-silver">
                {copied ? 'Message copié.' : ''}
              </span>
            </div>
            {!result.url && <p className="mt-4 text-body-sm text-silver">{copy.booking.numberMissing} : copiez le message et envoyez-le à l’agence.</p>}
          </div>
        </section>
      )}
      </div>
      <FeaturePanel
        id="panneau-fin"
        image="/vehicles/jetour-x90-plus-lg.webp"
        label={copy.closing.booking.label}
        title={copy.closing.booking.title}
        text={copy.closing.booking.text}
        cta={{ label: copy.closing.booking.cta, to: '/contact' }}
        align="left"
      />
    </>
  )
}
