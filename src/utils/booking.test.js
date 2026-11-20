import { describe, expect, it } from 'vitest'
import { buildBookingMessage, buildWhatsAppUrl, computeQuote, nowInDouala, rentalDays, validateBooking } from './booking.js'

const NOW = '2030-06-10T09:00'
const car = {
  brand: 'Toyota',
  model: 'Land Cruiser',
  dailyRateXAF: 120000,
  driverSupplementXAF: 25000,
  services: { selfDrive: true, withDriver: true },
}
const valid = {
  vehicle: car,
  city: 'Douala',
  start: '2030-06-12T10:00',
  end: '2030-06-15T10:00',
  withDriver: false,
  fullName: 'Jean Kouam',
  phone: '+237 6 99 00 00 00',
}
const check = (patch = {}) => validateBooking({ ...valid, ...patch }, { now: NOW, cities: ['Douala', 'Yaoundé'] })

describe('nowInDouala', () => {
  it('donne l’heure de Douala (UTC+1), au format datetime-local', () => {
    expect(nowInDouala(new Date('2030-06-10T08:30:00Z'))).toBe('2030-06-10T09:30')
    expect(nowInDouala(new Date('2030-12-31T23:30:00Z'))).toBe('2031-01-01T00:30')
  })
})

describe('rentalDays', () => {
  it('compte chaque tranche de 24 h commencée', () => {
    expect(rentalDays('2030-06-12T10:00', '2030-06-15T10:00')).toBe(3)
    expect(rentalDays('2030-06-12T10:00', '2030-06-15T10:01')).toBe(4)
    expect(rentalDays('2030-06-12T10:00', '2030-06-12T11:00')).toBe(1)
  })
  it('renvoie 0 pour des dates invalides ou incohérentes', () => {
    expect(rentalDays('2030-06-15T10:00', '2030-06-12T10:00')).toBe(0)
    expect(rentalDays('2030-06-12T10:00', '2030-06-12T10:00')).toBe(0)
    expect(rentalDays('', '2030-06-12T10:00')).toBe(0)
    expect(rentalDays('2030-02-30T10:00', '2030-03-05T10:00')).toBe(0)
    expect(rentalDays(undefined, null)).toBe(0)
  })
})

describe('computeQuote', () => {
  it('multiplie le tarif par les jours', () => {
    expect(computeQuote(car, valid)).toEqual({ days: 3, daily: 120000, driver: 0, total: 360000 })
  })
  it('ajoute le supplément chauffeur par jour', () => {
    expect(computeQuote(car, { ...valid, withDriver: true })).toEqual({ days: 3, daily: 120000, driver: 75000, total: 435000 })
  })
  it('renvoie null sans tarif ou sans dates valides', () => {
    expect(computeQuote({ ...car, dailyRateXAF: undefined }, valid)).toBeNull()
    expect(computeQuote(car, { ...valid, end: valid.start })).toBeNull()
    expect(computeQuote(null, valid)).toBeNull()
  })
  it('ignore un supplément chauffeur absent', () => {
    expect(computeQuote({ ...car, driverSupplementXAF: undefined }, { ...valid, withDriver: true }).total).toBe(360000)
  })
})

describe('validateBooking', () => {
  it('accepte une demande complète', () => {
    expect(check()).toEqual({})
  })
  it('exige les champs obligatoires', () => {
    const errors = check({ vehicle: null, city: '', start: '', end: '', fullName: ' ', phone: '' })
    expect(Object.keys(errors).sort()).toEqual(['city', 'end', 'fullName', 'phone', 'start', 'vehicle'])
  })
  it('refuse un départ dans le passé mais accepte l’instant présent', () => {
    expect(check({ start: '2030-06-10T08:59' }).start).toMatch(/passé/)
    expect(check({ start: NOW, end: '2030-06-11T09:00' }).start).toBeUndefined()
  })
  it('refuse un retour avant ou égal au départ', () => {
    expect(check({ end: valid.start }).end).toMatch(/après/)
    expect(check({ end: '2030-06-11T10:00' }).end).toMatch(/après/)
  })
  it('refuse des dates impossibles', () => {
    expect(check({ start: '2030-02-30T10:00' }).start).toMatch(/invalide/)
  })
  it('contrôle le téléphone', () => {
    expect(check({ phone: '12' }).phone).toMatch(/invalide/)
    expect(check({ phone: 'abcdefghij' }).phone).toMatch(/invalide/)
    expect(check({ phone: '799000000' }).phone).toMatch(/invalide/)
    expect(check({ phone: '699000000' }).phone).toBeUndefined()
    expect(check({ phone: '+237 222 00 00 00' }).phone).toBeUndefined()
  })
  it('refuse un nom d’un seul caractère', () => {
    expect(check({ fullName: 'A' }).fullName).toBeDefined()
  })
  it('respecte les services du véhicule', () => {
    const selfOnly = { ...car, services: { selfDrive: true, withDriver: false } }
    const driverOnly = { ...car, services: { selfDrive: false, withDriver: true } }
    expect(check({ vehicle: selfOnly, withDriver: true }).withDriver).toMatch(/pas proposé avec chauffeur/)
    expect(check({ vehicle: driverOnly, withDriver: false }).withDriver).toMatch(/qu’avec chauffeur/)
    expect(check({ vehicle: driverOnly, withDriver: true }).withDriver).toBeUndefined()
  })
  it('refuse une ville hors liste', () => {
    expect(check({ city: 'Paris' }).city).toBeDefined()
  })
})

describe('message et lien WhatsApp', () => {
  const quote = computeQuote(car, valid)
  const message = buildBookingMessage({ ...valid, notes: 'Siège enfant' }, quote)

  it('présente la demande comme non confirmée et récapitule tout', () => {
    expect(message).toContain('non confirmée')
    expect(message).toContain('Toyota Land Cruiser')
    expect(message).toContain('12/06/2030 à 10h00')
    expect(message).toContain('Durée : 3 jours')
    expect(message).toContain('non contractuelle')
    expect(message).toContain('Siège enfant')
    expect(message).not.toMatch(/réservation confirmée|validée/i)
  })
  it('omet l’estimation et les instructions quand elles manquent', () => {
    const bare = buildBookingMessage(valid, null)
    expect(bare).not.toContain('Estimation')
    expect(bare).not.toContain('Instructions')
  })
  it('encode le message dans le lien', () => {
    const url = buildWhatsAppUrl('+237 699 00 00 00', 'a b\nc&d')
    expect(url).toBe('https://wa.me/237699000000?text=a%20b%0Ac%26d')
  })
  it('le texte décodé du lien est identique au message d’origine (accents, &, #, %, retours à la ligne)', () => {
    const original = 'Café & thé #1 — 100 % prêt' + String.fromCharCode(10) + 'Deuxième ligne'
    const url = buildWhatsAppUrl('+237 699 00 00 00', original)
    expect(new URL(url).searchParams.get('text')).toBe(original)
  })
  it('affiche le téléphone formaté dans le message', () => {
    expect(buildBookingMessage({ ...valid, phone: '699000000' }, null)).toContain('Téléphone : +237 6 99 00 00 00')
  })
  it('renvoie null sans numéro valide (aucun lien mort)', () => {
    expect(buildWhatsAppUrl('', 'x')).toBeNull()
    expect(buildWhatsAppUrl('12', 'x')).toBeNull()
  })
})
