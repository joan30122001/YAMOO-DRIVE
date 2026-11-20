import { ArrowRight } from 'lucide-react'
import agencyConfig from '../../data/agency.config.js'
import copy from '../../data/copy.js'
import { buildContactHref } from '../../utils/contact.js'
import Button from '../ui/Button.jsx'

/**
 * Appel à l'action final : réserver, ou écrire sur WhatsApp. Le bouton WhatsApp est désactivé tant que le numéro de
 * l'agence est vide (« à compléter ») : jamais de lien mort. Rappelle que les conditions sont précisées par l'agence.
 */
export default function FinalCta() {
  const { title, text, book, whatsapp } = copy.home.final
  const href = buildContactHref('whatsapp', agencyConfig.whatsappNumber)

  return (
    <section aria-labelledby="final" className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-28 text-center md:py-40">
        <h2 id="final" className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-tight font-light text-ivory">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-body-sm leading-relaxed text-ivory/75">{text}</p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button to="/reservation" iconEnd={<ArrowRight aria-hidden="true" className="size-4" />}>
            {book}
          </Button>
          <Button variant="ghost" href={href ?? undefined} target="_blank" disabled={!href}>
            {href ? whatsapp : `${whatsapp} (${copy.toComplete})`}
          </Button>
        </div>
      </div>
    </section>
  )
}
