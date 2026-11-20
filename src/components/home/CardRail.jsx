import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { getVehicles } from '../../data/vehicleRepository.js'

/**
 * Carrousel de cartes photo en hauteur, une par véhicule du catalogue : nom et catégorie en haut à gauche sur la photo, barre de
 * progression et flèches en dessous. Défilement natif avec accroche (tactile, molette, clavier) ; les flèches font
 * avancer d'une carte. Tout vient des données ; les véhicules « à la une » passent en premier.
 */
export default function CardRail() {
  const cards = useMemo(() => {
    const vehicles = getVehicles()
    return [...vehicles]
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .map((v) => ({ slug: v.slug, name: `${v.brand} ${v.model}`, category: v.category, seats: v.seats, image: v.images.main }))
  }, [])

  const rail = useRef(null)
  const [progress, setProgress] = useState({ start: 0, size: 1 })

  const measure = () => {
    const el = rail.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress({ start: max > 0 ? el.scrollLeft / el.scrollWidth : 0, size: el.clientWidth / el.scrollWidth })
  }
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const scrollBy = (direction) => {
    const el = rail.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    el.scrollBy({ left: direction * (card.offsetWidth + 26), behavior: 'smooth' })
  }

  return (
    <section aria-label="Nos véhicules" className="bg-black pb-24">
      <div
        ref={rail}
        onScroll={measure}
        role="region"
        aria-label="Véhicules de la flotte"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-[26px] overflow-x-auto px-4 [scrollbar-width:none] md:px-[4.9vw] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="contents">
          {cards.map(({ slug, name, category, seats, image }) => (
            <li key={slug} className="w-[78vw] shrink-0 snap-start md:w-[21.6vw]">
              <Link to={`/vehicules/${slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-carbon">
                <img
                  src={image}
                  alt=""
                  width="800"
                  height="450"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/20" />
                <span className="absolute inset-x-0 top-0 p-8">
                  <span className="block font-display text-[clamp(1.25rem,1.5vw,1.5rem)] font-light text-ivory">{name}</span>
                  <span className="mt-3 block text-body-sm text-ivory/80">
                    {category} · {seats} {seats > 1 ? 'places' : 'place'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-4 mt-12 flex items-center justify-between md:mx-[4.9vw]">
        <div aria-hidden="true" className="relative h-px w-48 bg-line">
          <span className="absolute inset-y-0 bg-ivory" style={{ left: `${progress.start * 100}%`, width: `${progress.size * 100}%` }} />
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Cartes précédentes" className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold">
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Cartes suivantes" className="inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold">
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
