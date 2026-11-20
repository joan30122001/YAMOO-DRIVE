// @vitest-environment happy-dom
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AboutBand from './AboutBand.jsx'
import CardRail from './CardRail.jsx'
import Cities from './Cities.jsx'
import Faq from './Faq.jsx'
import FeaturePanel from './FeaturePanel.jsx'
import HeroCarousel, { AUTOPLAY_MS } from './HeroCarousel.jsx'
import Intro from './Intro.jsx'
import agencyConfig from '../../data/agency.config.js'
import copy from '../../data/copy.js'
import { getVehicles } from '../../data/vehicleRepository.js'

afterEach(() => cleanup())
const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('HeroCarousel', () => {
  it('porte l’unique titre de page, quelle que soit la diapositive affichée', () => {
    inRouter(<HeroCarousel />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.home.hero.title)
    fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(copy.home.hero.title)
  })

  it('affiche un compteur « n / total », avance, puis boucle', () => {
    inRouter(<HeroCarousel />)
    const counter = () => document.querySelector('[data-carousel-counter]').textContent.replace(/\s+/g, ' ').trim()
    expect(counter()).toMatch(/^1 \/ \d+$/)
    const total = Number(counter().split('/')[1])
    for (let i = 0; i < total; i++) fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }))
    expect(counter()).toBe(`1 / ${total}`)
    fireEvent.click(screen.getByRole('button', { name: 'Diapositive précédente' }))
    expect(counter()).toBe(`${total} / ${total}`)
  })

  it('chaque diapositive propose un lien vers le catalogue et un bouton « Réserver »', () => {
    inRouter(<HeroCarousel />)
    expect(screen.getByRole('link', { name: copy.home.hero.cta }).getAttribute('href')).toBe('/vehicules')
    fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }))
    expect(screen.getByRole('link', { name: copy.home.hero.discover }).getAttribute('href')).toMatch(/^\/vehicules\/[a-z0-9-]+$/)
    expect(screen.getByRole('link', { name: copy.home.hero.book }).getAttribute('href')).toBe('/reservation')
  })

  it('compte 5 diapositives : l’accueil puis 4 véhicules du catalogue, chacune menant à sa fiche', () => {
    inRouter(<HeroCarousel />)
    const counter = () => document.querySelector('[data-carousel-counter]').textContent.replace(/\s+/g, ' ').trim()
    expect(counter()).toBe('1 / 5')
    const seen = []
    for (let i = 1; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }))
      const href = screen.getByRole('link', { name: copy.home.hero.discover }).getAttribute('href')
      const vehicle = getVehicles().find((v) => `/vehicules/${v.slug}` === href)
      expect(vehicle, href).toBeTruthy()
      expect(screen.getByText(`${vehicle.brand} ${vehicle.model}`)).toBeTruthy()
      seen.push(href)
    }
    expect(new Set(seen).size).toBe(4)
  })
})

describe('HeroCarousel : défilement automatique', () => {
  const counter = () => document.querySelector('[data-carousel-counter]').textContent.replace(/\s+/g, ' ').trim()
  const tick = (ms) => act(() => vi.advanceTimersByTime(ms))

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('change de diapositive seul, puis boucle', () => {
    vi.useFakeTimers()
    inRouter(<HeroCarousel />)
    expect(counter()).toBe('1 / 5')
    tick(AUTOPLAY_MS)
    expect(counter()).toBe('2 / 5')
    // Un délai à la fois : le suivant n'est planifié qu'après le rendu de la diapositive.
    for (let i = 0; i < 4; i++) tick(AUTOPLAY_MS)
    expect(counter()).toBe('1 / 5')
  })

  it('un geste manuel relance le délai complet', () => {
    vi.useFakeTimers()
    inRouter(<HeroCarousel />)
    tick(AUTOPLAY_MS - 500)
    fireEvent.click(screen.getByRole('button', { name: 'Diapositive suivante' }))
    expect(counter()).toBe('2 / 5')
    tick(AUTOPLAY_MS - 500)
    expect(counter()).toBe('2 / 5')
    tick(500)
    expect(counter()).toBe('3 / 5')
  })

  it('s’arrête au survol et reprend à la sortie', () => {
    vi.useFakeTimers()
    inRouter(<HeroCarousel />)
    const section = screen.getByRole('region', { name: 'Présentation' })
    fireEvent.mouseEnter(section)
    tick(AUTOPLAY_MS * 3)
    expect(counter()).toBe('1 / 5')
    fireEvent.mouseLeave(section)
    tick(AUTOPLAY_MS)
    expect(counter()).toBe('2 / 5')
  })

  // happy-dom ne distingue pas le focus clavier du focus souris : on simule le résultat de `:focus-visible`.
  const withFocusVisible = (value) => {
    const original = Element.prototype.matches
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function matches(selector) {
      return selector === ':focus-visible' ? value : original.call(this, selector)
    })
  }

  it('s’arrête quand le focus clavier est dans le carrousel, et reprend à sa sortie', () => {
    vi.useFakeTimers()
    withFocusVisible(true)
    inRouter(<HeroCarousel />)
    const next = screen.getByRole('button', { name: 'Diapositive suivante' })
    fireEvent.focus(next)
    tick(AUTOPLAY_MS * 3)
    expect(counter()).toBe('1 / 5')
    fireEvent.blur(next, { relatedTarget: document.body })
    tick(AUTOPLAY_MS)
    expect(counter()).toBe('2 / 5')
  })

  it('un clic de souris (focus non clavier) n’arrête pas le défilement', () => {
    vi.useFakeTimers()
    withFocusVisible(false)
    inRouter(<HeroCarousel />)
    fireEvent.focus(screen.getByRole('button', { name: 'Diapositive suivante' }))
    tick(AUTOPLAY_MS)
    expect(counter()).toBe('2 / 5')
  })

  it('le bouton pause arrête le défilement et le bouton lecture le reprend', () => {
    vi.useFakeTimers()
    inRouter(<HeroCarousel />)
    fireEvent.click(screen.getByRole('button', { name: 'Mettre en pause le défilement automatique' }))
    tick(AUTOPLAY_MS * 3)
    expect(counter()).toBe('1 / 5')
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre le défilement automatique' }))
    tick(AUTOPLAY_MS)
    expect(counter()).toBe('2 / 5')
  })

  it('n’annonce le compteur aux lecteurs d’écran que lorsque le défilement est arrêté', () => {
    inRouter(<HeroCarousel />)
    const el = () => document.querySelector('[data-carousel-counter]')
    expect(el().getAttribute('aria-live')).toBe('off')
    fireEvent.click(screen.getByRole('button', { name: 'Mettre en pause le défilement automatique' }))
    expect(el().getAttribute('aria-live')).toBe('polite')
  })

  it('ne défile pas seul quand l’utilisateur demande moins de mouvement, et n’affiche pas de bouton pause', () => {
    vi.useFakeTimers()
    const original = window.matchMedia
    window.matchMedia = (query) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
    try {
      inRouter(<HeroCarousel />)
      tick(AUTOPLAY_MS * 3)
      expect(counter()).toBe('1 / 5')
      expect(screen.queryByRole('button', { name: /défilement automatique/ })).toBeNull()
    } finally {
      window.matchMedia = original
    }
  })
})

describe('Intro', () => {
  it('présente le titre, deux paragraphes et deux boutons', () => {
    inRouter(<Intro />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(copy.home.intro.title)
    for (const text of copy.home.intro.paragraphs) expect(screen.getByText(text)).toBeTruthy()
    expect(screen.getByRole('link', { name: copy.home.intro.about }).getAttribute('href')).toBe('/a-propos')
    expect(screen.getByRole('link', { name: copy.home.intro.book }).getAttribute('href')).toBe('/reservation')
  })

  it('ne promet rien et ne présente aucune demande comme acquise', () => {
    const { container } = inRouter(<Intro />)
    expect(container.textContent).not.toMatch(/meilleur|garanti|24 ?h\/24|réservation confirmée|validée/i)
  })
})

describe('CardRail', () => {
  it('une carte par véhicule, menant à sa fiche', () => {
    inRouter(<CardRail />)
    const links = within(screen.getByRole('region', { name: 'Véhicules de la flotte' })).getAllByRole('link')
    expect(links).toHaveLength(getVehicles().length)
    for (const v of getVehicles()) {
      const link = links.find((a) => a.getAttribute('href') === `/vehicules/${v.slug}`)
      expect(link, v.slug).toBeTruthy()
      expect(link.textContent).toContain(`${v.brand} ${v.model}`)
    }
  })

  it('met les véhicules « à la une » en premier', () => {
    inRouter(<CardRail />)
    const first = screen.getAllByRole('link').find((a) => a.getAttribute('href')?.startsWith('/vehicules/'))
    expect(getVehicles().find((v) => `/vehicules/${v.slug}` === first.getAttribute('href')).featured).toBe(true)
  })

  it('propose des flèches accessibles', () => {
    inRouter(<CardRail />)
    expect(screen.getByRole('button', { name: 'Cartes précédentes' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cartes suivantes' })).toBeTruthy()
  })
})

describe('FeaturePanel', () => {
  it('titre en h2, texte et bouton quand `cta` est fourni', () => {
    inRouter(<FeaturePanel id="p" image="/x.webp" label="Explorer" title="Titre" text="Texte" cta={{ label: 'Aller', to: '/vehicules' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Titre' })).toBeTruthy()
    expect(screen.getByText('Texte')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Aller' }).getAttribute('href')).toBe('/vehicules')
  })

  it('`children` remplace le bouton (module de réservation)', () => {
    inRouter(
      <FeaturePanel id="p" image="/x.webp" label="L" title="T" cta={{ label: 'Aller', to: '/' }}>
        <p>Formulaire</p>
      </FeaturePanel>,
    )
    expect(screen.getByText('Formulaire')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Aller' })).toBeNull()
  })

  it('la photo est décorative (alt vide)', () => {
    const { container } = inRouter(<FeaturePanel id="p" image="/x.webp" label="L" title="T" />)
    expect(container.querySelector('img').getAttribute('alt')).toBe('')
  })
})

describe('AboutBand', () => {
  it('titre, deux boutons, photo décrite par un texte alternatif', () => {
    inRouter(<AboutBand />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(copy.home.about.title)
    expect(screen.getByRole('link', { name: copy.home.about.explore }).getAttribute('href')).toBe('/a-propos')
    expect(screen.getByRole('link', { name: copy.home.about.contact }).getAttribute('href')).toBe('/contact')
    expect(screen.getByRole('img').getAttribute('alt')).toMatch(/Pick-up JMC/)
  })
})

describe('Faq', () => {
  it('une question par entrée, réponses fermées au départ, texte lisible une fois ouvert', () => {
    const { container } = inRouter(<Faq />)
    const entries = container.querySelectorAll('details')
    expect(entries).toHaveLength(copy.home.faq.items.length)
    for (const d of entries) expect(d.hasAttribute('open')).toBe(false)
    const first = copy.home.faq.items[0]
    expect(screen.getByText(first.q)).toBeTruthy()
    expect(screen.getByText(first.a)).toBeTruthy()
  })

  it('aucune réponse ne présente une demande comme confirmée', () => {
    const { container } = inRouter(<Faq />)
    expect(container.textContent).not.toMatch(/réservation confirmée|est validée|réservé\b/i)
  })
})

describe('Cities', () => {
  it('une carte par ville de la configuration, menant au formulaire avec la ville choisie', () => {
    inRouter(<Cities />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(agencyConfig.cities.map((c) => `/reservation?ville=${encodeURIComponent(c)}`))
  })

  it('rappelle que les villes sont à confirmer par l’agence', () => {
    inRouter(<Cities />)
    expect(screen.getByText(copy.home.cities.note)).toBeTruthy()
  })
})
