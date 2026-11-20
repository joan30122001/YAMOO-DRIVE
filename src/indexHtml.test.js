import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// index.html est la première chose servie (et la seule vue sans JavaScript) : ses métadonnées doivent exister.
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const html = readFileSync(join(ROOT, 'index.html'), 'utf8').replace(/\r/g, '')
const theme = readFileSync(join(ROOT, 'src', 'styles', 'theme.css'), 'utf8')
const themeColor = (name) => theme.match(new RegExp(`--color-${name}: *(#[0-9A-Fa-f]{6});`))?.[1].toLowerCase()

describe('index.html', () => {
  it('déclare la langue française, le viewport et un titre', () => {
    expect(html).toMatch(/<html lang="fr">/)
    expect(html).toMatch(/<meta name="viewport" content="width=device-width, initial-scale=1.0" \/>/)
    expect(html).toMatch(/<title>[^<]+<\/title>/)
  })

  it('déclare une description', () => {
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
    expect(description?.length).toBeGreaterThan(50)
    expect(description).toMatch(/Location de véhicules/)
  })

  it('référence un favicon qui existe (une icône absente provoque une erreur 404 dans la console)', () => {
    const href = html.match(/<link rel="icon"[^>]*href="([^"]+)"/)?.[1]
    expect(href).toBeTruthy()
    expect(existsSync(join(ROOT, 'public', href.replace(/^\//, '')))).toBe(true)
  })

  it('le favicon est un PNG carré valide (le « Y » du logo)', () => {
    const png = readFileSync(join(ROOT, 'public', 'favicon.png'))
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    expect(width).toBe(height)
    expect(width).toBeGreaterThanOrEqual(32)
  })

  it('le logo existe et son rapport correspond aux dimensions réservées par Wordmark', () => {
    const png = readFileSync(join(ROOT, 'public', 'images', 'logo.png'))
    expect(png.readUInt32BE(16)).toBe(616)
    expect(png.readUInt32BE(20)).toBe(191)
  })

  it('prévoit un message en français sans JavaScript', () => {
    const message = html.match(/<noscript>([^<]+)<\/noscript>/)?.[1]
    expect(message).toMatch(/JavaScript/)
    expect(message).toMatch(/activer/)
  })

  it('fixe la couleur du navigateur sur le fond du site', () => {
    const color = html.match(/<meta name="theme-color" content="([^"]+)"/)?.[1]
    expect(color?.toLowerCase()).toBe(themeColor('obsidian'))
  })

  it('fournit un robots.txt valide, cohérent avec noindex tant que le site n’est pas approuvé par l’agence', async () => {
    const robots = readFileSync(join(ROOT, 'public', 'robots.txt'), 'utf8').replace(/\r/g, '')
    const { default: agencyConfig } = await import('./data/agency.config.js')
    expect(typeof agencyConfig.noindex).toBe('boolean')
    expect(robots).toMatch(/^User-agent: \*$/m)
    // Sans ce fichier, l'hébergeur renvoie index.html à la place : Lighthouse le juge invalide.
    expect(robots).not.toMatch(/<html/i)
    if (agencyConfig.noindex) expect(robots).toMatch(/^Disallow: \/$/m)
    else expect(robots).not.toMatch(/^Disallow: \/$/m)
  })

  it('la balise noindex statique est présente si et seulement si noindex est actif dans la configuration', async () => {
    const { default: agencyConfig } = await import('./data/agency.config.js')
    const hasMeta = /<meta name="robots" content="noindex, nofollow" \/>/.test(html)
    // Le robots.txt bloque l'exploration, pas l'indexation : la balise couvre les liens externes et les robots sans JavaScript.
    // Passer `noindex` à faux sans retirer la balise de index.html (ou l'inverse) fait échouer ce test.
    expect(hasMeta).toBe(agencyConfig.noindex)
  })

  it('la description statique est identique à celle de seo.js (une seule source de vérité)', async () => {
    const { DEFAULT_DESCRIPTION } = await import('./data/seo.js')
    expect(html.match(/<meta name="description" content="([^"]+)"/)?.[1]).toBe(DEFAULT_DESCRIPTION)
  })

  it('le jeton de couleur utilisé existe (message d’erreur clair si le thème change)', () => {
    expect(themeColor('gold')).toMatch(/^#[0-9a-f]{6}$/)
    expect(themeColor('obsidian')).toMatch(/^#[0-9a-f]{6}$/)
  })

  describe('entrée du logo (story 9.1)', () => {
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

    function run() {
      const attrs = new Set()
      const doc = { documentElement: { setAttribute: (name) => attrs.add(name) } }
      new Function('document', script)(doc)
      return attrs
    }

    it('pose data-logo-intro à chaque chargement de la page (ouverture et actualisation)', () => {
      expect(run().has('data-logo-intro')).toBe(true)
      expect(run().has('data-logo-intro')).toBe(true)
    })

    it('n’utilise aucun stockage (rien à bloquer, rien à retenir)', () => {
      expect(script).not.toMatch(/Storage|cookie/)
    })

    it('l’animation n’existe que si l’utilisateur n’a pas demandé moins de mouvement', () => {
      const block = theme.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n {2}\}/)?.[0] ?? ''
      expect(block).toContain('html[data-logo-intro] .logo-intro')
      expect(theme).toMatch(/@keyframes logo-intro/)
    })

    it('la mise en avant (story 9.3) passe par transform, ne reste pas écrasée par l’entrée, et se joue sans mouvement réduit', () => {
      const block = theme.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n {2}\}\r?\n\r?\n {2}:focus-visible/)?.[0] ?? ''
      expect(block).toMatch(/a:hover \.logo-shine,\s+a:focus-visible \.logo-shine \{\s+transform: scale\(1\.03\);\s+filter: brightness\(1\.12\);/)
      expect(block).toMatch(/\.logo-shine \{\s+transition:\s+transform 0\.25s/)
      // `both` retiendrait le transform final de l'entrée et empêcherait l'échelle du survol.
      expect(block).toMatch(/logo-intro 1\.2s [^;]* backwards;/)
    })

    it('le reflet (story 9.2) est masqué par le logo, joué au survol et au focus, et seulement sans demande de moins de mouvement', () => {
      const block = theme.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n {2}\}\r?\n\r?\n {2}:focus-visible/)?.[0] ?? ''
      expect(block).toContain('.logo-shine::after')
      expect(block).toContain('/images/logo.png')
      expect(block).toContain('a:hover .logo-shine::after')
      expect(block).toContain('a:focus-visible .logo-shine::after')
      expect(block).toContain('(hover: none)')
      // Reflet au chargement (en-tête) : rejoué par le survol grâce à un nom d'animation différent.
      expect(block).toContain(':where(html[data-logo-intro]) .logo-intro.logo-shine::after')
      expect(theme).toMatch(/@keyframes logo-shine-hover/)
      expect(theme).toMatch(/@keyframes logo-shine/)
    })
  })
})
