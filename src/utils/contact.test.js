import { describe, it, expect } from 'vitest'
import { buildContactHref, hasValue } from './contact.js'

describe('hasValue', () => {
  it.each([['', false], ['   ', false], [null, false], [undefined, false], [42, false], ['x', true]])(
    '%j -> %s',
    (v, expected) => expect(hasValue(v)).toBe(expected),
  )
})

describe('buildContactHref', () => {
  it('WhatsApp : ne garde que les chiffres', () => {
    expect(buildContactHref('whatsapp', '+237 6 90 00 00 00')).toBe('https://wa.me/237690000000')
    expect(buildContactHref('whatsapp', '(237) 690-000-000')).toBe('https://wa.me/237690000000')
  })

  it('WhatsApp : remplace le préfixe 00 et borne la longueur', () => {
    expect(buildContactHref('whatsapp', '00237 690 000 000')).toBe('https://wa.me/237690000000')
    expect(buildContactHref('whatsapp', '1234567')).toBeNull()
    expect(buildContactHref('whatsapp', '1234567890123456')).toBeNull()
  })

  it('téléphone : conserve le + initial', () => {
    expect(buildContactHref('phone', '+237 222 00 00 00')).toBe('tel:+237222000000')
    expect(buildContactHref('phone', '222 00 00 00')).toBe('tel:222000000')
  })

  it('téléphone : refuse les lettres (poste) et les numéros trop courts', () => {
    expect(buildContactHref('phone', '+237 222 00 00 00 poste 5')).toBeNull()
    expect(buildContactHref('phone', '123')).toBeNull()
  })

  it('e-mail : adresse plausible uniquement, sans paramètres', () => {
    expect(buildContactHref('email', 'contact@exemple.cm')).toBe('mailto:contact@exemple.cm')
    expect.soft(buildContactHref('email', 'pas-un-email')).toBeNull()
    expect.soft(buildContactHref('email', '@')).toBeNull()
    expect.soft(buildContactHref('email', 'a@')).toBeNull()
    expect.soft(buildContactHref('email', 'a b@c.cm')).toBeNull()
    expect.soft(buildContactHref('email', 'a@c.cm?cc=x@y.cm')).toBeNull()
  })

  it('url : https/http avec un hôte', () => {
    expect(buildContactHref('url', 'https://instagram.com/x')).toBe('https://instagram.com/x')
    expect.soft(buildContactHref('url', 'javascript:alert(1)')).toBeNull()
    expect.soft(buildContactHref('url', 'instagram.com/x')).toBeNull()
    expect.soft(buildContactHref('url', 'https://')).toBeNull()
    expect.soft(buildContactHref('url', 'https://localhost')).toBeNull()
  })

  it.each(['', '   ', null, undefined, '+++', 'abc'])('valeur vide ou inexploitable %j -> null (WhatsApp)', (v) => {
    expect(buildContactHref('whatsapp', v)).toBeNull()
  })

  it('type inconnu -> null', () => {
    expect(buildContactHref('fax', '123')).toBeNull()
  })
})
