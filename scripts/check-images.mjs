// Vérifie que toutes les images d'une page se chargent réellement (largeur naturelle > 0) après défilement.
// Usage : node scripts/check-images.mjs [url-de-base] [chemin ...]   (le site doit être servi, ex. npm run preview)
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const PATHS = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/vehicules']
const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => p && existsSync(p))
if (!chrome) {
  console.error('Aucun Chrome trouvé : définissez CHROME_PATH')
  process.exit(2)
}

const browser = await chromium.launch({ executablePath: chrome, headless: true })
let broken = 0
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const failed = []
  page.on('response', (r) => r.request().resourceType() === 'image' && r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))

  for (const path of PATHS) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    // Fait défiler la page pour déclencher le chargement différé (loading="lazy").
    await page.evaluate(async () => {
      // La hauteur est relue à chaque pas : le défilement épinglé (GSAP) allonge la page après le chargement.
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo({ top: y, behavior: 'instant' })
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    // Laisse aux images différées le temps d'arriver (page longue : le défilement va plus vite que le réseau).
    await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(400)
    const images = await page.evaluate(() =>
      [...document.images].map((img) => ({
        src: img.currentSrc || img.src,
        loading: img.loading,
        loaded: img.complete && img.naturalWidth > 0,
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        shown: `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}`,
      })),
    )
    const bad = images.filter((i) => !i.loaded)
    broken += bad.length
    console.log(`${path} : ${images.length} image(s), ${bad.length} non chargée(s)`)
    for (const i of images) console.log(`  ${i.loaded ? '✓' : '✗'} ${i.src.replace(BASE, '')}  ${i.natural} affichée ${i.shown} (${i.loading})`)
  }
  if (failed.length) {
    console.log('Réponses en erreur :')
    for (const f of failed) console.log('  ' + f)
    broken += failed.length
  }
} finally {
  await browser.close()
}
process.exit(broken === 0 ? 0 : 1)
