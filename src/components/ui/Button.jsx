import { Link } from 'react-router'

// Spécifications : DESIGN.md.Components (bouton principal, contour, WhatsApp). Hauteur 44 px, forme pilule.
// `enabled:hover:` ne s'applique qu'aux vrais boutons (`:enabled` n'existe pas pour les liens) ; les liens
// reçoivent `hover:`. Un bouton désactivé n'est jamais un lien : il est rendu en <button disabled>, sans href.
const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm text-button uppercase transition-colors disabled:cursor-not-allowed'

// Le padding horizontal vient de `size`, jamais de `className` : Tailwind départage deux utilitaires du même
// groupe (px-4 / px-6) par l'ordre de la feuille de styles, pas par l'ordre des classes.
const SIZES = {
  default: 'px-6',
  compact: 'px-4 sm:px-6',
  small: 'px-4',
}

const VARIANTS = {
  primary: {
    own: 'bg-gold text-on-gold focus-visible:outline-ivory disabled:bg-line disabled:text-silver',
    link: 'hover:bg-gold-light',
    button: 'enabled:hover:bg-gold-light',
  },
  outline: {
    own: 'border border-gold text-gold disabled:border-line disabled:text-silver',
    link: 'hover:bg-gold hover:text-on-gold',
    button: 'enabled:hover:bg-gold enabled:hover:text-on-gold',
  },
  ghost: {
    own: 'border border-ivory text-ivory focus-visible:outline-gold disabled:border-line disabled:text-silver',
    link: 'hover:bg-ivory hover:text-obsidian',
    button: 'enabled:hover:bg-ivory enabled:hover:text-obsidian',
  },
  whatsapp: {
    own: 'border border-line bg-carbon text-ivory disabled:text-silver',
    link: 'hover:border-gold',
    button: 'enabled:hover:border-gold',
  },
}

/**
 * Bouton ou lien d'action.
 * - `to` : lien interne (React Router). `href` : lien externe ou `mailto:`/`tel:`.
 * - `disabled` : toujours rendu en <button disabled aria-disabled>, jamais en lien mort.
 * - `size` : 'default' (px-6), 'compact' (px-4, px-6 dès sm), 'small' (px-4).
 * - `iconStart` / `iconEnd` : éléments décoratifs (passer `aria-hidden`).
 * `className` ne doit servir qu'à des utilitaires sans conflit avec ceux du composant (largeur, marges, effets).
 */
export default function Button({
  variant = 'primary',
  size = 'default',
  to,
  href,
  disabled = false,
  type = 'button',
  iconStart,
  iconEnd,
  className = '',
  children,
  ...rest
}) {
  const spec = Object.hasOwn(VARIANTS, variant) ? VARIANTS[variant] : VARIANTS.primary
  const padding = Object.hasOwn(SIZES, size) ? SIZES[size] : SIZES.default
  const { rel, ...others } = rest
  const content = (
    <>
      {iconStart}
      {children}
      {iconEnd}
    </>
  )
  const build = (kind) => `${BASE} ${padding} ${spec.own} ${spec[kind]} ${className ?? ''}`.trim()

  if (disabled || (!to && !href)) {
    return (
      <button
        type={type}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        className={build('button')}
        {...others}
      >
        {content}
      </button>
    )
  }

  if (to) {
    return (
      <Link to={to} className={build('link')} rel={rel} {...others}>
        {content}
      </Link>
    )
  }

  // Lien externe dans un nouvel onglet : `noopener noreferrer` est toujours conservé, un `rel` de l'appelant s'y ajoute.
  const newTab = others.target === '_blank'
  const safeRel = newTab ? `noopener noreferrer${rel ? ` ${rel}` : ''}` : rel
  return (
    <a href={href} className={build('link')} rel={safeRel} {...others}>
      {content}
    </a>
  )
}
