import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { getFeaturedVehicles, getVehicles } from '../../data/vehicleRepository.js'
import { CATEGORIES } from '../../data/vehicleSchema.js'
import { formatPrice } from '../../utils/format.js'

/**
 * Méga-menu « Véhicules » (grands écrans) : les catégories avec leur effectif, trois véhicules en vedette, et le lien
 * vers tout le catalogue. Tout vient des données ; une catégorie sans véhicule n'est pas listée.
 * `onNavigate` ferme le menu quand on suit un lien.
 */
export default function MegaMenu({ id, onNavigate, panelRef, ...rest }) {
  const { categories, featured } = useMemo(() => {
    const vehicles = getVehicles()
    const flagged = getFeaturedVehicles()
    return {
      categories: CATEGORIES.map((category) => ({ category, count: vehicles.filter((v) => v.category === category).length })).filter((c) => c.count > 0),
      featured: (flagged.length > 0 ? flagged : vehicles).slice(0, 3),
    }
  }, [])

  const linkClass = 'inline-flex min-h-11 w-full items-center justify-between gap-3 text-body-sm text-ivory hover:text-gold'

  return (
    <div
      id={id}
      ref={panelRef}
      role="region"
      aria-label="Nos véhicules"
      className="absolute inset-x-0 top-full hidden border-t border-gold/40 bg-carbon shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] md:block"
      {...rest}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:grid-cols-[15rem_minmax(0,1fr)]">
        <div>
          <p className="mb-2 text-label text-gold uppercase">Catégories</p>
          <ul className="divide-y divide-line">
            {categories.map(({ category, count }) => (
              <li key={category}>
                <Link to={`/vehicules?categorie=${encodeURIComponent(category)}`} onClick={onNavigate} className={linkClass}>
                  {category}
                  <span className="text-silver">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/vehicules" onClick={onNavigate} className="mt-4 inline-flex min-h-11 items-center gap-2 text-body-sm text-gold hover:text-gold-light">
            Voir tous les véhicules
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div>
          <p className="mb-2 text-label text-gold uppercase">En vedette</p>
          <ul className="grid gap-4 sm:grid-cols-3">
            {featured.map((vehicle) => {
              const name = `${vehicle.brand} ${vehicle.model}`
              const price = formatPrice(vehicle.dailyRateXAF)
              return (
                <li key={vehicle.slug}>
                  <Link to={`/vehicules/${vehicle.slug}`} onClick={onNavigate} className="group block overflow-hidden rounded-card border border-line bg-obsidian transition-colors hover:border-gold">
                    <img
                      src={vehicle.images.main}
                      alt=""
                      width="800"
                      height="450"
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                    />
                    <span className="block p-3">
                      <span className="block font-display text-body-md text-ivory">{name}</span>
                      <span className="block text-body-sm text-silver">{price ? `${price} / jour` : vehicle.category}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
