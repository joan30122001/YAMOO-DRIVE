/**
 * Sur-titre de section : petites capitales dorées précédées d'un filet et d'un losange (ornement décoratif).
 * `as` choisit la balise (p par défaut).
 */
export default function Eyebrow({ as: Tag = 'p', className = '', children }) {
  return (
    <Tag className={`flex items-center gap-3 text-label text-gold uppercase ${className}`.trim()}>
      <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-transparent to-gold" />
      <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
      {children}
    </Tag>
  )
}
