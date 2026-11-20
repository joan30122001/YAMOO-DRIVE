import { Link } from 'react-router'
import copy from '../../data/copy.js'
import { getFeaturedVehicles } from '../../data/vehicleRepository.js'
import VehicleCard from '../vehicles/VehicleCard.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'

/**
 * Véhicules « à la une » : les mêmes cartes que le catalogue, lues dans les données (champ `featured`).
 * Rien n'est affiché s'il n'y en a aucun.
 */
export default function FeaturedVehicles() {
  const vehicles = getFeaturedVehicles().slice(0, 3)
  if (vehicles.length === 0) return null
  const { eyebrow, title, all } = copy.home.featured

  return (
    <section aria-labelledby="a-la-une" className="bg-black">
      <div className="mx-auto max-w-[1900px] px-4 py-24 md:px-[4.9vw] md:py-32">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id="a-la-une" className="mt-4 font-display text-[clamp(1.5rem,2.4vw,2.125rem)] font-light text-ivory">
          {title}
        </h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.slug}>
              <VehicleCard vehicle={vehicle} />
            </li>
          ))}
        </ul>
        <Link to="/vehicules" className="mt-10 inline-flex min-h-11 items-center border-b border-gold pb-2 text-label tracking-[0.24em] text-ivory uppercase transition-colors hover:text-gold">
          {all}
        </Link>
      </div>
    </section>
  )
}
