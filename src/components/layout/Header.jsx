import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import agencyConfig from '../../data/agency.config.js'
import { bookingLink, navLinks } from '../../navigation.js'
import Button from '../ui/Button.jsx'
import Wordmark from '../ui/Wordmark.jsx'
import MegaMenu from './MegaMenu.jsx'
import MobileMenu from './MobileMenu.jsx'

// Navigation en petites capitales de 11 px très espacées ; lien actif souligné d'un filet doré de 2 px.
const linkClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-gold ${
    isActive ? 'text-gold underline decoration-gold decoration-2 underline-offset-8' : 'text-ivory'
  }`

// Lien du catalogue : celui qui porte le méga-menu.
const MENU_PATH = '/vehicules'
const HOVER_CLOSE_DELAY_MS = 140

/**
 * En-tête à trois zones : navigation à gauche, logo au centre, bouton à contour fin à droite. Sur l'accueil il est
 * transparent et défile avec la page, sur toutes les pages (jamais de fond noir au défilement) ; il n'est plein que
 * quand le méga-menu est ouvert.
 */
export default function Header() {
  const { pathname, search } = useLocation()
  // Le menu n'est « ouvert » que pour l'adresse où il a été ouvert : toute navigation le ferme, sans effet de bord.
  const here = `${pathname}${search}`
  const [openAt, setOpenAt] = useState(null)
  const open = openAt === here

  const overHero = !open

  const headerRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const timer = useRef(null)
  const panelId = useId()

  const clearTimer = () => window.clearTimeout(timer.current)
  const openMenu = () => {
    clearTimer()
    setOpenAt(here)
  }
  const closeMenu = () => {
    clearTimer()
    setOpenAt(null)
  }
  const closeSoon = () => {
    clearTimer()
    timer.current = window.setTimeout(() => setOpenAt(null), HOVER_CLOSE_DELAY_MS)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Fermeture : touche Échap (le focus revient au déclencheur) et clic en dehors de l'en-tête.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpenAt(null)
        triggerRef.current?.focus()
      }
    }
    const onPointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpenAt(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  function toggleFromButton() {
    if (open) {
      closeMenu()
      return
    }
    openMenu()
    // Ouvert au clavier ou au clic : le focus passe au premier lien du panneau.
    requestAnimationFrame(() => panelRef.current?.querySelector('a')?.focus())
  }

  return (
    <header
      ref={headerRef}
      className={`relative z-40 transition-colors duration-300 ${
        overHero ? 'bg-gradient-to-b from-black/70 to-transparent' : 'border-b border-line bg-black'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1900px] items-center justify-between gap-x-3 px-4 sm:gap-x-6 md:grid md:h-24 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-[4.9vw]">
        <Link to="/" aria-label={`${agencyConfig.name}, accueil`} className="inline-flex min-h-11 shrink-0 items-center md:order-2 md:justify-self-center">
          <Wordmark intro />
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:order-1 md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map(({ to, label, end }) =>
              to === MENU_PATH ? (
                <li key={to} className="flex items-center" onMouseEnter={openMenu} onMouseLeave={closeSoon}>
                  <NavLink to={to} end={end} className={linkClass}>
                    {label}
                  </NavLink>
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-label="Afficher les catégories de véhicules"
                    onClick={toggleFromButton}
                    className="-ml-1.5 inline-flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold"
                  >
                    <ChevronDown aria-hidden="true" className={`size-3.5 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                </li>
              ) : (
                <li key={to}>
                  <NavLink to={to} end={end} className={linkClass}>
                    {label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:order-3 md:justify-self-end">
          <Button to={bookingLink.to} size="compact" variant="ghost">
            {bookingLink.label}
          </Button>
          <MobileMenu />
        </div>
      </div>

      {open && <MegaMenu id={panelId} panelRef={panelRef} onNavigate={closeMenu} onMouseEnter={openMenu} onMouseLeave={closeSoon} />}
    </header>
  )
}
