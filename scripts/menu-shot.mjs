// Capture du menu mobile ouvert. Usage : node scripts/menu-shot.mjs <url> <fichier.png>
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'
const [url, out] = process.argv.slice(2)
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => p && existsSync(p))
const browser = await chromium.launch({ executablePath: chrome, headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 760 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
  await page.getByRole('dialog').waitFor()
  await page.waitForTimeout(800)
  await page.screenshot({ path: out })
  console.log('ok')
} finally {
  await browser.close()
}
