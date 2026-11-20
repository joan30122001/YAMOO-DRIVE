import copy from '../../data/copy.js'
import { buildContactHref, hasValue } from '../../utils/contact.js'

/**
 * Lien de contact. Valeur vide ou inexploitable : bouton désactivé (focalisable, annoncé comme indisponible),
 * jamais de lien mort. Une valeur renseignée mais invalide est signalée distinctement d'une valeur absente.
 */
export default function ContactLink({ kind, value, label, className = '' }) {
  const href = buildContactHref(kind, value)

  if (!href) {
    const hint = hasValue(value) ? copy.invalidValue : copy.toComplete
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`inline-flex min-h-11 cursor-not-allowed items-center gap-2 text-silver ${className}`}
      >
        {label} <span className="italic">({hint})</span>
      </button>
    )
  }

  const external = kind === 'whatsapp' || kind === 'url'
  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center gap-2 text-gold underline-offset-4 hover:underline ${className}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
      {external && <span className="sr-only"> {copy.opensNewTab}</span>}
    </a>
  )
}
