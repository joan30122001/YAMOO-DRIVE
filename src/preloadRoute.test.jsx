// @vitest-environment happy-dom
import { Suspense, memo, useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render as rtlRender, screen } from '@testing-library/react'
import { findRoute, preloadRoute } from './preloadRoute.js'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { forgetPages, isPageLoaded, lazyRoutes, rememberPage, routes } from './routes.jsx'

describe('findRoute', () => {
  it.each([
    ['/', 'home'],
    ['/vehicules', 'catalogue'],
    ['/vehicules/', 'catalogue'],
    ['/vehicules/range-rover-vogue-01', 'vehicle'],
    ['/reservation', 'booking'],
    ['/a-propos', 'about'],
    ['/contact', 'contact'],
    ['/CONTACT', 'contact'],
    ['/nimporte-quoi', 'notFound'],
    ['/vehicules/a/b/c', 'notFound'],
  ])('%s -> %s', (pathname, key) => {
    expect(findRoute(pathname)?.key).toBe(key)
  })

  it('utilise la table de routes réelle (toutes les routes sont atteignables)', () => {
    for (const route of routes) {
      const sample = route.path === '*' ? '/page-inconnue' : route.path.replace(':slug', 'exemple')
      expect(findRoute(sample)?.key, route.path).toBe(route.key)
    }
  })

  it('table vide : aucune route', () => {
    expect(findRoute('/', [])).toBeNull()
  })
})

describe('preloadRoute', () => {
  const makeTable = (load) => [{ key: 'a', path: '/a', load }, { key: 'nf', path: '*', load: vi.fn(async () => ({ default: 'nf' })) }]

  it('charge la page de la route et renvoie son module', async () => {
    const load = vi.fn(async () => ({ default: 'Page A' }))
    const module = await preloadRoute('/a', makeTable(load))
    expect(load).toHaveBeenCalledTimes(1)
    expect(module).toEqual({ default: 'Page A' })
  })

  it('une route inconnue charge la page « introuvable »', async () => {
    const table = makeTable(vi.fn())
    expect(await preloadRoute('/zzz', table)).toEqual({ default: 'nf' })
    expect(table[1].load).toHaveBeenCalledTimes(1)
  })

  it('un échec de chargement ne bloque pas : résultat nul, sans exception', async () => {
    const table = makeTable(vi.fn(async () => Promise.reject(new Error('réseau coupé'))))
    await expect(preloadRoute('/a', table)).resolves.toBeNull()
  })

  it('table sans route correspondante : nul', async () => {
    await expect(preloadRoute('/x', [])).resolves.toBeNull()
  })

  it('charge réellement les pages du site (modules valides)', async () => {
    for (const path of ['/', '/vehicules', '/contact', '/nimporte-quoi']) {
      const module = await preloadRoute(path)
      expect(typeof module.default, path).toBe('function')
    }
  })
})

describe('adresses mal formées ou avec paramètres', () => {
  it('une adresse mal encodée ne lève jamais d’exception', async () => {
    await expect(preloadRoute('/%E0%A4%A')).resolves.toBeDefined()
  })

  it('une adresse avec requête ou ancre (pathname seul) est reconnue', () => {
    expect(findRoute('/vehicules')?.key).toBe('catalogue')
  })
})

describe('page mémorisée : rendue sans écran de chargement', () => {
  beforeEach(() => forgetPages())

  // Route que les autres tests de ce fichier ne chargent jamais : la mémorisation est partagée par tout le module.
  const booking = lazyRoutes.find((r) => r.key === 'booking')
  const render = () =>
    renderToString(
      <StaticRouter location="/reservation">
        <Suspense fallback={<p>Chargement…</p>}>
          <booking.Component />
        </Suspense>
      </StaticRouter>,
    )

  it('avant préchargement, la page passe par React.lazy et affiche le chargement', () => {
    expect(isPageLoaded('booking')).toBe(false)
    expect(render()).toContain('Chargement…')
  })

  it('après préchargement, la page est rendue directement : le pied de page ne saute plus', async () => {
    await preloadRoute('/reservation')
    expect(isPageLoaded('booking')).toBe(true)
    const html = render()
    expect(html).not.toContain('Chargement…')
    expect(html).toContain('<h1')
  })

  it('rememberPage accepte les composants mémo (type objet valide) et refuse le reste', () => {
    rememberPage('memo', { default: memo(() => null) })
    expect(isPageLoaded('memo')).toBe(true)
    rememberPage('objet', { default: {} })
    expect(isPageLoaded('objet')).toBe(false)
  })

  it('forgetPages oublie toutes les pages (isolation des tests)', async () => {
    await preloadRoute('/reservation')
    expect(isPageLoaded('booking')).toBe(true)
    forgetPages()
    expect(isPageLoaded('booking')).toBe(false)
  })

  it('rememberPage ignore un module sans export par défaut ou invalide', () => {
    rememberPage('x', null)
    rememberPage('x', {})
    rememberPage('x', { default: 'pas une fonction' })
    expect(isPageLoaded('x')).toBe(false)
  })

  it('une table personnalisée ne mémorise rien dans la table réelle', async () => {
    await preloadRoute('/seule', [{ key: 'seule', path: '/seule', load: async () => ({ default: () => null }) }])
    expect(isPageLoaded('seule')).toBe(false)
  })
})

describe('pas de remontage de la page quand elle devient mémorisée (état conservé)', () => {
  beforeEach(() => {
    forgetPages()
    cleanup()
  })

  it('la page chargée par React.lazy reste montée aux rendus suivants', async () => {
    window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })
    const about = lazyRoutes.find((r) => r.key === 'about')
    const make = () => (
      <StaticRouter location="/a-propos">
        <Suspense fallback={<p>Chargement…</p>}>
          <about.Component />
        </Suspense>
      </StaticRouter>
    )
    const { rerender } = rtlRender(make())
    const h1 = await screen.findByRole('heading', { level: 1 })
    // Pendant ce montage, React.lazy vient de mémoriser la page : un rendu suivant ne doit PAS changer de composant.
    expect(isPageLoaded('about')).toBe(true)

    await act(async () => rerender(make()))
    expect(screen.getByRole('heading', { level: 1 })).toBe(h1)
  })

  it('si le cache est oublié après le montage, la page montée reste la même (choix fait une seule fois par montage)', async () => {
    // Page factice reconnaissable : si le composant changeait, le texte et le compteur de montages changeraient.
    let mounts = 0
    function Factice() {
      useEffect(() => {
        mounts += 1
      }, [])
      return <h1>page factice</h1>
    }
    rememberPage('about', { default: Factice })
    const about = lazyRoutes.find((r) => r.key === 'about')
    const make = () => (
      <StaticRouter location="/a-propos">
        <Suspense fallback={<p>Chargement…</p>}>
          <about.Component />
        </Suspense>
      </StaticRouter>
    )
    const { rerender } = rtlRender(make())
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('page factice')
    expect(mounts).toBe(1)

    // Le cache est oublié pendant que la page est affichée ; les rendus suivants ne doivent rien changer.
    forgetPages()
    await act(async () => rerender(make()))
    await act(async () => rerender(make()))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('page factice')
    expect(screen.queryByText('Chargement…')).toBeNull()
    expect(mounts).toBe(1)
  })

  it('une page préchargée est montée directement, et ne change pas non plus', async () => {
    await preloadRoute('/contact')
    const contact = lazyRoutes.find((r) => r.key === 'contact')
    const make = () => (
      <StaticRouter location="/contact">
        <Suspense fallback={<p>Chargement…</p>}>
          <contact.Component />
        </Suspense>
      </StaticRouter>
    )
    const { rerender } = rtlRender(make())
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(screen.queryByText('Chargement…')).toBeNull()
    await act(async () => rerender(make()))
    expect(screen.getByRole('heading', { level: 1 })).toBe(h1)
  })
})

