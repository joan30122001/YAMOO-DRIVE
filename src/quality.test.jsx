import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App.jsx'
import { routes } from './routes.jsx'
import vehicles from './data/vehicles.json'

const SRC = resolve(fileURLToPath(new URL('.', import.meta.url)))
const ROOT = resolve(SRC, '..')

async function render(url) {
  await Promise.all(routes.map((r) => r.load()))
  const { prelude } = await prerender(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
    { progressiveChunkSize: Infinity },
  )
  return await new Response(prelude).text()
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))

const PAGES = ['/', '/vehicules', `/vehicules/${vehicles[0].slug}`, '/reservation', '/a-propos', '/contact', '/introuvable']

describe('images (story 7.2) : format, dimensions, alternative, existence', () => {
  it.each(PAGES)('%s : chaque image a alt, width, height et un fichier WebP, PNG ou SVG existant', async (url) => {
    const html = await render(url)
    const images = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
    expect(images.length).toBeGreaterThan(0)
    for (const tag of images) {
      expect(tag, 'alt').toMatch(/ alt="/)
      expect(tag, 'width').toMatch(/ width="/)
      expect(tag, 'height').toMatch(/ height="/)
      const src = tag.match(/ src="([^"]+)"/)[1]
      expect(src, 'format').toMatch(/\.(webp|png|svg)$/)
      expect(existsSync(join(ROOT, 'public', src)), src).toBe(true)
    }
  })

  it('toutes les images du dossier public sont consignées dans la liste des licences', () => {
    const licenses = readFileSync(join(ROOT, 'public', 'vehicles', 'LICENSES.md'), 'utf8')
    const files = walk(join(ROOT, 'public')).filter((f) => /\.webp$/.test(f))
    const missing = files.map((f) => f.split(/[\\/]/).pop()).filter((name) => !licenses.includes('`' + name + '`'))
    expect(missing, 'images sans licence consignée : ' + missing.join(', ')).toEqual([])
  })

  it('aucune image du dossier public ne dépasse 250 Kio', () => {
    const heavy = walk(join(ROOT, 'public'))
      .filter((f) => /\.(webp|png)$/.test(f) && statSync(f).size > 250 * 1024)
      .map((f) => relative(ROOT, f))
    expect(heavy).toEqual([])
  })
})

describe('rouge sport (story 7.3) : jamais en texte courant', () => {
  it('« text-sport-red » n’apparaît que sur une icône', () => {
    const offenders = walk(SRC)
      .filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .map((line, i) => ({ f, line, i }))
          .filter(({ line }) => /text-sport-red/.test(line) && !/CircleAlert|aria-hidden="true"/.test(line)),
      )
      .map(({ f, i }) => relative(SRC, f) + ':' + (i + 1))
    expect(offenders).toEqual([])
  })
})

describe('SEO (story 7.1) : un seul h1, titre et description sur chaque page', () => {
  it('chaque page a un seul <h1>, un <title> et une description ; les titres sont tous différents', async () => {
    const titles = []
    for (const url of PAGES) {
      const html = await render(url)
      expect(html.match(/<h1[ >]/g), url + ' : h1').toHaveLength(1)
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
      expect(title, url + ' : titre').toBeTruthy()
      expect(html, url + ' : description').toMatch(/<meta name="description" content="[^"]+"/)
      titles.push(title)
    }
    expect(new Set(titles).size, 'titres : ' + titles.join(' | ')).toBe(titles.length)
  })
})
