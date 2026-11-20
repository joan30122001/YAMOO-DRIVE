import { preloadRoute } from './preloadRoute.js'

// Délai maximal d'attente de la page de l'adresse courante avant d'afficher l'application malgré tout :
// sur un réseau bloqué, l'écran de chargement et la barrière d'erreur prennent le relais (jamais de page blanche).
export const PRELOAD_TIMEOUT_MS = 3000

/**
 * Démarrage de l'application : charge la page de l'adresse courante AVANT le premier rendu, puis rend.
 * - Le préchargement supprime l'écran « Chargement… » au démarrage et le saut du pied de page (Lighthouse).
 * - Il est borné dans le temps et n'empêche jamais le rendu, même en cas d'échec ou d'adresse mal formée.
 * @param {{ pathname: string, render: () => void, preload?: typeof preloadRoute, timeoutMs?: number }} options
 */
export async function startApp({ pathname, render, preload = preloadRoute, timeoutMs = PRELOAD_TIMEOUT_MS }) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, timeoutMs)
  })
  try {
    await Promise.race([Promise.resolve().then(() => preload(pathname)), timeout])
  } catch {
    // Un échec de préchargement n'est pas bloquant : la page sera chargée par le rendu (React.lazy + barrière d'erreur).
  } finally {
    clearTimeout(timer)
  }
  render()
}
