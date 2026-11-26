// Server statico minimale per provare dist/ o un export in locale (solo sviluppo).
// node tools/serve.js                 → http://localhost:4173/  (dist/)
// node tools/serve.js exports/osteria 4180 /demo/osteria/  → serve la cartella sotto un sotto-percorso
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const dir = path.resolve(ROOT, process.argv[2] || 'dist');
const port = Number(process.argv[3] || process.env.PORT || 4173);
const prefix = (process.argv[4] || '/').replace(/\/?$/, '/');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

function createServer(dir, prefix = '/') {
  dir = path.resolve(dir);
  prefix = prefix.replace(/\/?$/, '/');
  return http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (!url.startsWith(prefix)) { res.writeHead(404); return res.end('Fuori dal sotto-percorso ' + prefix); }
    url = url.slice(prefix.length - 1);
    let file = path.join(dir, url);
    if (!file.startsWith(dir)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 — ' + url); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
}

if (require.main === module) {
  createServer(dir, prefix).listen(port, () => console.log(`Server su http://localhost:${port}${prefix}  (cartella: ${path.relative(ROOT, dir) || '.'})`));
}
module.exports = { createServer };
