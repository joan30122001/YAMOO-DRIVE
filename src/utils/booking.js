// Logique de la demande de réservation (AD-3 : pur, sans React). Fuseau de référence : Africa/Douala (AD-4).
// Une demande n'est jamais une réservation : seule l'agence accepte, par sa réponse.
import { buildContactHref, hasValue } from './contact.js'
import { formatPhone, formatPrice } from './format.js'

const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const HOUR_MS = 60 * 60 * 1000

/** Date et heure actuelles à Douala, au format des champs `datetime-local` : AAAA-MM-JJTHH:mm. */
export function nowInDouala(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

/** Millisecondes d'une date `datetime-local` valide (lue comme heure locale fixe), sinon NaN. Le Cameroun n'a pas d'heure d'été. */
function toMs(value) {
  const m = typeof value === 'string' ? DATETIME_RE.exec(value) : null
  if (!m) return Number.NaN
  const [, y, mo, d, h, mi] = m.map(Number)
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi))
  const exact = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d && date.getUTCHours() === h
  return exact ? date.getTime() : Number.NaN
}

/** Nombre de jours de location facturés : chaque tranche commencée de 24 h compte. 0 si les dates sont invalides ou incohérentes. */
export function rentalDays(start, end) {
  const from = toMs(start)
  const to = toMs(end)
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0
  return Math.ceil((to - from) / (24 * HOUR_MS))
}

/**
 * Estimation indicative (non contractuelle) : tarif journalier × jours, plus le supplément chauffeur par jour si demandé.
 * @returns {{ days: number, daily: number, driver: number, total: number } | null} null si le tarif ou les dates manquent.
 */
export function computeQuote(vehicle, { start, end, withDriver = false } = {}) {
  const days = rentalDays(start, end)
  const daily = vehicle?.dailyRateXAF
  if (!days || !Number.isSafeInteger(daily) || daily < 0) return null
  const supplement = Number.isSafeInteger(vehicle.driverSupplementXAF) ? vehicle.driverSupplementXAF : 0
  const driver = withDriver ? supplement * days : 0
  return { days, daily, driver, total: daily * days + driver }
}


/**
 * Valide le formulaire. Retourne un objet { champ: message } ; vide si tout est correct.
 * Champs : vehicle (objet ou null), city, start, end, withDriver, fullName, phone.
 */
export function validateBooking(values, { now = nowInDouala(), cities = [] } = {}) {
  const errors = {}
  const { vehicle, city, start, end, withDriver, fullName, phone } = values

  if (!vehicle) errors.vehicle = 'Choisissez un véhicule.'
  if (!hasValue(city) || (cities.length > 0 && !cities.includes(city))) errors.city = 'Choisissez une ville de prise en charge.'

  const from = toMs(start)
  const to = toMs(end)
  if (!hasValue(start)) errors.start = 'Indiquez la date et l’heure de départ.'
  else if (!Number.isFinite(from)) errors.start = 'Date de départ invalide.'
  else if (from < toMs(now)) errors.start = 'Le départ ne peut pas être dans le passé.'

  if (!hasValue(end)) errors.end = 'Indiquez la date et l’heure de retour.'
  else if (!Number.isFinite(to)) errors.end = 'Date de retour invalide.'
  else if (Number.isFinite(from) && to <= from) errors.end = 'Le retour doit être après le départ.'

  if (withDriver && vehicle && vehicle.services?.withDriver !== true) errors.withDriver = 'Ce véhicule n’est pas proposé avec chauffeur.'
  if (!withDriver && vehicle && vehicle.services?.selfDrive !== true) errors.withDriver = 'Ce véhicule n’est proposé qu’avec chauffeur.'

  if (!hasValue(fullName) || fullName.trim().length < 2) errors.fullName = 'Indiquez votre nom complet.'

  if (!hasValue(phone)) errors.phone = 'Indiquez votre numéro de téléphone.'
  else if (!formatPhone(phone)) errors.phone = 'Numéro invalide : 9 chiffres commençant par 6 ou 2 (+237 facultatif).'

  return errors
}

const frDate = (value) => {
  const m = DATETIME_RE.exec(value)
  return m ? `${m[3]}/${m[2]}/${m[1]} à ${m[4]}h${m[5]}` : value
}

/**
 * Message WhatsApp de la demande. Il dit explicitement qu'il s'agit d'une demande à confirmer par l'agence.
 * Les retours à la ligne sont conservés ; aucune donnée n'est inventée.
 */
export function buildBookingMessage({ vehicle, city, start, end, withDriver, fullName, phone, notes }, quote) {
  const lines = [
    'Bonjour, je souhaite faire une demande de réservation (non confirmée, en attente de votre réponse).',
    '',
    `Véhicule : ${vehicle.brand} ${vehicle.model}`,
    `Prise en charge : ${city}`,
    `Départ : ${frDate(start)}`,
    `Retour : ${frDate(end)}`,
    `Chauffeur : ${withDriver ? 'avec chauffeur' : 'sans chauffeur'}`,
  ]
  if (quote) {
    lines.push(`Durée : ${quote.days} ${quote.days > 1 ? 'jours' : 'jour'}`)
    lines.push(`Estimation indicative : ${formatPrice(quote.total)} (non contractuelle)`)
  }
  lines.push('', `Nom : ${fullName.trim()}`, `Téléphone : ${formatPhone(phone) || phone.trim()}`)
  if (hasValue(notes)) lines.push('', `Instructions : ${notes.trim()}`)
  return lines.join('\n')
}

/** Lien WhatsApp avec message prérempli, ou null si le numéro de l'agence est vide ou invalide. */
export function buildWhatsAppUrl(number, message) {
  const base = buildContactHref('whatsapp', number)
  return base ? `${base}?text=${encodeURIComponent(message)}` : null
}
