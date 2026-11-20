// Parcourt le site dans un vrai navigateur en suivant tous les liens internes (story 7.3 : 0 lien cassé).
// Une page est « cassée » si elle affiche « introuvable » ou répond autrement que 200. Les liens mailto:, tel: et
// wa.me sont ignorés. Usage : node scripts/check-links.mjs [url-de-base]   (le site doit être servi)
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

const browser = await chromium.launch({ executablePath: chrome, headless: true })
const seen = new Map()
const queue = ['/']
const broken = []
try {
  const page = await browser.newPage()
  while (queue.length) {
    const path = queue.shift()
    if (seen.has(path)) continue
    const response = await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const h1 = (await page.locator('h1').first().textContent().catch(() => '')) ?? ''
    const isMissing = response?.status() !== 200 || /introuvable/i.test(h1)
    seen.set(path, isMissing ? 'CASSÉ' : 'ok')
    if (isMissing) broken.push(path)

    // Un menu replié ou fermé n'expose pas ses liens : on ouvre le méga-menu pour les lire aussi.
    const trigger = page.getByRole('button', { name: 'Afficher les catégories de véhicules' })
    if (await trigger.isVisible().catch(() => false)) await trigger.click().catch(() => {})
    const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href')))
    for (const href of hrefs) {
      if (!href || /^(mailto:|tel:|https?:|#)/.test(href)) continue
      const clean = href.split('#')[0]
      if (clean && !seen.has(clean) && !queue.includes(clean)) queue.push(clean)
    }
  }
} finally {
  await browser.close()
}

for (const [path, state] of seen) console.log(`${state === 'ok' ? '✓' : '✗'} ${path}`)
console.log(broken.length === 0 ? `\n${seen.size} pages parcourues, 0 lien cassé.` : `\n${broken.length} lien(s) cassé(s) : ${broken.join(', ')}`)
process.exit(broken.length === 0 ? 0 : 1)
