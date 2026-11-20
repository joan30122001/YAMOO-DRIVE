// Détection d'appareil peu puissant (AD-7). Fonction pure : aucun accès direct à `navigator`.
// Limites : `deviceMemory` et `connection` n'existent que dans les navigateurs Chromium ; `saveData` est une
// préférence réseau, pas une capacité matérielle ; `hardwareConcurrency` ≤ 4 peut viser aussi des machines correctes.
// Une valeur inconnue ne déclenche jamais le mode « faible puissance ».

const LOW_CORES = 4
const LOW_MEMORY_GB = 4

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/**
 * @param {{ hardwareConcurrency?: number, deviceMemory?: number, connection?: { saveData?: boolean } }} [info]
 * @returns {boolean} true si l'appareil est probablement peu puissant. Valeurs inconnues = false.
 */
export function detectLowPower(info = {}) {
  const { hardwareConcurrency, deviceMemory, connection } = info ?? {}
  if (isNumber(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= LOW_CORES) return true
  if (isNumber(deviceMemory) && deviceMemory > 0 && deviceMemory <= LOW_MEMORY_GB) return true
  return connection?.saveData === true
}
