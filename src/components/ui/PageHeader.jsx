// Intensité maximale de la lueur rouge, en pourcentage. Doit rester égale au nombre écrit dans GLOW_CLASS
// (Tailwind lit des classes littérales) : un test vérifie l'égalité et calcule le contraste du texte dans ce pire cas.
export const GLOW_OPACITY_PERCENT = 12

const GLOW_CLASS =
  'pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-gold)_12%,transparent),transparent_60%)]'

/** Découpe le titre autour de la dernière occurrence du mot clé ; sans mot clé trouvé, tout le titre est « avant ». */
export function splitTitle(title, accent) {
  const text = typeof title === 'string' ? title : ''
  const index = typeof accent === 'string' && accent.trim() !== '' ? text.lastIndexOf(accent) : -1
  if (index < 0) return { before: text, accent: '', after: '' }
  return { before: text.slice(0, index), accent, after: text.slice(index + accent.length) }
}

// Un texte simple devient un paragraphe ; un contenu riche (blocs) reste dans un <div> pour éviter un <p> invalide.
function Intro({ children }) {
  const classes = 'mt-4 max-w-prose text-body-md text-silver'
  return typeof children === 'string' ? <p className={classes}>{children}</p> : <div className={classes}>{children}</div>
}

/**
 * En-tête commun des pages (DESIGN.md.Components) : titre `display-lg` dont un mot clé est doré, introduction en
 * argent, lueur rouge discrète en arrière-plan. La lueur est décorative, ancrée en haut à droite et assez faible
 * pour que le texte garde un contraste ≥ 4,5:1 ; le texte n'est jamais rouge.
 */
export default function PageHeader({ title, accent, intro, image, className = '', children }) {
  const parts = splitTitle(title, accent)

  return (
    <div className={`relative isolate overflow-hidden border-b border-line ${className}`.trim()}>
      {image ? (
        <>
          <img
            src={image}
            alt=""
            width="1280"
            height="720"
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute inset-y-0 right-0 -z-20 h-full w-full object-cover object-[75%_center] sm:w-3/4"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-obsidian via-obsidian/80 to-obsidian/20" />
        </>
      ) : null}
      <div aria-hidden="true" className={GLOW_CLASS} />
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <h1 className="font-display text-display-xl-mobile font-light text-ivory sm:text-display-lg">
          {parts.before}
          {parts.accent && <span className="text-gold">{parts.accent}</span>}
          {parts.after}
        </h1>
        {intro ? <Intro>{intro}</Intro> : null}
        {children}
      </div>
    </div>
  )
}
