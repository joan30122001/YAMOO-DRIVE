// Filtrage et tri du catalogue (AD-3 : pur, sans React). L'état vit dans l'adresse (URL) : lien partageable,
// bouton retour fonctionnel. Paramètres : q, categorie*, marque*, transmission*, chauffeur, prixmax, tri.

export const SORTS = [
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
]
export const DEFAULT_SORT = 'prix-asc'
export const DRIVER_OPTIONS = ['avec', 'sans']

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Lit les filtres depuis des URLSearchParams ; toute valeur inconnue ou invalide est ignorée. */
export function parseFilters(params) {
  const sort = params.get('tri')
  const driver = params.get('chauffeur')
  const maxPrice = Number(params.get('prixmax'))
  return {
    query: (params.get('q') ?? '').trim(),
    categories: params.getAll('categorie'),
    brands: params.getAll('marque'),
    transmissions: params.getAll('transmission'),
    driver: DRIVER_OPTIONS.includes(driver) ? driver : '',
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice) : 0,
    sort: SORTS.some((s) => s.value === sort) ? sort : DEFAULT_SORT,
  }
}

/** Écrit les filtres dans une copie des paramètres (les paramètres étrangers, ex. dates, sont conservés). */
export function writeFilters(params, filters) {
  const next = new URLSearchParams(params)
  for (const key of ['q', 'categorie', 'marque', 'transmission', 'chauffeur', 'prixmax', 'tri']) next.delete(key)
  if (filters.query) next.set('q', filters.query)
  filters.categories.forEach((value) => next.append('categorie', value))
  filters.brands.forEach((value) => next.append('marque', value))
  filters.transmissions.forEach((value) => next.append('transmission', value))
  if (filters.driver) next.set('chauffeur', filters.driver)
  if (filters.maxPrice) next.set('prixmax', String(filters.maxPrice))
  if (filters.sort !== DEFAULT_SORT) next.set('tri', filters.sort)
  return next
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.query ||
      filters.categories.length ||
      filters.brands.length ||
      filters.transmissions.length ||
      filters.driver ||
      filters.maxPrice,
  )
}

function matchesDriver(vehicle, driver) {
  if (!driver) return true
  return driver === 'avec' ? vehicle.services?.withDriver === true : vehicle.services?.selfDrive === true
}

/** Applique les filtres (ET entre critères, OU au sein d'un même critère) puis le tri. Ne modifie pas l'entrée. */
export function applyFilters(vehicles, filters) {
  const query = normalize(filters.query)
  const result = vehicles.filter((v) => {
    if (query && !normalize(`${v.brand} ${v.model} ${v.category}`).includes(query)) return false
    if (filters.categories.length && !filters.categories.includes(v.category)) return false
    if (filters.brands.length && !filters.brands.includes(v.brand)) return false
    if (filters.transmissions.length && !filters.transmissions.includes(v.transmission)) return false
    if (filters.maxPrice && !(v.dailyRateXAF <= filters.maxPrice)) return false
    return matchesDriver(v, filters.driver)
  })
  const direction = filters.sort === 'prix-desc' ? -1 : 1
  // Les véhicules sans tarif (« à compléter ») vont toujours en fin de liste.
  return result.sort((a, b) => {
    const pa = Number.isFinite(a.dailyRateXAF) ? a.dailyRateXAF : null
    const pb = Number.isFinite(b.dailyRateXAF) ? b.dailyRateXAF : null
    if (pa === null && pb === null) return 0
    if (pa === null) return 1
    if (pb === null) return -1
    return (pa - pb) * direction
  })
}

/** Valeurs distinctes d'un champ, triées, pour construire les listes de filtres depuis les données. */
export function distinctValues(vehicles, field) {
  return [...new Set(vehicles.map((v) => v[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
}
