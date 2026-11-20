import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Le document de design fait foi : les jetons de theme.css doivent lui rester identiques, dans les deux sens.
const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const DESIGN = join(
  ROOT,
  '..',
  '_bmad-output',
  'planning-artifacts',
  'ux-designs',
  'ux-yamoo-drive-2026-11-19',
  'DESIGN.md',
)
const THEME = join(ROOT, 'src', 'styles', 'theme.css')

/** Lit le frontmatter YAML de DESIGN.md (sous-ensemble : 2 à 3 niveaux, valeurs scalaires). */
function parseFrontmatter(text) {
  const front = text.replace(/\r/g, '').split(/^---\s*$/m)[1] ?? ''
  const tree = {}
  let top = null
  let mid = null
  for (const line of front.split('\n')) {
    if (!line.trim()) continue
    const indent = line.length - line.trimStart().length
    const match = line.trim().match(/^['"]?([\w.-]+)['"]?:\s*(.*)$/)
    if (!match) continue
    const [, key, raw] = match
    const value = raw.replace(/^['"]|['"]$/g, '')
    if (indent === 0) {
      top = key
      tree[top] = value === '' ? {} : value
      mid = null
    } else if (indent === 2 && typeof tree[top] === 'object') {
      if (value === '') {
        tree[top][key] = {}
        mid = key
      } else {
        tree[top][key] = value
        mid = null
      }
    } else if (indent === 4 && mid && typeof tree[top][mid] === 'object') {
      tree[top][mid][key] = value
    }
  }
  return tree
}

const theme = readFileSync(THEME, 'utf8').replace(/\r/g, '')
const themeBlock = theme.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const token = (name) => themeBlock.match(new RegExp(`(?:^|\\n)\\s*${escapeRe(name)}: *([^;]+);`))?.[1].trim()
const toRem = (value) => (/rem$/.test(value) ? value : `${parseFloat(value) / 16}rem`)
const themeNames = (prefix) =>
  [...themeBlock.matchAll(new RegExp(`(?:^|\\n)\\s*--${prefix}-([\\w-]+?)(?:--[\\w-]+)?:`, 'g'))].map((m) => m[1])

describe('parité des jetons avec DESIGN.md : présence du document', () => {
  it('DESIGN.md est trouvable (sinon la parité ne protégerait rien)', () => {
    // Pour exécuter les tests hors du dépôt complet : ALLOW_MISSING_DESIGN=1 npm test
    if (process.env.ALLOW_MISSING_DESIGN === '1') return
    expect(existsSync(DESIGN), `DESIGN.md introuvable : ${DESIGN}`).toBe(true)
  })
})

describe.skipIf(!existsSync(DESIGN))('parité des jetons avec DESIGN.md', () => {
  const design = parseFrontmatter(readFileSync(DESIGN, 'utf8'))

  it('lit les couleurs et la typographie du document de design', () => {
    expect(Object.keys(design.colors ?? {}).length).toBeGreaterThanOrEqual(12)
    expect(Object.keys(design.typography ?? {}).length).toBeGreaterThanOrEqual(11)
  })

  it('chaque couleur de DESIGN.md existe dans le thème avec la même valeur', () => {
    const mismatches = []
    for (const [name, hex] of Object.entries(design.colors)) {
      const actual = token(`--color-${name}`)
      if (actual?.toLowerCase() !== hex.toLowerCase()) mismatches.push(`${name}: attendu ${hex}, thème ${actual ?? 'absent'}`)
    }
    expect(mismatches, mismatches.join(' | ')).toEqual([])
  })

  it('chaque style typographique existe avec la même taille, hauteur de ligne, graisse et espacement', () => {
    const mismatches = []
    for (const [name, spec] of Object.entries(design.typography)) {
      const checks = [
        [`--text-${name}`, toRem(spec.fontSize)],
        [`--text-${name}--line-height`, spec.lineHeight],
        [`--text-${name}--font-weight`, spec.fontWeight],
        ...(spec.letterSpacing ? [[`--text-${name}--letter-spacing`, spec.letterSpacing]] : []),
      ]
      for (const [variable, expected] of checks) {
        const actual = token(variable)
        const same = actual === expected || (variable.endsWith('line-height') && Number(actual) === Number(expected))
        if (!same) mismatches.push(`${variable}: attendu ${expected}, thème ${actual ?? 'absent'}`)
      }
    }
    expect(mismatches, mismatches.join(' | ')).toEqual([])
  })

  it('l’espacement et les rayons nommés du thème correspondent à DESIGN.md', () => {
    const pairs = [
      ['--spacing-gutter', toRem(design.spacing.gutter)],
      ['--spacing-section', toRem(design.spacing.section)],
      ['--radius-card', toRem(design.rounded.card)],
      ['--radius-pill', design.rounded.full],
    ]
    const mismatches = pairs.filter(([name, expected]) => token(name) !== expected).map(([name, expected]) => `${name}: attendu ${expected}, thème ${token(name) ?? 'absent'}`)
    expect(mismatches, mismatches.join(' | ')).toEqual([])
  })

  it('sens inverse : le thème ne déclare aucune couleur ni style absent de DESIGN.md', () => {
    const extraColors = [...new Set(themeNames('color'))].filter((name) => !(name in design.colors))
    const extraText = [...new Set(themeNames('text'))].filter((name) => !(name in design.typography))
    expect(extraColors, `couleurs hors DESIGN.md : ${extraColors.join(', ')}`).toEqual([])
    expect(extraText, `styles hors DESIGN.md : ${extraText.join(', ')}`).toEqual([])
  })

  it('les polices du design sont celles du thème', () => {
    const families = new Set(Object.values(design.typography).map((t) => t.fontFamily))
    expect(families).toEqual(new Set(['Space Grotesk', 'Manrope']))
    expect(token('--font-display')).toContain('Space Grotesk')
    expect(token('--font-body')).toContain('Manrope')
  })
})

describe('parité : le lecteur de frontmatter', () => {
  const sample = ['---', 'colors:', "  gold: '#C9A86A'", 'typography:', '  label:', '    fontSize: 12px', '---', '# titre'].join('\r\n')

  it('gère les fins de ligne Windows et les trois niveaux', () => {
    const tree = parseFrontmatter(sample)
    expect(tree.colors.gold).toBe('#C9A86A')
    expect(tree.typography.label.fontSize).toBe('12px')
  })

  it('convertit px et rem en rem', () => {
    expect(toRem('72px')).toBe('4.5rem')
    expect(toRem('1.5rem')).toBe('1.5rem')
    expect(toRem('12px')).toBe('0.75rem')
  })
})
