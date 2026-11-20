import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(fileURLToPath(new URL('..', import.meta.url)))
const ROOT = resolve(SRC, '..')
const THEME_PATH = join(SRC, 'styles', 'theme.css')
const theme = readFileSync(THEME_PATH, 'utf8')
const themeBlock = theme.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name)
    return entry.isDirectory() ? walk(p) : [p]
  })
}

function declared(name) {
  return themeBlock.match(new RegExp(`${name}: *([^;]+);`))?.[1].trim()
}

describe('jetons de design', () => {
  it('lit un bloc @theme', () => {
    expect(themeBlock.length).toBeGreaterThan(0)
  })

  it.each([
    ['--color-obsidian', '#050607'],
    ['--color-carbon', '#0E1011'],
    ['--color-gold', '#C9A86A'],
    ['--color-sport-red', '#C8102E'],
    ['--color-brand-blue', '#042C7C'],
    ['--color-brand-deep', '#0C1A33'],
    ['--color-surface', '#1A1B1E'],
    ['--color-surface-panel', '#232528'],
    ['--color-brand-blue-light', '#3F72E0'],
    ['--color-ivory', '#F5F2EA'],
    ['--color-silver', '#929292'],
  ])('déclare %s = %s dans @theme', (name, hex) => {
    expect(declared(name)?.toLowerCase()).toBe(hex.toLowerCase())
  })

  it.each(['--spacing-gutter', '--spacing-section', '--radius-card', '--radius-pill'])(
    'déclare %s dans @theme',
    (name) => {
      expect(declared(name)).toBeTruthy()
    },
  )

  it('déclare Space Grotesk et Manrope', () => {
    expect(declared('--font-display')).toContain('Space Grotesk')
    expect(declared('--font-body')).toContain('Manrope')
  })

  it('aligne la meta theme-color de index.html sur le fond obsidienne', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
    const color = html.match(/<meta name="theme-color" content="([^"]+)"/)?.[1]
    expect(color?.toLowerCase()).toBe(declared('--color-obsidian')?.toLowerCase())
  })

  it('ne contient aucune couleur littérale en dehors de theme.css', () => {
    const colorLiteral =
      /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab)\(/g
    const offenders = []
    for (const file of walk(SRC)) {
      if (!/\.(jsx?|css)$/.test(file) || file === THEME_PATH || file.endsWith('tokens.test.js') || file.endsWith('designParity.test.js')) continue
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const cleaned = line.replace(/href=["']#["']/g, '')
          const hits = cleaned.match(colorLiteral)
          if (hits) offenders.push(`${relative(SRC, file)}:${i + 1} (${hits.join(', ')})`)
        })
    }
    expect(offenders, `couleurs hors thème : ${offenders.join(' ; ')}`).toEqual([])
  })
})
