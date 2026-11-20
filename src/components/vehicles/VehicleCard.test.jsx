// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import VehicleCard from './VehicleCard.jsx'
import { formatPrice } from '../../utils/format.js'

// Véhicule défini dans le test : la carte ne dépend pas du contenu de vehicles.json.
const vehicle = {
  slug: 'range-rover-vogue-01',
  brand: 'Range Rover',
  model: 'Vogue',
  category: 'SUV / 4x4',
  seats: 5,
  transmission: 'Automatique',
  dailyRateXAF: 250000,
  driverSupplementXAF: 40000,
  services: { selfDrive: true, withDriver: true },
  specs: { Carburant: 'Diesel' },
  equipment: ['Climatisation'],
  images: { main: '/vehicles/placeholder-main.svg', gallery: ['/vehicles/placeholder-main.svg'] },
  conditions: ['Condition de démonstration'],
  isDemo: true,
  featured: false,
}

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <VehicleCard vehicle={vehicle} {...props} />
    </MemoryRouter>,
  )

afterEach(() => cleanup())

describe('VehicleCard : contenu', () => {
  it('affiche nom, catégorie, places, transmission et tarif', () => {
    renderCard()
    expect(screen.getByRole('heading', { level: 2, name: 'Range Rover Vogue' })).toBeTruthy()
    expect(screen.getByText('SUV / 4x4')).toBeTruthy()
    expect(screen.getByText(`${vehicle.seats} places`)).toBeTruthy()
    expect(screen.getByText(vehicle.transmission)).toBeTruthy()
    // Comparaison du texte exact : la bibliothèque de test normaliserait les espaces insécables.
    const price = screen.getByText((_, el) => el?.children.length === 0 && el.textContent === formatPrice(vehicle.dailyRateXAF))
    expect(price).toBeTruthy()
    expect(screen.getByText(/\/ jour/)).toBeTruthy()
  })

  it('« Voir les détails » mène à la fiche du véhicule et nomme le véhicule pour les lecteurs d’écran', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /Voir les détails/ })
    expect(link.getAttribute('href')).toBe('/vehicules/range-rover-vogue-01')
    expect(link.textContent).toContain('Range Rover Vogue')
  })

  it('ne présente aucune icône décorative aux lecteurs d’écran', () => {
    const { container } = renderCard()
    const svgs = [...container.querySelectorAll('svg')]
    expect(svgs.length).toBeGreaterThan(0)
    expect(svgs.every((svg) => svg.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})

describe('VehicleCard : styles typographiques du design', () => {
  const classesOf = (el) => (el.getAttribute('class') ?? '').split(/\s+/)

  it('catégorie en capitales dorées (text-label)', () => {
    renderCard()
    const category = screen.getByText('SUV / 4x4')
    expect(classesOf(category)).toEqual(expect.arrayContaining(['text-label', 'text-gold', 'uppercase']))
  })

  it('nom en police d’affichage légère, prix en price, « / jour » en body-sm argent', () => {
    renderCard()
    expect(classesOf(screen.getByRole('heading', { level: 2 }))).toEqual(expect.arrayContaining(['font-display', 'font-light']))
    const price = screen.getByText((_, el) => el?.children.length === 0 && /FCFA$/.test(el.textContent))
    expect(classesOf(price)).toEqual(expect.arrayContaining(['font-display', 'text-price', 'text-ivory']))
    expect(classesOf(screen.getByText(/\/ jour/))).toEqual(expect.arrayContaining(['text-body-sm', 'text-silver']))
  })

  it('aucune taille de texte écrite en dur (text-xs, text-sm, text-xl, text-2xl)', () => {
    const { container } = renderCard()
    expect(container.innerHTML).not.toMatch(/class="[^"]*\btext-(xs|sm|base|lg|xl|2xl|3xl)\b/)
  })

  it('bouton « Voir les détails » : contour doré de 44 px', () => {
    renderCard()
    expect(classesOf(screen.getByRole('link', { name: /Voir les détails/ }))).toEqual(
      expect.arrayContaining(['border-gold', 'text-gold', 'min-h-11', 'rounded-sm']),
    )
  })
})

describe('VehicleCard : cas limites', () => {
  it('« 1 place » au singulier', () => {
    renderCard({ vehicle: { ...vehicle, seats: 1 } })
    expect(screen.getByText('1 place')).toBeTruthy()
    expect(screen.queryByText('1 places')).toBeNull()
  })

  it('tarif invalide : « Tarif à compléter » plutôt qu’un « / jour » sans montant', () => {
    renderCard({ vehicle: { ...vehicle, dailyRateXAF: NaN } })
    expect(screen.getByText('Tarif à compléter')).toBeTruthy()
    expect(screen.queryByText(/\/ jour/)).toBeNull()
  })

  it('la ligne prix/bouton passe à la ligne sur écran étroit (pas de débordement à 320 px)', () => {
    const { container } = renderCard()
    const row = container.querySelector('p.min-w-0').parentElement
    expect(row.getAttribute('class')).toContain('flex-wrap')
  })
})

describe('VehicleCard : image', () => {
  it('réserve ses dimensions, décrit l’image et se charge en différé par défaut', () => {
    renderCard()
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe(vehicle.images.main)
    expect(img.getAttribute('width')).toBe('800')
    expect(img.getAttribute('height')).toBe('450')
    expect(img.getAttribute('alt')).toContain('Range Rover Vogue')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('decoding')).toBe('async')
  })

  it('priority : chargement immédiat en haute priorité', () => {
    renderCard({ priority: true })
    const img = screen.getByRole('img')
    expect(img.getAttribute('loading')).toBe('eager')
    expect(img.getAttribute('fetchpriority')).toBe('high')
  })

  it('par défaut : pas de priorité déclarée', () => {
    renderCard()
    expect(screen.getByRole('img').hasAttribute('fetchpriority')).toBe(false)
  })
})

describe('VehicleCard : effets (survol, focus, tactile, animations réduites)', () => {
  const classesOf = (el) => (el.getAttribute('class') ?? '').split(/\s+/)

  it('carte sans bordure ni cadre : elle se distingue par son fond, pas par un liseré', () => {
    renderCard()
    const classes = classesOf(screen.getByRole('article')).join(' ')
    expect(classes).toContain('bg-carbon')
    expect(classes).not.toMatch(/(^| )border( |$)/)
  })

  it('le bouton, lui, passe en or plein au survol et au focus de la carte', () => {
    renderCard()
    const button = screen.getByRole('link', { name: /Voir les détails/ })
    expect(classesOf(button)).toEqual(expect.arrayContaining(['group-hover:bg-gold', 'group-focus-within:bg-gold']))
  })

  it('zoom léger de l’image, seulement hors animations réduites', () => {
    renderCard()
    const classes = classesOf(screen.getByRole('img'))
    expect(classes).toContain('motion-safe:group-hover:scale-105')
    expect(classes).toContain('motion-safe:group-focus-within:scale-105')
    expect(classes).toContain('motion-safe:transition-transform')
    // Aucun zoom hors `motion-safe` : sans la préférence « réduire les animations », rien ne bouge.
    expect(classes.filter((c) => /scale-/.test(c) && !c.startsWith('motion-safe:'))).toEqual([])
  })

  it('flèche du bouton animée, seulement hors animations réduites', () => {
    renderCard()
    const arrow = screen.getByRole('link', { name: /Voir les détails/ }).querySelector('svg')
    const classes = classesOf(arrow)
    expect(classes).toContain('motion-safe:group-hover:translate-x-1')
    expect(classes).toContain('motion-safe:group-focus-within:translate-x-1')
    expect(classes.filter((c) => /translate-/.test(c) && !c.startsWith('motion-safe:'))).toEqual([])
  })

  it('le focus clavier produit les mêmes effets que le survol (bouton rempli, anneau doré)', () => {
    renderCard()
    const linkClasses = classesOf(screen.getByRole('link', { name: /Voir les détails/ }))
    expect(linkClasses).toContain('group-focus-within:bg-gold')
    expect(linkClasses).toContain('group-focus-within:text-on-gold')
    const cardClasses = classesOf(screen.getByRole('article'))
    expect(cardClasses).toContain('has-[:focus-visible]:ring-2')
    expect(cardClasses).toContain('has-[:focus-visible]:ring-gold')
  })

  it('toute la carte est cliquable via le lien (zone étendue)', () => {
    renderCard()
    const classes = classesOf(screen.getByRole('link', { name: /Voir les détails/ }))
    expect(classes).toContain('after:absolute')
    expect(classes).toContain('after:inset-0')
    expect(classesOf(screen.getByRole('article'))).toContain('relative')
  })
})
