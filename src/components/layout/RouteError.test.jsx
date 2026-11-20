// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RouteError, { RouteErrorMessage } from './RouteError.jsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Boom() {
  throw new Error('chunk introuvable')
}

describe('RouteErrorMessage', () => {
  it('« Réessayer » déclenche l’action de nouvelle tentative', () => {
    const onRetry = vi.fn()
    render(<RouteErrorMessage onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('est annoncé comme une alerte et titré', () => {
    render(<RouteErrorMessage onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Impossible de charger cette page')
  })

  it('le bouton est un bouton contour de 44 px', () => {
    render(<RouteErrorMessage onRetry={() => {}} />)
    const classes = screen.getByRole('button').getAttribute('class').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['min-h-11', 'border-gold', 'rounded-sm']))
  })
})

describe('RouteError (barrière)', () => {
  it('affiche le message quand un enfant échoue et le journalise', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <RouteError>
        <Boom />
      </RouteError>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(logged.mock.calls.some((call) => String(call[0]).includes('Erreur de chargement de page'))).toBe(true)
  })

  it('laisse passer les enfants quand tout va bien', () => {
    render(
      <RouteError>
        <p>Page</p>
      </RouteError>,
    )
    expect(screen.getByText('Page')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('« Réessayer » recharge la page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', { value: { ...original, reload }, configurable: true })
    try {
      render(
        <RouteError>
          <Boom />
        </RouteError>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      Object.defineProperty(window, 'location', { value: original, configurable: true })
    }
  })
})
