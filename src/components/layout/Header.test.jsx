// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Header from './Header.jsx'
import { bookingLink, navLinks } from '../../navigation.js'

afterEach(() => cleanup())

const renderHeader = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  )

describe('Header : bouton « Réserver »', () => {
  it('est un vrai bouton : 44 px, angles quasi droits, contour ivoire fin, texte ivoire', () => {
    renderHeader()
    // Le panneau mobile est fermé : un seul lien « Réserver » dans l’en-tête.
    const link = screen.getByRole('link', { name: bookingLink.label })
    expect(link.getAttribute('href')).toBe(bookingLink.to)
    expect(link.getAttribute('class').split(/\s+/)).toEqual(
      expect.arrayContaining(['min-h-11', 'rounded-sm', 'border', 'border-ivory', 'text-ivory', 'text-button']),
    )
  })

  it('utilise la taille « compact » : un seul padding de base, plus large dès sm', () => {
    renderHeader()
    const padding = screen
      .getByRole('link', { name: bookingLink.label })
      .getAttribute('class')
      .split(/\s+/)
      .filter((c) => /(^|:)px-\d/.test(c))
    expect(padding).toEqual(['px-4', 'sm:px-6'])
  })

  it('porte un anneau de focus doré, visible sur le hero comme sur le fond noir', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: bookingLink.label }).getAttribute('class')).toContain('focus-visible:outline-gold')
  })
})

describe('Header : navigation centrée et lien actif', () => {
  const classesOf = (el) => el.getAttribute('class').split(/\s+/)

  it('à partir de 768 px : grille 1fr / auto / 1fr, donc liens exactement centrés', () => {
    const { container } = renderHeader()
    const row = container.querySelector('header > div')
    expect(classesOf(row)).toEqual(expect.arrayContaining(['md:grid', 'md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]']))
    const [logo, nav, actions] = row.children
    expect(logo.tagName).toBe('A')
    expect(nav.tagName).toBe('NAV')
    expect(classesOf(actions)).toContain('md:justify-self-end')
    expect(classesOf(logo)).toEqual(expect.arrayContaining(['md:order-2', 'md:justify-self-center']))
  })

  it('cibles de 44 px : liens de navigation et lien du logo (mesurés à 35 et 39 px dans Chrome avant correction)', () => {
    const { container } = renderHeader()
    for (const link of container.querySelectorAll('nav[aria-label="Navigation principale"] a')) {
      expect(classesOf(link), link.textContent).toEqual(expect.arrayContaining(['min-h-11', 'inline-flex', 'items-center']))
    }
    expect(classesOf(screen.getByRole('link', { name: /accueil/ }))).toEqual(expect.arrayContaining(['min-h-11', 'inline-flex']))
  })

  it('colonnes latérales de largeur égale quel que soit leur contenu (minmax(0,1fr), pas 1fr seul)', () => {
    const { container } = renderHeader()
    const row = container.querySelector('header > div')
    expect(classesOf(row).join(' ')).not.toMatch(/grid-cols-\[1fr_/)
  })

  it('le lien du logo ne porte pas de classes contradictoires (min-w-0 et shrink-0)', () => {
    renderHeader()
    const classes = classesOf(screen.getByRole('link', { name: /accueil/ }))
    expect(classes).toContain('shrink-0')
    expect(classes).not.toContain('min-w-0')
  })

  it('le lien « Accueil » est le seul à avoir `end` : « / » n’est pas actif sur les autres pages', () => {
    for (const link of navLinks) {
      if (link.to === '/') expect(link.end).toBe(true)
      else expect(link.end).toBeFalsy()
    }
  })

  it('« Véhicules » reste actif sur une fiche véhicule (route imbriquée)', () => {
    const { container } = renderHeader('/vehicules/range-rover-vogue-01')
    const active = container.querySelector('nav a[aria-current="page"]')
    expect(active.textContent).toBe('Véhicules')
  })

  it('la navigation en ligne contient les quatre liens et est masquée sous 768 px', () => {
    const { container } = renderHeader()
    const nav = container.querySelector('nav[aria-label="Navigation principale"]')
    expect(classesOf(nav)).toEqual(expect.arrayContaining(['hidden', 'md:block']))
    expect(nav.querySelectorAll('a')).toHaveLength(navLinks.length)
  })

  it.each([
    ['/', 'Accueil'],
    ['/vehicules', 'Véhicules'],
    ['/a-propos', 'À propos'],
    ['/contact', 'Contact'],
  ])('sur %s, seul « %s » est doré et souligné', (path, label) => {
    const { container } = renderHeader(path)
    const links = [...container.querySelectorAll('nav[aria-label="Navigation principale"] a')]
    for (const link of links) {
      const classes = classesOf(link)
      const active = link.textContent === label
      expect(classes.includes('text-gold') && classes.includes('underline'), link.textContent).toBe(active)
      expect(link.getAttribute('aria-current') === 'page', link.textContent).toBe(active)
    }
  })

  it('le trait souligné est doré, de 2 px, décalé du texte', () => {
    const { container } = renderHeader('/vehicules')
    const active = container.querySelector('nav a[aria-current="page"]')
    expect(classesOf(active)).toEqual(expect.arrayContaining(['underline', 'decoration-gold', 'decoration-2', 'underline-offset-8']))
  })

  it('un lien inactif n’est pas souligné', () => {
    const { container } = renderHeader('/vehicules')
    const inactive = [...container.querySelectorAll('nav a')].find((a) => a.textContent === 'Contact')
    expect(classesOf(inactive)).toContain('text-ivory')
    expect(classesOf(inactive)).not.toContain('underline')
  })

  it('sur une page inconnue, aucun lien n’est actif', () => {
    const { container } = renderHeader('/page-inconnue')
    expect(container.querySelectorAll('nav a[aria-current="page"]')).toHaveLength(0)
  })
})

