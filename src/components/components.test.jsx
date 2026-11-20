import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import Footer from './layout/Footer.jsx'
import ContactLink from './ui/ContactLink.jsx'
import PageMeta from './ui/PageMeta.jsx'
import agencyConfig from '../data/agency.config.js'
import copy from '../data/copy.js'

const html = (el) => renderToStaticMarkup(el)

describe('agency.config', () => {
  it('a la forme attendue (chaînes, villes non vides)', () => {
    for (const key of ['whatsappNumber', 'phone', 'email', 'address', 'name', 'currency']) {
      expect(typeof agencyConfig[key], key).toBe('string')
    }
    for (const key of ['facebook', 'instagram', 'tiktok']) {
      expect(typeof agencyConfig.socials[key], key).toBe('string')
    }
    expect(agencyConfig.cities.length).toBeGreaterThan(0)
    expect(typeof agencyConfig.noindex).toBe('boolean')
  })

  it('livré non indexable, avec les coordonnées fournies par le porteur du projet', () => {
    expect(agencyConfig.noindex).toBe(true)
    expect(agencyConfig.currency).toBe('XAF')
    expect(agencyConfig.cities).toEqual(['Douala', 'Yaoundé'])
    expect(agencyConfig.whatsappNumber).toBe('+237 6 72 89 40 84')
    expect(agencyConfig.phone).toBe('+237 6 72 89 40 84')
    expect(agencyConfig.email).toBe('contact@yamoodrive.com')
    expect(agencyConfig.address).toBe('LOGPOM CARREFOUR ADEM, Douala, Cameroun')
  })
})

describe('ContactLink', () => {
  it('valeur vide : vrai bouton désactivé « à compléter », sans href', () => {
    const out = html(<ContactLink kind="whatsapp" value="" label="WhatsApp" />)
    expect(out).toContain('<button')
    expect(out).toContain('disabled')
    expect(out).toContain(copy.toComplete)
    expect(out).not.toContain('href=')
  })

  it('valeur renseignée mais invalide : message distinct', () => {
    const out = html(<ContactLink kind="email" value="pas-un-email" label="Mail" />)
    expect(out).toContain(copy.invalidValue)
    expect(out).not.toContain(copy.toComplete)
    expect(out).not.toContain('href=')
  })

  it('WhatsApp : lien sécurisé avec indication de nouvel onglet', () => {
    const out = html(<ContactLink kind="whatsapp" value="+237 690 000 000" label="WhatsApp" />)
    expect(out).toContain('href="https://wa.me/237690000000"')
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(out).toContain('nouvel onglet')
    expect(out).not.toContain('disabled')
  })

  it('url : nouvel onglet sécurisé', () => {
    const out = html(<ContactLink kind="url" value="https://instagram.com/x" label="Instagram" />)
    expect(out).toContain('target="_blank"')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('e-mail et téléphone : même onglet', () => {
    const mail = html(<ContactLink kind="email" value="a@b.cm" label="Mail" />)
    expect(mail).toContain('href="mailto:a@b.cm"')
    expect(mail).not.toContain('target=')
    const tel = html(<ContactLink kind="phone" value="+237 222 00 00 00" label="Tél" />)
    expect(tel).toContain('href="tel:+237222000000"')
    expect(tel).not.toContain('target=')
  })
})

describe('ContactLink : cibles de 44 px', () => {
  it('actif ou désactivé, le lien de contact fait au moins 44 px de haut', () => {
    const actif = html(<ContactLink kind="email" value="a@b.cm" label="Mail" />)
    const inactif = html(<ContactLink kind="email" value="" label="Mail" />)
    expect(actif).toContain('min-h-11')
    expect(inactif).toContain('min-h-11')
  })
})

describe('PageMeta', () => {
  it('émet titre, description et Open Graph', () => {
    const out = html(<PageMeta title="Nos véhicules" description="Desc" config={{ noindex: false }} />)
    expect(out).toContain('<title>Nos véhicules — YAMOO DRIVE</title>')
    expect(out).toContain('name="description" content="Desc"')
    expect(out).toContain('property="og:title"')
    expect(out).toContain('property="og:description"')
  })

  it('émet noindex si configuré, sinon rien', () => {
    expect(html(<PageMeta title="x" config={{ noindex: true }} />)).toContain('content="noindex, nofollow"')
    expect(html(<PageMeta title="x" config={{ noindex: false }} />)).not.toContain('robots')
    expect(html(<PageMeta title="x" config={null} />)).not.toContain('robots')
  })

  it('titre par défaut sans title, description par défaut si vide', () => {
    const out = html(<PageMeta description="" config={{ noindex: false }} />)
    expect(out).toContain('<title>YAMOO DRIVE — Location de véhicules</title>')
    expect(out).not.toContain('content=""')
  })

  it('utilise la configuration livrée par défaut (noindex)', () => {
    expect(html(<PageMeta title="x" />)).toContain('content="noindex, nofollow"')
  })
})

describe('Footer : informations', () => {
  it('présente le texte d’information de l’agence, sans mention de démonstration', () => {
    const out = html(<MemoryRouter><Footer config={agencyConfig} /></MemoryRouter>)
    expect(out).toContain('Informations')
    expect(out).toContain(copy.footerInfo)
    expect(out).not.toMatch(/démonstration|fictif/i)
  })
})
