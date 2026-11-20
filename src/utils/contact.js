// Aides pures pour les coordonnées (AD-3 : aucun import React).

export function hasValue(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function digitsOnly(value) {
  return value.replace(/\D/g, '')
}

const EMAIL_RE = /^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/

/**
 * Construit le lien d'un contact, ou null si la valeur est vide ou inexploitable.
 * kind : 'whatsapp' | 'phone' | 'email' | 'url'
 */
export function buildContactHref(kind, value) {
  if (!hasValue(value)) return null
  const v = value.trim()

  switch (kind) {
    case 'whatsapp': {
      // Préfixe international « 00 » remplacé par le format wa.me (sans zéros), longueur E.164 (8 à 15 chiffres).
      const digits = digitsOnly(v).replace(/^00/, '')
      return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null
    }
    case 'phone': {
      // Les lettres (ex. « poste 5 ») rendraient la composition ambiguë.
      if (/[a-z]/i.test(v)) return null
      const digits = digitsOnly(v)
      return digits.length >= 6 ? `tel:${v.startsWith('+') ? '+' : ''}${digits}` : null
    }
    case 'email':
      return EMAIL_RE.test(v) ? `mailto:${v}` : null
    case 'url': {
      try {
        const u = new URL(v)
        return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : null
      } catch {
        return null
      }
    }
    default:
      return null
  }
}
