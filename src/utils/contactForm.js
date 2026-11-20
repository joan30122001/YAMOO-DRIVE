// Formulaire de contact (AD-3 : pur, sans React). Frontend seul : le message est préparé, jamais envoyé par le site.
import { buildContactHref, hasValue } from './contact.js'

export const SUBJECTS = ['Demande d’information', 'Question sur un véhicule', 'Demande de réservation', 'Autre']
const MIN_MESSAGE = 10

/** Valide le formulaire ; retourne { champ: message }, vide si tout est correct. */
export function validateContactForm({ fullName, email, subject, message } = {}) {
  const errors = {}
  if (!hasValue(fullName) || fullName.trim().length < 2) errors.fullName = 'Indiquez votre nom complet.'
  if (!hasValue(email)) errors.email = 'Indiquez votre adresse e-mail.'
  else if (!buildContactHref('email', email)) errors.email = 'Adresse e-mail invalide.'
  if (!SUBJECTS.includes(subject)) errors.subject = 'Choisissez un objet.'
  if (!hasValue(message) || message.trim().length < MIN_MESSAGE) errors.message = `Votre message doit contenir au moins ${MIN_MESSAGE} caractères.`
  return errors
}

/** Texte du message préparé, identique pour WhatsApp, e-mail ou copie. */
export function buildContactMessage({ fullName, email, subject, message }) {
  return [`Objet : ${subject}`, '', message.trim(), '', `Nom : ${fullName.trim()}`, `E-mail : ${email.trim()}`].join('\n')
}

/** Lien e-mail avec objet et corps préremplis, ou null si l'adresse de l'agence est vide ou invalide. */
export function buildMailtoUrl(agencyEmail, subject, body) {
  const base = buildContactHref('email', agencyEmail)
  return base ? `${base}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : null
}
