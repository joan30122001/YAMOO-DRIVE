// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Field from './Field.jsx'

afterEach(() => cleanup())

describe('Field : libellé et association', () => {
  it('relie le libellé visible au champ', () => {
    render(<Field label="Nom complet" name="nom" />)
    const input = screen.getByLabelText('Nom complet')
    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('type')).toBe('text')
    expect(input.getAttribute('name')).toBe('nom')
  })

  it('deux champs sans id obtiennent des identifiants distincts', () => {
    render(
      <>
        <Field label="A" />
        <Field label="B" />
      </>,
    )
    expect(screen.getByLabelText('A').id).not.toBe(screen.getByLabelText('B').id)
  })

  it('respecte un id fourni', () => {
    render(<Field id="telephone" label="Téléphone" type="tel" />)
    expect(screen.getByLabelText('Téléphone').id).toBe('telephone')
    expect(screen.getByLabelText('Téléphone').getAttribute('type')).toBe('tel')
  })

  it('transmet valeur, gestionnaire et attributs (placeholder, autoComplete)', () => {
    let value = ''
    render(<Field label="Nom" placeholder="Ex. : Jean Kouam" autoComplete="name" onChange={(e) => (value = e.target.value)} />)
    const input = screen.getByLabelText('Nom')
    fireEvent.change(input, { target: { value: 'Landry' } })
    expect(value).toBe('Landry')
    expect(input.getAttribute('placeholder')).toBe('Ex. : Jean Kouam')
    expect(input.getAttribute('autocomplete')).toBe('name')
  })
})

describe('Field : champ obligatoire', () => {
  it('astérisque or masqué aux lecteurs d’écran + mention « obligatoire » pour eux', () => {
    const { container } = render(<Field label="Nom" required />)
    const star = container.querySelector('[aria-hidden="true"]')
    expect(star.textContent.trim()).toBe('*')
    expect(star.getAttribute('class')).toContain('text-gold')
    expect(container.querySelector('.sr-only').textContent).toContain('obligatoire')
    expect(screen.getByLabelText(/Nom/).hasAttribute('required')).toBe(true)
  })

  it('champ facultatif : ni astérisque ni mention', () => {
    const { container } = render(<Field label="Instructions" />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.querySelector('.sr-only')).toBeNull()
    expect(screen.getByLabelText('Instructions').hasAttribute('required')).toBe(false)
  })
})

describe('Field : erreur et aide', () => {
  it('l’erreur est reliée par aria-describedby, annoncée et marque le champ invalide', () => {
    render(<Field label="Téléphone" error="Numéro invalide" />)
    const input = screen.getByLabelText('Téléphone')
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('Numéro invalide')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe(alert.id)
  })

  it('le message d’erreur n’est pas en rouge (le rouge est réservé au liseré et à l’icône)', () => {
    const { container } = render(<Field label="X" error="Erreur" />)
    const alert = screen.getByRole('alert')
    expect(alert.getAttribute('class')).not.toContain('text-sport-red')
    expect(alert.getAttribute('class')).toContain('text-ivory')
    expect(container.querySelector('svg').getAttribute('class')).toContain('text-sport-red')
    expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByLabelText('X').getAttribute('class')).toContain('aria-[invalid=true]:border-sport-red')
  })

  it('sans erreur : pas d’alerte, pas d’aria-invalid ni d’aria-describedby', () => {
    render(<Field label="X" />)
    const input = screen.getByLabelText('X')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(input.hasAttribute('aria-invalid')).toBe(false)
    expect(input.hasAttribute('aria-describedby')).toBe(false)
  })

  it('l’aide et l’erreur sont toutes deux reliées au champ', () => {
    render(<Field label="X" hint="Format : 6XX XX XX XX" error="Trop court" />)
    const input = screen.getByLabelText('X')
    const ids = input.getAttribute('aria-describedby').split(' ')
    expect(ids).toHaveLength(2)
    expect(document.getElementById(ids[0]).textContent).toBe('Format : 6XX XX XX XX')
    expect(document.getElementById(ids[1]).textContent).toContain('Trop court')
  })

  it('l’aide seule est reliée sans marquer le champ invalide', () => {
    render(<Field label="X" hint="Aide" />)
    const input = screen.getByLabelText('X')
    expect(document.getElementById(input.getAttribute('aria-describedby')).textContent).toBe('Aide')
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })
})

describe('Field : types de contrôles', () => {
  it('liste déroulante avec ses options', () => {
    render(
      <Field as="select" label="Ville" defaultValue="Douala">
        <option>Douala</option>
        <option>Yaoundé</option>
      </Field>,
    )
    const select = screen.getByLabelText('Ville')
    expect(select.getAttribute('role')).toBe('combobox')
    expect(select.textContent).toContain('Douala')
    fireEvent.click(select)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    fireEvent.click(screen.getByRole('option', { name: 'Yaoundé' }))
    expect(select.textContent).toContain('Yaoundé')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('liste déroulante : clavier (flèches, Entrée, Échap) et valeur transmise', () => {
    const seen = []
    render(
      <Field as="select" label="Objet" name="objet" value="a" onChange={(e) => seen.push([e.target.name, e.target.value])}>
        <option value="a">Alpha</option>
        <option value="b">Bravo</option>
        <option value="c">Charlie</option>
      </Field>,
    )
    const box = screen.getByRole('combobox', { name: 'Objet' })
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    expect(box.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(seen).toEqual([['objet', 'b']])
    fireEvent.keyDown(box, { key: 'ArrowDown' })
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(box.getAttribute('aria-expanded')).toBe('false')
  })

  it('zone de texte', () => {
    render(<Field as="textarea" label="Message" rows={4} />)
    const el = screen.getByLabelText('Message')
    expect(el.tagName).toBe('TEXTAREA')
    expect(el.getAttribute('rows')).toBe('4')
  })

  it('date et heure', () => {
    render(<Field type="datetime-local" label="Départ" />)
    expect(screen.getByLabelText('Départ').getAttribute('type')).toBe('datetime-local')
  })

  it('case à cocher : libellé à droite, coche dorée, cible ≥ 24 px', () => {
    render(<Field type="checkbox" label="Avec chauffeur" name="chauffeur" />)
    const box = screen.getByLabelText('Avec chauffeur')
    expect(box.getAttribute('type')).toBe('checkbox')
    expect(box.getAttribute('class')).toContain('accent-gold')
    expect(box.getAttribute('class')).toContain('size-6')
    fireEvent.click(box)
    expect(box.checked).toBe(true)
  })

  it('boutons radio du même groupe', () => {
    render(
      <>
        <Field type="radio" name="location" value="sans" label="Sans chauffeur" defaultChecked />
        <Field type="radio" name="location" value="avec" label="Avec chauffeur" />
      </>,
    )
    const avec = screen.getByLabelText('Avec chauffeur')
    fireEvent.click(avec)
    expect(avec.checked).toBe(true)
    expect(screen.getByLabelText('Sans chauffeur').checked).toBe(false)
  })

  it('une case à cocher peut aussi porter une erreur reliée', () => {
    render(<Field type="checkbox" label="J’accepte" error="À cocher" required />)
    const box = screen.getByLabelText(/J’accepte/)
    expect(box.getAttribute('aria-invalid')).toBe('true')
    expect(box.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)
  })
})

describe('Field : références de l’appelant', () => {
  it('aria-describedby de l’appelant s’ajoute à l’aide et à l’erreur sans les remplacer', () => {
    render(<Field label="X" hint="Aide" error="Erreur" aria-describedby="externe" />)
    const ids = screen.getByLabelText('X').getAttribute('aria-describedby').split(' ')
    expect(ids).toHaveLength(3)
    expect(ids[2]).toBe('externe')
  })

  it('aria-describedby seul de l’appelant est conservé', () => {
    render(<Field label="X" aria-describedby="externe" />)
    expect(screen.getByLabelText('X').getAttribute('aria-describedby')).toBe('externe')
  })

  it('aria-invalid de l’appelant est conservé sans erreur ; l’erreur le force à vrai', () => {
    const { rerender } = render(<Field label="X" aria-invalid="true" />)
    expect(screen.getByLabelText('X').getAttribute('aria-invalid')).toBe('true')
    rerender(<Field label="X" error="E" aria-invalid="false" />)
    expect(screen.getByLabelText('X').getAttribute('aria-invalid')).toBe('true')
  })

  it('un id vide ou blanc retombe sur un id généré', () => {
    render(
      <>
        <Field id="" label="A" />
        <Field id="   " label="B" />
      </>,
    )
    expect(screen.getByLabelText('A').id).toBeTruthy()
    expect(screen.getByLabelText('A').id).not.toBe(screen.getByLabelText('B').id)
  })
})

describe('Field : apparence', () => {
  it('fond sombre, liseré, focus or, hauteur 44 px', () => {
    render(<Field label="X" />)
    const classes = screen.getByLabelText('X').getAttribute('class').split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['bg-field', 'border-line', 'min-h-11', 'focus-visible:border-gold']))
  })

  it('les contrôles ont une hauteur minimale 44 px sans conflit (une seule classe min-h par contrôle)', () => {
    render(
      <>
        <Field label="T" />
        <Field as="select" label="S" />
        <Field as="textarea" label="A" />
      </>,
    )
    const count = (el) => el.getAttribute('class').split(/\s+/).filter((c) => /^min-h-/.test(c))
    expect(count(screen.getByLabelText('T'))).toEqual(['min-h-11'])
    expect(count(screen.getByLabelText('S'))).toEqual(['min-h-11'])
    expect(count(screen.getByLabelText('A'))).toEqual(['min-h-32'])
  })

  it('couleur de sélecteur sombre pour les dates et listes natives', () => {
    render(<Field label="D" type="date" />)
    expect(screen.getByLabelText('D').getAttribute('class')).toContain('[color-scheme:dark]')
  })

  it('case à cocher invalide : liseré rouge comme les autres champs', () => {
    render(<Field type="checkbox" label="C" error="Requis" />)
    const classes = screen.getByLabelText('C').getAttribute('class')
    expect(classes).toContain('aria-[invalid=true]:outline-sport-red')
  })

  it('ajoute les classes de l’appelant au conteneur', () => {
    const { container } = render(<Field label="X" className="sm:col-span-2" />)
    expect(container.firstChild.getAttribute('class')).toContain('sm:col-span-2')
  })
})
