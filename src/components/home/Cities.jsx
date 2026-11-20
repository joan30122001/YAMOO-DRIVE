import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import agencyConfig from '../../data/agency.config.js'
import copy from '../../data/copy.js'
import Eyebrow from '../ui/Eyebrow.jsx'

/**
 * Villes de prise en charge, lues dans la configuration de l'agence (jamais écrites en dur), présentées en lignes
 * ouvertes séparées par des filets. Chaque ligne ouvre le formulaire de demande avec la ville choisie.
 */
export default function Cities() {
  const { eyebrow, title, accent, note, cta } = copy.home.cities
  return (
    <section aria-labelledby="villes" className="mx-auto max-w-6xl px-4 py-section">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id="villes" className="mt-6 font-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] font-light text-ivory">
        {title} <span className="text-gold">{accent}</span>
      </h2>
      <ul className="mt-20 divide-y divide-line border-y border-line">
        {agencyConfig.cities.map((city) => (
          <li key={city}>
            <Link
              to={`/reservation?ville=${encodeURIComponent(city)}`}
              className="group flex min-h-24 items-center justify-between gap-6 py-6 transition-colors hover:text-gold"
            >
              <span>
                <span className="block font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-light text-ivory transition-colors group-hover:text-gold">{city}</span>
                <span className="mt-1 block text-body-sm text-silver">
                  {cta} {city}
                </span>
              </span>
              <ArrowUpRight aria-hidden="true" className="size-6 shrink-0 text-gold motion-safe:transition-transform motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-body-sm text-silver">{note}</p>
    </section>
  )
}
