// Dépôt de données véhicules (AD-1) : seul point de lecture de vehicles.json.
// Pour passer à une API plus tard, remplacer ce module sans toucher aux pages.
import rawVehicles from './vehicles.json'
import { validateVehicles } from './vehicleSchema.js'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

// Données invalides : refus immédiat, dans tous les modes. Le build les refuse aussi (scripts/validate-data.mjs).
const errors = validateVehicles(rawVehicles)
if (errors.length > 0) {
  throw new Error(`vehicles.json invalide :\n- ${errors.join('\n- ')}`)
}

const vehicles = deepFreeze(structuredClone(rawVehicles))

export function getVehicles() {
  return [...vehicles]
}

/** @returns le véhicule, ou `null` si le slug est inconnu ou n'est pas un texte. */
export function getVehicleBySlug(slug) {
  if (typeof slug !== 'string' || slug === '') return null
  return vehicles.find((vehicle) => vehicle.slug === slug) ?? null
}

export function getFeaturedVehicles() {
  return vehicles.filter((vehicle) => vehicle.featured)
}
