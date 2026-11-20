import PageHero from './PageHero.jsx'
import PageMeta from './PageMeta.jsx'
import copy from '../../data/copy.js'
import { hasValue } from '../../utils/contact.js'

/** Valeur issue de la configuration agence : vide, elle s'affiche « à compléter » (rien n'est inventé). */
export function ConfigValue({ value }) {
  return hasValue(value) ? value : <em className="text-silver">{copy.toComplete}</em>
}

/**
 * Gabarit des pages d'information (conditions, mentions légales, confidentialité) : bandeau, puis sections de texte.
 * `sections` : [{ id, title, content }] où `content` est un nœud React.
 */
export default function LegalPage({ meta, title, accent, intro, sections }) {
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHero title={title} accent={accent} intro={intro} />
      <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 md:py-24">
        {sections.map(({ id, title: heading, content }) => (
          <section key={id} aria-labelledby={id}>
            <h2 id={id} className="font-display text-title-md font-light text-ivory">
              {heading}
            </h2>
            <div className="mt-4 space-y-3 text-body-sm leading-relaxed text-ivory/85">{content}</div>
          </section>
        ))}
      </div>
    </>
  )
}
