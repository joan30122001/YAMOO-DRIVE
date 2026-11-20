// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import Notice from './Notice.jsx'
import Panel from './Panel.jsx'
import copy from '../../data/copy.js'

afterEach(() => cleanup())

describe('Panel', () => {
  it('carte sombre à liseré, contenu affiché', () => {
    render(<Panel>Contenu</Panel>)
    const el = screen.getByText('Contenu')
    const classes = el.getAttribute('class').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['rounded-card', 'border', 'border-line', 'bg-carbon']))
  })

  it('titre : h2 par défaut, niveau réglable', () => {
    const { rerender } = render(<Panel title="Filtres">x</Panel>)
    expect(screen.getByRole('heading', { level: 2, name: 'Filtres' })).toBeTruthy()
    rerender(
      <Panel title="Filtres" titleAs="h3">
        x
      </Panel>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Filtres' })).toBeTruthy()
  })

  it('un panneau titré est nommé par son titre (région accessible)', () => {
    render(<Panel title="Récapitulatif">x</Panel>)
    expect(screen.getByRole('region', { name: 'Récapitulatif' })).toBeTruthy()
  })

  it('sans titre : aucun titre', () => {
    render(<Panel>x</Panel>)
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('élément et classes personnalisables', () => {
    const { container } = render(
      <Panel as="aside" className="lg:col-span-2" aria-label="Récapitulatif">
        x
      </Panel>,
    )
    expect(container.firstChild.tagName).toBe('ASIDE')
    expect(container.firstChild.getAttribute('class')).toContain('lg:col-span-2')
    expect(container.firstChild.getAttribute('class')).toContain('bg-carbon')
    expect(screen.getByLabelText('Récapitulatif')).toBeTruthy()
  })
})

describe('Notice', () => {
  it('est annoncée comme une note, bordure or profond sur fond surélevé', () => {
    render(<Notice>{copy.booking.notConfirmed}</Notice>)
    const note = screen.getByRole('note')
    const classes = note.getAttribute('class').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['border-gold-deep', 'bg-carbon-raised', 'rounded-card']))
    expect(note.textContent).toBe(copy.booking.notConfirmed)
  })

  it('le rôle « note » ne peut pas être écrasé par l’appelant', () => {
    render(<Notice role="alert">x</Notice>)
    expect(screen.getByRole('note')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('icône décorative masquée aux lecteurs d’écran', () => {
    const { container } = render(<Notice>x</Notice>)
    expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true')
  })

  it('affiche les deux avis du projet (non confirmée, prix confirmé par l’agence)', () => {
    render(
      <>
        <Notice>{copy.booking.notConfirmed}</Notice>
        <Notice>{copy.catalogueNotice}</Notice>
      </>,
    )
    expect(screen.getAllByRole('note')).toHaveLength(2)
    expect(screen.getByText(/non confirmée/)).toBeTruthy()
    expect(screen.getByText(/FCFA par jour/)).toBeTruthy()
  })

  it('classes personnalisables', () => {
    render(<Notice className="mt-4">x</Notice>)
    expect(screen.getByRole('note').getAttribute('class')).toContain('mt-4')
  })
})
