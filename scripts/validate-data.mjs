// Valide src/data/vehicles.json (ou le fichier passé en argument). Échoue avec un code 1 et la liste des erreurs.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateVehicles } from '../src/data/vehicleSchema.js'

const defaultFile = fileURLToPath(new URL('../src/data/vehicles.json', import.meta.url))
const file = resolve(process.argv[2] ?? defaultFile)

let data
try {
  data = JSON.parse(readFileSync(file, 'utf8'))
} catch (error) {
  console.error(`Impossible de lire ${file} : ${error.message}`)
  process.exit(1)
}

const errors = validateVehicles(data)
if (errors.length > 0) {
  console.error(`vehicles.json invalide (${errors.length} erreur(s)) :\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`vehicles.json valide : ${data.length} véhicules.`)
