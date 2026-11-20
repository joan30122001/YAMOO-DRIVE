import { describe, expect, it } from 'vitest'
import { buildCatalogueUrl, daysBetween, todayISO, validateSearch } from './search.js'

const TODAY = '2030-06-10'

describe('todayISO', () => {
  it('donne la date locale au format AAAA-MM-JJ', () => {
    expect(todayISO(new Date(2030, 5, 10, 23, 30))).toBe('2030-06-10')
    expect(todayISO(new Date(2030, 0, 1, 0, 5))).toBe('2030-01-01')
  })
})

describe('validateSearch', () => {
  it('accepte une recherche vide (les dates sont facultatives)', () => {
    expect(validateSearch({}, TODAY)).toEqual({})
    expect(validateSearch(undefined, TODAY)).toEqual({})
  })
  it('accepte des dates cohérentes, y compris aujourd’hui', () => {
    expect(validateSearch({ from: TODAY, to: '2030-06-11' }, TODAY)).toEqual({})
  })
  it('refuse un départ ou un retour dans le passé', () => {
    expect(validateSearch({ from: '2030-06-09' }, TODAY).from).toMatch(/passé/)
    expect(validateSearch({ from: TODAY, to: '2030-06-09' }, TODAY).to).toMatch(/passé/)
  })
  it('refuse un retour sans départ, égal ou antérieur au départ', () => {
    expect(validateSearch({ to: '2030-06-12' }, TODAY).from).toBeDefined()
    expect(validateSearch({ from: '2030-06-12', to: '2030-06-12' }, TODAY).to).toMatch(/suivre/)
    expect(validateSearch({ from: '2030-06-12', to: '2030-06-11' }, TODAY).to).toMatch(/suivre/)
  })
  it('refuse des dates impossibles ou mal formées', () => {
    expect(validateSearch({ from: '2030-02-30' }, TODAY).from).toMatch(/invalide/)
    expect(validateSearch({ from: 'demain' }, TODAY).from).toMatch(/invalide/)
  })
})

describe('daysBetween', () => {
  it('compte les jours entiers', () => {
    expect(daysBetween('2030-06-10', '2030-06-13')).toBe(3)
  })
  it('renvoie 0 si une date est invalide', () => {
    expect(daysBetween('x', '2030-06-13')).toBe(0)
  })
})

describe('buildCatalogueUrl', () => {
  it('ne transmet que les champs renseignés', () => {
    expect(buildCatalogueUrl({})).toBe('/vehicules')
    expect(buildCatalogueUrl({ category: 'Berline' })).toBe('/vehicules?categorie=Berline')
  })
  it('encode la catégorie et transmet ville, dates et type de location', () => {
    const url = buildCatalogueUrl({ category: 'SUV / 4x4', city: 'Douala', from: '2030-06-12', to: '2030-06-15', driver: 'avec' })
    const params = new URL(url, 'http://x').searchParams
    expect(params.get('categorie')).toBe('SUV / 4x4')
    expect(params.get('ville')).toBe('Douala')
    expect(params.get('du')).toBe('2030-06-12')
    expect(params.get('au')).toBe('2030-06-15')
    expect(params.get('chauffeur')).toBe('avec')
  })
  it('ignore un type de location inconnu', () => {
    expect(buildCatalogueUrl({ driver: 'peut-être' })).toBe('/vehicules')
  })
})
