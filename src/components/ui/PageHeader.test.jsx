// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import PageHeader, { GLOW_OPACITY_PERCENT, splitTitle } from './PageHeader.jsx'

afterEach(() => cleanup())

describe('splitTitle', () => {
  it.each([
    ['Nos véhicules', 'véhicules', { before: 'Nos ', accent: 'véhicules', after: '' }],
    ['Contactez-nous', 'nous', { before: 'Contactez-', accent: 'nous', after: '' }],
    ['À propos de YAMOO DRIVE', 'YAMOO DRIVE', { before: 'À propos de ', accent: 'YAMOO DRIVE', after: '' }],
    ['Contact contact', 'contact', { before: 'Contact ', accent: 'contact', after: '' }],
    ['Un titre au milieu ici', 'au milieu', { before: 'Un titre ', accent: 'au milieu', after: ' ici' }],
  ])('%j / %j', (title, accent, expected) => {
    expect(splitTitle(title, accent)).toEqual(expected)
  })

  it.each([
    ['Nos véhicules', 'xyz'],
    ['Nos véhicules', ''],
    ['Nos véhicules', undefined],
    ['Nos véhicules', null],
    ['Nos véhicules', 42],
    ['Nos véhicules', '   '],
    ['Nos véhicules', 'Véhicules'],
    ['Nos véhicules', ' '],
    ['Nos  véhicules', '  '],
  ])('%j sans mot clé exploitable (%j) : titre entier, sans mise en valeur', (title, accent) => {
    expect(splitTitle(title, accent)).toEqual({ before: title, accent: '', after: '' })
  })

  it.each([undefined, null, 42, {}])('titre non textuel %j : chaîne vide, sans erreur', (title) => {
    expect(splitTitle(title, 'x')).toEqual({ before: '', accent: '', after: '' })
  })
})

describe('PageHeader : titre', () => {
  it('un seul h1, avec le mot clé doré', () => {
    render(<PageHeader title="Nos véhicules" accent="véhicules" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(h1.textContent).toBe('Nos véhicules')
    const span = h1.querySelector('span')
    expect(span.textContent).toBe('véhicules')
    expect(span.getAttribute('class')).toContain('text-gold')
  })

  it('le reste du titre est en ivoire (aucune couleur propre au h1 sauf ivoire)', () => {
    render(<PageHeader title="Nos véhicules" accent="véhicules" />)
    const classes = screen.getByRole('heading', { level: 1 }).getAttribute('class').split(/\s+/)
    expect(classes).toContain('text-ivory')
    expect(classes).not.toContain('text-gold')
  })

  it('titre display-xl-mobile sur mobile, display-lg dès sm, Space Grotesk', () => {
    render(<PageHeader title="X" />)
    const classes = screen.getByRole('heading', { level: 1 }).getAttribute('class').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['font-display', 'text-display-xl-mobile', 'sm:text-display-lg']))
  })

  it('sans mot clé : pas de <span>', () => {
    render(<PageHeader title="Page introuvable" />)
    expect(screen.getByRole('heading', { level: 1 }).querySelector('span')).toBeNull()
  })

  it('le nom accessible du titre est le texte complet', () => {
    render(<PageHeader title="Contactez-nous" accent="nous" />)
    // Le simulateur de DOM insère une espace autour du <span> dans le calcul du nom ; un navigateur n'en ajoute pas.
    expect(screen.getByRole('heading', { level: 1, name: /^Contactez-\s?nous$/ })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Contactez-nous')
  })
})

describe('PageHeader : introduction et contenu', () => {
  it('introduction en argent', () => {
    render(<PageHeader title="X" intro="Une phrase." />)
    const intro = screen.getByText('Une phrase.')
    expect(intro.getAttribute('class')).toContain('text-silver')
  })

  it.each([0, '', null, undefined, false])('introduction %j : rien n’est affiché (pas de « 0 » parasite)', (intro) => {
    const { container } = render(<PageHeader title="X" intro={intro} />)
    expect(container.querySelector('p')).toBeNull()
    expect(container.textContent).toBe('X')
  })

  it('introduction textuelle : un paragraphe ; contenu riche : un bloc, jamais de <p> imbriqué', () => {
    const { container, rerender } = render(<PageHeader title="X" intro="Texte" />)
    expect(container.querySelector('p').textContent).toBe('Texte')
    rerender(<PageHeader title="X" intro={<ul><li>A</li></ul>} />)
    expect(container.querySelector('p')).toBeNull()
    expect(container.querySelector('div > ul')).not.toBeNull()
  })

  it('sans introduction : aucun paragraphe', () => {
    const { container } = render(<PageHeader title="X" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('affiche les enfants sous le titre', () => {
    render(
      <PageHeader title="X">
        <p>Avis</p>
      </PageHeader>,
    )
    expect(screen.getByText('Avis')).toBeTruthy()
  })

  it('classes personnalisables', () => {
    const { container } = render(<PageHeader title="X" className="mb-8" />)
    expect(container.firstChild.getAttribute('class')).toContain('mb-8')
  })
})

describe('PageHeader : lueur dorée', () => {
  it('est décorative : masquée aux lecteurs d’écran, sans événement, derrière le contenu', () => {
    const { container } = render(<PageHeader title="X" />)
    const glow = container.querySelector('[aria-hidden="true"]')
    const classes = glow.getAttribute('class').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['pointer-events-none', 'absolute', '-z-10']))
    expect(glow.textContent).toBe('')
    expect(glow.children).toHaveLength(0)
  })

  it('n’emploie que le jeton rouge du thème (aucune couleur littérale) et un dégradé vers le transparent', () => {
    const { container } = render(<PageHeader title="X" />)
    const glow = container.querySelector('[aria-hidden="true"]').getAttribute('class')
    expect(glow).toContain('var(--color-gold)')
    expect(glow).toContain('transparent')
    expect(glow).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('forme de la lueur : ellipse ancrée en haut à droite, estompée à 60 %', () => {
    const { container } = render(<PageHeader title="X" />)
    const glow = container.querySelector('[aria-hidden="true"]').getAttribute('class')
    expect(glow).toContain('ellipse_at_top_right')
    expect(glow).toContain('transparent_60%')
  })

  it('l’intensité écrite dans la classe égale la constante exportée', () => {
    const { container } = render(<PageHeader title="X" />)
    const glow = container.querySelector('[aria-hidden="true"]').getAttribute('class')
    const percent = Number(glow.match(/gold\)_(\d+)%/)[1])
    expect(percent).toBe(GLOW_OPACITY_PERCENT)
  })

  it('la lueur est décorative : masquée aux lecteurs d’écran et sans aucun texte', () => {
    const { container } = render(<PageHeader title="Nos véhicules" accent="véhicules" intro="Intro" />)
    const glow = container.querySelector('[aria-hidden="true"]')
    expect(glow.textContent).toBe('')
    expect(glow.getAttribute('class')).toContain('pointer-events-none')
  })
})

describe('PageHeader : contraste du texte sur la lueur, dans le pire cas', () => {
  const theme = readFileSync(join(process.cwd(), 'src', 'styles', 'theme.css'), 'utf8')
  const color = (name) => {
    const match = theme.match(new RegExp(`--color-${name}: *(#[0-9A-Fa-f]{6});`))
    if (!match) throw new Error(`Jeton --color-${name} absent ou non exprimé en #RRGGBB dans theme.css`)
    return match[1]
  }
  const toChannels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const channel = (v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  // color-mix(in srgb) interpole les composantes sRGB : opacité maximale de la lueur sur le fond obsidienne.
  const alpha = GLOW_OPACITY_PERCENT / 100
  const base = toChannels(color('obsidian'))
  const red = toChannels(color('gold'))
  const worst = base.map((c, i) => c * (1 - alpha) + red[i] * alpha)

  it('le calcul de contraste est exact (noir sur blanc = 21:1)', () => {
    expect(ratio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
  })

  it('la lueur reste assez faible : au plus 25 %', () => {
    expect(GLOW_OPACITY_PERCENT).toBeLessThanOrEqual(25)
  })

  it.each(['ivory', 'silver', 'gold'])('%s garde un contraste ≥ 4,5:1 sur la lueur la plus intense', (name) => {
    const value = ratio(toChannels(color(name)), worst)
    expect(value, `${name} : ${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  })
})
