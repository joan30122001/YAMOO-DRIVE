// Formatage d'affichage (AD-3 : pur, aucun import React).

const NBSP = '\u00A0'

// Libellé affiché pour le franc CFA (les données restent en francs CFA ; XAF n'est que le code ISO interne).
const CURRENCY_LABEL = 'FCFA'

/**
 * Montant en francs CFA, séparateur de milliers insécable : 35000 -> « 35 000 FCFA ».
 * @returns {string} chaîne vide si la valeur n'est pas un entier positif ou nul.
 */
export function formatPrice(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) return ''
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}${CURRENCY_LABEL}`
}

/**
 * Numéro de téléphone camerounais : 9 chiffres commençant par 6 (mobile) ou 2 (fixe), préfixe +237 (ou 00237) facultatif.
 * @returns {string} « +237 6 99 00 00 00 » ; chaîne vide si le numéro n'est pas exploitable.
 */
export function formatPhone(value) {
  if (typeof value !== 'string') return ''
  const digits = value.replace(/\D/g, '').replace(/^(?:00)?237(?=\d{9}$)/, '')
  if (!/^[62]\d{8}$/.test(digits)) return ''
  return `+237 ${digits[0]} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
}
