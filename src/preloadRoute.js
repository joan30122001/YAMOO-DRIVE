import { matchPath } from 'react-router'
import { rememberPage, routes } from './routes.jsx'

/** Trouve la route qui correspond à un chemin (la route « * » est la dernière de la table). */
export function findRoute(pathname, table = routes) {
  return table.find((route) => matchPath({ path: route.path, end: true }, pathname)) ?? null
}

/**
 * Charge la page de l'adresse courante avant le premier rendu : l'écran « Chargement… » n'apparaît pas au
 * démarrage et le pied de page ne saute pas quand la page arrive (décalage de mise en page mesuré par Lighthouse).
 * Un échec de chargement n'est pas bloquant : le rendu l'affichera via la barrière d'erreur de page.
 */
export async function preloadRoute(pathname, table = routes) {
  try {
    const route = findRoute(pathname, table)
    if (!route) return null
    const module = await route.load()
    // Mémorisée : la page est rendue sans passer par React.lazy (aucun écran de chargement au démarrage).
    if (table === routes) rememberPage(route.key, module)
    return module
  } catch {
    return null
  }
}
