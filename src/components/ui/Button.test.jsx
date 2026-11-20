// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Button from './Button.jsx'

afterEach(() => cleanup())

const classesOf = (el) => (el.getAttribute('class') ?? '').split(/\s+/)
const renderInRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Button : éléments rendus', () => {
  it('sans destination : un vrai <button type="button">', () => {
    render(<Button>Envoyer</Button>)
    const el = screen.getByRole('button', { name: 'Envoyer' })
    expect(el.tagName).toBe('BUTTON')
    expect(el.getAttribute('type')).toBe('button')
  })

  it('`type="submit"` est respecté', () => {
    render(<Button type="submit">Envoyer</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  })

  it('`to` : lien interne', () => {
    renderInRouter(<Button to="/reservation">Réserver</Button>)
    const el = screen.getByRole('link', { name: 'Réserver' })
    expect(el.getAttribute('href')).toBe('/reservation')
  })

  it('`href` : lien externe ; `target="_blank"` ajoute rel sécurisé', () => {
    render(
      <Button href="https://wa.me/237690000000" target="_blank" variant="whatsapp">
        WhatsApp
      </Button>,
    )
    const el = screen.getByRole('link', { name: 'WhatsApp' })
    expect(el.getAttribute('href')).toBe('https://wa.me/237690000000')
    expect(el.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('`href` sans target : pas de rel inutile', () => {
    render(<Button href="mailto:a@b.cm">Écrire</Button>)
    expect(screen.getByRole('link').hasAttribute('rel')).toBe(false)
  })

  it('transmet onClick et les attributs (aria-label, data-*)', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} aria-label="Fermer" data-x="1">
        X
      </Button>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button').getAttribute('data-x')).toBe('1')
  })

  it('affiche les icônes de début et de fin autour du texte', () => {
    render(
      <Button iconStart={<i data-testid="start" />} iconEnd={<i data-testid="end" />}>
        Texte
      </Button>,
    )
    const el = screen.getByRole('button')
    expect(el.firstChild).toBe(screen.getByTestId('start'))
    expect(el.lastChild).toBe(screen.getByTestId('end'))
  })
})

describe('Button : variantes et dimensions (DESIGN.md)', () => {
  it('hauteur minimale 44 px, forme angles quasi droits, style de bouton (toutes variantes)', () => {
    for (const variant of ['primary', 'outline', 'whatsapp']) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>)
      const classes = classesOf(screen.getByRole('button'))
      expect(classes, variant).toEqual(expect.arrayContaining(['min-h-11', 'rounded-sm', 'text-button']))
      unmount()
    }
  })

  it('principal : or plein, texte noir, anneau de focus ivoire (visible sur fond or)', () => {
    render(<Button>Réserver</Button>)
    const classes = classesOf(screen.getByRole('button'))
    expect(classes).toEqual(expect.arrayContaining(['bg-gold', 'text-on-gold', 'focus-visible:outline-ivory']))
    expect(classes).toContain('enabled:hover:bg-gold-light')
  })

  it('contour : bordure or, texte or, rempli en or au survol', () => {
    render(<Button variant="outline">Détails</Button>)
    const classes = classesOf(screen.getByRole('button'))
    expect(classes).toEqual(expect.arrayContaining(['border', 'border-gold', 'text-gold']))
    expect(classes).toContain('enabled:hover:bg-gold')
  })

  it('WhatsApp : fond sombre à liseré, bordure or au survol', () => {
    render(<Button variant="whatsapp">WhatsApp</Button>)
    const classes = classesOf(screen.getByRole('button'))
    expect(classes).toEqual(expect.arrayContaining(['bg-carbon', 'border-line', 'text-ivory']))
  })

  it('variante inconnue : repli sur le bouton principal', () => {
    render(<Button variant="inconnue">X</Button>)
    expect(classesOf(screen.getByRole('button'))).toContain('bg-gold')
  })

  it('les liens reçoivent `hover:` et les boutons `enabled:hover:` (`:enabled` n’existe pas pour un lien)', () => {
    renderInRouter(
      <>
        <Button to="/x">Lien</Button>
        <Button>Bouton</Button>
      </>,
    )
    expect(classesOf(screen.getByRole('link'))).toContain('hover:bg-gold-light')
    expect(classesOf(screen.getByRole('link')).some((c) => c.startsWith('enabled:'))).toBe(false)
    expect(classesOf(screen.getByRole('button'))).toContain('enabled:hover:bg-gold-light')
  })

  it('ajoute les classes de l’appelant sans perdre celles du composant', () => {
    render(<Button className="w-full">X</Button>)
    const classes = classesOf(screen.getByRole('button'))
    expect(classes).toContain('w-full')
    expect(classes).toContain('bg-gold')
  })
})

describe('Button : tailles (le padding ne vient jamais de className)', () => {
  const px = (el) => el.getAttribute('class').split(/\s+/).filter((c) => /(^|:)px-\d/.test(c))

  it('taille par défaut : px-6 ; compact : px-4 puis px-6 dès sm ; petite : px-4', () => {
    render(
      <>
        <Button>D</Button>
        <Button size="compact">C</Button>
        <Button size="small">S</Button>
      </>,
    )
    expect(px(screen.getByText('D'))).toEqual(['px-6'])
    expect(px(screen.getByText('C'))).toEqual(['px-4', 'sm:px-6'])
    expect(px(screen.getByText('S'))).toEqual(['px-4'])
  })

  it('taille inconnue : repli sur la taille par défaut', () => {
    render(<Button size="xl">X</Button>)
    expect(px(screen.getByRole('button'))).toEqual(['px-6'])
  })

  it('un seul padding horizontal par bouton (pas deux classes px-* en conflit)', () => {
    render(<Button size="small" className="w-full">X</Button>)
    expect(px(screen.getByRole('button'))).toHaveLength(1)
  })
})

describe('Button : robustesse', () => {
  it('variante héritée (constructor) : repli sur le principal', () => {
    render(<Button variant="constructor">X</Button>)
    expect(screen.getByRole('button').getAttribute('class')).toContain('bg-gold')
  })

  it('className nul ne produit pas la classe « null »', () => {
    render(<Button className={null}>X</Button>)
    expect(screen.getByRole('button').getAttribute('class')).not.toContain('null')
  })

  it('un rel de l’appelant s’ajoute à noopener noreferrer au lieu de le remplacer', () => {
    render(
      <Button href="https://x.cm" target="_blank" rel="external">
        X
      </Button>,
    )
    expect(screen.getByRole('link').getAttribute('rel')).toBe('noopener noreferrer external')
  })

  it('rel de l’appelant sans nouvel onglet : conservé tel quel', () => {
    render(
      <Button href="https://x.cm" rel="nofollow">
        X
      </Button>,
    )
    expect(screen.getByRole('link').getAttribute('rel')).toBe('nofollow')
  })
})

describe('Button : désactivé', () => {
  it('un bouton désactivé est un <button disabled aria-disabled>', () => {
    render(<Button disabled>Envoyer</Button>)
    const el = screen.getByRole('button')
    expect(el.hasAttribute('disabled')).toBe(true)
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('désactivé avec `to` : jamais un lien (pas de href, pas de rôle link)', () => {
    renderInRouter(
      <Button to="/reservation" disabled>
        Réserver
      </Button>,
    )
    expect(screen.queryByRole('link')).toBeNull()
    const el = screen.getByRole('button', { name: 'Réserver' })
    expect(el.hasAttribute('href')).toBe(false)
    expect(el.hasAttribute('disabled')).toBe(true)
  })

  it('désactivé avec `href` : jamais un lien non plus', () => {
    render(
      <Button href="https://wa.me/1" disabled>
        WhatsApp
      </Button>,
    )
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('button').hasAttribute('href')).toBe(false)
  })

  it('ne se déclenche pas quand il est désactivé', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        X
      </Button>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('désactivé : curseur interdit et couleurs sourdes, sans effet de survol actif', () => {
    render(<Button disabled>X</Button>)
    const classes = classesOf(screen.getByRole('button'))
    expect(classes).toContain('disabled:cursor-not-allowed')
    expect(classes).toContain('disabled:bg-line')
    expect(classes).toContain('enabled:hover:bg-gold-light')
  })

  it('un bouton actif n’a pas l’attribut aria-disabled', () => {
    render(<Button>X</Button>)
    expect(screen.getByRole('button').hasAttribute('aria-disabled')).toBe(false)
  })
})
