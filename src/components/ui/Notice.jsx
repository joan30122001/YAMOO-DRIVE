import { Info } from 'lucide-react'

/**
 * Avis important (DESIGN.md.Components : notice-gold) : « demande non confirmée », tarifs à confirmer.
 * Annoncé comme une note ; l'icône est décorative.
 */
export default function Notice({ children, className = '', ...rest }) {
  return (
    <div
      {...rest}
      role="note"
      className={`flex items-start gap-3 rounded-card border border-gold-deep bg-carbon-raised p-4 text-body-sm text-ivory ${className}`.trim()}
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
      <div>{children}</div>
    </div>
  )
}
