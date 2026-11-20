// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router'
import MobileMenu from './MobileMenu.jsx'
import { bookingLink, navLinks } from '../../navigation.js'

// matchMedia simulé : animations réduites (durée 0) et largeur pilotable.
let desktopListeners
function mockMatchMedia({ desktop = false, reduced = true } = {}) {
  desktopListeners = new Set()
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : desktop,
    media: query,
    addEventListener: (_type, fn) => query.includes('min-width') && desktopListeners.add(fn),
    removeEventListener: (_type, fn) => desktopListeners.delete(fn),
    addListener() {},
    removeListener() {},
  })
}

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

let navigateFromOutside
function Navigator() {
  navigateFromOutside = useNavigate()
  return null
}

function setup(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Navigator />
      <MobileMenu />
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

const toggle = () => screen.getAllByRole('button', { name: /menu/i })[0]
const dialog = () => screen.queryByRole('dialog')

beforeEach(() => {
  document.body.style.overflow = ''
  mockMatchMedia()
})
afterEach(() => cleanup())

describe('MobileMenu', () => {
  it('fermé au départ : bouton « Ouvrir le menu », aria-expanded=false, pas de panneau', () => {
    setup()
    expect(toggle().getAttribute('aria-label')).toBe('Ouvrir le menu')
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    expect(dialog()).toBeNull()
  })

  it('ouverture : panneau modal, liens, « Réserver », focus dedans, page non défilante', async () => {
    setup()
    fireEvent.click(toggle())

    const panel = await screen.findByRole('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    expect(toggle().getAttribute('aria-controls')).toBe(panel.id)

    for (const { label } of navLinks) {
      expect(within(panel).getByRole('link', { name: label })).toBeTruthy()
    }
    expect(within(panel).getByRole('link', { name: bookingLink.label }).getAttribute('href')).toBe(bookingLink.to)

    expect(panel.contains(document.activeElement)).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('Échap ferme le menu, rend le focus au bouton et rétablit le défilement', async () => {
    setup()
    fireEvent.click(toggle())
    await screen.findByRole('dialog')

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).toBe(toggle())
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')
  })

  it('le bouton de fermeture ferme le menu', async () => {
    setup()
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    fireEvent.click(within(panel).getByRole('button', { name: 'Fermer le menu' }))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).toBe(toggle())
  })

  it('un clic sur un lien navigue et ferme le menu', async () => {
    setup('/')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')

    fireEvent.click(within(panel).getByRole('link', { name: 'Contact' }))

    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.getByTestId('where').textContent).toBe('/contact')
    expect(document.body.style.overflow).toBe('')
  })

  it('« Réserver » navigue vers la réservation et ferme le menu', async () => {
    setup('/')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    fireEvent.click(within(panel).getByRole('link', { name: bookingLink.label }))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.getByTestId('where').textContent).toBe(bookingLink.to)
  })

  it('piège de focus : Tab sur le dernier élément revient au premier, Maj+Tab inversement', async () => {
    setup()
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    const items = [...panel.querySelectorAll('a[href], button:not([disabled])')]
    const first = items[0]
    const last = items[items.length - 1]

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('si le focus sort du panneau, Tab le ramène dedans', async () => {
    setup()
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    ;(document.activeElement instanceof HTMLElement ? document.activeElement : document.body).blur()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(panel.contains(document.activeElement)).toBe(true)
  })

  it('passage en affichage large : le menu se ferme', async () => {
    setup()
    fireEvent.click(toggle())
    await screen.findByRole('dialog')

    act(() => desktopListeners.forEach((fn) => fn({ matches: true })))

    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('démontage menu ouvert : le défilement du body est rétabli', async () => {
    const { unmount } = setup()
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('restaure la valeur d’overflow qui précédait l’ouverture', async () => {
    document.body.style.overflow = 'scroll'
    setup()
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('le lien de la page courante est signalé dans le menu', async () => {
    setup('/a-propos')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    expect(within(panel).getByRole('link', { name: 'À propos' }).getAttribute('aria-current')).toBe('page')
    expect(within(panel).getByRole('link', { name: 'Accueil' }).getAttribute('aria-current')).toBeNull()
  })

  it('une navigation vers une autre page ferme le menu et laisse le focus à la page (useRouteChange)', async () => {
    setup('/')
    fireEvent.click(toggle())
    await screen.findByRole('dialog')

    act(() => navigateFromOutside('/contact'))

    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).not.toBe(toggle())
  })

  it('un changement de recherche seul ferme le menu et rend le focus au bouton', async () => {
    setup('/')
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    act(() => navigateFromOutside('/?x=1'))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).toBe(toggle())
  })

  it('un clic sur un lien du panneau ne focalise pas le bouton menu', async () => {
    setup('/')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    fireEvent.click(within(panel).getByRole('link', { name: 'Contact' }))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).not.toBe(toggle())
  })

  it('un changement de recherche ou de hachage ferme aussi le menu', async () => {
    setup('/')
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    act(() => navigateFromOutside('/?x=1#haut'))
    await waitFor(() => expect(dialog()).toBeNull())
  })

  it('naviguer menu fermé ne déplace pas le focus', () => {
    setup('/')
    const other = document.createElement('button')
    document.body.appendChild(other)
    other.focus()
    act(() => navigateFromOutside('/contact'))
    expect(document.activeElement).toBe(other)
    other.remove()
  })

  it('aria-controls n’existe que lorsque le panneau est monté', async () => {
    setup()
    expect(toggle().hasAttribute('aria-controls')).toBe(false)
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    expect(toggle().hasAttribute('aria-controls')).toBe(true)
  })

  it('refuse de rester ouvert si l’écran est déjà large', async () => {
    mockMatchMedia({ desktop: true })
    setup()
    fireEvent.click(toggle())
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('anciens navigateurs : repli sur addListener', async () => {
    const listeners = new Set()
    window.matchMedia = (query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addListener: (fn) => query.includes('min-width') && listeners.add(fn),
      removeListener: (fn) => listeners.delete(fn),
    })
    setup()
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    expect(listeners.size).toBe(1)
    act(() => listeners.forEach((fn) => fn({ matches: true })))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(listeners.size).toBe(0)
  })

  it('un lien vers la page courante ferme le menu et rend le focus au bouton (pas de focus perdu)', async () => {
    setup('/contact')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    fireEvent.click(within(panel).getByRole('link', { name: 'Contact' }))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).toBe(toggle())
  })

  it('un lien vers une autre page ne focalise pas le bouton (la page prend le focus)', async () => {
    setup('/contact')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    fireEvent.click(within(panel).getByRole('link', { name: 'Accueil' }))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).not.toBe(toggle())
  })

  it('passage en affichage large : le focus va au contenu principal (le bouton menu est masqué)', async () => {
    const main = document.createElement('main')
    main.id = 'contenu'
    main.tabIndex = -1
    document.body.appendChild(main)
    setup('/')
    fireEvent.click(toggle())
    await screen.findByRole('dialog')
    act(() => desktopListeners.forEach((fn) => fn({ matches: true })))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(document.activeElement).toBe(main)
    main.remove()
  })

  it('le panneau affiche le wordmark, lien d’accueil qui ferme le menu', async () => {
    setup('/contact')
    fireEvent.click(toggle())
    const panel = await screen.findByRole('dialog')
    const home = within(panel).getByRole('link', { name: 'YAMOO DRIVE, accueil' })
    expect(home.getAttribute('href')).toBe('/')
    expect(home.querySelector('img')?.getAttribute('src')).toBe('/images/logo.png')

    fireEvent.click(home)
    await waitFor(() => expect(dialog()).toBeNull())
    expect(screen.getByTestId('where').textContent).toBe('/')
  })
})
