import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './styles/theme.css'
import App from './App.jsx'
import { startApp } from './startApp.js'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Élément #root introuvable dans index.html')

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Le HTML prérendu (scripts/prerender.mjs) n'est « hydraté » que s'il correspond à l'adresse courante. Sinon (adresse
// inconnue servie par un serveur qui renvoie l'accueil), il est écarté et la page est dessinée normalement.
const prerendered = rootElement.dataset.prerendered
const hydrate = Boolean(prerendered) && prerendered === window.location.pathname.replace(/(.)\/$/, '$1')
if (prerendered && !hydrate) rootElement.replaceChildren()

// La page de l'adresse courante est chargée avant le premier rendu (voir startApp.js).
await startApp({
  pathname: window.location.pathname,
  render: () => (hydrate ? hydrateRoot(rootElement, app) : createRoot(rootElement).render(app)),
})
