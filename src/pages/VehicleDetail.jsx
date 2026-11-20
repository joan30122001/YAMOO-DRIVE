import { ArrowLeft, ArrowRight, Check, ChevronRight, Cog, MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import FeaturePanel from '../components/home/FeaturePanel.jsx'
import Button from '../components/ui/Button.jsx'
import Notice from '../components/ui/Notice.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import agencyConfig from '../data/agency.config.js'
import copy from '../data/copy.js'
import seo from '../data/seo.js'
import { getVehicleBySlug } from '../data/vehicleRepository.js'
import { buildWhatsAppUrl } from '../utils/booking.js'
import { formatPrice } from '../utils/format.js'
import VehicleNotFound from './VehicleNotFound.jsx'

// Conditions de location : l'agence n'a rien fourni. Chaque ligne reste « à compléter » tant que ce n'est pas vérifié.
const CONDITIONS = ['Caution', 'Kilométrage inclus', 'Carburant', 'Permis et âge minimum', 'Conditions d’annulation']

export default function VehicleDetail() {
  const { slug } = useParams()
  const vehicle = getVehicleBySlug(slug)
  const [active, setActive] = useState(0)

  if (!vehicle) return <VehicleNotFound />

  const name = `${vehicle.brand} ${vehicle.model}`
  const price = formatPrice(vehicle.dailyRateXAF)
  const supplement = formatPrice(vehicle.driverSupplementXAF)
  const gallery = vehicle.images.gallery
  const whatsappUrl = buildWhatsAppUrl(agencyConfig.whatsappNumber, `Bonjour, je m’intéresse au véhicule ${name}. Pouvez-vous me renseigner ?`)

  const tabs = [
    {
      id: 'description',
      label: 'Description',
      content: (
        <div className="space-y-6">
          <p className="max-w-prose text-body-md text-silver">
            {name} — catégorie {vehicle.category}, {vehicle.seats} {vehicle.seats > 1 ? 'places' : 'place'}, transmission{' '}
            {vehicle.transmission.toLowerCase()}.
            {vehicle.services.withDriver && vehicle.services.selfDrive ? ' Disponible avec ou sans chauffeur, selon votre demande.' : ''}
          </p>
          <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-body-sm">
            {Object.entries(vehicle.specs).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-silver">{key}</dt>
                <dd className="text-ivory">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
    {
      id: 'equipements',
      label: 'Équipements',
      content: (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vehicle.equipment.map((item) => (
            <li key={item} className="flex items-center gap-3 text-body-md text-ivory">
              <Check aria-hidden="true" className="size-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'conditions',
      label: 'Conditions',
      content: (
        <div className="space-y-5">
          <ul className="divide-y divide-line rounded-card border border-line">
            {CONDITIONS.map((label) => (
              <li key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-body-sm">
                <span className="text-silver">{label}</span>
                <span className="text-ivory italic">{copy.toComplete}</span>
              </li>
            ))}
            {vehicle.services.withDriver && supplement && (
              <li className="flex items-center justify-between gap-4 px-4 py-3 text-body-sm">
                <span className="text-silver">Supplément chauffeur</span>
                <span className="text-ivory">{supplement} / jour</span>
              </li>
            )}
          </ul>
          <Notice>Le prix final et les conditions de location sont communiqués par l’agence avant toute réservation.</Notice>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageMeta title={name} description={`${name} : caractéristiques, équipements et conditions de location. ${seo.vehicle.description}`} />

      <section
        aria-roledescription="carrousel"
        aria-label={`Présentation de ${name}`}
        className="relative isolate -mt-20 overflow-hidden bg-black pt-24 pb-10 md:-mt-24 md:pt-28 md:pb-14"
      >
        <img
          key={gallery[active]}
          src={gallery[active]}
          alt=""
          aria-hidden="true"
          width="1200"
          height="675"
          decoding="async"
          className="absolute inset-0 -z-20 size-full scale-110 object-cover blur-2xl brightness-[0.7]"
        />
      <nav aria-label="Fil d’Ariane" className="relative mx-4 md:mx-[4.9vw]">
        <ol className="flex flex-wrap items-center gap-1 text-[0.6875rem] tracking-[0.1em] text-ivory/70 uppercase">
          <li>
            <Link to="/" className="inline-flex min-h-11 items-center hover:text-gold">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
          <li>
            <Link to="/vehicules" className="inline-flex min-h-11 items-center hover:text-gold">
              Véhicules
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
          <li aria-current="page" className="text-gold">
            {name}
          </li>
        </ol>
      </nav>
        <div className="relative isolate mx-4 flex h-[calc(100svh-13rem)] min-h-[26rem] items-end overflow-hidden bg-black md:mx-[4.9vw]">
          {gallery.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={index === active ? `${name} (vue ${index + 1} sur ${gallery.length})` : ''}
              aria-hidden={index === active ? undefined : 'true'}
              width="1200"
              height="675"
              fetchPriority={index === 0 ? 'high' : undefined}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`absolute inset-0 -z-20 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${index === active ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-6 md:px-10">
            <div className="flex items-center gap-4 bg-black/70 px-3 py-2 text-label tracking-[0.15em] text-ivory">
              <span aria-live="polite">
                {active + 1} / {gallery.length}
              </span>
              <span aria-hidden="true" className="relative block h-px w-24 bg-line md:w-48">
                <span className="absolute inset-y-0 left-0 bg-ivory transition-all duration-500" style={{ width: `${((active + 1) / gallery.length) * 100}%` }} />
              </span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => setActive((i) => (i - 1 + gallery.length) % gallery.length)} aria-label="Vue précédente" className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold">
                <ArrowLeft aria-hidden="true" className="size-5" />
              </button>
              <button type="button" onClick={() => setActive((i) => (i + 1) % gallery.length)} aria-label="Vue suivante" className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold">
                <ArrowRight aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>

          <div className="w-full px-6 pb-8 md:px-10 md:pb-10">
            <p className="text-[0.6875rem] tracking-[0.15em] text-gold uppercase">{vehicle.category}</p>
            <h1 className="mt-2 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-tight font-light text-ivory">{name}</h1>
            <p className="mt-3">
              {price ? (
                <>
                  <span className="font-display text-[1.25rem] font-light text-ivory">{price}</span>
                  <span className="text-body-sm text-ivory/70"> / jour</span>
                </>
              ) : (
                <span className="text-body-sm text-ivory/70">Tarif {copy.toComplete}</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="bg-surface">
      <div className="mx-auto grid max-w-[1900px] grid-cols-[minmax(0,1fr)] gap-12 px-4 py-16 md:px-[4.9vw] lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <Tabs label={`Informations sur ${name}`} tabs={tabs} />
        </div>

        <aside aria-label="Réserver ce véhicule" className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-surface-panel p-8">
            <p className="font-display text-[1.375rem] font-light text-ivory">{price || `Tarif ${copy.toComplete}`}</p>
            <p className="text-body-sm text-ivory/70">par jour · estimation, non contractuelle</p>
            <ul className="mt-6 space-y-2 text-body-sm text-ivory/80">
              <li className="flex items-center gap-3">
                <Users aria-hidden="true" className="size-4 text-gold" />
                {vehicle.seats} {vehicle.seats > 1 ? 'places' : 'place'}
              </li>
              <li className="flex items-center gap-3">
                <Cog aria-hidden="true" className="size-4 text-gold" />
                {vehicle.transmission}
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Button to={`/reservation?vehicule=${encodeURIComponent(vehicle.slug)}`}>Réserver ce véhicule</Button>
              <Button
                variant="ghost"
                href={whatsappUrl ?? undefined}
                target="_blank"
                disabled={!whatsappUrl}
                iconStart={<MessageCircle aria-hidden="true" className="size-4" />}
              >
                {whatsappUrl ? 'Demander par WhatsApp' : `WhatsApp (${copy.toComplete})`}
              </Button>
            </div>
            <p className="mt-6 text-body-sm text-ivory/70">{copy.booking.notConfirmed}.</p>
          </div>
          <p className="mt-4 text-body-sm text-ivory/60">{copy.catalogueNotice}</p>
        </aside>
      </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-black/95 p-3 backdrop-blur-sm lg:hidden">
        <Button to={`/reservation?vehicule=${encodeURIComponent(vehicle.slug)}`} size="compact" className="flex-1">
          Réserver
        </Button>
        <Button
          variant="ghost"
          size="compact"
          className="flex-1"
          href={whatsappUrl ?? undefined}
          target="_blank"
          disabled={!whatsappUrl}
          iconStart={<MessageCircle aria-hidden="true" className="size-4" />}
        >
          {whatsappUrl ? 'WhatsApp' : 'WhatsApp (à compléter)'}
        </Button>
      </div>
      <FeaturePanel
        id="panneau-fin"
        image={gallery[gallery.length - 1]}
        label={copy.closing.vehicle.label}
        title={copy.closing.vehicle.title}
        text={copy.closing.vehicle.text}
        cta={{ label: copy.closing.vehicle.cta, to: `/reservation?vehicule=${encodeURIComponent(vehicle.slug)}` }}
        align="right"
      />
    </>
  )
}
