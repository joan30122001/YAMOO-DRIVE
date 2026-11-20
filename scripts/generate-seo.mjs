// Génère public/robots.txt et public/sitemap.xml à partir de la configuration et des données (story 7.1).
// - `noindex: true` dans agency.config.js  =>  robots.txt interdit tout, et le sitemap reste présent (utile à l'approbation).
// - L'adresse publique vient de SITE_URL (variable d'environnement) ; à défaut, une adresse de démonstration à remplacer.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join, resolve } from 'node:path'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const config = (await import(pathToFileURL(join(ROOT, 'src', 'data', 'agency.config.js')).href)).default
const vehicles = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'vehicles.json'), 'utf8'))

const site = (process.env.SITE_URL || 'https://yamoo-drive.example').replace(/\/+$/, '')
const paths = ['/', '/vehicules', ...vehicles.map((v) => `/vehicules/${v.slug}`), '/reservation', '/a-propos', '/contact', '/conditions-de-location', '/mentions-legales', '/confidentialite']

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${site}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`

const robots = config.noindex
  ? `# Démonstration indépendante : indexation interdite tant que \`noindex: true\` est actif dans src/data/agency.config.js.
# Fichier généré par scripts/generate-seo.mjs : ne pas le modifier à la main.
User-agent: *
Disallow: /

Sitemap: ${site}/sitemap.xml
`
  : `# Fichier généré par scripts/generate-seo.mjs : ne pas le modifier à la main.
User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`

writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap)
writeFileSync(join(ROOT, 'public', 'robots.txt'), robots)
console.log(`SEO : ${paths.length} adresses dans le sitemap, indexation ${config.noindex ? 'interdite (noindex)' : 'autorisée'}, site = ${site}`)
