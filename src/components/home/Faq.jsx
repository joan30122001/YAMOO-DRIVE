import { Plus } from 'lucide-react'
import copy from '../../data/copy.js'
import Eyebrow from '../ui/Eyebrow.jsx'

/**
 * Questions fréquentes : accordéon natif <details>/<summary> (clavier, lecteurs d'écran et impression gérés par le
 * navigateur). Réponses descriptives du fonctionnement du site ; aucune promesse.
 */
export default function Faq() {
  const { eyebrow, title, accent, items } = copy.home.faq
  return (
    <section aria-labelledby="faq" className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-16 px-4 py-section lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id="faq" className="mt-6 font-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[0.98] font-light text-ivory">
            {title} <span className="text-gold">{accent}</span>
          </h2>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {items.map(({ q, a }) => (
            <details key={q} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-title-md text-ivory marker:content-none [&::-webkit-details-marker]:hidden">
                {q}
                <Plus aria-hidden="true" className="size-5 shrink-0 text-gold motion-safe:transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-prose pb-4 text-body-md text-silver">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
