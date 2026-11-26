# Anteprima ristoranti — tre siti dimostrativi

Tre siti statici, indipendenti e pronti da personalizzare, per trattorie, osterie e ristoranti di famiglia, più una pagina che li presenta.

| Cartella | Template | Ristorante (di fantasia) | Caratteri |
|---|---|---|---|
| `src/sites/trattoria` | 01 — Trattoria tradizionale | Trattoria Bellandi | Cormorant Garamond · DM Sans |
| `src/sites/osteria` | 02 — Osteria del territorio | Osteria Campolungo | Fraunces · Source Sans 3 |
| `src/sites/contemporaneo` | 03 — Ristorante familiare contemporaneo | Gemma | Instrument Serif · Manrope |

Ogni sito ha quattro pagine: `index.html` (Home), `menu.html`, `storia.html`, `contatti.html`.

## Cosa c'è nella cartella

```
dist/                     build completa da pubblicare come raccolta demo
  index.html              pagina di selezione delle tre demo
  trattoria/ osteria/ contemporaneo/
exports/                  i tre siti esportati SINGOLARMENTE (uno per cliente)
  trattoria/  osteria/  contemporaneo/
src/
  shared/base.css         base comune (accessibilità, menu mobile, finestra demo)
  shared/site.js          JavaScript comune (nessuna libreria)
  portal/                 pagina di selezione delle demo
  sites/<sito>/
    site.json             nome, colori, font, indirizzo, orari, collegamenti esterni
    content.json          tutti i testi delle pagine
    menu.json             menu: categorie, piatti, descrizioni, prezzi, allergeni
    images.json           elenco foto con testo alternativo e crediti
    foto/                 fotografie originali (jpg/png/webp)
    theme.css             identità visiva del sito
    templates.js          struttura HTML delle quattro pagine
tools/                    build, server locale, anteprime, QA
qa/                       report e screenshot dei test
```

Il sito pubblicato è fatto solo di file statici (HTML, CSS, JS, immagini WebP): non servono Node.js, database o backend sul server. Node.js serve soltanto sul computer di chi modifica il sito, per rigenerare le pagine.

## Avvio

Il modo più rapido su Windows è fare doppio clic su **`AVVIA-ANTEPRIMA.cmd`**. Aggiorna la build, avvia il server locale e apre il browser. Sceglie fra:
1. la raccolta demo (pagina di selezione con i tre siti) su `http://localhost:4173/`;
2. 3. 4. un singolo sito esportato, servito in una sottocartella come su un hosting reale, su `http://localhost:4174/clienti/demo/`.

Il server si ferma chiudendo la finestra.

Requisiti: Node.js 18 o successivo.

```
npm install            # una volta: installa sharp (immagini) e playwright-core (test)
npm run build          # genera dist/ ed exports/
npm run serve          # http://localhost:4173/  (la raccolta demo)
```

Per un solo sito: `node tools/build.js osteria` (aggiorna `dist/osteria` ed `exports/osteria`).

## Personalizzare un sito

Tutte le modifiche si fanno nei file di `src/sites/<sito>/`, poi si esegue `npm run build`.

### Testi
In `content.json`. Ogni pagina ha la sua sezione (`home`, `menu`, `storia`, `contatti`) con titoli, paragrafi, didascalie e la descrizione per i motori di ricerca (`meta`). Nei testi si può usare `*corsivo*` e `**grassetto**`. Nome del locale, indirizzo, telefono, e-mail e orari sono invece in `site.json` e compaiono automaticamente in tutte le pagine.

### Fotografie
1. Copiare la nuova foto in `foto/` (JPG, PNG o WebP, idealmente almeno 2000 px sul lato lungo).
2. In `images.json` indicare il nome del file alla voce corrispondente (`"file": "sala-nuova.jpg"`), aggiornare `alt` (descrizione per chi non vede l'immagine) e, se serve, `position` (il punto da tenere al centro quando la foto viene ritagliata, es. `"50% 30%"`).
3. `npm run build`: la build crea da sola le versioni WebP in più larghezze (480–2400 px) e il `srcset` per ogni schermo.

Per sostituire una foto mantenendo il nome basta sovrascrivere il file. Le foto dimostrative provengono da Unsplash (licenza Unsplash): i crediti sono in `CREDITI-FOTO.txt` di ogni sito. Per un cliente reale vanno sostituite con le fotografie del locale.

### Colori e caratteri
In `site.json`:
- `colors`: ogni voce diventa una variabile CSS (`"accent": "#8a2a2b"` → `var(--c-accent)`), usata in tutto `theme.css`. Cambiando i valori cambia l'intero sito. Verificare il contrasto (almeno 4,5:1 per il testo).
- `fonts`: `href` è l'indirizzo Google Fonts (CSS API v2, `display=swap`); `display` e `text` sono le famiglie per titoli e testo, con i fallback di sistema. Si possono caricare solo i pesi effettivamente usati.
- `fonts.fallbacks`: font di sistema (Georgia, Arial…) ridimensionati con `size-adjust` (e, dove serve, `ascent-override` / `descent-override`) perché abbiano la stessa larghezza del font web: mentre i caratteri arrivano da Google Fonts il testo occupa già lo stesso spazio e la pagina non "salta" (CLS misurato ≤ 0,02). Se si cambia font, questi valori vanno ricalibrati (o tolti: il sito funziona comunque, solo con un piccolo assestamento al caricamento).

### Menu e prezzi
In `menu.json`: ogni categoria ha `id` (usato nei collegamenti, senza spazi), `title`, un'introduzione facoltativa e i piatti:

```json
{ "name": "Tagliatelle al ragù", "desc": "Sfoglia tirata a mano, ragù cotto quattro ore", "price": 13, "tags": ["casa"], "allergens": [1, 3, 9] }
```

- `price`: numero (13 → "13", 6.5 → "6,50").
- `tags`: etichette previste dal template (per esempio `veg`, `casa`, `orto`, `condividere`, `nonna`, `bambini`).
- `allergens`: numeri dell'elenco dei 14 allergeni (Reg. UE 1169/2011) riportato in fondo a `menu.json`. **Nelle demo è vuoto di proposito**: i dati sugli allergeni li fornisce e verifica il ristorante.

### Collegamenti esterni (prenotazioni, telefono, mappe, social)
In `site.json` → `links`:

```json
"links": {
  "booking": "https://www.thefork.it/ristorante/…",
  "phone": "tel:+390510000000",
  "email": "mailto:info@ristorante.it",
  "maps": "https://maps.google.com/?q=…",
  "instagram": "https://instagram.com/…",
  "facebook": "https://facebook.com/…",
  "whatsapp": "https://wa.me/39…"
}
```

Finché un collegamento è vuoto il sito è in **modalità demo**: il pulsante apre una finestra che spiega cosa farà nel sito reale. Appena il campo è compilato, il pulsante diventa un collegamento vero. `booking` può puntare a qualsiasi servizio esterno (TheFork, Quandoo, un modulo esterno, WhatsApp…). Non c'è nessun modulo di contatto che finga di inviare messaggi.

### Indicizzazione
Le demo hanno `"noindex": true` in `site.json` → `seo`, per non far apparire ristoranti di fantasia nei motori di ricerca. Per un cliente reale: `"noindex": false` e `"siteUrl": "https://www.ristorante.it/"` (per URL canonici e immagine di anteprima assoluti). Non sono pubblicati dati strutturati di attività commerciale: vanno aggiunti solo con i dati reali del cliente.

## Esportare un singolo sito

`npm run build` crea già `exports/<sito>/`: contiene **solo** quel sito (niente altri template, niente pagina di selezione, nessun collegamento "Tutte le demo"). Basta comprimere la cartella e consegnarla.

## Pubblicare su hosting statico

Caricare il contenuto della cartella (via FTP, pannello dell'hosting, Netlify, Cloudflare Pages, GitHub Pages…):
- la raccolta demo: il contenuto di `dist/`;
- un singolo sito: il contenuto di `exports/<sito>/`.

Tutti i collegamenti sono relativi: il sito funziona nella radice del dominio (`https://ristorante.it/`) o in una sottocartella (`https://studio.it/clienti/ristorante/`) senza modifiche. Non serve nessuna configurazione del server. I caratteri vengono caricati da Google Fonts (connessione a `fonts.googleapis.com` / `fonts.gstatic.com`); il sito non usa cookie né script di tracciamento.

## Test

```
npm run qa                      # dopo npm run build: Microsoft Edge installato
node tools/qa.js chromium       # oppure firefox, webkit (browser di Playwright in .browsers/)
```

Per installare i browser di Playwright nella cartella del progetto (una volta, circa 600 MB): in PowerShell `$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD\.browsers"; node node_modules/playwright-core/cli.js install chromium firefox webkit`. La cartella `.browsers/` serve solo ai test e non va pubblicata.

Apre ogni pagina di ogni sito nel browser scelto (via Playwright) a 1920, 1440, 1024 (tablet orizzontale), 768, 390 e 360 px; controlla errori JavaScript, richieste fallite, scorrimento orizzontale, immagini rotte o deformate, titoli fuori dal contenitore, gerarchia dei titoli, metadati, bersagli di tocco, menu mobile, tastiera e focus, finestra demo, indice e filtri del menu, gallerie, link e ancore, movimento ridotto, export singoli serviti in una sottocartella. Risultati in `qa/report/<browser>/REPORT.md` e `results.json`, screenshot in `qa/screenshots/<browser>/`. Il riepilogo dei test eseguiti per la consegna è in `TEST-REPORT.md`.

`npm run previews` rigenera le anteprime della pagina di selezione (poi `npm run build`).
