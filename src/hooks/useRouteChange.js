import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * À chaque changement de page (chemin différent, hors chargement initial) :
 * remet la page en haut et place le focus sur le contenu principal.
 * - Retour arrière/avant (POP) et liens avec hachage : pas de défilement forcé.
 * - Changement de recherche ou de hachage seul (même chemin, ex. filtres, ancres) : rien ne bouge.
 * - Le focus utilise `preventScroll` pour ne pas annuler la position choisie.
 */
export default function useRouteChange(mainRef) {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const previousPath = useRef(pathname)

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname

    if (navigationType !== 'POP' && !hash && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0)
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, hash, navigationType, mainRef])
}
