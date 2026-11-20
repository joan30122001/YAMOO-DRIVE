// Prérendu des pages après `vite build` : chaque route est écrite en HTML complet (contenu + métadonnées) dans dist/.
// Le navigateur affiche donc la page avant que le JavaScript ne soit exécuté (LCP), puis React « hydrate » ce HTML.
// - dist/index.html            : accueil prérendu.
// - dist/<route>/index.html    : autres pages prérendues.
// - dist/app-shell.html        : coquille vide, utilisée pour toute adresse inconnue (voir vercel.json) : aucun HTML d'une
//                                autre page ne peut être « hydraté » par erreur.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { createServer } from 'vite'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const DIST = join(ROOT, 'dist')
const template = readFileSync(join(DIST, 'index.html'), 'utf8')
const vehicles = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'vehicles.json'), 'utf8'))

const server = await createServer({ root: ROOT, appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' })
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const { routes } = await server.ssrLoadModule('/src/routes.jsx')
  await Promise.all(routes.map((route) => route.load()))

  // La coquille vide sert aux adresses inconnues ; elle garde le titre et les balises du modèle.
  writeFileSync(join(DIST, 'app-shell.html'), template)

  const paths = ['/', '/vehicules', ...vehicles.map((v) => `/vehicules/${v.slug}`), '/reservation', '/a-propos', '/contact', '/conditions-de-location', '/mentions-legales', '/confidentialite']
  const strip = [/<title>[\s\S]*?<\/title>/, /<meta name="description"[^>]*>/, /<meta name="robots"[^>]*>/]

  for (const path of paths) {
    const { prelude } = await prerender(createElement(StaticRouter, { location: path }, createElement(App)), { progressiveChunkSize: Infinity })
    const html = (await new Response(prelude).text()).replace(/&#x27;/g, "'")
    // React place les balises d'en-tête (title, meta, link) en tête du flux : on les sépare du contenu de l'application.
    const split = html.indexOf('<div class="flex min-h-svh')
    if (split < 0) throw new Error(`Prérendu de ${path} : contenu de l'application introuvable`)
    const head = html.slice(0, split)
    const body = html.slice(split)

    let page = template
    for (const re of strip) page = page.replace(re, '')
    page = page.replace('</head>', `${head}</head>`)
    page = page.replace('<div id="root"></div>', `<div id="root" data-prerendered="${path}">${body}</div>`)

    const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path.slice(1), 'index.html')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, page)
  }
  console.log(`Prérendu : ${paths.length} pages écrites dans dist/ (+ app-shell.html).`)
} finally {
  await server.close()
}
