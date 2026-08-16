# FERMO

**Marketplace della capacità inutilizzata.** Officine, laboratori, stampanti 3D, CNC,
magazzini, furgoni e attrezzature ferme: si affittano, si danno in conto lavoro, si vendono.

Prototipo di presentazione. Nessun backend, nessuna dipendenza, nessun passaggio di build.

---

## Avvio

Apri `index.html` con un doppio clic — funziona anche da `file://`, perché non usa
moduli ES né `fetch`.

Se preferisci un server locale:

```bash
python3 -m http.server 4173     # poi http://localhost:4173
```

Oppure `npm start`, che fa la stessa cosa.

---

## Che cosa c'è dentro

| Pagina | A che serve |
|---|---|
| `index.html` | Manifesto: il problema, le tre modalità di cessione, la tassonomia, come si chiude un giro. |
| `catalogo.html` | Ricerca a testo libero, otto filtri combinabili, cinque ordinamenti, stato salvato nella barra URL. |
| `asset.html` | Scheda tecnica del bene, calendario di 28 giorni, preventivo che si ricalcola mentre configuri. |
| `pubblica.html` | Pubblicazione in quattro passaggi con validazione, anteprima della scheda e stima del ricavo annuo. |
| `console.html` | Lato proprietario: transato, occupazione per macchina, richieste da accettare o rifiutare. |
| `prenotazioni.html` | Lato domanda: richieste inviate, con conferma e annullamento, più i beni salvati. |

### Il modello

Tre modi di cedere capacità, perché sono tre contratti diversi:

- **Noleggio** — la macchina la usi tu. Prezzo a ora, giorno, settimana o mese.
- **Conto lavoro** — lavora il fornitore, tu mandi il file o il pezzo. Prezzo a pezzo o a ora.
- **Dismissione** — la macchina si vende. Prezzo in blocco, con trattativa sull'offerta.

Sopra ci sono i parametri di piattaforma, tutti in un posto solo
(`assets/js/data.js`): commissione **9 %**, copertura danni opzionale **3,5 %**, IVA **22 %**.

---

## Struttura

```
index.html  catalogo.html  asset.html  pubblica.html  console.html  prenotazioni.html
assets/
  css/fermo.css        un solo foglio di stile, con i token in cima
  js/data.js           dataset (30 beni), tassonomia, generatori deterministici
  js/core.js           stato locale, formattazione, testata/piede, glifi, grafici
  js/catalogo.js  js/asset.js  js/pubblica.js  js/console.js  js/prenotazioni.js
```

### Scelte tecniche

- **Script classici, non moduli.** Così i file si aprono anche senza server.
- **Stato in `localStorage`** sotto la chiave `fermo.v1`: preferiti, richieste, annunci
  pubblicati, tema, decisioni sulle richieste. Il pulsante *Azzera dati demo* in fondo a
  ogni pagina rimette tutto a zero.
- **Dati generati con un PRNG seminato dall'ID** (`mulberry32`): disponibilità, storici e
  richieste sono diversi da bene a bene ma identici a ogni ricaricamento.
- **Nessuna immagine.** I beni sono disegnati con glifi SVG schematici, uno per categoria,
  su fondo tratteggiato. Niente richieste di rete, niente foto stock.
- **Tutto il testo variabile passa da `FERMO.esc()`** prima di finire nell'HTML.

---

## Il linguaggio visivo

Scheda tecnica d'officina, non SaaS: monospazio ovunque, bordi neri da 2 px, ombre dure
senza sfocatura, zero angoli arrotondati, griglia millimetrata di fondo, etichette a
stencil, sezioni numerate `[01]`, nastro a bande diagonali. Tema chiaro e scuro
(*turno giorno* / *turno notte*), con il tema scelto salvato e applicato prima del primo
disegno per non far lampeggiare la pagina.

### I grafici

Palette validata con lo script `validate_palette.js` della skill `dataviz` — sei controlli,
tutte le coppie, in entrambi i temi:

| Slot | Chiaro | Scuro |
|---|---|---|
| 1 | `#C2410C` | `#E8622B` |
| 2 | `#1B5FA8` | `#4B90E2` |
| 3 | `#0F7B5F` | `#17A57C` |

Il tetto è **tre serie**: superficie chiara `#FBF9F3` e scura `#17161A`, separazione CVD
peggiore ΔE 10,6 / 11,2 e visione normale 16,4 / 18,7 — sopra le soglie. Una quarta tinta
non superava i controlli, quindi oltre la terza categoria le altre confluiscono in *Altro*
in grigio neutro, invece di inventare un colore.

Il resto segue le stesse regole: colonne sotto i 24 px con estremità arrotondata solo in
cima, nessuna legenda dove la serie è una sola, etichetta diretta solo sul massimo, testo
sempre in inchiostro e mai nel colore della serie, lettura al passaggio del mouse e da
tastiera, e sotto ogni grafico una tabella dei dati apribile.

---

## Limiti dichiarati

È una demo di presentazione. Non ci sono: autenticazione, pagamenti, ricerca geografica
reale, messaggistica, verifica di partita IVA, persistenza fra dispositivi. Fornitori,
prezzi, valutazioni e disponibilità sono inventati e non fanno riferimento ad aziende reali.
