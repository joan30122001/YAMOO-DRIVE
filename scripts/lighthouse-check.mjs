// Mesure Lighthouse mobile (accueil et catalogue) sur le site servi localement et vérifie les cibles du projet.
// Usage : npm run build && npm run preview -- --port 4173   puis   npm run check:lighthouse -- [url] [dossier-de-sortie]
// Cibles (PRD) : Performance ≥ 90, Accessibilité ≥ 95. Le SEO n'est pas évalué : le site est volontairement `noindex`.
// Code de sortie : 0 si les cibles sont atteintes, 1 sinon.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = resolve(process.argv[3] ?? 'visual-check')
const LIGHTHOUSE = 'lighthouse@13.6.0'
const TARGETS = { performance: 90, accessibility: 95 }
const PAGES = [
  ['accueil', '/'],
  ['vehicules', '/vehicules'],
]

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path) => path && existsSync(path))
if (!chrome) {
  console.error('Aucun Chrome trouvé. Définissez CHROME_PATH.')
  process.exit(2)
}

// Via le shell : tout argument contenant une espace (chemin de sortie, adresse) doit être mis entre guillemets,
// sinon Lighthouse le prend pour une adresse supplémentaire à auditer.
const quote = (value) => (/\s/.test(value) ? `"${value}"` : value)

mkdirSync(OUT, { recursive: true })
let failures = 0

for (const [name, path] of PAGES) {
  const file = join(OUT, `lighthouse-${name}.json`)
  const run = spawnSync(
    'npx',
    [
      '--yes',
      LIGHTHOUSE,
      quote(BASE + path),
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags="--headless=new --no-sandbox"',
      '--output=json',
      `--output-path=${quote(file)}`,
      '--quiet',
    ],
    { env: { ...process.env, CHROME_PATH: chrome }, shell: true, encoding: 'utf-8' },
  )
  if (run.status !== 0 || !existsSync(file)) {
    console.error(`${name} : Lighthouse a échoué (${(run.stderr || '').split('\n')[0]})`)
    failures += 1
    continue
  }

  const result = JSON.parse(readFileSync(file, 'utf-8'))
  const scores = Object.fromEntries(Object.entries(result.categories).map(([key, value]) => [key, Math.round(value.score * 100)]))
  const audits = result.audits
  const line = [
    `perf ${scores.performance}`,
    `a11y ${scores.accessibility}`,
    `bonnes pratiques ${scores['best-practices']}`,
    `SEO ${scores.seo} (non évalué)`,
    `CLS ${audits['cumulative-layout-shift'].numericValue.toFixed(3)}`,
    `LCP ${(audits['largest-contentful-paint'].numericValue / 1000).toFixed(1)} s`,
    `TBT ${Math.round(audits['total-blocking-time'].numericValue)} ms`,
  ].join(' · ')
  const misses = Object.entries(TARGETS).filter(([key, min]) => scores[key] < min)
  console.log(`${misses.length ? '✗' : '✓'} ${name.padEnd(10)} ${line}`)
  for (const [key, min] of misses) console.log(`    cible non atteinte : ${key} ${scores[key]} < ${min}`)
  failures += misses.length
}

process.exit(failures === 0 ? 0 : 1)
