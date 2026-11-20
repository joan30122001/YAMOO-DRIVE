// Capture de l'écran visible (sans défilement) d'une page. Usage : node scripts/shot.mjs <url> <fichier.png> [largeur] [hauteur] [scrollY]
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'

const [url, out, w = '1280', h = '800', scrollY = '0'] = process.argv.slice(2)
const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((p) => p && existsSync(p))
const browser = await chromium.launch({ executablePath: chrome, headless: true })
try {
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3200) // laisse finir l'animation d'entrée
  if (Number(scrollY) > 0) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Number(scrollY))
    await page.waitForTimeout(1200)
  }
  await page.screenshot({ path: out })
  console.log('ok', out)
} finally {
  await browser.close()
}
