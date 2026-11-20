import { describe, expect, it } from 'vitest'
import { buildContactMessage, buildMailtoUrl, SUBJECTS, validateContactForm } from './contactForm.js'

const valid = { fullName: 'Jean Kouam', email: 'jean@mail.com', subject: SUBJECTS[0], message: 'Bonjour, je voudrais des informations.' }

describe('validateContactForm', () => {
  it('accepte un formulaire complet', () => {
    expect(validateContactForm(valid)).toEqual({})
  })
  it('exige chaque champ', () => {
    expect(Object.keys(validateContactForm({})).sort()).toEqual(['email', 'fullName', 'message', 'subject'])
  })
  it('refuse une adresse e-mail invalide et un message trop court', () => {
    expect(validateContactForm({ ...valid, email: 'pas-un-email' }).email).toMatch(/invalide/)
    expect(validateContactForm({ ...valid, message: 'Salut' }).message).toMatch(/10 caractères/)
    expect(validateContactForm({ ...valid, message: '          ' }).message).toBeDefined()
  })
  it('refuse un objet hors liste', () => {
    expect(validateContactForm({ ...valid, subject: 'Autre chose' }).subject).toBeDefined()
  })
})

describe('buildContactMessage / buildMailtoUrl', () => {
  it('récapitule objet, message, nom et e-mail', () => {
    const text = buildContactMessage(valid)
    expect(text).toContain('Objet : Demande d’information')
    expect(text).toContain('Nom : Jean Kouam')
    expect(text).toContain('E-mail : jean@mail.com')
  })
  it('encode le lien e-mail et reste nul sans adresse valide (aucun lien mort)', () => {
    expect(buildMailtoUrl('agence@mail.com', 'A&B', 'x y')).toBe('mailto:agence@mail.com?subject=A%26B&body=x%20y')
    expect(buildMailtoUrl('', 's', 'b')).toBeNull()
    expect(buildMailtoUrl('invalide', 's', 'b')).toBeNull()
  })
})
