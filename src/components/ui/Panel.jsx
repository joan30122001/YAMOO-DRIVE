import { useId } from 'react'

/**
 * Carte sombre à liseré (DESIGN.md.Components : panneau). Le titre, s'il existe, est un titre de la hiérarchie
 * de la page : `titleAs` choisit son niveau (h2 par défaut).
 */
export default function Panel({ as: Tag = 'section', title, titleAs: TitleTag = 'h2', className = '', children, ...rest }) {
  const titleId = useId()
  return (
    <Tag
      aria-labelledby={title ? titleId : undefined}
      className={`rounded-card border border-line bg-carbon p-6 ${className}`.trim()}
      {...rest}
    >
      {title && (
        <TitleTag id={titleId} className="mb-4 font-display text-title-md text-ivory">
          {title}
        </TitleTag>
      )}
      {children}
    </Tag>
  )
}
