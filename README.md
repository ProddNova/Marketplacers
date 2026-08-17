# FERMO

**Il mercato dei macchinari usati.** Centri di lavoro sostituiti, presse rimaste indietro di
una tecnologia, laser, laboratori, scaffalature e mezzi d'opera: si comprano a prezzo fisso,
si trattano, si mettono all'asta.

Demo navigabile. Nessun backend, nessuna dipendenza, nessun passaggio di build.

---

## Il modello

Una macchina ferma non si rivaluta: ogni mese che resta in fondo al capannone vale meno di
quello prima. FERMO la rimette sul mercato e chiude la vendita in uno di tre modi, perché
sono tre trattative diverse:

- **Prezzo fisso** — il numero è quello, chi lo accetta per primo se la prende.
- **Trattativa** — il compratore propone, il venditore accetta, rifiuta o rilancia.
- **Asta a tempo** — si rilancia fino alla scadenza; sotto la base non si vende.

Ogni scheda dice le quattro cose che decidono un acquisto di usato — **anno**, **contatore**
(ore, chilometri, battute o cicli), **stato dichiarato** e **perché si vende** — e poi il resto:
quando è ritirabile, chi smonta, chi trasporta, che garanzia c'è.

I parametri di piattaforma stanno tutti in cima a `assets/js/data.js`: commissione **6 %**
(la paga il venditore, solo sul venduto), perizia indipendente **290 €**, stime di trasporto
**480 €** e di smontaggio **350 €**, IVA **22 %**.

---

## Pensata prima per il telefono

La maggior parte di chi la guarderà la aprirà dal telefono, quindi il telefono è il caso
normale e lo schermo grande è la variante — non il contrario.

- **Navigazione in basso.** Tre voci, quelle del lato in cui ti trovi, più il passaggio
  all'altro lato. Il pollice ci arriva; un menu a tendina in alto no. Da 900 px in su la
  stessa navigazione torna nella testata e la barra sparisce.
- **Filtri in un pannello.** Sul listino restano visibili solo ricerca, categorie e
  ordinamento: tutto il resto sta in un foglio che sale dal basso, si applica dal vivo e
  in fondo dice sempre quante macchine restano.
- **Le schede sono righe.** Sul telefono una macchina è una riga alta 118 px con la figura a
  sinistra: ne stanno tre per schermata invece di una. Da 720 px in su la stessa
  marcatura diventa una scheda in colonna.
- **L'azione resta a portata.** Sulla scheda il prezzo e il pulsante — *Compra ora*,
  *Invia la proposta* o *Rilancia*, secondo la formula — sono fissi in fondo; nel modulo di
  pubblicazione lo sono *Indietro* e *Avanti*.
- **Niente tabelle da far scorrere di lato.** Dove c'erano tabelle — macchine in vendita,
  proposte in arrivo — ci sono righe che si impilano.
- **Tocco e leggibilità.** Bersagli da 44 px, campi a 16 px (sotto, il telefono
  ingrandisce da solo la pagina), rispetto della tacca e del bordo inferiore con
  `env(safe-area-inset-*)`.

---

## Il linguaggio visivo

Una tinta d'accento sola, usata dove si decide qualcosa; tutto il resto in grigi neutri.
Caratteri di sistema, angoli morbidi, ombre appena accennate, molto spazio bianco.
Tema chiaro e scuro, applicati prima del primo disegno per non far lampeggiare la pagina.

| Ruolo | Chiaro | Scuro |
|---|---|---|
| Sfondo | `#F6F6F3` | `#101113` |
| Superficie | `#FFFFFF` | `#191A1D` |
| Testo | `#17181A` | `#F2F2EF` |
| Accento | `#C2410C` | `#E8622B` |

I colori delle serie nei grafici restano quelli validati con lo script
`validate_palette.js` della skill `dataviz` — sei controlli, tutte le coppie, in entrambi
i temi:

| Slot | Chiaro | Scuro |
|---|---|---|
| 1 | `#C2410C` | `#E8622B` |
| 2 | `#1B5FA8` | `#4B90E2` |
| 3 | `#0F7B5F` | `#17A57C` |

Il tetto è **tre serie**: separazione peggiore per il daltonismo ΔE 10,6 / 11,2 e a visione
normale 16,4 / 18,7, sopra le soglie. Una quarta tinta non le superava, quindi oltre la
terza categoria le altre confluiscono in *Altro* in grigio neutro invece di inventare un
colore.

Il misuratore dello **stato** usa la stessa scala di sempre, ma al contrario: verde quando la
vita residua dichiarata è alta, rosso quando la macchina si compra per i pezzi.

---

## Che cosa si può provare

Al primo accesso si apre una **guida** di quattro tappe, richiamabile in ogni momento dal
menu **···** in testata — dove stanno anche il cambio di tema e l'azzeramento dei dati.

La demo **si semina da sola**: tre pratiche già a stadi diversi del percorso, con le loro
conversazioni, tre macchine seguite e due proposte già decise sulla console. Un mercato
vuoto non fa capire il prodotto.

| Pagina | A che serve |
|---|---|
| `index.html` | Il problema, come funziona, le tre formule, la tassonomia, quanto recuperi vendendo. |
| `catalogo.html` | Ricerca a testo libero, nove filtri, sette ordinamenti, stato nella barra URL, mappa delle sedi. |
| `asset.html` | Scheda tecnica, stato e contatore, calendario delle visioni, conto completo, recensioni del venditore. |
| `pubblica.html` | Messa in vendita in quattro passaggi con validazione, anteprima e netto dopo commissione. |
| `console.html` | Lato venditore: valore a listino, visite alle schede, proposte da accettare. |
| `acquisti.html` | Lato compratore: avanzamento in cinque tappe, conversazione col venditore, macchine seguite. |

### I due lati del mercato

Sono due prodotti che condividono un listino, e la navigazione lo dice: *compratore* o
*venditore*. Aprire una pagina dell'altro lato riallinea il ruolo da sola, così non si
finisce mai in un menu che non contiene la pagina in cui ti trovi.

### Il percorso di una pratica

Cinque tappe: **proposta inviata → accettata → pagamento in deposito → ritiro concordato →
conclusa**. L'importo resta vincolato finché la macchina non è caricata; nella demo il
percorso lo avanzi tu, con il pulsante che porta il nome della tappa successiva.

---

## Struttura

```
index.html  catalogo.html  asset.html  pubblica.html  console.html  acquisti.html
404.html  render.yaml  robots.txt
assets/
  css/fermo.css        un solo foglio di stile, con i token in cima
  img/anteprima.png    immagine per l'anteprima dei collegamenti
  js/data.js           listino (30 macchine), tassonomia, coordinate, generatori deterministici
  js/demo.js           semina della demo e guida
  js/core.js           stato locale, formattazione, testata, navigazione, schede, grafici
  js/manifesto.js  js/catalogo.js  js/asset.js  js/pubblica.js  js/console.js  js/acquisti.js
```

### Scelte tecniche

- **Script classici, non moduli.** Così i file si aprono anche senza server.
- **Stato in `localStorage`** sotto `fermo.v2`: ruolo, macchine seguite, pratiche, messaggi,
  annunci pubblicati, tema, decisioni. *Azzera i dati della demo*, nel menu ···, rimette
  tutto a zero.
- **Dati generati con un PRNG seminato dall'ID** (`mulberry32`): visite, storici, proposte,
  disponibilità per le visioni e recensioni sono diversi da macchina a macchina ma identici
  a ogni ricaricamento.
- **In asta il prezzo è calcolato, non scritto**: base più un rilancio per ogni offerta
  ricevuta. Così il numero grande sulla scheda, il filtro sul prezzo e il minimo del
  prossimo rilancio non possono divergere.
- **Nessuna immagine nei contenuti.** Le macchine sono disegnate con glifi SVG schematici, uno
  per categoria. Niente richieste di rete, niente foto stock.
- **Un solo set di icone**, disegnate a tratto in `core.js`, viewBox 24 e colore ereditato.
- **Tutto il testo variabile passa da `FERMO.esc()`** prima di finire nell'HTML.

### La mappa delle sedi

Non è una mappa disegnata: è una **proiezione equirettangolare delle coordinate reali**
delle trenta città a listino, con i meridiani compressi del coseno della latitudine. Non
c'è nessun contorno — la sagoma dell'Italia esce dalle sedi stesse, e il vuoto al Sud è
copertura che manca davvero, non spazio sprecato.

Qui la geografia non è un dettaglio: il ritiro parte da lì, quindi la distanza è un costo.
Il raggio è proporzionale all'**area**, non al raggio, perché è l'area che l'occhio legge
come quantità. Il nome si scrive solo dove nessun'altra sede sta a meno di 30 px: una
regola che si adatta da sola ai filtri invece di un elenco scritto a mano. Dove i punti si
accavallano — Brescia e Lumezzane distano 12 km — resta l'elenco accanto alla mappa come
via precisa.

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

- **Indirizzi puliti**: `/listino`, `/catalogo`, `/console`, `/vendi`, `/pubblica`,
  `/acquisti`, `/scheda?id=…` funzionano come punti d'ingresso condivisibili. La navigazione
  interna resta sui `.html`, che è coerente e non richiede una finta cartella per pagina.
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

```bash
npm run check          # sintassi di tutti gli script
```

Le prove del browser stanno fuori dal repository (servono un server locale su `:4173`) e
coprono: sei pagine più la 404 in due temi e a 390 px e 1280 px, senza errori in console né
straripamenti orizzontali; ricerca, filtri e ordinamenti con lo stato che finisce nell'URL;
acquisto a prezzo fisso con visione prenotata; proposta in trattativa con lo scarto
calcolato; rilancio d'asta, respinto sotto il minimo e accettato sopra; avanzamento di una
pratica e risposta del venditore nel filo; decisione su una proposta dalla console;
pubblicazione completa dei quattro passaggi con la validazione che ferma il primo.

---

## Limiti dichiarati

È una demo. Non ci sono: autenticazione, pagamenti, deposito vincolato vero, ricerca
geografica per distanza, messaggistica reale (il venditore risponde con frasi pronte),
verifica di partita IVA né perizie effettive. Le aste hanno una scadenza in giorni che non
scorre da sola, e offerte, visite e disponibilità per le visioni sono generate. Venditori,
macchine, prezzi e valutazioni sono inventati e non fanno riferimento ad aziende reali.
