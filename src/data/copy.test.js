import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import copy from './copy.js'

const SRC = resolve(fileURLToPath(new URL('..', import.meta.url)))

// Expressions interdites (AD-9), sauf négation explicite « non confirmée ».
export const FORBIDDEN = [
  /(?<!non[ -])\bconfirm(?:é|ée|és|ées|ee|ees)(?![a-zà-ÿ])/i,
  /\br[ée]servation\s+confirm(?:é|ée|és|ées|ee|ees)(?![a-zà-ÿ])/i,
  /\bdisponible\s+maintenant(?![a-zà-ÿ])/i,
  /\br[ée]serv(?:é|ée|és|ées|ee|ees)(?![a-zà-ÿ])/i,
  /\bvalid(?:é|ée|és|ées|ee|ees)(?![a-zà-ÿ])/i,
]

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name)
    return entry.isDirectory() ? walk(p) : [p]
  })
}

// Numéros de lignes (uniques) contenant au moins un libellé interdit.
function scan(text) {
  return text
    .split('\n')
    .map((line, i) => (FORBIDDEN.some((re) => re.test(line.normalize('NFC').replace(/\u00a0/g, ' '))) ? i + 1 : null))
    .filter(Boolean)
}

describe('garde-fou : aucun faux statut de confirmation (AD-9)', () => {
  it('détecte les libellés interdits', () => {
    expect(scan('Réservation confirmée')).toEqual([1])
    expect(scan('Votre demande est validée')).toEqual([1])
    expect(scan('Disponible maintenant')).toEqual([1])
    expect(scan('Votre demande est confirmé.')).toEqual([1])
    expect(scan('Véhicule réservé')).toEqual([1])
    expect(scan('Demande confirmee')).toEqual([1])
    expect(scan('Ligne 1'+String.fromCharCode(10)+'Demande validée')).toEqual([2])
  })

  it('autorise la négation et le futur', () => {
    expect(scan('Demande non confirmée : en attente')).toEqual([])
    expect(scan("l'agence confirmera")).toEqual([])
    expect(scan('Demande non'+String.fromCharCode(160)+'confirmée')).toEqual([])
    expect(scan("en attente de validation par l'agence")).toEqual([])
  })

  it('aucun fichier de src/ ne contient de libellé interdit', () => {
    const offenders = []
    for (const file of walk(SRC)) {
      if (!/\.(jsx?|css|json|md|txt|svg)$/.test(file) || /\.test\.jsx?$/.test(file)) continue
      scan(readFileSync(file, 'utf8')).forEach((n) => offenders.push(`${relative(SRC, file)}:${n}`))
    }
    const indexHtml = join(SRC, '..', 'index.html')
    scan(readFileSync(indexHtml, 'utf8')).forEach((n) => offenders.push(`index.html:${n}`))
    expect(offenders, `libellés interdits : ${offenders.join(', ')}`).toEqual([])
  })

  it('les textes de statut centralisés sont présents', () => {
    expect(copy.booking.notConfirmed).toMatch(/non confirmée/)
    expect(copy.footerInfo).toMatch(/WhatsApp/)
  })
})
