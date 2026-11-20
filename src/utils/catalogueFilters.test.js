import { describe, expect, it } from 'vitest'
import {
  applyFilters,
  DEFAULT_SORT,
  distinctValues,
  hasActiveFilters,
  parseFilters,
  writeFilters,
} from './catalogueFilters.js'

const car = (slug, o = {}) => ({
  slug,
  brand: 'Toyota',
  model: slug,
  category: 'Berline',
  transmission: 'Automatique',
  dailyRateXAF: 50000,
  services: { selfDrive: true, withDriver: false },
  ...o,
})
const none = parseFilters(new URLSearchParams())
const fleet = [
  car('a', { brand: 'Mercedes', model: 'Classe S', dailyRateXAF: 250000, services: { selfDrive: false, withDriver: true } }),
  car('b', { category: 'SUV / 4x4', dailyRateXAF: 120000, transmission: 'Manuelle' }),
  car('c', { dailyRateXAF: 30000 }),
  car('d', { dailyRateXAF: undefined }),
]

describe('parseFilters / writeFilters', () => {
  it('lit des valeurs par défaut sur une adresse vide', () => {
    expect(none).toEqual({ query: '', categories: [], brands: [], transmissions: [], driver: '', maxPrice: 0, sort: DEFAULT_SORT })
    expect(hasActiveFilters(none)).toBe(false)
  })

  it('ignore les valeurs invalides', () => {
    const f = parseFilters(new URLSearchParams('chauffeur=peut-etre&prixmax=abc&tri=hasard'))
    expect(f.driver).toBe('')
    expect(f.maxPrice).toBe(0)
    expect(f.sort).toBe(DEFAULT_SORT)
    expect(parseFilters(new URLSearchParams('prixmax=-5')).maxPrice).toBe(0)
  })

  it('fait un aller-retour sans perte et conserve les paramètres étrangers', () => {
    const params = new URLSearchParams('du=2030-01-10&categorie=Berline&categorie=SUV%20%2F%204x4&chauffeur=avec&prixmax=100000&tri=prix-desc&q=mer')
    const f = parseFilters(params)
    expect(f.categories).toEqual(['Berline', 'SUV / 4x4'])
    const out = writeFilters(params, f)
    expect(out.get('du')).toBe('2030-01-10')
    expect(parseFilters(out)).toEqual(f)
  })

  it('retire les filtres effacés mais garde les dates', () => {
    const out = writeFilters(new URLSearchParams('du=2030-01-10&categorie=Berline'), none)
    expect(out.toString()).toBe('du=2030-01-10')
  })
})

describe('applyFilters', () => {
  it('trie par prix croissant puis décroissant, sans tarif en fin de liste', () => {
    expect(applyFilters(fleet, none).map((v) => v.slug)).toEqual(['c', 'b', 'a', 'd'])
    expect(applyFilters(fleet, { ...none, sort: 'prix-desc' }).map((v) => v.slug)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('filtre par catégorie, marque et transmission', () => {
    expect(applyFilters(fleet, { ...none, categories: ['SUV / 4x4'] }).map((v) => v.slug)).toEqual(['b'])
    expect(applyFilters(fleet, { ...none, brands: ['Mercedes'] }).map((v) => v.slug)).toEqual(['a'])
    expect(applyFilters(fleet, { ...none, transmissions: ['Manuelle'] }).map((v) => v.slug)).toEqual(['b'])
  })

  it('combine les critères en ET et les valeurs d\'un critère en OU', () => {
    const f = { ...none, categories: ['SUV / 4x4', 'Berline'], brands: ['Mercedes'] }
    expect(applyFilters(fleet, f).map((v) => v.slug)).toEqual(['a'])
  })

  it('filtre par chauffeur', () => {
    expect(applyFilters(fleet, { ...none, driver: 'avec' }).map((v) => v.slug)).toEqual(['a'])
    expect(applyFilters(fleet, { ...none, driver: 'sans' }).map((v) => v.slug)).toEqual(['c', 'b', 'd'])
  })

  it('filtre par budget maximum (borne incluse) et écarte les véhicules sans tarif', () => {
    expect(applyFilters(fleet, { ...none, maxPrice: 120000 }).map((v) => v.slug)).toEqual(['c', 'b'])
  })

  it('recherche sans tenir compte de la casse ni des accents', () => {
    expect(applyFilters(fleet, { ...none, query: 'CLASSE s' }).map((v) => v.slug)).toEqual(['a'])
    expect(applyFilters([car('x', { model: 'Électra' })], { ...none, query: 'electra' })).toHaveLength(1)
  })

  it('ne modifie pas la liste d\'origine', () => {
    const copy = [...fleet]
    applyFilters(fleet, { ...none, sort: 'prix-desc' })
    expect(fleet).toEqual(copy)
  })
})

describe('distinctValues', () => {
  it('renvoie les valeurs uniques triées', () => {
    expect(distinctValues(fleet, 'brand')).toEqual(['Mercedes', 'Toyota'])
  })
})
