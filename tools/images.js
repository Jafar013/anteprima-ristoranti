// Scarica le fotografie dimostrative (Unsplash, licenza Unsplash) in src/sites/<id>/foto/<chiave>.jpg
// e aggiorna i crediti in images.json. Da usare solo per ripristinare le foto demo:
// le foto vere del ristorante si copiano direttamente in foto/ (vedi README).
// Uso: node tools/images.js [sito]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PICKS = {
  trattoria: {
    hero: 'iFyLBKmCrmQ', sala: '4Q1NcGMBE-8', cantina: 'kpTkEF5Eyos', sfoglia: 'mciRIMaxiAM', mattarello: 'Tq6vWULIsSg',
    mani: 'itHWCygYksY', cucina: 'JzKQSxf4-4Q', tagliatelle: 'gOf9Be55k4s', lasagne: 'flEUTTwGlJQ', ravioli: 'OwmrSzvCMck',
    dolce: 'Rjc0kwgs1ps', bicchieri: 'xG2rX9sAKWQ', pane: '0Oh1bChh2ao'
  },
  osteria: {
    hero: 'a7_NmPrRTdQ', colline: 'g3yfdBEAjdg', tramonto: 'AsFcUp-6Wro', olio: '102NToxkJFA', olive: '0zjhtpnNwO0',
    pane: '7ARN514bTuA', verdure: 'vO1h-ZUlSKM', porcini: 'vhlNuLYHbtw', zucca: 'lnPCB2PkB8M', zuppa: '81B2H64Ff54',
    cantina: 'D9WH_vlxicA', tavola: 'y297TPey8Do', pasta: '4nXkhLCrkLo'
  },
  contemporaneo: {
    hero: 'TivEEYzzhik', sala: 'fnGKHK-V_Rk', cucina: 'apbA9pu34DY', chef: 'v3OlBE6-fhU', impiattamento: '-eKZLpj7U0E',
    brindisi: 'DmO662qvWO8', tavola: 'Q_Moi2xjieU', amici: 'PS7SeQ-LELY', burrata: 'NNTV0JhNmis', risotto: 'noaP9Z9Ta2Y',
    spaghetti: 'P7BBkQ9vLgU', tiramisu: 'kBRJ6dhhmYQ', condivisione: 'xWMPFH2l_J0'
  }
};

const only = process.argv[2];
for (const [site, picks] of Object.entries(PICKS)) {
  if (only && only !== site) continue;
  const dir = path.join(ROOT, 'src', 'sites', site);
  const foto = path.join(dir, 'foto');
  fs.mkdirSync(foto, { recursive: true });
  const credits = {};
  for (const [key, id] of Object.entries(picks)) {
    const out = path.join(foto, `${key}.jpg`);
    const res = execFileSync('curl.exe', ['-sL', '-o', out, '-w', '%{http_code} %{url_effective}', `https://unsplash.com/photos/${id}/download?force=true&w=2400`]).toString();
    const [code, url] = res.split(' ');
    if (code !== '200' || !/^https:\/\/images\.unsplash\.com\//.test(url)) throw new Error(`${site}/${key}: download non riuscito (${res})`);
    const dl = decodeURIComponent((url.match(/[?&]dl=([^&]+)/) || [])[1] || '');
    const user = dl.replace(new RegExp(`-${id.replace(/[-_]/g, '\\$&')}-unsplash\\.jpg$`), '');
    credits[key] = { title: `Foto Unsplash ${id}`, author: user ? `@${user} su Unsplash` : 'Unsplash', source: `https://unsplash.com/photos/${id}`, license: 'Licenza Unsplash (uso gratuito, anche commerciale)', licenseUrl: 'https://unsplash.com/license' };
    console.log(site, key, user, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
  }
  const jf = path.join(dir, 'images.json');
  const cur = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')) : {};
  for (const [key, c] of Object.entries(credits)) cur[key] = { file: `${key}.jpg`, alt: (cur[key] || {}).alt || '', ...(cur[key] || {}), credit: c };
  fs.writeFileSync(jf, JSON.stringify(cur, null, 2) + '\n');
}
