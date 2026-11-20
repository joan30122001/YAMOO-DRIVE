// Contrôle visuel dans un vrai navigateur (Chrome ou Edge installé, aucun téléchargement).
// Usage : npm run build && npm run preview -- --port 4173   puis   npm run check:visual -- [url] [dossier-de-sortie]
// Produit des captures pleine page et un rapport JSON (débordements, tailles de cibles, centrage, polices, erreurs).
// Code de sortie : 0 si aucun défaut, 1 sinon (utilisable comme garde-fou).
// Les mesures sont automatiques ; la comparaison avec la maquette est un travail humain (voir RAPPORT.md).
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = resolve(process.argv[3] ?? 'visual-check')

// CHROME_PATH d'abord, puis les emplacements usuels (Windows, macOS, Linux).
const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)
const executablePath = CANDIDATES.find((path) => existsSync(path))
if (!executablePath) {
  console.error('Aucun Chrome ou Edge trouvé. Définissez CHROME_PATH vers le programme du navigateur.')
  process.exit(2)
}

const PAGES = [
  ['accueil', '/'],
  ['catalogue', '/vehicules'],
  ['fiche', '/vehicules/jetour-t1'],
  ['fiche-2', '/vehicules/jmc-grand-avenue'],
  ['contact', '/contact'],
  ['reservation', '/reservation'],
  ['a-propos', '/a-propos'],
  ['introuvable', '/page-qui-n-existe-pas'],
]
const WIDTHS = [320, 375, 768, 1024, 1280, 1920]
const MIN_TARGET = 43.5 // 44 px, avec une tolérance d'arrondi

mkdirSync(OUT, { recursive: true })
const report = []
let defects = 0
let browser

try {
  browser = await chromium.launch({ executablePath, headless: true })
} catch (error) {
  console.error(`Impossible de lancer le navigateur (${executablePath}) : ${error.message}`)
  process.exit(2)
}

try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const logs = []
    page.on('console', (msg) => msg.type() === 'error' && logs.push(msg.text()))
    page.on('pageerror', (err) => logs.push(String(err)))

    for (const [name, path] of PAGES) {
      const entry = { page: name, width, path }
      logs.length = 0
      try {
        const response = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 })
        // La page « introuvable » est servie avec le code 200 (application monopage) : tout le reste doit l'être aussi.
        entry.status = response?.status() ?? null
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(400)

        Object.assign(
          entry,
          await page.evaluate((minTarget) => {
            const vw = document.documentElement.clientWidth
            const visible = (el) => {
              const style = getComputedStyle(el)
              const r = el.getBoundingClientRect()
              return style.visibility !== 'hidden' && style.display !== 'none' && r.width > 0 && r.height > 0
            }
            const label = (el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28)}"`

            const overflowing = [...document.querySelectorAll('body *')]
              .filter((el) => visible(el) && !el.closest('.sr-only') && !el.matches('.sr-only'))
              .map((el) => ({ el, r: el.getBoundingClientRect() }))
              .filter(({ r }) => r.right > vw + 1 || r.left < -1)
              .map(({ el, r }) => `${label(el)} [${Math.round(r.left)}→${Math.round(r.right)}]`)

            // Cibles : tous les éléments interactifs visibles, pied de page compris. Seuls les liens placés dans une phrase
            // (un paragraphe) sont exemptés (WCAG 2.5.8) ; le lien d'évitement n'est visible qu'au focus.
            const smallTargets = [...document.querySelectorAll('a, button, input, select, textarea')]
              .filter((el) => visible(el) && !el.matches('.sr-only') && !(getComputedStyle(el).display === 'inline' && el.closest('p')))
              .map((el) => ({ el, r: el.getBoundingClientRect() }))
              .filter(({ el, r }) => {
                if (r.height >= minTarget && r.width >= minTarget) return false
                // Case à cocher / bouton radio : la zone cliquable est son libellé, qui doit atteindre la taille minimale.
                if (el.matches('input[type="checkbox"], input[type="radio"]')) {
                  const lr = el.closest('label')?.getBoundingClientRect()
                  if (lr && lr.height >= minTarget && lr.width >= minTarget) return false
                }
                return true
              })
              .map(({ el, r }) => `${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`)

            const nav = document.querySelector('nav[aria-label="Navigation principale"]')
            const navRect = nav && visible(nav) ? nav.getBoundingClientRect() : null
            const h1s = document.querySelectorAll('h1')
            const h1 = h1s[0]
            return {
              viewport: vw,
              scrollWidth: document.documentElement.scrollWidth,
              bodyScrollWidth: document.body.scrollWidth,
              horizontalOverflow: document.documentElement.scrollWidth > vw || document.body.scrollWidth > vw,
              overflowing: overflowing.slice(0, 12),
              smallTargets: smallTargets.slice(0, 20),
              navCenterOffset: navRect ? Math.round((navRect.left + navRect.width / 2 - vw / 2) * 10) / 10 : null,
              headerPosition: document.querySelector('header')?.style && getComputedStyle(document.querySelector('header')).position,
              h1Count: h1s.length,
              h1Font: h1 ? getComputedStyle(h1).fontFamily.split(',')[0] : null,
              bodyFont: getComputedStyle(document.body).fontFamily.split(',')[0],
              bodyBackground: getComputedStyle(document.body).backgroundColor,
              fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
              fontsFailed: [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family),
              loadingVisible: [...document.querySelectorAll('[role="status"]')].some((e) => /^Chargement/.test(e.textContent.trim())),
              title: document.title,
            }
          }, MIN_TARGET),
        )
        entry.consoleErrors = [...logs]
        // Défile la page pour déclencher les images différées : la capture montre ce que voit un visiteur.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            window.scrollTo({ top: y, behavior: 'instant' })
            await new Promise((r) => setTimeout(r, 80))
          }
          window.scrollTo({ top: 0, behavior: 'instant' })
        })
        await page.waitForTimeout(500)
        await page.screenshot({ path: join(OUT, `${name}-${width}.png`), fullPage: true })
        entry.shot = `${name}-${width}.png`
      } catch (error) {
        entry.failure = String(error.message ?? error).split('\n')[0]
      }

      entry.defects = [
        entry.failure && `échec : ${entry.failure}`,
        entry.status && entry.status !== 200 && `code HTTP ${entry.status}`,
        entry.horizontalOverflow && 'débordement horizontal',
        entry.smallTargets?.length && `${entry.smallTargets.length} cible(s) < 44 px`,
        entry.consoleErrors?.length && `${entry.consoleErrors.length} erreur(s) console`,
        entry.fontsFailed?.length && `police(s) en échec : ${entry.fontsFailed.join(', ')}`,
        entry.h1Count !== undefined && entry.h1Count !== 1 && `${entry.h1Count} titres h1`,
        entry.loadingVisible && 'écran « Chargement… » encore affiché',
      ].filter(Boolean)
      defects += entry.defects.length
      report.push(entry)
    }

    // Menu mobile : ouverture, contenu, Échap, retour du focus (sous le point de rupture 768 px).
    if (width < 768) {
      const menu = { page: 'menu-mobile', width }
      try {
        await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 })
        const toggle = page.getByRole('button', { name: 'Ouvrir le menu' })
        await toggle.click()
        const dialog = page.getByRole('dialog')
        await dialog.waitFor({ state: 'visible', timeout: 5000 })
        menu.opened = true
        menu.links = await dialog.getByRole('link').allTextContents()
        await page.screenshot({ path: join(OUT, `menu-ouvert-${width}.png`) })
        await page.keyboard.press('Escape')
        await dialog.waitFor({ state: 'hidden', timeout: 5000 })
        menu.closedAfterEscape = true
        menu.focusAfterEscape = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
        menu.focusVisible = await page.evaluate(() => {
          const el = document.activeElement
          const style = el && getComputedStyle(el)
          return !!style && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
        })
      } catch (error) {
        menu.failure = String(error.message ?? error).split('\n')[0]
      }
      menu.defects = [
        menu.failure && `échec : ${menu.failure}`,
        menu.opened === false && 'menu non ouvert',
        menu.closedAfterEscape === false && 'menu non fermé par Échap',
        menu.focusAfterEscape && menu.focusAfterEscape !== 'Ouvrir le menu' && 'focus non rendu au bouton',
        menu.focusVisible === false && 'focus invisible sur le bouton menu',
      ].filter(Boolean)
      defects += menu.defects.length
      report.push(menu)
    }
    await context.close()
  }
} finally {
  // Toujours fermer le navigateur et écrire le rapport, même si une page a échoué.
  await browser.close()
  writeFileSync(join(OUT, 'rapport.json'), JSON.stringify(report, null, 2))
}

console.log(`Captures et rapport écrits dans ${OUT}`)
for (const r of report) {
  const tag = `[${String(r.width).padStart(4)}px] ${r.page.padEnd(11)}`
  console.log(r.defects.length ? `${tag} ✗ ${r.defects.join(' ; ')}` : `${tag} ✓`)
}
console.log(defects === 0 ? '\nAucun défaut.' : `\n${defects} défaut(s).`)
process.exit(defects === 0 ? 0 : 1)
