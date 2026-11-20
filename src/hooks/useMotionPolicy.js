import { useMemo, useSyncExternalStore } from 'react'
import { detectLowPower } from '../utils/device.js'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function getQuery() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_QUERY)
    : null
}

function subscribe(onChange) {
  const query = getQuery()
  if (!query) return () => {}
  // Anciens Safari : seule l'API addListener existe.
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }
  query.addListener?.(onChange)
  return () => query.removeListener?.(onChange)
}

const getSnapshot = () => getQuery()?.matches === true
const getServerSnapshot = () => false

/**
 * Politique d'animation unique (AD-7). Tout composant animé la consulte.
 * reduced : l'utilisateur demande moins de mouvement.
 * lowPower : appareil peu puissant ou économie de données.
 */
export default function useMotionPolicy() {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const lowPower = useMemo(
    () => (typeof navigator === 'undefined' ? false : detectLowPower(navigator)),
    [],
  )
  return useMemo(() => ({ reduced, lowPower }), [reduced, lowPower])
}
