import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App.jsx'
import Footer from './components/layout/Footer.jsx'
import RouteError, { RouteErrorMessage } from './components/layout/RouteError.jsx'
import { bookingLink, navLinks } from './navigation.js'
import { lazyRoutes, routes } from './routes.jsx'
import agencyConfig from './data/agency.config.js'
import copy from './data/copy.js'
import seo from './data/seo.js'

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&amp;/g, '&')

// Rend le VRAI <App /> (routes lazy comprises) : prerender attend la fin des chargements Suspense.
async function renderApp(url) {
  // Précharge les chunks pour que React.lazy se résolve dans le même rendu.
  await Promise.all(routes.map((r) => r.load()))
  // Sans cette option, une page de plus de ~12 Ko est « sortie » en différé et le rendu garde le message de chargement.
  const { prelude } = await prerender(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
    { progressiveChunkSize: Infinity },
  )
  return decode(await new Response(prelude).text())
}

const navHtml = (out) => out.slice(out.indexOf('aria-label="Navigation principale"'), out.indexOf('</nav>'))

describe('table de routes (AD-10)', () => {
  it('contient exactement les routes attendues', () => {
    expect(routes.map((r) => r.path)).toEqual([
      '/',
      '/vehicules',
      '/vehicules/:slug',
      '/reservation',
      '/a-propos',
      '/contact',
      '/conditions-de-location',
      '/mentions-legales',
      '/confidentialite',
      '*',
    ])
  })

  it('chaque route a des métadonnées SEO et charge une page par import dynamique', async () => {
    for (const route of routes) {
      expect(seo[route.key], `seo.${route.key}`).toBeTruthy()
      expect(seo[route.key].title, route.key).toBeTruthy()
      const mod = await route.load()
      expect(typeof mod.default, route.path).toBe('function')
    }
  })

  it('chaque page dispose d’un composant React.lazy de repli', () => {
    for (const r of lazyRoutes) {
      expect(r.Lazy.$$typeof, r.path).toBe(Symbol.for('react.lazy'))
      expect(typeof r.Component, r.path).toBe('function')
    }
  })
})

describe('App réelle : pages, mise en page et métadonnées', () => {
  it.each([
    ['/', 'home', 'DRIVE BEYOND ORDINARY.'],
    ['/vehicules', 'catalogue', 'Nos véhicules'],
    ['/vehicules/jetour-x90-plus', 'vehicle', 'Jetour X90 Plus'],
    ['/vehicules/abc-01', 'vehicleNotFound', 'Véhicule introuvable'],
    ['/reservation', 'booking', 'Demande de réservation'],
    ['/a-propos', 'about', 'À propos de YAMOO DRIVE'],
    ['/contact', 'contact', 'Contactez-nous'],
    ['/nimporte-quoi', 'notFound', 'Page introuvable'],
  ])('%s rend la bonne page (h1 unique, titre et noindex)', async (url, key, h1) => {
    const out = await renderApp(url)
    expect(out.match(/<h1[ >]/g), 'un seul h1').toHaveLength(1)
    // Le mot clé doré est dans un <span> : on compare le texte du titre sans les balises.
    const heading = out.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '')
    expect(heading).toBe(h1)
    // La fiche d'un véhicule porte le nom du véhicule dans son titre ; les autres pages, leur titre de seo.js.
    const title = key === 'vehicle' ? 'Jetour X90 Plus' : seo[key].title
    expect(out).toContain(`<title>${title} — YAMOO DRIVE</title>`)
    expect(out).toContain('content="noindex, nofollow"')
    expect(out).not.toContain('Chargement…')
  })

  it.each(['/vehicules', '/vehicules/abc-01', '/reservation', '/a-propos', '/contact', '/nimporte-quoi'])(
    '%s : le titre contient un mot clé doré (une faute de frappe sur le mot clé le ferait disparaître)',
    async (url) => {
      const out = await renderApp(url)
      const h1 = out.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]
      expect(h1).toMatch(/<span class="text-gold">[^<]+<\/span>/)
    },
  )

  it('/vehicules/:slug affiche la fiche : tarif, bouton de réservation vers ce véhicule, aucune confirmation', async () => {
    const out = await renderApp('/vehicules/jetour-x90-plus')
    expect(out).toContain('100 000 FCFA')
    expect(out).toMatch(/<a [^>]*href="\/reservation\?vehicule=jetour-x90-plus"[^>]*>Réserver ce véhicule/)
    expect(out).toContain(copy.booking.notConfirmed)
  })

  it('un slug inconnu affiche « Véhicule introuvable » avec retour au catalogue, pas une fiche vide', async () => {
    const out = await renderApp('/vehicules/abc-01')
    expect(out).toContain('Véhicule introuvable')
    expect(out).toMatch(/<a [^>]*href="\/vehicules"[^>]*>Retour au catalogue<\/a>/)
    expect(out).not.toContain('Réserver ce véhicule')
  })

  it.each(['/', '/vehicules', '/vehicules/abc-01', '/vehicules/jetour-x90-plus', '/reservation', '/a-propos', '/contact', '/nimporte-quoi'])(
    '%s : aucun vocabulaire de projet visible par le visiteur (epic, story, sprint, PRD, TODO)',
    async (url) => {
      const out = await renderApp(url)
      const visible = out.replace(/<(script|style|template)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ')
      expect(visible).not.toMatch(/\b(epic|story|stories|sprint|PRD|TODO|FIXME|lorem)\b/i)
    },
  )

  it('une route inconnue affiche la 404 avec retour à l’accueil', async () => {
    expect(await renderApp('/nimporte-quoi')).toMatch(/<a [^>]*href="\/"[^>]*>Retour à l'accueil<\/a>/)
  })

  it('le lien d’évitement est le premier lien et cible #contenu', async () => {
    const out = await renderApp('/')
    expect(out.match(/<a [^>]*>/)[0]).toContain('href="#contenu"')
    expect(out).toContain('Aller au contenu')
    expect(out).toContain('<main id="contenu"')
  })

  it('en-tête : logo, quatre liens, « Réserver », fixe en haut', async () => {
    const out = await renderApp('/')
    for (const { to, label } of navLinks) {
      expect(navHtml(out)).toMatch(new RegExp(`<a [^>]*href="${escapeRe(to)}"[^>]*>${escapeRe(label)}</a>`))
    }
    expect(out).toMatch(new RegExp(`<a [^>]*href="${escapeRe(bookingLink.to)}"[^>]*>${bookingLink.label}</a>`))
    // Accueil : l'en-tête est transparent et défile avec la page (jamais de fond noir au défilement).
    expect(out).toMatch(/<header class="[^"]*\brelative\b[^"]*from-black\/70/)
    expect(out).not.toMatch(/<header class="[^"]*\bsticky\b/)
  })

  it('toutes les pages : en-tête transparent qui défile avec la page, jamais fixe ni noir', async () => {
    for (const url of ['/', '/vehicules', '/a-propos', '/contact']) {
      const out = await renderApp(url)
      const header = out.match(/<header class="([^"]*)"/)[1]
      expect(header, url).toMatch(/\brelative\b/)
      expect(header, url).not.toMatch(/\bsticky\b/)
      expect(header, url).not.toMatch(/\bbg-black\b/)
    }
  })

  it('signale le lien actif par aria-current, et lui seul', async () => {
    const nav = navHtml(await renderApp('/a-propos'))
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1)
    expect(nav).toMatch(/aria-current="page"[^>]*>À propos</)
  })

  it('« Accueil » inactif hors accueil ; « Véhicules » actif sur une fiche', async () => {
    expect(navHtml(await renderApp('/vehicules'))).not.toMatch(/aria-current="page"[^>]*>Accueil</)
    expect(navHtml(await renderApp('/vehicules/abc-01'))).toMatch(/aria-current="page"[^>]*>Véhicules</)
  })

  it('l’URL avec slash final ou casse différente est traitée sans planter', async () => {
    expect(await renderApp('/vehicules/')).toContain('Nos véhicules')
    expect(await renderApp('/CONTACT')).toContain('<h1')
  })
})

describe('pied de page', () => {
  const render = (config) =>
    renderToStaticMarkup(
      <StaticRouter location="/">
        <Footer config={config} />
      </StaticRouter>,
    )

  it('coordonnées vides : « à compléter » et boutons désactivés', () => {
    const out = render({ ...agencyConfig, whatsappNumber: '', phone: '', email: '', address: '' })
    expect(out).toContain('href="/vehicules"')
    expect(out).toContain(`href="${bookingLink.to}"`)
    expect(out).toContain(copy.toComplete)
    expect(out).toContain('disabled')
  })

  it('coordonnées renseignées : liens actifs et adresse affichée', () => {
    const out = render({
      ...agencyConfig,
      whatsappNumber: '+237 690 000 000',
      phone: '+237 222 00 00 00',
      email: 'contact@exemple.cm',
      address: '1 rue Test, Douala',
    })
    expect(out).toContain('https://wa.me/237690000000')
    expect(out).toContain('tel:+237222000000')
    expect(out).toContain('mailto:contact@exemple.cm')
    expect(out).toContain('1 rue Test, Douala')
    expect(out).not.toContain(`(${copy.toComplete})`)
    expect(out).not.toContain(`<em>${copy.toComplete}</em>`)
  })

  it('chaque lien du pied de page est une cible de 44 px (liens de navigation et coordonnées)', () => {
    const out = render({ ...agencyConfig, email: 'a@b.cm', phone: '+237 222 00 00 00', whatsappNumber: '+237 690 000 000' })
    const anchors = [...out.matchAll(/<a [^>]*class="([^"]*)"/g)].map((m) => m[1])
    expect(anchors.length).toBeGreaterThanOrEqual(8)
    for (const classes of anchors) expect(classes.split(' ')).toContain('min-h-11')
  })

  it('ne contient aucun lien mort', () => {
    const out = render(agencyConfig)
    expect(out).not.toMatch(/href=""/)
    expect(out).not.toMatch(/href="#"/)
  })
})

describe('échec de chargement d’une page', () => {
  it('le message d’erreur propose de réessayer', () => {
    const out = renderToStaticMarkup(<RouteErrorMessage onRetry={() => {}} />)
    expect(out).toContain('role="alert"')
    expect(out).toContain('Réessayer')
  })

  it('la barrière bascule en erreur quand un enfant échoue', () => {
    expect(RouteError.getDerivedStateFromError()).toEqual({ hasError: true })
  })
})
