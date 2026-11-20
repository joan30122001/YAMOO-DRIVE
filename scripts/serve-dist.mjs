// Sert dist/ comme Vercel (voir vercel.json) : fichier statique s'il existe, `<route>/index.html` prérendu, sinon la
// coquille vide app-shell.html. Remplace `vite preview`, qui renvoie l'accueil pour toute adresse.
// Usage : node scripts/serve-dist.mjs [port]
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { createBrotliCompress, createGzip } from 'node:zlib'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = resolve(fileURLToPath(new URL('../dist', import.meta.url)))
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2',
}

const isFile = (p) => existsSync(p) && statSync(p).isFile()

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const target = normalize(join(DIST, pathname))
  if (!target.startsWith(DIST)) {
    res.writeHead(403).end()
    return
  }
  let file = isFile(target) ? target : isFile(join(target, 'index.html')) ? join(target, 'index.html') : join(DIST, 'app-shell.html')
  const isAsset = /\/(assets|images|vehicles)\//.test(pathname)
  if (isAsset && !isFile(target)) {
    res.writeHead(404).end('Not found')
    return
  }
  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  // Compression à la volée des fichiers texte (Vercel fait de même) : mesures de poids réalistes.
  const compressible = /^(text\/|application\/(json|xml)|image\/svg)|javascript/.test(type)
  const accept = req.headers['accept-encoding'] ?? ''
  const encoding = !compressible ? null : /br/.test(accept) ? 'br' : /gzip/.test(accept) ? 'gzip' : null
  const headers = {
    'Content-Type': type,
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    Vary: 'Accept-Encoding',
  }
  if (encoding) headers['Content-Encoding'] = encoding
  res.writeHead(200, headers)
  const stream = createReadStream(file)
  if (encoding) stream.pipe(encoding === 'br' ? createBrotliCompress() : createGzip()).pipe(res)
  else stream.pipe(res)
}).listen(PORT, () => console.log(`dist/ servi sur http://localhost:${PORT}`))
