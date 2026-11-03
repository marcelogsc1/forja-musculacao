/* Servidor local: o app (pasta www) e a API (/api) no mesmo endereço, igual à Vercel.
   Uso:  npm run dev   → http://localhost:8080
   Sem DATABASE_URL usa PGlite (banco local em .data/). Com DATABASE_URL usa seu PostgreSQL. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const handle = require('./handler');
const ROOT = path.join(__dirname, '..', 'www');
const PORT = +process.env.PORT || 8080;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'};
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api' || u.pathname.startsWith('/api/')) return handle(req, res);
  let f = path.normalize(path.join(ROOT, decodeURIComponent(u.pathname)));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  fs.readFile(f, (err, buf) => {
    if (err){ res.writeHead(404); return res.end('não encontrado'); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache'}); res.end(buf);
  });
}).listen(PORT, () => console.log(`Forja em http://localhost:${PORT} (API em /api, banco: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'PGlite local'})`));
