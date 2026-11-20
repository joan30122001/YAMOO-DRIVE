// Schéma des véhicules : validation pure, partagée par le dépôt (développement) et les tests.

export const CATEGORIES = ['SUV / 4x4', 'Pick-up']
export const TRANSMISSIONS = ['Automatique', 'Manuelle']

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_FEATURED = 3
const MAX_RATE_XAF = 10_000_000

// Champs autorisés : une faute de frappe (ex. « feautred ») est signalée au lieu d'être ignorée.
const ALLOWED_KEYS = [
  'slug', 'brand', 'model', 'category', 'seats', 'transmission', 'dailyRateXAF', 'driverSupplementXAF',
  'services', 'specs', 'equipment', 'images', 'conditions', 'isDemo', 'featured',
]
const SERVICE_KEYS = ['selfDrive', 'withDriver']

// Chemin local uniquement : absolu, sans « // » initial (hôte externe) ni « .. ».
const isLocalPath = (v) => isText(v) && /^\/(?!\/)/.test(v) && !v.includes('..') && !/\s/.test(v)

const isText = (v) => typeof v === 'string' && v.trim() !== ''
const isInt = (v) => Number.isSafeInteger(v)
const isTextList = (v) => Array.isArray(v) && v.length > 0 && v.every(isText)

/** Contrôles d'un véhicule : renvoie la liste des problèmes `{ field, message }`. */
function checkVehicle(v) {
  const problems = []
  const bad = (field, message) => problems.push({ field, message })

  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    return [{ field: '(véhicule)', message: 'doit être un objet' }]
  }

  for (const key of Object.keys(v)) {
    if (!ALLOWED_KEYS.includes(key)) bad(key, 'champ inconnu (faute de frappe ?)')
  }

  if (!isText(v.slug) || !SLUG_RE.test(v.slug)) bad('slug', 'texte en kebab-case requis (ex. jetour-x50)')
  if (!isText(v.brand)) bad('brand', 'texte requis')
  if (!isText(v.model)) bad('model', 'texte requis')
  if (!CATEGORIES.includes(v.category)) bad('category', `valeur parmi : ${CATEGORIES.join(', ')}`)
  if (!isInt(v.seats) || v.seats < 1 || v.seats > 9) bad('seats', 'entier de 1 à 9 requis')
  if (!TRANSMISSIONS.includes(v.transmission)) bad('transmission', `valeur parmi : ${TRANSMISSIONS.join(', ')}`)
  if (!isInt(v.dailyRateXAF) || v.dailyRateXAF <= 0 || v.dailyRateXAF > MAX_RATE_XAF) {
    bad('dailyRateXAF', `entier de 1 à ${MAX_RATE_XAF} requis`)
  }
  if (!isInt(v.driverSupplementXAF) || v.driverSupplementXAF < 0) bad('driverSupplementXAF', 'entier ≥ 0 requis')

  const s = v.services
  if (!s || typeof s !== 'object' || Array.isArray(s) || typeof s.selfDrive !== 'boolean' || typeof s.withDriver !== 'boolean') {
    bad('services', '{ selfDrive, withDriver } booléens requis')
  } else {
    for (const key of Object.keys(s)) {
      if (!SERVICE_KEYS.includes(key)) bad('services', `clé inconnue « ${key} »`)
    }
    if (!s.selfDrive && !s.withDriver) {
      bad('services', 'au moins un service (sans ou avec chauffeur) doit être proposé')
    }
    // Le supplément n'existe que si le client peut choisir entre sans et avec chauffeur.
    // Chauffeur obligatoire (selfDrive faux) : le tarif journalier l'inclut. Chauffeur absent : rien à facturer.
    if ((!s.selfDrive || !s.withDriver) && v.driverSupplementXAF !== 0) {
      bad('driverSupplementXAF', 'doit valoir 0 quand le véhicule n’est pas proposé à la fois avec et sans chauffeur')
    }
  }

  if (!v.specs || typeof v.specs !== 'object' || Array.isArray(v.specs)) {
    bad('specs', 'objet requis')
  } else if (Object.keys(v.specs).length === 0) {
    bad('specs', 'au moins une caractéristique requise')
  } else if (!Object.values(v.specs).every(isText)) {
    bad('specs', 'toutes les valeurs doivent être des textes non vides')
  }

  if (!isTextList(v.equipment)) bad('equipment', 'liste de textes non vide requise')

  const img = v.images
  if (!img || typeof img !== 'object' || Array.isArray(img)) {
    bad('images', 'objet { main, gallery } requis')
  } else {
    if (!isLocalPath(img.main)) bad('images.main', 'chemin local absolu requis (ex. /vehicles/x.svg), sans « // » ni « .. »')
    if (!Array.isArray(img.gallery) || !img.gallery.every(isLocalPath)) {
      bad('images.gallery', 'liste de chemins locaux absolus requise')
    }
  }

  if (!isTextList(v.conditions)) bad('conditions', 'liste de textes non vide requise')
  if (typeof v.isDemo !== 'boolean') bad('isDemo', 'booléen requis')
  if (typeof v.featured !== 'boolean') bad('featured', 'booléen requis')

  return problems
}

/**
 * Valide une liste de véhicules.
 * @returns {string[]} messages d'erreur citant le véhicule et le champ ; vide si tout est valide.
 */
export function validateVehicles(list) {
  if (!Array.isArray(list)) return ['La liste des véhicules doit être un tableau.']

  const errors = []
  const seen = new Map()

  list.forEach((vehicle, index) => {
    const label = isText(vehicle?.slug) ? vehicle.slug : `#${index + 1}`

    for (const { field, message } of checkVehicle(vehicle)) {
      errors.push(`Véhicule « ${label} » : champ « ${field} » — ${message}`)
    }

    if (isText(vehicle?.slug)) {
      if (seen.has(vehicle.slug)) {
        errors.push(`Véhicule « ${label} » : champ « slug » — dupliqué (déjà utilisé par l'entrée #${seen.get(vehicle.slug)})`)
      } else {
        seen.set(vehicle.slug, index + 1)
      }
    }
  })

  const featured = list.filter((vehicle) => vehicle?.featured === true).length
  if (featured > MAX_FEATURED) {
    errors.push(`Liste : ${featured} véhicules « featured » ; au plus ${MAX_FEATURED} (l'accueil en affiche ${MAX_FEATURED})`)
  }

  return errors
}
