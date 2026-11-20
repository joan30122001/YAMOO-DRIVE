// Recherche rapide de l'accueil : validation et construction de l'adresse du catalogue (AD-3 : pur, sans React).

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Date du jour au format AAAA-MM-JJ, dans le fuseau du navigateur (ou `now` fourni, pour les tests). */
export function todayISO(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/**
 * Valide les dates de la recherche rapide. Les dates sont facultatives, mais si elles sont données elles doivent
 * être cohérentes : valides, pas dans le passé, retour strictement après la prise en charge.
 * @returns {{ from?: string, to?: string }} messages d'erreur par champ ; objet vide si tout est valide.
 */
export function validateSearch({ from = '', to = '' } = {}, today = todayISO()) {
  const errors = {}

  if (from && !isValidDate(from)) errors.from = 'Date de prise en charge invalide.'
  else if (from && from < today) errors.from = 'La date de prise en charge ne peut pas être dans le passé.'

  if (to && !isValidDate(to)) errors.to = 'Date de retour invalide.'
  else if (to && to < today) errors.to = 'La date de retour ne peut pas être dans le passé.'
  else if (to && !from) errors.from = 'Indiquez la date de prise en charge.'
  else if (to && from && !errors.from && to <= from) errors.to = 'La date de retour doit suivre la date de prise en charge.'

  return errors
}

/** Nombre de jours entiers entre deux dates AAAA-MM-JJ (0 si l'une est invalide). */
export function daysBetween(from, to) {
  if (!isValidDate(from) || !isValidDate(to)) return 0
  return Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / DAY_MS)
}

/**
 * Adresse du catalogue pour une recherche rapide. Seuls les champs renseignés sont transmis ; la ville, les dates
 * et la catégorie suivent le visiteur jusqu'à la réservation.
 */
export function buildCatalogueUrl({ city = '', from = '', to = '', category = '', driver = '' } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('categorie', category)
  if (driver === 'avec' || driver === 'sans') params.set('chauffeur', driver)
  if (city) params.set('ville', city)
  if (from) params.set('du', from)
  if (to) params.set('au', to)
  const query = params.toString()
  return query ? `/vehicules?${query}` : '/vehicules'
}
