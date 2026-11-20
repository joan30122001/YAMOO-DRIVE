// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import Layout from './Layout.jsx'

let reduced = true
let nav
function Navigator() {
  nav = useNavigate()
  return null
}

function renderApp(initial = '/') {
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Navigator />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<h1>Accueil page</h1>} />
          <Route path="/contact" element={<h1>Contact page</h1>} />
          <Route path="/vehicules" element={<h1>Véhicules page</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const main = () => document.getElementById('contenu')
const transitionWrapper = () => main().querySelector('[style]')

beforeEach(() => {
  reduced = true
  window.scrollTo = vi.fn()
})
afterEach(() => cleanup())

describe('Layout : remise en haut et focus à la navigation', () => {
  it('premier rendu : ni défilement forcé ni vol de focus', () => {
    renderApp('/')
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(main())
  })

  it('navigation (PUSH) : page remise en haut et focus sur main', async () => {
    renderApp('/')
    act(() => nav('/contact'))
    expect(await screen.findByText('Contact page')).toBeTruthy()
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.activeElement).toBe(main())
  })

  it('remplacement (REPLACE) : remise en haut aussi', async () => {
    renderApp('/')
    act(() => nav('/contact', { replace: true }))
    await screen.findByText('Contact page')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('retour arrière (POP) : pas de remise en haut forcée, focus sur main', async () => {
    renderApp('/')
    act(() => nav('/contact'))
    await screen.findByText('Contact page')
    window.scrollTo.mockClear()
    act(() => nav(-1))
    await screen.findByText('Accueil page')
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(main())
  })

  it('autre page avec hachage : pas de remise en haut', async () => {
    renderApp('/')
    act(() => nav('/vehicules#liste'))
    await screen.findByText('Véhicules page')
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('même page, recherche seule (filtres) : ni défilement ni vol de focus', async () => {
    renderApp('/vehicules')
    act(() => nav('/vehicules?marque=x'))
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(main())
  })

  it('même page, ancre seule : ni défilement ni vol de focus', async () => {
    renderApp('/vehicules')
    act(() => nav('/vehicules#liste'))
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(main())
  })

  it('clic sur le lien de la page courante : rien ne bouge', async () => {
    renderApp('/vehicules')
    act(() => nav('/vehicules'))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('le focus sur main ne fait pas défiler', async () => {
    renderApp('/')
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    act(() => nav('/contact'))
    await screen.findByText('Contact page')
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    focus.mockRestore()
  })
})

describe('Layout : transition de page', () => {
  it('reduced : le contenu est visible immédiatement, sans déplacement', async () => {
    reduced = true
    renderApp('/')
    act(() => nav('/contact'))
    await screen.findByText('Contact page')
    const style = transitionWrapper().getAttribute('style')
    expect(style).toContain('opacity: 1')
  })

  it('chaque page est enveloppée dans une transition clé par route', async () => {
    renderApp('/')
    const first = transitionWrapper()
    act(() => nav('/contact'))
    await screen.findByText('Contact page')
    expect(transitionWrapper()).not.toBe(first)
  })
})

describe('Layout : menu mobile et focus (ordre des règles)', () => {
  it('lien du menu : le menu se ferme et le focus finit sur main, pas sur le bouton menu', async () => {
    renderApp('/')
    const toggle = screen.getAllByRole('button', { name: /menu/i })[0]
    fireEvent.click(toggle)
    const panel = await screen.findByRole('dialog')
    fireEvent.click(within(panel).getByRole('link', { name: 'Contact' }))

    await screen.findByText('Contact page')
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(main())
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})

describe('Layout : erreur de chargement', () => {
  it('une erreur de page ne survit pas à la navigation vers une autre page', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Boom() {
      throw new Error('chunk introuvable')
    }
    window.matchMedia = (query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })
    render(
      <MemoryRouter initialEntries={['/boom']}>
        <Navigator />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/boom" element={<Boom />} />
            <Route path="/contact" element={<h1>Contact page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toBeTruthy()

    act(() => nav('/contact'))
    expect(await screen.findByText('Contact page')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    errorSpy.mockRestore()
  })
})
