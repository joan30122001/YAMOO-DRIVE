import { afterEach, describe, expect, it, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import rawVehicles from './vehicles.json'
import { getFeaturedVehicles, getVehicleBySlug, getVehicles } from './vehicleRepository.js'
import { CATEGORIES, TRANSMISSIONS, validateVehicles } from './vehicleSchema.js'

const PUBLIC_DIR = resolve(fileURLToPath(new URL('../../public', import.meta.url)))

const valid = () => structuredClone(rawVehicles[0])
const withChange = (change) => [{ ...valid(), ...change }]

describe('données vehicles.json (jeu de démonstration : à adapter avec les vraies données)', () => {
  it('sont valides selon le schéma', () => {
    expect(validateVehicles(rawVehicles)).toEqual([])
  })

  it('contiennent 8 à 10 véhicules, tous marqués fictifs', () => {
    expect(rawVehicles.length).toBeGreaterThanOrEqual(8)
    expect(rawVehicles.length).toBeLessThanOrEqual(10)
    expect(rawVehicles.every((v) => v.isDemo === true)).toBe(true)
  })

  it('ont des slugs uniques', () => {
    const slugs = rawVehicles.map((v) => v.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('proposent exactement 3 véhicules « à la une »', () => {
    expect(rawVehicles.filter((v) => v.featured)).toHaveLength(3)
  })

  it('couvrent toutes les catégories et les deux transmissions (filtres de l’epic 2)', () => {
    expect(new Set(rawVehicles.map((v) => v.category))).toEqual(new Set(CATEGORIES))
    expect(new Set(rawVehicles.map((v) => v.transmission))).toEqual(new Set(TRANSMISSIONS))
  })

  it('couvrent les services avec et sans chauffeur, dont un véhicule avec chauffeur uniquement', () => {
    expect(rawVehicles.some((v) => v.services.withDriver)).toBe(true)
    expect(rawVehicles.some((v) => !v.services.withDriver)).toBe(true)
    expect(rawVehicles.some((v) => !v.services.selfDrive)).toBe(true)
  })

  it('contiennent plusieurs marques et des tarifs différents (filtre prix)', () => {
    expect(new Set(rawVehicles.map((v) => v.brand)).size).toBeGreaterThanOrEqual(2)
    expect(new Set(rawVehicles.map((v) => v.dailyRateXAF)).size).toBeGreaterThan(5)
  })

  it('référencent uniquement des images présentes dans public/, avec leur licence consignée', () => {
    const licenses = readFileSync(join(PUBLIC_DIR, 'vehicles', 'LICENSES.md'), 'utf8')
    const paths = new Set(rawVehicles.flatMap((v) => [v.images.main, ...v.images.gallery]))
    for (const path of paths) {
      expect(existsSync(join(PUBLIC_DIR, path)), `fichier manquant : ${path}`).toBe(true)
      expect(licenses, `licence non consignée : ${path}`).toContain(`| \`${path.split('/').pop()}\` |`)
    }
  })

  it('n’affichent aucune mention « donnée fictive » dans les valeurs (le drapeau isDemo suffit)', () => {
    const text = JSON.stringify(rawVehicles)
    expect(text).not.toMatch(/donnée fictive/i)
  })

  it('ont un supplément chauffeur nul quand le client n’a pas le choix', () => {
    for (const v of rawVehicles) {
      if (!v.services.selfDrive || !v.services.withDriver) {
        expect(v.driverSupplementXAF, v.slug).toBe(0)
      }
    }
  })

  it('ne contiennent aucun hexadécimal ni lien externe', () => {
    const text = readFileSync(fileURLToPath(new URL('./vehicles.json', import.meta.url)), 'utf8')
    expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(text).not.toMatch(/https?:\/\//)
  })
})

describe('validateVehicles', () => {
  it('refuse un champ obligatoire manquant en nommant le véhicule et le champ', () => {
    const { brand: _brand, ...incomplete } = valid()
    const errors = validateVehicles([incomplete])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(`« ${incomplete.slug} »`)
    expect(errors[0]).toContain('« brand »')
  })

  it('refuse un slug dupliqué en le nommant', () => {
    const errors = validateVehicles([valid(), valid()])
    expect(errors.some((e) => e.includes('« slug » — dupliqué') && e.includes(valid().slug))).toBe(true)
  })

  it.each([
    ['category hors énumération', { category: 'Camion' }, 'category'],
    ['transmission hors énumération', { transmission: 'Semi-automatique' }, 'transmission'],
    ['places à 0', { seats: 0 }, 'seats'],
    ['places non entières', { seats: 4.5 }, 'seats'],
    ['tarif à 0', { dailyRateXAF: 0 }, 'dailyRateXAF'],
    ['tarif en texte', { dailyRateXAF: '35000' }, 'dailyRateXAF'],
    ['supplément négatif', { driverSupplementXAF: -1 }, 'driverSupplementXAF'],
    ['slug avec majuscules', { slug: 'Toyota Corolla' }, 'slug'],
    ['aucun service', { services: { selfDrive: false, withDriver: false } }, 'services'],
    ['services mal formés', { services: { selfDrive: 'oui' } }, 'services'],
    ['équipements vides', { equipment: [] }, 'equipment'],
    ['équipement non texte', { equipment: ['ok', 3] }, 'equipment'],
    ['caractéristique vide', { specs: { Moteur: '' } }, 'specs'],
    ['image principale vide', { images: { main: '', gallery: [] } }, 'images.main'],
    ['image principale relative', { images: { main: 'x.svg', gallery: [] } }, 'images.main'],
    ['galerie absente', { images: { main: '/x.svg' } }, 'images.gallery'],
    ['conditions vides', { conditions: [] }, 'conditions'],
    ['isDemo absent', { isDemo: undefined }, 'isDemo'],
    ['featured non booléen', { featured: 'oui' }, 'featured'],
    ['specs vide', { specs: {} }, 'specs'],
    ['champ inconnu (faute de frappe)', { feautred: true }, 'feautred'],
    ['service inconnu', { services: { selfDrive: true, withDriver: true, vip: true } }, 'services'],
    ['services en tableau', { services: [true, true] }, 'services'],
    ['image principale vers un hôte externe', { images: { main: '//evil.example/x.svg', gallery: [] } }, 'images.main'],
    ['image principale avec ..', { images: { main: '/vehicles/../secret.svg', gallery: [] } }, 'images.main'],
    ['galerie relative', { images: { main: '/x.svg', gallery: ['y.svg'] } }, 'images.gallery'],
    ['galerie vers un hôte externe', { images: { main: '/x.svg', gallery: ['//evil.example/y.svg'] } }, 'images.gallery'],
    ['images en texte', { images: 'x.svg' }, 'images'],
    ['images en tableau', { images: ['x.svg'] }, 'images'],
    ['tarif au-delà du maximum', { dailyRateXAF: 10_000_001 }, 'dailyRateXAF'],
    ['entier non sûr', { dailyRateXAF: 2 ** 60 }, 'dailyRateXAF'],
    ['supplément sans service avec chauffeur', { services: { selfDrive: true, withDriver: false }, driverSupplementXAF: 5000 }, 'driverSupplementXAF'],
    ['supplément alors que le chauffeur est obligatoire', { services: { selfDrive: false, withDriver: true }, driverSupplementXAF: 5000 }, 'driverSupplementXAF'],
  ])('refuse : %s', (_name, change, field) => {
    const errors = validateVehicles(withChange(change))
    expect(errors.some((e) => e.includes(`« ${field} »`)), errors.join(' | ')).toBe(true)
  })

  it('signale les entrées qui ne sont pas des objets et les listes invalides', () => {
    expect(validateVehicles([null])[0]).toContain('doit être un objet')
    expect(validateVehicles(['texte'])[0]).toContain('doit être un objet')
    expect(validateVehicles({})[0]).toContain('tableau')
  })

  it('cite la position quand le slug est inutilisable', () => {
    const errors = validateVehicles([{ ...valid(), slug: '' }])
    expect(errors[0]).toContain('#1')
  })

  it('accepte un supplément quand le client choisit entre sans et avec chauffeur, et 0 sinon', () => {
    expect(validateVehicles(withChange({ services: { selfDrive: true, withDriver: true }, driverSupplementXAF: 15000 }))).toEqual([])
    expect(validateVehicles(withChange({ services: { selfDrive: false, withDriver: true }, driverSupplementXAF: 0 }))).toEqual([])
    expect(validateVehicles(withChange({ services: { selfDrive: true, withDriver: false }, driverSupplementXAF: 0 }))).toEqual([])
  })

  it('refuse plus de 3 véhicules « à la une »', () => {
    const list = rawVehicles.map((v) => ({ ...v, featured: true }))
    expect(validateVehicles(list).some((e) => e.includes('featured') && e.includes('au plus 3'))).toBe(true)
  })

  it('accepte une liste vide', () => {
    expect(validateVehicles([])).toEqual([])
  })
})

describe('dépôt de données (AD-1)', () => {
  it('getVehicles renvoie tous les véhicules', () => {
    expect(getVehicles()).toHaveLength(rawVehicles.length)
  })

  it('getVehicles renvoie un nouveau tableau à chaque appel (le tri d’un appelant n’affecte pas les autres)', () => {
    const first = getVehicles()
    first.reverse()
    expect(getVehicles()[0].slug).toBe(rawVehicles[0].slug)
  })

  it('getVehicleBySlug trouve un véhicule existant', () => {
    const slug = rawVehicles[2].slug
    expect(getVehicleBySlug(slug)?.model).toBe(rawVehicles[2].model)
  })

  it.each(['inconnu', '', ' ', null, undefined, 42, {}, [rawVehicles[0].slug]])(
    'getVehicleBySlug(%j) renvoie null',
    (slug) => {
      expect(getVehicleBySlug(slug)).toBeNull()
    },
  )

  it('getVehicleBySlug est sensible à la casse et aux espaces', () => {
    const slug = rawVehicles[0].slug
    expect(getVehicleBySlug(slug.toUpperCase())).toBeNull()
    expect(getVehicleBySlug(` ${slug}`)).toBeNull()
  })

  it('getFeaturedVehicles renvoie exactement les 3 véhicules « à la une »', () => {
    const featured = getFeaturedVehicles()
    expect(featured).toHaveLength(3)
    expect(featured.every((v) => v.featured)).toBe(true)
  })

  it('les objets renvoyés ne sont pas modifiables', () => {
    const vehicle = getVehicleBySlug(rawVehicles[0].slug)
    expect(Object.isFrozen(vehicle)).toBe(true)
    expect(() => {
      vehicle.seats = 1
    }).toThrow()
    expect(() => vehicle.equipment.push('x')).toThrow()
    expect(getVehicleBySlug(rawVehicles[0].slug).seats).toBe(rawVehicles[0].seats)
  })

  it('ne partage pas ses objets avec le JSON importé (copie profonde)', () => {
    expect(getVehicleBySlug(rawVehicles[0].slug)).not.toBe(rawVehicles[0])
  })
})

describe('chargement du dépôt avec des données invalides', () => {
  afterEach(() => {
    vi.doUnmock('./vehicles.json')
    vi.resetModules()
  })

  it('refuse de se charger et nomme le véhicule et le champ fautifs', async () => {
    vi.resetModules()
    const broken = structuredClone(rawVehicles)
    delete broken[1].brand
    vi.doMock('./vehicles.json', () => ({ default: broken }))

    const error = await import('./vehicleRepository.js').then(() => null, (e) => e)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('vehicles.json invalide')
    expect(error.message).toContain(rawVehicles[1].slug)
    expect(error.message).toContain('brand')
  })

  it('se charge normalement avec les données livrées', async () => {
    vi.resetModules()
    const repo = await import('./vehicleRepository.js')
    expect(repo.getVehicles()).toHaveLength(rawVehicles.length)
  })
})

describe('validation au build (scripts/validate-data.mjs)', () => {
  const script = fileURLToPath(new URL('../../scripts/validate-data.mjs', import.meta.url))
  const run = (file) => spawnSync(process.execPath, file ? [script, file] : [script], { encoding: 'utf8' })

  it('réussit avec les données livrées', () => {
    const result = run()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('valide')
  })

  it('échoue en nommant le véhicule et le champ fautifs', () => {
    const dir = mkdtempSync(join(tmpdir(), 'yamoo-'))
    const broken = structuredClone(rawVehicles)
    delete broken[3].model
    const file = join(dir, 'vehicles.json')
    writeFileSync(file, JSON.stringify(broken))
    const result = run(file)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(broken[3].slug)
    expect(result.stderr).toContain('model')
  })

  it('échoue proprement si le fichier est illisible ou n’est pas du JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'yamoo-'))
    const file = join(dir, 'vehicles.json')
    writeFileSync(file, '{ pas du json')
    expect(run(file).status).toBe(1)
    expect(run(join(dir, 'absent.json')).status).toBe(1)
  })

  it('est branché sur npm run build (prebuild)', () => {
    const pkg = JSON.parse(readFileSync(join(PUBLIC_DIR, '..', 'package.json'), 'utf8'))
    expect(pkg.scripts.prebuild).toContain('validate-data.mjs')
  })
})
