// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Catalogue from './Catalogue.jsx'
import copy from '../data/copy.js'
import seo from '../data/seo.js'
import { getVehicles } from '../data/vehicleRepository.js'

const renderPage = (url = '/vehicules') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Catalogue />
    </MemoryRouter>,
  )

afterEach(() => cleanup())

const byPrice = () =>
  getVehicles()
    .sort((a, b) => a.dailyRateXAF - b.dailyRateXAF)

const cardTitles = () => screen.getAllByRole('article').map((card) => within(card).getByRole('heading', { level: 2 }).textContent)

describe('Catalogue', () => {
  it('affiche une carte par véhicule, du moins cher au plus cher par défaut', () => {
    renderPage()
    const expected = byPrice().map((v) => `${v.brand} ${v.model}`)
    expect(cardTitles()).toEqual(expected)
    expect(screen.getAllByRole('article')).toHaveLength(expected.length)
  })

  it('structure de titres : un seul h1, puis un h2 par véhicule', () => {
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Nos véhicules')
  })

  it('affiche son introduction et met « véhicules » en or dans le titre', () => {
    renderPage()
    expect(screen.getByText(copy.catalogueIntro)).toBeTruthy()
    const accent = screen.getByRole('heading', { level: 1 }).querySelector('span')
    expect(accent.textContent).toBe('véhicules')
    expect(accent.getAttribute('class')).toContain('text-gold')
  })

  it('indique que le prix final est confirmé par l’agence', () => {
    renderPage()
    const note = screen.getByRole('note')
    expect(note.textContent).toBe(copy.catalogueNotice)
    expect(note.textContent).toMatch(/FCFA par jour/)
  })

  it('charge en priorité la première image (LCP), les autres en différé', () => {
    renderPage()
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThan(3)
    expect(images[0].getAttribute('loading')).toBe('eager')
    expect(images[0].getAttribute('fetchpriority')).toBe('high')
    for (const img of images.slice(1)) {
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img.hasAttribute('fetchpriority')).toBe(false)
    }
    expect(images.length).toBe(getVehicles().length)
  })

  it('fournit son propre titre et sa description (seo.catalogue)', () => {
    renderPage()
    expect(document.title).toBe(`${seo.catalogue.title} — YAMOO DRIVE`)
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(seo.catalogue.description)
  })

  it('chaque carte mène à la fiche de son véhicule', () => {
    renderPage()
    const hrefs = screen
      .getAllByRole('link', { name: /Voir les détails/ })
      .map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(byPrice().map((v) => `/vehicules/${v.slug}`))
  })

  it('grille : une colonne par défaut, deux dès sm, trois dès xl', () => {
    renderPage()
    const list = screen.getAllByRole('list').find((el) => el.className.includes('grid'))
    const classes = list.className.split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['grid', 'grid-cols-1', 'sm:grid-cols-2', 'xl:grid-cols-3']))
    expect(within(list).getAllByRole('article')).toHaveLength(getVehicles().length)
  })
})

describe('Catalogue : filtres, recherche et tri', () => {
  it('filtre par catégorie depuis l’adresse et annonce le nombre de résultats', () => {
    renderPage('/vehicules?categorie=Pick-up')
    expect(cardTitles().sort()).toEqual(['JMC Grand Avenue', 'JMC Vigus'])
    expect(screen.getByRole('status').textContent).toMatch(/^2 véhicules correspondent/)
  })

  it('cocher une catégorie filtre la grille, la décocher la rétablit', () => {
    renderPage()
    const box = screen.getByRole('checkbox', { name: 'Pick-up' })
    fireEvent.click(box)
    expect(cardTitles().sort()).toEqual(['JMC Grand Avenue', 'JMC Vigus'])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pick-up' }))
    expect(screen.getAllByRole('article')).toHaveLength(getVehicles().length)
  })

  it('trie par prix décroissant', () => {
    renderPage()
    fireEvent.click(screen.getByRole('combobox', { name: 'Trier par' }))
    fireEvent.click(screen.getByRole('option', { name: /décroissant/i }))
    const price = (name) => {
      const v = getVehicles().find((x) => `${x.brand} ${x.model}` === name)
      return v.dailyRateXAF
    }
    const prices = cardTitles().map(price)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
    expect(prices[0]).toBe(Math.max(...getVehicles().map((v) => v.dailyRateXAF)))
  })

  it('recherche un véhicule sans tenir compte des accents ni de la casse', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Rechercher un véhicule'), { target: { value: 'DASHING' } })
    expect(cardTitles()).toEqual(['Jetour Dashing'])
  })

  it('sans résultat : message clair et bouton de réinitialisation qui rétablit la liste', () => {
    renderPage('/vehicules?q=zzzz')
    expect(screen.getByText('Aucun véhicule ne correspond à ces critères.')).toBeTruthy()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }))
    expect(screen.getAllByRole('article')).toHaveLength(getVehicles().length)
  })

  it('les cases cochées reflètent l’adresse (état partageable)', () => {
    renderPage('/vehicules?marque=JMC&transmission=Automatique')
    expect(screen.getByRole('checkbox', { name: 'JMC' }).checked).toBe(true)
    expect(screen.getByRole('checkbox', { name: 'Jetour' }).checked).toBe(false)
    expect(cardTitles().every((t) => t.startsWith('JMC'))).toBe(true)
  })
})

describe('Catalogue vide', () => {
  afterEach(() => {
    vi.doUnmock('../data/vehicleRepository.js')
    vi.resetModules()
  })

  it('explique l’absence de véhicule au lieu d’afficher une liste vide', async () => {
    vi.resetModules()
    vi.doMock('../data/vehicleRepository.js', () => ({ getVehicles: () => [] }))
    const { default: EmptyCatalogue } = await import('./Catalogue.jsx')
    render(
      <MemoryRouter>
        <EmptyCatalogue />
      </MemoryRouter>,
    )
    expect(screen.getByText(copy.catalogueEmpty)).toBeTruthy()
    const action = screen.getByRole('link', { name: copy.catalogueEmptyAction })
    expect(action.getAttribute('href')).toBe('/contact')
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.queryAllByRole('list')).toHaveLength(0)
    expect(screen.getByRole('note').textContent).toBe(copy.catalogueNotice)
  })
})
