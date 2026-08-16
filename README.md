# FERMO

**Marketplace della capacità inutilizzata.** Officine, laboratori, stampanti 3D, CNC,
magazzini, furgoni e attrezzature ferme: si affittano, si danno in conto lavoro, si vendono.

Demo navigabile. Nessun backend, nessuna dipendenza, nessun passaggio di build.

---

## Pubblicare su Render

Il repository **è** il sito: non c'è niente da compilare.

### Con il blueprint (consigliato)

1. Render → **New** → **Blueprint** → punta a questo repository.
2. Render legge `render.yaml` e crea il servizio con routing, intestazioni e cache già
   impostati. Ogni pull request ottiene la sua anteprima navigabile.

### A mano

Render → **New** → **Static Site**, poi:

| Campo | Valore |
|---|---|
| Build Command | *(lasciare vuoto)* |
| Publish Directory | `.` |

Le regole di `render.yaml` — riscritture e intestazioni — vanno poi ricreate dalle schede
*Redirects/Rewrites* e *Headers* del servizio, altrimenti restano solo i file statici.

### Dopo il primo deploy

Sostituire il dominio segnaposto nei meta dell'anteprima dei collegamenti:

```bash
grep -rl 'fermo-demo.onrender.com' *.html \
  | xargs sed -i 's|https://fermo-demo\.onrender\.com|https://IL-TUO-DOMINIO|g'
```

### Che cosa c'è nella configurazione

- **Indirizzi puliti**: `/catalogo`, `/console`, `/pubblica`, `/richieste`, `/scheda?id=…`
  funzionano come punti d'ingresso condivisibili. La navigazione interna resta sui `.html`,
  che è coerente e non richiede una finta cartella per pagina.
- **Intestazioni di sicurezza**, CSP compresa. La regola dice il vero: `connect-src 'none'`,
  perché il sito non fa nessuna richiesta di rete. `script-src 'self'` è stretto — non c'è
  JavaScript inline in nessuna pagina. `style-src` accetta `'unsafe-inline'` perché le
  pagine usano attributi `style="…"`.
- **Cache**: HTML rivalidato a ogni richiesta, asset un'ora con `stale-while-revalidate`.
- **`404.html`** deliberatamente senza script: deve reggere anche se il JavaScript non parte.
- **`robots.txt`** blocca gli indici di ricerca — è una demo con dati inventati — ma lascia
  passare i bot che generano l'anteprima dei collegamenti, altrimenti condividere il link
  non mostrerebbe nulla.

---

## In locale

Doppio clic su `index.html`: funziona anche da `file://`, perché non usa moduli ES né `fetch`.

Oppure `npm start` (`python3 -m http.server 4173`).

---

## Che cosa si può provare

Al primo accesso si apre una **visita guidata** di quattro tappe, richiamabile in ogni
momento dal pulsante *Guida* in basso a destra.

La demo **si semina da sola**: tre richieste già a stadi diversi del percorso, con le loro
conversazioni, tre beni salvati e due decisioni già prese sulla console. Un marketplace
vuoto non fa capire il prodotto.

| Pagina | A che serve |
|---|---|
| `index.html` | Manifesto: il problema, le tre modalità di cessione, la tassonomia, come si chiude un giro. |
| `catalogo.html` | Ricerca a testo libero, otto filtri, cinque ordinamenti, stato nella barra URL, quadro geografico delle sedi. |
| `asset.html` | Scheda tecnica, calendario di 28 giorni, preventivo dal vivo, recensioni. |
| `pubblica.html` | Pubblicazione in quattro passaggi con validazione, anteprima e stima del ricavo annuo. |
| `console.html` | Lato proprietario: transato, occupazione per macchina, richieste da accettare o rifiutare. |
| `prenotazioni.html` | Lato domanda: avanzamento in cinque tappe, conversazione col fornitore, beni salvati. |

### I due lati del mercato

La testata ha un **cambio di ruolo**: *cliente* o *fornitore*. Il menu cambia di conseguenza,
perché sono due prodotti diversi che condividono un catalogo. Aprire una pagina dell'altro
lato riallinea il ruolo da sola, così non si finisce mai in un menu che non contiene la
pagina in cui ti trovi.

### Il modello

Tre modi di cedere capacità, perché sono tre contratti diversi:

- **Noleggio** — la macchina la usi tu. Prezzo a ora, giorno, settimana o mese.
- **Conto lavoro** — lavora il fornitore, tu mandi il file o il pezzo. Prezzo a pezzo o a ora.
- **Dismissione** — la macchina si vende. Prezzo in blocco, con trattativa sull'offerta.

I parametri di piattaforma stanno tutti in cima a `assets/js/data.js`: commissione **9 %**,
copertura danni opzionale **3,5 %**, IVA **22 %**.

---

## Struttura

```
index.html  catalogo.html  asset.html  pubblica.html  console.html  prenotazioni.html
404.html  render.yaml  robots.txt
assets/
  css/fermo.css        un solo foglio di stile, con i token in cima
  img/anteprima.png    immagine per l'anteprima dei collegamenti
  js/data.js           dataset (30 beni), tassonomia, coordinate, generatori deterministici
  js/demo.js           semina della demo e visita guidata
  js/core.js           stato locale, formattazione, testata, ruoli, glifi, grafici, quadro sedi
  js/manifesto.js  js/catalogo.js  js/asset.js  js/pubblica.js  js/console.js  js/prenotazioni.js
```

### Scelte tecniche

- **Script classici, non moduli.** Così i file si aprono anche senza server.
- **Stato in `localStorage`** sotto `fermo.v1`: ruolo, preferiti, richieste, messaggi,
  annunci pubblicati, tema, decisioni. Il pulsante *Azzera dati demo* rimette tutto a zero.
- **Dati generati con un PRNG seminato dall'ID** (`mulberry32`): disponibilità, storici,
  richieste e recensioni sono diversi da bene a bene ma identici a ogni ricaricamento.
- **Nessuna immagine nei contenuti.** I beni sono disegnati con glifi SVG schematici, uno per
  categoria, su fondo tratteggiato. Niente richieste di rete, niente foto stock.
- **Tutto il testo variabile passa da `FERMO.esc()`** prima di finire nell'HTML.

---

## Il linguaggio visivo

Scheda tecnica d'officina, non SaaS: monospazio ovunque, bordi neri da 2 px, ombre dure senza
sfocatura, zero angoli arrotondati, griglia millimetrata di fondo, etichette a stencil,
sezioni numerate `[01]`, nastro a bande diagonali. Tema chiaro e scuro (*turno giorno* /
*turno notte*), applicato prima del primo disegno per non far lampeggiare la pagina.

### Il quadro delle sedi

Non è una mappa disegnata: è una **proiezione equirettangolare delle coordinate reali** delle
trenta città a catalogo, con i meridiani compressi del coseno della latitudine. Non c'è nessun
contorno — la sagoma dell'Italia esce dalle sedi stesse, e il vuoto al Sud è copertura che
manca davvero, non spazio sprecato.

Il raggio è proporzionale all'**area**, non al raggio, perché è l'area che l'occhio legge come
quantità. Il nome si scrive solo dove nessun'altra sede sta a meno di 30 px: una regola che si
adatta da sola ai filtri invece di un elenco scritto a mano. Dove i punti si accavallano —
Brescia e Lumezzane distano 12 km — resta l'elenco accanto al quadro come via precisa.

### I grafici

Palette validata con lo script `validate_palette.js` della skill `dataviz` — sei controlli,
tutte le coppie, in entrambi i temi:

| Slot | Chiaro | Scuro |
|---|---|---|
| 1 | `#C2410C` | `#E8622B` |
| 2 | `#1B5FA8` | `#4B90E2` |
| 3 | `#0F7B5F` | `#17A57C` |

Il tetto è **tre serie**: separazione peggiore per il daltonismo ΔE 10,6 / 11,2 e a visione
normale 16,4 / 18,7, sopra le soglie. Una quarta tinta non le superava, quindi oltre la terza
categoria le altre confluiscono in *Altro* in grigio neutro invece di inventare un colore.

Il resto segue le stesse regole: scala arrotondata a cifre tonde in una corsia dedicata,
colonne sotto i 24 px, nessuna legenda dove la serie è una sola, etichetta diretta solo sul
massimo, testo mai nel colore della serie, lettura da mouse e da tastiera, tabella dei dati
apribile sotto ogni grafico.

---

## Collaudo

Guidato con Playwright:

```bash
npm run check          # sintassi di tutti gli script
```

Le prove del browser stanno fuori dal repository (servono un server locale su `:4173`) e
coprono: percorsi completi di ricerca, prenotazione, pubblicazione e decisione; il primo
accesso con semina e visita guidata; il cambio di ruolo; la geometria del quadro delle sedi;
la coerenza interna dei dati seminati; sei pagine in due temi senza errori né straripamenti;
il viewport da 390 px; i nomi accessibili di bottoni, campi e SVG; **e un giro completo servito
con le intestazioni esatte di `render.yaml`**, per accorgersi di una CSP sbagliata qui e non
dopo la pubblicazione.

---

## Limiti dichiarati

È una demo. Non ci sono: autenticazione, pagamenti, ricerca geografica per distanza,
messaggistica reale (il fornitore risponde con frasi pronte), verifica di partita IVA,
persistenza fra dispositivi. Fornitori, prezzi, valutazioni e disponibilità sono inventati
e non fanno riferimento ad aziende reali.
