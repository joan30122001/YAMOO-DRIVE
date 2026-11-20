// Contrôle fonctionnel dans un vrai navigateur : recherche rapide, filtres, fiche, réservation, contact.
// Usage : node scripts/e2e-check.mjs [url-de-base]   (le site doit être servi, ex. npm run preview)
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => p && existsSync(p))
if (!chrome) {
  console.error('Aucun Chrome trouvé : définissez CHROME_PATH')
  process.exit(2)
}

const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${detail}`}`)
}

const browser = await chromium.launch({ executablePath: chrome, headless: true })
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  // 1. Recherche rapide -> catalogue filtré
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByRole('combobox', { name: 'Catégorie' }).click()
  await page.getByRole('option', { name: 'Pick-up' }).click()
  await page.getByRole('button', { name: 'Rechercher' }).click()
  await page.waitForURL(/categorie=Pick-up/)
  await page.locator('article').first().waitFor()
  const berlines = await page.locator('article').count()
  check('recherche rapide : catalogue filtré sur « Pick-up »', berlines === 2, `${berlines} cartes`)

  // 2. Dates incohérentes refusées sur la recherche rapide
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.fill('input[name="du"]', '2099-05-10')
  await page.fill('input[name="au"]', '2099-05-08')
  await page.getByRole('button', { name: 'Rechercher' }).click()
  check('recherche rapide : retour avant départ refusé', (await page.getByRole('alert').count()) > 0 && page.url().endsWith('/'))

  // 3. Catalogue : filtre, tri, recherche
  await page.goto(BASE + '/vehicules', { waitUntil: 'networkidle' })
  await page.getByLabel('Rechercher un véhicule').fill('dashing')
  await page.waitForFunction(() => document.querySelectorAll('article').length === 1, null, { timeout: 3000 }).catch(() => {})
  check('catalogue : recherche « dashing »', (await page.locator('article').count()) === 1)
  await page.getByLabel('Rechercher un véhicule').fill('')
  await page.waitForFunction(() => document.querySelectorAll('article').length === 8, null, { timeout: 3000 }).catch(() => {})
  await page.getByRole('combobox', { name: 'Trier par' }).click()
  await page.getByRole('option', { name: 'Prix décroissant' }).click()
  await page.waitForFunction(() => /Grand Avenue/.test(document.querySelector('article h2')?.textContent ?? ''), null, { timeout: 3000 }).catch(() => {})
  const first = await page.locator('article h2').first().textContent()
  check('catalogue : tri décroissant (Grand Avenue en premier)', /Grand Avenue/.test(first ?? ''), first ?? '')

  // 4. Fiche -> bouton de réservation vers le bon véhicule
  await page.goto(BASE + '/vehicules/jetour-x90-plus', { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Réserver ce véhicule' }).click()
  await page.waitForURL(/reservation\?vehicule=jetour-x90-plus/)
  check('fiche -> réservation : véhicule présélectionné', (await page.locator('#booking-vehicle').textContent()).includes('X90 Plus'))

  // 5. Réservation : erreurs puis succès, estimation, jamais « confirmée »
  await page.getByRole('button', { name: 'Préparer ma demande' }).click()
  check('réservation : champs obligatoires signalés', (await page.getByRole('alert').count()) >= 3)
  await page.fill('#booking-start', '2099-06-10T10:00')
  await page.fill('#booking-end', '2099-06-13T10:00')
  await page.fill('#booking-fullName', 'Jean Kouam')
  await page.fill('#booking-phone', '+237 699 00 00 00')
  const recap = await page.locator('aside[aria-label="Récapitulatif"]').innerText()
  check('réservation : estimation 3 jours = 300 000 FCFA', /3 jours/.test(recap) && /300\s000\sFCFA/.test(recap.replace(/\u00a0/g, ' ')), recap.replace(/\n/g, ' | '))
  await page.getByRole('button', { name: 'Préparer ma demande' }).click()
  await page.locator('#booking-result').waitFor()
  const resultText = (await page.locator('#booking-result').innerText()).replace(/\u00a0/g, ' ')
  check('réservation : message préparé, non confirmé', /non confirmée/.test(resultText) && /Jetour X90 Plus/.test(resultText))
  check('réservation : jamais présentée comme confirmée', !/réservation confirmée|validée|réservé\b/i.test(resultText))
  check('réservation : lien WhatsApp vers le numéro de l’agence, avec le message préparé', ((await page.locator('#booking-result a[href^="https://wa.me/237672894084?text="]').count()) === 1))

  // 6. Départ dans le passé refusé
  await page.fill('#booking-start', '2001-01-01T10:00')
  await page.getByRole('button', { name: 'Préparer ma demande' }).click()
  check('réservation : départ dans le passé refusé', /passé/.test(await page.locator('#booking-start').locator('xpath=..').innerText()))

  // 7. Contact
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Préparer le message' }).click()
  check('contact : champs obligatoires signalés', (await page.getByRole('alert').count()) >= 3)
  await page.fill('#contact-fullName', 'Jean Kouam')
  await page.fill('#contact-email', 'jean@mail.com')
  await page.locator('#contact-subject').click()
  await page.getByRole('option', { name: 'Autre' }).click()
  await page.fill('#contact-message', 'Bonjour, je voudrais des informations.')
  await page.getByRole('button', { name: 'Préparer le message' }).click()
  await page.locator('#contact-result').waitFor()
  check('contact : message préparé', /Objet : Autre/.test(await page.locator('#contact-result').innerText()))

  // 8. Navigation clavier : onglets de la fiche
  await page.goto(BASE + '/vehicules/jetour-x50', { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: 'Description' }).focus()
  await page.keyboard.press('ArrowRight')
  check('fiche : flèche droite ouvre « Équipements »', (await page.getByRole('tab', { name: 'Équipements' }).getAttribute('aria-selected')) === 'true')

  // 9. Mode « réduire les animations » : aucun mouvement appliqué par JavaScript, contenu identique
  const calm = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const calmPage = await calm.newPage()
  await calmPage.goto(BASE + '/', { waitUntil: 'networkidle' })
  await calmPage.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  const moving = await calmPage.evaluate(() => [...document.querySelectorAll('img')].filter((i) => /transform|translate|scale/.test(i.getAttribute('style') ?? '')).length)
  check('réduire les animations : aucune image déplacée ni agrandie au défilement', moving === 0, moving + ' image(s) animée(s)')
  check('réduire les animations : le contenu reste affiché', (await calmPage.getByRole('heading', { level: 1 }).count()) === 1)
  await calm.close()

  check('aucune erreur JavaScript dans la console', errors.length === 0, errors.join(' | '))
} finally {
  await browser.close()
}
const failed = results.filter((ok) => !ok).length
console.log(failed === 0 ? `\nTout est conforme (${results.length} contrôles).` : `\n${failed} contrôle(s) en échec.`)
process.exit(failed === 0 ? 0 : 1)
