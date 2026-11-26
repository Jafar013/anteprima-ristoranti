# Riepilogo dei test — 18 novembre 2026

Tutti i controlli sono stati eseguiti realmente sulla build finale (`dist/` ed `exports/`), con `tools/qa.js`, in quattro browser pilotati da Playwright 1.65.1. Il dettaglio di ogni browser è in `qa/report/<browser>/REPORT.md` e `results.json`, gli screenshot in `qa/screenshots/<browser>/`.

**Esito finale, tutti superati:**

| Browser | Motore | Controlli superati |
|---|---|---|
| Chromium 159 (la base di Google Chrome; Chrome non è installato su questo PC) | Blink | 1307 / 1307 |
| Microsoft Edge 157 | Blink | 1307 / 1307 |
| Firefox 159 | Gecko | 1301 / 1301 |
| WebKit 27.2 (il motore di Safari) | WebKit | 1301 / 1301 |

Firefox e WebKit hanno 6 controlli in meno perché non espongono la metrica CLS (stabilità del layout): lì il CLS non è misurabile e il controllo non viene contato, non viene dato per superato.

### Problemi trovati dai test su più browser, e corretti
- **Firefox, sito 02 a 1024 px:** la pagina scorreva di 11 px in orizzontale. L'indirizzo e-mail ("…@osteriacampolungo.example"), parola unica larga 261 px dentro una colonna da 202 px, sporgeva dal pulsante. Chromium ritagliava il testo senza segnalarlo, quindi il difetto c'era anche lì, ma invisibile ai test. Correzione: l'indirizzo può andare a capo dopo la @ e prima del dominio, in tutti i siti, con `overflow-wrap: anywhere` come rete di sicurezza. La QA ora ha un controllo generale "testi e pulsanti dentro il proprio box", che è il motivo dei 100 controlli in più rispetto alla prima tornata.
- **WebKit / Safari:** con il Tab semplice lo skip link "Vai al contenuto" non era raggiungibile, perché Safari di default fa saltare i link al Tab. Ora ha `tabindex="0"` ed è il primo elemento raggiungibile da tastiera anche in Safari (verificato: Tab → skip link → Invio → contenuto).

I browser sono installati in `.browsers/` dentro il progetto, non nelle cartelle condivise del sistema. Per rieseguire: `node tools/qa.js chromium`, `firefox`, `webkit` oppure `edge`.

Il resto di questo riepilogo descrive i controlli, identici in ogni browser.

## Cosa è stato verificato

### Pagine e formati
- **Pagine:** le 4 pagine di ciascuno dei 3 siti (Home, Menu, La nostra storia, Contatti) e la pagina di selezione delle demo.
- **Formati:**
  - 1920×1080 e 1440×900 (desktop);
  - 1024×768 (tablet orizzontale);
  - 768×1024 (tablet verticale);
  - 390×844 e 360×740 (smartphone, con emulazione touch).
- **Controlli su ogni pagina e formato:**
  - nessun errore JavaScript e nessuna richiesta fallita;
  - nessuno scorrimento orizzontale e nessun elemento oltre il bordo;
  - immagini caricate, con `alt`, `width` e `height`, non deformate;
  - titoli contenuti nel proprio box;
  - un solo `h1` e una gerarchia dei titoli senza salti;
  - `title`, `description`, `og:image` e `lang="it"` presenti;
  - bersagli di tocco di almeno 44 px su tablet e smartphone;
  - nessun testo sotto i 12 px.

### Interazioni, per ogni sito
- **Menu hamburger:**
  - si apre con `aria-expanded`;
  - il focus entra nel pannello e i 4 link sono visibili;
  - `Esc` lo chiude e riporta il focus sul pulsante;
  - i link del pannello navigano correttamente.
- **Tastiera:**
  - il primo `Tab` raggiunge lo skip link, che porta al contenuto;
  - il focus è visibile sui primi 14 elementi della home.
- **Pulsanti dimostrativi:** "Prenota" apre la finestra dimostrativa e `Esc` la chiude. Ogni tipo di pulsante (prenotazione, telefono, e-mail, mappe, social, WhatsApp) ha il suo testo.
- **Indice delle categorie del menu (1440 e 390 px):**
  - il clic porta alla sezione senza che le barre fisse la coprano;
  - la categoria attiva viene evidenziata.
- **Filtro "Solo vegetariani" (sito 03):** nasconde davvero i piatti (28 → 13), annuncia il risultato e ripristina l'elenco.
- **Galleria a scorrimento (sito 02):** le frecce avanti e indietro funzionano e sono disattivate agli estremi.
- **Link e ancore:** tutti i collegamenti interni e le ancore risolvono, senza percorsi assoluti.
- **Movimento ridotto:** con `prefers-reduced-motion` nessun contenuto resta nascosto in attesa di un'animazione.
- **Senza JavaScript:** il menu resta completo e leggibile.

### Pagina di selezione
- I tre pulsanti portano alle tre demo corrette (verificato anche con clic reale).
- "Tutte le demo" riporta alla selezione.

### Export singoli
- `exports/<sito>/` contiene solo i file di quel sito: nessun altro template, nessuna pagina di selezione, nessun collegamento alla raccolta.
- Tutti gli asset referenziati esistono.
- Ogni export è stato **servito in una sottocartella** (`/clienti/demo/`) e ricontrollato: pagine a 1440 e 390 px, più tutte le interazioni sopra.

### Prestazioni
Valori indicativi: server locale, nessuna limitazione di rete.
- **LCP:** 144–164 ms.
- **CLS:** 0–0,011. Era 0,13–0,24 prima della correzione, dovuto allo scambio dei font: ora i fallback di sistema sono calibrati con `size-adjust`.
- **Richieste:** 7–10 al primo caricamento della home.
- **Servizi esterni:** solo Google Fonts. Nessun tracciamento e nessun cookie.

## Controllo visivo
- **Screenshot a pagina intera:** salvati per tutte le pagine a 1920, 768 e 390 px, più il menu mobile aperto e la finestra di prenotazione, per ciascun browser (51 file in ogni `qa/screenshots/<browser>/`). Firefox e WebKit sono stati confrontati a vista: home e menu dei tre siti a 390 px, hero dei tre siti a 1920 px.
- **Pagine esaminate a vista:**
  - la home dei tre siti a desktop e smartphone;
  - il menu del sito 01 su smartphone;
  - la pagina di selezione a 1920, 390 e 360 px;
  - il menu mobile del sito 03 aperto in cima e dopo lo scorrimento.
- **Durante lo sviluppo:** ogni sito è stato controllato a vista su tutte e quattro le pagine a 1440, 768 e 390 px, e in parte a 1920, 1024 e 360.

## Problemi trovati e corretti durante i test
- Il filtro vegetariano annunciava il risultato ma non nascondeva i piatti: il `display` del tema prevaleva sull'attributo `hidden`.
- La pillola fissa "Tutte le demo" copriva la CTA dell'hero su smartphone. È diventata una barra statica in cima alla pagina, assente negli export.
- Con la barra demo visibile, il pannello del menu mobile copriva l'header.
- Spostamenti del layout al caricamento dei font (CLS fino a 0,24 su smartphone).
- Testo a 10–11 px nel sito 01.
- Voci di navigazione larghe 37–40 px nel sito 02 a 1024 px.
- Titolo dell'hero del sito 03 a ridosso della foto a 1920 px.
- Titolo della pagina di selezione con a capo forzato su smartphone.

## Limitazioni: cosa NON è stato testato
- **Safari vero e dispositivi reali:** WebKit su Windows non è Safari su Mac o iPhone (stesso motore, ma rendering dei font, barre del browser e gesti diversi). Su iPhone e iPad non ci sono test su dispositivi reali: safe area, `100dvh` e comportamento del menu fisso vanno controllati a mano.
- **Google Chrome:** non è installato su questo PC. È stato usato Chromium, la stessa base di Chrome nella versione di Playwright.
- **Lighthouse:** non eseguito (per scelta non sono stati installati né aggiornati strumenti). Le metriche sopra vengono dal browser, non da un audit Lighthouse.
- **Accessibilità:** nessun test con lettori di schermo (VoiceOver, NVDA) e nessun audit axe. Contrasti, focus, gerarchia, nomi e tastiera sono stati verificati con i controlli descritti sopra; i rapporti di contrasto della palette sono stati calcolati.
- **Prestazioni su rete mobile reale:** non misurate.

## Note per l'uso commerciale
- **Fotografie:** sono immagini dimostrative Unsplash (licenza Unsplash, crediti in `CREDITI-FOTO.txt`). Alcune sono solo un'approssimazione del soggetto:
  - sito 01: la sala dell'hero è un locale piuttosto moderno; la foto della sfoglia mostra una macchina per la pasta, ritagliata per nasconderla;
  - sito 03: la foto della cucina ha toni seppia.

  Per un cliente vanno sostituite con le foto del locale.
- **Google Fonts via CDN:** il visitatore si collega ai server di Google, che ricevono il suo indirizzo IP. Nell'UE questo ha già portato a contestazioni (es. LG München, 2022). Per i siti dei clienti valutare i font in locale oppure citarli nell'informativa privacy.
- **Allergeni:** non compilati di proposito; vanno inseriti dal ristorante.
- **Indicizzazione:** le demo hanno `noindex`. Per un sito reale va impostato `noindex: false` con `siteUrl`.
- **Dimensioni degli export:** 9–13 MB, perché ogni foto ha le versioni da 480 a 2400 px. Il browser scarica solo quella adatta allo schermo: la home pesa 115–400 KB al primo caricamento.
- **Menu mobile nella raccolta demo:** all'apertura in cima alla pagina, la pagina scorre di 44 px per togliere di vista la barra "Tutte le demo". Negli export la barra non c'è.
