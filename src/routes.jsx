import { lazy, useState } from 'react'

// Table de routes unique (AD-10). Chaque page est un chunk chargé à la demande.
// `key` correspond à la clé de métadonnées dans data/seo.js.
export const routes = [
  { key: 'home', path: '/', load: () => import('./pages/Home.jsx') },
  { key: 'catalogue', path: '/vehicules', load: () => import('./pages/Catalogue.jsx') },
  { key: 'vehicle', path: '/vehicules/:slug', load: () => import('./pages/VehicleDetail.jsx') },
  { key: 'booking', path: '/reservation', load: () => import('./pages/Booking.jsx') },
  { key: 'about', path: '/a-propos', load: () => import('./pages/About.jsx') },
  { key: 'contact', path: '/contact', load: () => import('./pages/Contact.jsx') },
  { key: 'conditions', path: '/conditions-de-location', load: () => import('./pages/RentalConditions.jsx') },
  { key: 'legalNotice', path: '/mentions-legales', load: () => import('./pages/LegalNotice.jsx') },
  { key: 'privacy', path: '/confidentialite', load: () => import('./pages/Privacy.jsx') },
  { key: 'notFound', path: '*', load: () => import('./pages/NotFound.jsx') },
]

// Pages déjà chargées. React.lazy suspend toujours au premier rendu, même si le module est déjà là : l'écran de
// chargement s'affichait donc au démarrage et le pied de page sautait quand la page arrivait. Une page mémorisée
// est rendue directement, sans passer par lazy.
const loadedPages = new Map()

// Accepte tout type d'élément React valide : fonction, mémo, forwardRef.
const isPageType = (value) => typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value)

export function rememberPage(key, module) {
  if (module && isPageType(module.default)) loadedPages.set(key, module.default)
}

/** Oublie les pages mémorisées (tests uniquement : l'état est partagé par tout le module). */
export function forgetPages() {
  loadedPages.clear()
}

export function isPageLoaded(key) {
  return loadedPages.has(key)
}

export const lazyRoutes = routes.map((route) => {
  const Lazy = lazy(async () => {
    const module = await route.load()
    rememberPage(route.key, module)
    return module
  })

  function Page(props) {
    // Choisi une seule fois par montage : si la page devenait « mémorisée » entre deux rendus, passer de Lazy à la page
    // chargée changerait le type du composant et remonterait toute la page (état perdu, animation rejouée).
    const [Loaded] = useState(() => loadedPages.get(route.key))
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />
  }

  return { ...route, Lazy, Component: Page }
})
