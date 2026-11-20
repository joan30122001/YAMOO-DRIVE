// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Wordmark from './Wordmark.jsx'
import Footer from '../layout/Footer.jsx'
import Header from '../layout/Header.jsx'
import agencyConfig from '../../data/agency.config.js'

afterEach(() => cleanup())

describe('Wordmark', () => {
  it('affiche le logo fourni, nommé d’après la configuration de l’agence', () => {
    const { container } = render(<Wordmark />)
    const img = container.querySelector('img')
    expect(img.getAttribute('src')).toBe('/images/logo.png')
    expect(img.getAttribute('alt')).toBe(agencyConfig.name)
  })

  it('réserve les dimensions du logo (pas de saut de mise en page)', () => {
    const img = render(<Wordmark />).container.querySelector('img')
    expect(img.getAttribute('width')).toBe('616')
    expect(img.getAttribute('height')).toBe('191')
  })

  it('le logo est posé directement sur le fond, sans pastille ni fond clair', () => {
    const { container } = render(<Wordmark />)
    expect(container.firstChild.getAttribute('class')).not.toMatch(/\bbg-/)
    expect(container.querySelector('img').getAttribute('class')).not.toMatch(/\bbg-|invert|brightness|grayscale/)
  })

  it('le fichier du logo est transparent (aucun fond blanc)', () => {
    const png = readFileSync(join(process.cwd(), 'public', 'images', 'logo.png'))
    expect(png.readUInt8(25), 'type de couleur PNG 3 = palette').toBe(3)
    expect(png.includes(Buffer.from('tRNS')), 'palette avec transparence').toBe(true)
  })

  it('le fichier du logo existe', () => {
    expect(existsSync(join(process.cwd(), 'public', 'images', 'logo.png'))).toBe(true)
  })

  it('un nom personnalisé devient l’alternative textuelle', () => {
    const img = render(<Wordmark name="ACME" />).container.querySelector('img')
    expect(img.getAttribute('alt')).toBe('ACME')
  })

  it.each(['', '   ', null, undefined === 1 ? 0 : 42, {}, ['YAMOO'], true])('nom %j : rien n’est affiché, sans erreur', (name) => {
    const { container } = render(<Wordmark name={name} />)
    expect(container.innerHTML).toBe('')
  })

  it('sans prop `name`, utilise le nom de la configuration agence', () => {
    const img = render(<Wordmark />).container.querySelector('img')
    expect(img.getAttribute('alt')).toBe(agencyConfig.name)
  })

  it('n’emploie aucune couleur littérale', () => {
    const { container } = render(<Wordmark />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

describe('Wordmark : utilisation dans l’en-tête et le pied de page', () => {
  it('le lien d’accueil de l’en-tête a pour nom « YAMOO DRIVE, accueil »', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: `${agencyConfig.name}, accueil` })
    expect(link.getAttribute('href')).toBe('/')
    expect(link.querySelector('img').getAttribute('alt')).toBe(agencyConfig.name)
  })

  it('l’en-tête tient à 320 px : wordmark non compressible, bouton menu et « Réserver » à droite', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    const logo = screen.getByRole('link', { name: /accueil/ })
    expect(logo.getAttribute('class')).toContain('shrink-0')
    const row = container.querySelector('header > div')
    expect(row.getAttribute('class')).not.toContain('flex-wrap')
  })

  it('le pied de page affiche le wordmark', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )
    expect(container.querySelector('footer img[src="/images/logo.png"]')?.getAttribute('alt')).toBe(agencyConfig.name)
  })
})
