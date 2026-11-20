import { ArrowRight, Cog, Fuel, UserRound, Users } from 'lucide-react'
import copy from '../../data/copy.js'
import { formatPrice } from '../../utils/format.js'
import Button from '../ui/Button.jsx'

// Dimensions intrinsèques des visuels (16/9) : réservent la place avant le chargement.
const IMAGE_WIDTH = 800
const IMAGE_HEIGHT = 450

/**
 * Carte véhicule. Survol et focus : zoom léger, bordure dorée, flèche animée (CSS, sans JavaScript).
 * `hover:` ne s'applique qu'aux appareils à souris ; sur tactile, `active:` donne un état d'appui discret.
 * Les mouvements sont désactivés avec prefers-reduced-motion (variante `motion-safe`).
 * `priority` : image principale de la page (LCP), chargée tout de suite et en haute priorité ; les autres sont
 * différées (une image différée mais déjà visible se charge dès la mise en page).
 */
export default function VehicleCard({ vehicle, priority = false }) {
  const { slug, brand, model, category, seats, transmission, dailyRateXAF, images } = vehicle
  const name = `${brand} ${model}`
  const price = formatPrice(dailyRateXAF)

  return (
    <article className="group relative flex h-full min-h-[27rem] flex-col justify-end overflow-hidden rounded-card bg-carbon transition duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold">
      <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden bg-surface">
        <img
          src={images.main}
          srcSet={images.gallery?.[0] && images.gallery[0] !== images.main ? `${images.main} 800w, ${images.gallery[0]} 1200w` : undefined}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          alt={name}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105 motion-safe:group-focus-within:scale-105 motion-safe:group-active:scale-[1.02]"
        />
      </div>

      <div className="relative flex flex-col gap-4 bg-gradient-to-t from-carbon via-carbon/95 to-transparent p-5 pt-16">
        <div>
          <p className="text-label text-gold uppercase">{category}</p>
          <h2 className="mt-1 font-display text-[1.25rem] font-light">{name}</h2>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-silver">
          <li className="inline-flex items-center gap-2">
            <Users aria-hidden="true" className="size-4 text-gold" />
            {seats} {seats > 1 ? 'places' : 'place'}
          </li>
          <li className="inline-flex items-center gap-2">
            <Cog aria-hidden="true" className="size-4 text-gold" />
            {transmission}
          </li>
          {vehicle.specs?.Carburant && (
            <li className="inline-flex items-center gap-2">
              <Fuel aria-hidden="true" className="size-4 text-gold" />
              {vehicle.specs.Carburant}
            </li>
          )}
          {vehicle.services?.withDriver && (
            <li className="inline-flex items-center gap-2">
              <UserRound aria-hidden="true" className="size-4 text-gold" />
              Chauffeur possible
            </li>
          )}
        </ul>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-2">
          <p className="min-w-0">
            {price ? (
              <>
                <span className="font-display text-price font-medium text-ivory">{price}</span>
                <span className="text-body-sm text-silver"> / jour</span>
              </>
            ) : (
              <span className="text-body-sm text-silver">Tarif {copy.toComplete}</span>
            )}
          </p>

          <Button
            variant="outline"
            to={`/vehicules/${slug}`}
            size="small"
            className="after:absolute after:inset-0 after:content-[''] group-hover:bg-gold group-hover:text-on-gold group-focus-within:bg-gold group-focus-within:text-on-gold"
            iconEnd={
              <ArrowRight
                aria-hidden="true"
                className="size-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-within:translate-x-1"
              />
            }
          >
            Voir les détails
            <span className="sr-only"> : {name}</span>
          </Button>
        </div>
      </div>
    </article>
  )
}
