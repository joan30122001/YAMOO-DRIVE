import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import copy from '../../data/copy.js'
import { getVehicles } from '../../data/vehicleRepository.js'
import useMotionPolicy from '../../hooks/useMotionPolicy.js'
import Button from '../ui/Button.jsx'

// Véhicules présentés après la première diapositive (photos les plus larges d'abord). Si l'un d'eux n'existe plus dans
// les données, un autre véhicule du catalogue le remplace : le carrousel garde toujours 5 diapositives.
const HERO_SLUGS = ['jetour-x90-plus', 'jmc-grand-avenue', 'jmc-vigus', 'jetour-t1']
const VEHICLE_SLIDES = 4
// Délai entre deux diapositives en défilement automatique.
export const AUTOPLAY_MS = 6000

/**
 * Hero en carrousel : un panneau photo encadré sur un fond flouté de la même photo, compteur et flèches en haut,
 * barre basse (titre, texte, deux boutons). Une diapositive à la fois ; flèches au clavier et au toucher.
 * Le titre principal de la page est un <h1> masqué visuellement (la diapositive 1 l'affiche en grand) afin qu'il
 * reste présent quelle que soit la diapositive visible.
 * Défilement automatique (toutes les 6 s) : il s'arrête au survol, quand le focus est dans le carrousel, quand l'onglet est
 * masqué, quand l'utilisateur appuie sur « pause » et quand il demande moins de mouvement. Un geste manuel relance le délai.
 */
export default function HeroCarousel() {
  const slides = useMemo(() => {
    const vehicles = getVehicles()
    const first = { id: 'hero', title: copy.home.hero.title, text: copy.home.hero.text, image: '/images/hero.webp', to: '/vehicules', cta: copy.home.hero.cta, width: 1920, height: 1080 }
    const chosen = HERO_SLUGS.map((slug) => vehicles.find((v) => v.slug === slug)).filter(Boolean)
    const topUp = vehicles.filter((v) => !chosen.includes(v))
    const featured = [...chosen, ...topUp].slice(0, VEHICLE_SLIDES).map((v) => ({
      id: v.slug,
      title: `${v.brand} ${v.model}`,
      text: `${v.category}, ${v.seats} ${v.seats > 1 ? 'places' : 'place'}, boîte ${v.transmission.toLowerCase()}.`,
      image: v.images.gallery[0],
      to: `/vehicules/${v.slug}`,
      cta: copy.home.hero.discover,
      width: 1200,
      height: 675,
    }))
    return [first, ...featured]
  }, [])

  const [index, setIndex] = useState(0)
  const count = slides.length
  const go = (delta) => setIndex((current) => (current + delta + count) % count)
  const slide = slides[index]

  const { reduced } = useMotionPolicy()
  const [userPaused, setUserPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const playing = !reduced && !userPaused && !hovered && !focused && !hidden

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // `index` dans les dépendances : tout changement (automatique ou manuel) relance le délai complet.
  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [playing, index, count])

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Présentation"
      className="relative isolate -mt-20 overflow-hidden bg-black pt-28 pb-10 md:-mt-24 md:pt-32 md:pb-14"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(event) => {
        // Seul le focus clavier arrête le défilement : un clic de souris laisse le focus sur le bouton cliqué, et le
        // carrousel resterait figé jusqu'à un clic ailleurs.
        let keyboard = true
        try {
          keyboard = event.target.matches(':focus-visible')
        } catch {
          // Sélecteur non pris en charge : dans le doute, on s'arrête (comportement le plus prudent pour l'accessibilité).
        }
        if (keyboard) setFocused(true)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <h1 className="sr-only">{copy.home.hero.title}</h1>

      {/* Fond : la photo de la diapositive, floutée et assombrie. */}
      <img
        key={slide.id}
        src={slide.image}
        alt=""
        aria-hidden="true"
        width={slide.width}
        height={slide.height}
        decoding="async"
        className="absolute inset-0 -z-20 size-full scale-110 object-cover blur-2xl brightness-[0.7]"
      />

      <div className="relative mx-4 h-[calc(100svh-9rem)] min-h-[30rem] overflow-hidden bg-black md:mx-[4.9vw]">
        {slides.map((s, i) => {
          const img = (
            <img
              key={i === 0 ? undefined : s.id}
              src={s.image}
              alt=""
              aria-hidden="true"
              width={s.width}
              height={s.height}
              fetchPriority={i === 0 ? 'high' : undefined}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === index ? 'opacity-100' : 'opacity-0'}`}
            />
          )
          // Première diapositive : version allégée et recadrée en portrait sur mobile.
          return i === 0 ? (
            <picture key={s.id}>
              <source media="(max-width: 767px)" srcSet="/images/hero-mobile.webp" />
              {img}
            </picture>
          ) : (
            img
          )
        })}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-6 md:px-10">
          <div className="flex items-center gap-4 bg-black/70 px-3 py-2 text-label tracking-[0.15em] text-ivory">
            {/* Annoncé aux lecteurs d'écran seulement quand le défilement est arrêté (jamais pendant le défilement automatique). */}
            <span data-carousel-counter aria-live={playing ? 'off' : 'polite'}>
              {index + 1} / {count}
            </span>
            <span aria-hidden="true" className="relative block h-px w-32 bg-line md:w-60">
              <span className="absolute inset-y-0 left-0 bg-ivory transition-all duration-500" style={{ width: `${((index + 1) / count) * 100}%` }} />
            </span>
          </div>
          <div className="flex gap-1">
            {!reduced && (
              <button
                type="button"
                onClick={() => setUserPaused((paused) => !paused)}
                aria-label={userPaused ? 'Reprendre le défilement automatique' : 'Mettre en pause le défilement automatique'}
                className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold"
              >
                {userPaused ? <Play aria-hidden="true" className="size-5" /> : <Pause aria-hidden="true" className="size-5" />}
              </button>
            )}
            <button type="button" onClick={() => go(-1)} aria-label="Diapositive précédente" className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold">
              <ArrowLeft aria-hidden="true" className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Diapositive suivante" className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold">
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        <div key={slide.id} className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 px-6 pb-8 md:px-10 md:pb-10">
          <div className="max-w-2xl">
            <p className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-light text-ivory" aria-hidden={slide.id === 'hero' ? 'true' : undefined}>
              {slide.title}
            </p>
            <p className="mt-3 max-w-xl text-body-sm text-ivory/80">{slide.text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to={slide.to}>{slide.cta}</Button>
            <Button to="/reservation" variant="ghost">
              {copy.home.hero.book}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
