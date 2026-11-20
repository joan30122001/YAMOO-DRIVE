import { m } from 'motion/react'
import { useRef } from 'react'
import { useLocation } from 'react-router'
import useMotionPolicy from '../../hooks/useMotionPolicy.js'
import { offset, transition } from '../../styles/motion.js'

/**
 * Transition d'entrée discrète à chaque changement de page (AD-6). Aucune sortie : la navigation n'est jamais retardée.
 * - Première page affichée : aucune animation. Son HTML est déjà à l'écran (prérendu) ; la masquer pour la faire
 *   apparaître retarderait le contenu (LCP).
 * - reduced : affichage immédiat (pas d'état initial masqué, durée nulle).
 * - lowPower : fondu seul, sans déplacement.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation()
  const { reduced, lowPower } = useMotionPolicy()
  const firstPath = useRef(pathname)
  const isFirstPage = pathname === firstPath.current

  return (
    <m.div
      key={pathname}
      initial={reduced || isFirstPage ? false : { opacity: 0, y: lowPower ? 0 : offset.rise / 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition(reduced)}
    >
      {children}
    </m.div>
  )
}
