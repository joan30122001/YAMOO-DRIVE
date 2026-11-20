// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import PageTransition from './PageTransition.jsx'
import { duration, offset } from '../../styles/motion.js'

// Motion est remplacé par une div qui expose ses propriétés : on vérifie le contrat de la transition.
vi.mock('motion/react', () => ({
  m: {
    div: ({ initial, animate, transition, children }) => (
      <div
        data-testid="transition"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
      >
        {children}
      </div>
    ),
  },
}))

let reduced = false
function setEnv({ reducedMotion = false, cores = 8 } = {}) {
  reduced = reducedMotion
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? reduced : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: cores, configurable: true })
}

const props = () => {
  const el = screen.getByTestId('transition')
  return {
    initial: JSON.parse(el.dataset.initial),
    animate: JSON.parse(el.dataset.animate),
    transition: JSON.parse(el.dataset.transition),
  }
}

// Rend la transition sur la première page, puis (si `navigate`) après un changement de page.
const renderIt = ({ navigate = false } = {}) => {
  const out = render(
    <MemoryRouter initialEntries={['/a']}>
      <Link to="/b">aller</Link>
      <Routes>
        <Route
          path="*"
          element={
            <PageTransition>
              <p>contenu</p>
            </PageTransition>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
  if (navigate) act(() => fireEvent.click(screen.getByText('aller')))
  return out
}

beforeEach(() => setEnv())
afterEach(() => cleanup())

describe('PageTransition', () => {
  it('première page : aucune animation (son HTML prérendu est déjà à l’écran)', () => {
    renderIt()
    expect(props().initial).toBe(false)
    expect(screen.getByText('contenu')).toBeTruthy()
  })

  it('page suivante, appareil standard : fondu avec léger glissement, durée ≤ 400 ms', () => {
    renderIt({ navigate: true })
    const { initial, animate, transition } = props()
    expect(initial).toEqual({ opacity: 0, y: offset.rise / 2 })
    expect(animate).toEqual({ opacity: 1, y: 0 })
    expect(transition.duration).toBeGreaterThan(0)
    expect(transition.duration).toBeLessThanOrEqual(0.4)
    expect(transition.duration).toBe(duration.base)
    expect(screen.getByText('contenu')).toBeTruthy()
  })

  it('reduced : affichage immédiat (aucun état initial masqué, durée nulle)', () => {
    setEnv({ reducedMotion: true })
    renderIt({ navigate: true })
    expect(props().initial).toBe(false)
    expect(props().transition).toEqual({ duration: 0 })
  })

  it('lowPower : fondu seul, sans déplacement', () => {
    setEnv({ cores: 2 })
    renderIt({ navigate: true })
    expect(props().initial).toEqual({ opacity: 0, y: 0 })
  })

  it('aucune animation de sortie (la navigation n’est jamais retardée)', () => {
    renderIt({ navigate: true })
    expect(screen.getByTestId('transition').hasAttribute('data-exit')).toBe(false)
  })
})
