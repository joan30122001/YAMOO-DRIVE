import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Garde-fou (UX-DR3) : les boutons d'action passent tous par <Button>. Ce test lit le code source ; il est
// complété par des tests de rendu (Header.test.jsx, VehicleCard.test.jsx, RouteError.test.jsx).
const SRC = resolve(fileURLToPath(new URL('../..', import.meta.url)))

// Autorisés : le composant, les boutons-icônes ronds du menu mobile et le lien d'évitement.
const ALLOWED = new Set(['components/ui/Button.jsx', 'components/layout/MobileMenu.jsx', 'components/layout/SkipLink.jsx'])

// Formes ou fonds de bouton recopiés à la main (pilule, ou fond or avec hauteur de bouton).
const BUTTON_STYLES = [/rounded-pill/, /rounded-full/, /\bbg-gold\b[^'"`]*\bmin-h-11\b/, /\bmin-h-11\b[^'"`]*\bbg-gold\b/]

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name)
    return entry.isDirectory() ? walk(p) : [p]
  })
}

const sources = walk(SRC)
  .filter((file) => /\.jsx?$/.test(file) && !/\.test\.jsx?$/.test(file))
  .map((file) => ({ rel: relative(SRC, file).replace(/\\/g, '/'), text: readFileSync(file, 'utf8') }))

describe('aucune classe de bouton dupliquée (UX-DR3)', () => {
  it('les styles de bouton n’apparaissent que dans Button et les trois fichiers autorisés', () => {
    const offenders = sources
      .filter(({ rel }) => !ALLOWED.has(rel))
      .filter(({ text }) => BUTTON_STYLES.some((re) => re.test(text)))
      .map(({ rel }) => rel)
    expect(offenders, `styles de bouton recopiés dans : ${offenders.join(', ')}`).toEqual([])
  })

  it('le détecteur repère bien un bouton recopié à la main', () => {
    expect(BUTTON_STYLES.some((re) => re.test('<a className="rounded-pill bg-gold px-4">'))).toBe(true)
    expect(BUTTON_STYLES.some((re) => re.test('<a className="rounded-full border">'))).toBe(true)
    expect(BUTTON_STYLES.some((re) => re.test('<a className="bg-gold min-h-11 px-4">'))).toBe(true)
    expect(BUTTON_STYLES.some((re) => re.test('<p className="text-ivory">'))).toBe(false)
  })

  it('les fichiers qui affichent un bouton d’action importent Button', () => {
    for (const rel of [
      'components/layout/Header.jsx',
      'components/layout/MobileMenu.jsx',
      'components/layout/RouteError.jsx',
      'pages/NotFound.jsx',
      'components/vehicles/VehicleCard.jsx',
    ]) {
      const { text } = sources.find((s) => s.rel === rel)
      expect(text, rel).toMatch(/import Button from '[./]+(?:components\/)?(?:ui\/)?Button\.jsx'/)
      expect(text, rel).toMatch(/<Button[\s>]/)
    }
  })
})
