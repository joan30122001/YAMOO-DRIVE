import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router'
import useMotionPolicy from '../../hooks/useMotionPolicy.js'
import agencyConfig from '../../data/agency.config.js'
import { bookingLink, navLinks } from '../../navigation.js'
import { offset, stagger, transition } from '../../styles/motion.js'
import Button from '../ui/Button.jsx'
import Wordmark from '../ui/Wordmark.jsx'

const DESKTOP_QUERY = '(min-width: 768px)'
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { reduced, lowPower } = useMotionPolicy()
  const panelId = useId()
  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const openRef = useRef(false)
  const { key: locationKey, pathname } = useLocation()
  const lastLocationKey = useRef(locationKey)
  const lastPathname = useRef(pathname)

  openRef.current = open

  const close = useCallback(() => {
    setOpen(false)
    toggleRef.current?.focus()
  }, [])

  // Clic sur un lien du panneau : si le chemin change, la navigation place le focus sur la page ; si le lien
  // pointe vers la page courante, rien ne change et le focus revient au bouton (le lien disparaît avec le panneau).
  const closeForNavigation = useCallback(
    (to) => {
      if (to === pathname) close()
      else setOpen(false)
    },
    [pathname, close],
  )


  // Toute navigation ferme le menu ouvert. Si le chemin change, le focus est confié à la page (useRouteChange) ;
  // sinon (recherche ou hachage seuls) il revient au bouton. Sans menu ouvert, rien ne bouge.
  useEffect(() => {
    if (lastLocationKey.current === locationKey) return
    lastLocationKey.current = locationKey
    const pathChanged = lastPathname.current !== pathname
    lastPathname.current = pathname
    if (!openRef.current) return
    if (pathChanged) setOpen(false)
    else close()
  }, [locationKey, pathname, close])

  // Menu ouvert : page non défilante, focus dans le panneau, Échap et piège de focus.
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (!panelRef.current.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, close])

  // Affichage large (déjà atteint ou atteint plus tard) : le menu n'a plus lieu d'être.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia(DESKTOP_QUERY)
    if (query.matches) {
      setOpen(false)
      return undefined
    }
    const onChange = (event) => {
      if (!event.matches) return
      setOpen(false)
      // Le bouton menu est masqué en affichage large : le focus passe au contenu principal.
      document.getElementById('contenu')?.focus({ preventScroll: true })
    }
    // Anciens Safari : seule l'API addListener existe.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    }
    query.addListener?.(onChange)
    return () => query.removeListener?.(onChange)
  }, [open])

  // Appareil peu puissant : fondu seul, sans déplacement.
  const slide = lowPower ? 0 : offset.slide
  const rise = lowPower ? 0 : offset.rise

  const linkClass = ({ isActive }) =>
    `block py-4 font-display text-3xl font-bold tracking-tight transition-colors hover:text-gold ${
      isActive ? 'text-gold' : 'text-ivory'
    }`

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill border border-line text-ivory transition-colors hover:border-gold hover:text-gold md:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slide, pointerEvents: 'none' }}
            transition={transition(reduced)}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-obsidian px-4 pt-3 pb-8 md:hidden"
          >
            <div className="flex items-center justify-between">
              <Link to="/" onClick={() => closeForNavigation('/')} aria-label={`${agencyConfig.name}, accueil`}>
                <Wordmark />
              </Link>
              <button
                ref={closeRef}
                type="button"
                aria-label="Fermer le menu"
                onClick={close}
                className="inline-flex size-11 items-center justify-center rounded-pill border border-line text-ivory transition-colors hover:border-gold hover:text-gold"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <nav aria-label="Navigation mobile" className="mt-10 flex-1">
              <ul className="divide-y divide-line">
                {navLinks.map(({ to, label, end }, index) => (
                  <m.li
                    key={to}
                    initial={{ opacity: 0, y: rise }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition(reduced, { delay: stagger(index) })}
                  >
                    <NavLink to={to} end={end} onClick={() => closeForNavigation(to)} className={linkClass}>
                      {label}
                    </NavLink>
                  </m.li>
                ))}
              </ul>
            </nav>

            <Button
              to={bookingLink.to}
              onClick={() => closeForNavigation(bookingLink.to)}
              className="mt-8 w-full"
            >
              {bookingLink.label}
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
