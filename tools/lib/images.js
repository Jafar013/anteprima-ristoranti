// Immagini responsive: da src/sites/<id>/foto/<file> genera <chiave>-<larghezza>.webp
// (480, 800, 1200, 1800, 2400 px, mai oltre la larghezza originale). Cache in .cache/img.
// Per sostituire una foto basta sostituire il file in foto/ (stesso nome o nome nuovo in images.json).
'use strict';
const fs = require('fs');
const path = require('path');

const WIDTHS = [480, 800, 1200, 1800, 2400];
const QUALITY = 74;

async function buildImages(siteId, fotoDir, defs, cacheDir) {
  let sharp;
  try { sharp = require('sharp'); } catch (e) {
    throw new Error('Serve "sharp" per generare le immagini: eseguire npm install nella cartella del progetto.');
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  const result = { __files: [] };
  for (const [key, def] of Object.entries(defs)) {
    const src = path.join(fotoDir, def.file);
    if (!fs.existsSync(src)) throw new Error(`[${siteId}] file mancante: foto/${def.file} (chiave "${key}")`);
    const stat = fs.statSync(src);
    const meta = await sharp(src).rotate().metadata();
    // dimensioni dopo l'eventuale crop dichiarato in images.json (crop: rapporto "4:5" ecc.)
    let w = meta.autoOrient ? meta.autoOrient.width : meta.width;
    let h = meta.autoOrient ? meta.autoOrient.height : meta.height;
    let extract = null;
    if (def.crop) {
      const [rw, rh] = def.crop.split(':').map(Number);
      const target = rw / rh;
      const [fx, fy] = (def.focus || '50% 50%').split(' ').map(p => parseFloat(p) / 100);
      if (w / h > target) { const nw = Math.round(h * target); extract = { left: Math.round((w - nw) * fx), top: 0, width: nw, height: h }; w = nw; }
      else { const nh = Math.round(w / target); extract = { left: 0, top: Math.round((h - nh) * fy), width: w, height: nh }; h = nh; }
    }
    const widths = WIDTHS.filter(x => x <= w);
    if (!widths.length || widths[widths.length - 1] < w && w < 2400 && w - widths[widths.length - 1] > 200) widths.push(w);
    const sig = `${stat.size}-${stat.mtimeMs}-${def.crop || ''}-${def.focus || ''}-${QUALITY}`;
    for (const tw of widths) {
      const name = `${key}-${tw}.webp`;
      const out = path.join(cacheDir, name);
      const sigFile = out + '.sig';
      if (!(fs.existsSync(out) && fs.existsSync(sigFile) && fs.readFileSync(sigFile, 'utf8') === sig)) {
        let p = sharp(src).rotate();
        if (extract) p = p.extract(extract);
        await p.resize({ width: tw, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 5, smartSubsample: true }).toFile(out);
        fs.writeFileSync(sigFile, sig);
      }
      result.__files.push({ src: out, name });
    }
    result[key] = { widths, width: w, height: h, alt: def.alt, position: def.position || null };
  }
  return result;
}

module.exports = { buildImages };
