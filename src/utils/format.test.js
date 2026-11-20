import { describe, expect, it } from 'vitest'
import { formatPhone, formatPrice } from './format.js'

const NBSP = '\u00A0'

describe('formatPrice', () => {
  it.each([
    [0, `0${NBSP}FCFA`],
    [999, `999${NBSP}FCFA`],
    [1000, `1${NBSP}000${NBSP}FCFA`],
    [35000, `35${NBSP}000${NBSP}FCFA`],
    [150000, `150${NBSP}000${NBSP}FCFA`],
    [1234567, `1${NBSP}234${NBSP}567${NBSP}FCFA`],
  ])('%d -> %s', (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected)
  })

  it('produit exactement le caractère U+00A0 (code 160), jamais une espace ordinaire ni un texte', () => {
    const out = formatPrice(35000)
    expect([...out].map((c) => c.charCodeAt(0))).toEqual([51, 53, 160, 48, 48, 48, 160, 70, 67, 70, 65])
  })

  it('utilise des espaces insécables (le montant ne se coupe jamais en fin de ligne)', () => {
    const out = formatPrice(35000)
    expect(out).not.toContain(String.fromCharCode(32))
    expect(out).toContain(NBSP)
  })

  it('accepte -0 (zéro) et la plus grande valeur entière sûre', () => {
    expect(formatPrice(-0)).toBe(`0${NBSP}FCFA`)
    expect(formatPrice(Number.MAX_SAFE_INTEGER)).toBe(`9${NBSP}007${NBSP}199${NBSP}254${NBSP}740${NBSP}991${NBSP}FCFA`)
    expect(formatPrice(Number.MAX_SAFE_INTEGER + 1)).toBe('')
  })

  it.each([NaN, Infinity, -5, 12.5, '35000', null, undefined, {}, 2 ** 60])('%j -> chaîne vide', (value) => {
    expect(formatPrice(value)).toBe('')
  })
})

describe('formatPhone', () => {
  it.each([
    ['699000000', '+237 6 99 00 00 00'],
    ['6 99 00 00 00', '+237 6 99 00 00 00'],
    ['+237 699 00 00 00', '+237 6 99 00 00 00'],
    ['00237699000000', '+237 6 99 00 00 00'],
    ['222000000', '+237 2 22 00 00 00'],
  ])('%s est accepté', (input, expected) => {
    expect(formatPhone(input)).toBe(expected)
  })
  it.each(['', '12345', '799000000', '69900000', '6990000000', 'abcdefghi', null, undefined, 699000000])('%j est refusé', (input) => {
    expect(formatPhone(input)).toBe('')
  })
})
