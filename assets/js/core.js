/* =============================================================================
   FERMO — nucleo comune
   Stato locale, formattazione, testata, navigazione, schede, grafici.
   Nessuna dipendenza, nessun modulo: si apre anche facendo doppio clic sui file.
   ========================================================================== */
(function (global) {
  'use strict';

  var D = global.FERMO_DATA;
  var CHIAVE = 'fermo.v2';

  /* ====================================================== STATO LOCALE ===== */
  var vuoto = {
    preferiti: [], acquisti: [], annunci: [], tema: null,
    ruolo: 'compratore',   /* compratore | venditore */
    messaggi: {},          /* codice pratica → elenco messaggi */
    decisioni: {},         /* codice proposta → accettata | rifiutata */
    offerteAperte: 0,      /* conteggio per il bollo in navigazione */
    seminato: false,       /* la demo si popola una volta sola */
    tour: false            /* visita guidata gia' vista */
  };

  function leggi() {
    try {
      var grezzo = localStorage.getItem(CHIAVE);
      if (!grezzo) return JSON.parse(JSON.stringify(vuoto));
      var s = JSON.parse(grezzo);
      Object.keys(vuoto).forEach(function (k) {
        if (s[k] === undefined) s[k] = JSON.parse(JSON.stringify(vuoto[k]));
      });
      return s;
    } catch (e) {
      return JSON.parse(JSON.stringify(vuoto));
    }
  }
  function scrivi(s) {
    try { localStorage.setItem(CHIAVE, JSON.stringify(s)); } catch (e) { /* modalita' privata */ }
    return s;
  }
  var store = {
    tutto: leggi,
    aggiorna: function (fn) { var s = leggi(); fn(s); scrivi(s); return s; },
    azzera: function () { try { localStorage.removeItem(CHIAVE); } catch (e) {} }
  };

  /* Listino = dataset di base + annunci pubblicati dall'utente in questa demo */
  function catalogo() {
    var miei = store.tutto().annunci || [];
    return miei.concat(D.ASSET);
  }
  function trova(id) {
    var tutti = catalogo();
    for (var i = 0; i < tutti.length; i++) if (tutti[i].id === id) return tutti[i];
    return null;
  }

  /* ======================================================= FORMATTAZIONE === */
  var fEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  var fEuroTondo = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var fNum = new Intl.NumberFormat('it-IT');

  /* Il contatore cambia nome da macchina a macchina: le ore di un mandrino,
     i chilometri di un furgone, le battute di una pressa. */
  var CONTATORI = {
    ore:     { singolo: 'ora',     plurale: 'ore' },
    km:      { singolo: 'km',      plurale: 'km' },
    battute: { singolo: 'battuta', plurale: 'battute' },
    cicli:   { singolo: 'ciclo',   plurale: 'cicli' }
  };
  function contatore(a) {
    if (!a || !a.contatore || !a.contatore.valore) return '';
    var u = CONTATORI[a.contatore.unita] || { singolo: a.contatore.unita, plurale: a.contatore.unita };
    var v = a.contatore.valore;
    return fNum.format(v) + ' ' + (Math.abs(v) === 1 ? u.singolo : u.plurale);
  }

  var fmt = {
    euro: function (n) { return fEuro.format(n); },
    euroTondo: function (n) { return fEuroTondo.format(n); },
    num: function (n) { return fNum.format(n); },
    pct: function (n) { return Math.round(n * 100) + ' %'; },
    data: function (d) {
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    dataCorta: function (d) {
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    },
    giorni: function (n) { return n === 1 ? '1 giorno' : fNum.format(n) + ' giorni'; },
    mesi: function (n) { return n === 1 ? '1 mese' : fNum.format(n) + ' mesi'; },
    pezzi: function (n) { return n === 1 ? '1 pezzo' : fNum.format(n) + ' pezzi'; },
    contatore: contatore
  };

  /* HTML sicuro: tutto il testo variabile passa da qui */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================== PREZZO E RISPARMIO ======= */
  /* In asta il prezzo che conta e' l'offerta piu' alta, non quello richiesto:
     base piu' un rilancio per ogni offerta ricevuta. */
  function offertaCorrente(a) {
    if (!a.asta) return null;
    return a.asta.base + a.asta.offerte * a.asta.rilancio;
  }
  function prezzoCorrente(a) {
    var o = offertaCorrente(a);
    return o == null ? a.prezzo : o;
  }
  function inAsta(a) { return !!a.asta && a.mod.indexOf('asta') !== -1; }
  /* Quanto si risparmia rispetto alla stessa macchina nuova, oggi. */
  function sconto(a) {
    if (!a.nuovo) return null;
    return Math.max(0, 1 - prezzoCorrente(a) / a.nuovo);
  }
  function eta(a) {
    return a.anno ? new Date().getFullYear() - a.anno : null;
  }

  /* ============================================================ ICONE ====== */
  /* Un solo tratto, 24×24, colore ereditato: cosi' stanno bene ovunque. */
  var ICONE = {
    casa:       '<path d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z"/>',
    lente:      '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
    lista:      '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    cruscotto:  '<path d="M3 21h18M7 21v-8M12 21V4M17 21v-5"/>',
    piu:        '<path d="M12 5v14M5 12h14"/>',
    scambio:    '<path d="M16 3l4 4-4 4M20 7H9a4 4 0 0 0-4 4v1M8 21l-4-4 4-4M4 17h11a4 4 0 0 0 4-4v-1"/>',
    sole:       '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna:       '<path d="M21 13.2A8.6 8.6 0 1 1 10.8 3a6.7 6.7 0 0 0 10.2 10.2z"/>',
    altro:      '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    info:       '<circle cx="12" cy="12" r="9"/><path d="M12 16.5v-5M12 8h.01"/>',
    cuore:      '<path d="M20.6 5.9a5.2 5.2 0 0 0-7.4 0L12 7.1l-1.2-1.2a5.2 5.2 0 1 0-7.4 7.4l8.6 8.5 8.6-8.5a5.2 5.2 0 0 0 0-7.4z"/>',
    filtro:     '<path d="M3 6h18M7 12h10M10 18h4"/>',
    chiudi:     '<path d="M6 6l12 12M18 6 6 18"/>',
    avanti:     '<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',
    indietro:   '<path d="M19 12H6M11.5 5.5 5 12l6.5 6.5"/>',
    spunta:     '<path d="m4.5 12.5 5 5 10-11"/>',
    mappa:      '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5zM9 4v13M15 6.5v13"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    cestino:    '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    fabbrica:   '<path d="M3 21h18M4 21V9l6 4V9l6 4V6h4v15"/>',
    ordina:     '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
    /* mercato dell'usato: il martelletto dell'asta, il cartellino, il camion */
    martello:   '<path d="M14 4l6 6M17 7l-8.5 8.5M11 5.5 15.5 10M3.5 20.5h9M6 18l7-7"/>',
    cartellino: '<path d="M20.5 12.5 12 21l-9-9V3h9zM7.5 7.5h.01"/>',
    camion:     '<path d="M2 17V6h11v11M13 9h4l4 4v4h-4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'
  };

  function icona(nome, dim) {
    var d = ICONE[nome] || ICONE.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (dim ? ' width="' + dim + '" height="' + dim + '"' : '') + '>' + d + '</svg>';
  }

  /* ============================================================= GLIFI ===== */
  /* Disegni schematici al posto delle foto: niente immagini esterne. */
  var TRATTI = {
    cnc: '<rect x="14" y="58" width="92" height="10" rx="2"/><path d="M24 58V26h72v32"/><path d="M40 26v14h40V26"/>' +
         '<path d="M60 40v10"/><path d="M52 50h16l-8 8z"/><path d="M30 68v6M90 68v6"/>',
    stampante: '<rect x="20" y="14" width="80" height="54" rx="3"/><path d="M20 30h80"/><path d="M60 30v10"/>' +
         '<path d="M52 40h16v6H52z"/><path d="M60 46v6"/><rect x="40" y="52" width="40" height="8" rx="2"/>' +
         '<path d="M34 68v6M86 68v6"/>',
    laser: '<rect x="16" y="52" width="88" height="16" rx="3"/><path d="M60 14v18"/><path d="M52 32h16v8H52z"/>' +
         '<path d="M60 40v12" stroke-dasharray="3 3"/><circle cx="60" cy="60" r="6"/>' +
         '<path d="M30 60h14M76 60h14"/><path d="M24 46v-8h72v8"/>',
    /* pressa piegatrice: due montanti, la traversa che scende, la lamiera piegata */
    pressa: '<path d="M22 70V14h16v56M82 70V14h16v56"/><path d="M38 24h44"/><rect x="38" y="30" width="44" height="12" rx="2"/>' +
         '<path d="M60 42v8"/><path d="M46 58h28l-14-8z"/><path d="M30 70h60"/>',
    officina: '<rect x="12" y="46" width="96" height="8" rx="2"/><path d="M20 54v18M100 54v18"/>' +
         '<rect x="44" y="30" width="32" height="16" rx="2"/><path d="M52 30v-8h16v8"/>' +
         '<path d="M36 46h-8M92 46h8"/><path d="M60 22V10"/><path d="M54 14l6-6 6 6"/>',
    lab: '<rect x="16" y="18" width="52" height="50" rx="3"/><path d="M16 32h52"/><circle cx="30" cy="25" r="3"/>' +
         '<path d="M28 44h28v18H28z"/><path d="M82 22v14l-10 26h28L90 36V22z"/><path d="M78 22h16"/>' +
         '<path d="M76 52h24"/>',
    magazzino: '<path d="M14 68V16h92v52"/><path d="M14 34h92M14 51h92"/><path d="M40 16v52M80 16v52"/>' +
         '<rect x="18" y="38" width="18" height="11" rx="1"/><rect x="44" y="21" width="32" height="11" rx="1"/>' +
         '<rect x="84" y="55" width="18" height="11" rx="1"/><rect x="44" y="55" width="18" height="11" rx="1"/>',
    furgone: '<path d="M10 56V26h56v30"/><path d="M66 34h18l14 14v8H66z"/><path d="M70 38h12l8 8H70z"/>' +
         '<circle cx="32" cy="60" r="8"/><circle cx="84" cy="60" r="8"/><path d="M10 56h12M40 56h36"/>' +
         '<path d="M18 34h30"/>',
    muletto: '<path d="M28 58V32h30v26"/><path d="M58 40h12v18H58z"/><path d="M70 20v38"/><path d="M70 52h22"/>' +
         '<path d="M70 20h10"/><circle cx="38" cy="62" r="7"/><circle cx="62" cy="62" r="5"/>' +
         '<path d="M92 52v-6"/><rect x="76" y="40" width="16" height="12" rx="1"/>'
  };

  function glifo(nome, classe) {
    var tratto = TRATTI[nome] || TRATTI.officina;
    return '<svg viewBox="0 0 120 80" class="' + (classe || '') + '" role="img" aria-hidden="true" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'opacity=".75">' + tratto + '</svg>';
  }

  /* ==================================================== RUOLI E PAGINE ===== */
  /* Il mercato ha due lati: chi compra ferro usato e chi lo vende. Il menu
     cambia di conseguenza, perche' sono due prodotti che dividono un listino. */
  var RUOLI = {
    compratore: {
      nome: 'Compratore',
      altro: 'venditore',
      nota: 'Cerchi una macchina: sfogli il listino, prenoti una visione, fai la tua proposta.',
      pagine: [
        { href: 'index.html',    nome: 'Home',     icona: 'casa' },
        { href: 'catalogo.html', nome: 'Cerca',    icona: 'lente' },
        { href: 'acquisti.html', nome: 'Acquisti', icona: 'lista', bollo: 'acquisti' }
      ]
    },
    venditore: {
      nome: 'Venditore',
      altro: 'compratore',
      nota: 'Hai ferro da vendere: lo metti a listino e decidi quali proposte accettare.',
      pagine: [
        { href: 'index.html',    nome: 'Home',    icona: 'casa' },
        { href: 'console.html',  nome: 'Console', icona: 'cruscotto', bollo: 'offerte' },
        { href: 'pubblica.html', nome: 'Vendi',   icona: 'piu' }
      ]
    }
  };
  /* Aprire una pagina dell'altro lato cambia ruolo da sola: nessun vicolo cieco. */
  var RUOLO_DI = {
    'catalogo.html': 'compratore', 'acquisti.html': 'compratore', 'asset.html': 'compratore',
    'console.html': 'venditore', 'pubblica.html': 'venditore'
  };
  /* La scheda di una macchina sta sotto "Cerca": la voce resta accesa. */
  var TAB_DI = { 'asset.html': 'catalogo.html' };

  function ruoloCorrente() { return RUOLI[store.tutto().ruolo] ? store.tutto().ruolo : 'compratore'; }

  function bolli() {
    var s = store.tutto();
    return {
      acquisti: s.acquisti.filter(function (x) { return x.stato !== 'annullata'; }).length,
      offerte: s.offerteAperte || 0
    };
  }

  function cambiaLato(scelto) {
    store.aggiorna(function (st) { st.ruolo = scelto; });
    var casa = RUOLI[scelto].pagine[1];
    location.href = casa ? casa.href : 'index.html';
  }

  /* ========================================================== TESTATA ====== */
  function montaTestata(corrente) {
    var ruolo = ruoloCorrente();
    var n = bolli();

    var voci = RUOLI[ruolo].pagine.map(function (p) {
      var attiva = p.href === corrente ? ' aria-current="page"' : '';
      var b = p.bollo && n[p.bollo] ? '<span class="bollo">' + n[p.bollo] + '</span>' : '';
      return '<a href="' + p.href + '"' + attiva + '>' + esc(p.nome) + b + '</a>';
    }).join('');

    var lati = Object.keys(RUOLI).map(function (k) {
      return '<button class="lato__voce" type="button" data-lato="' + k + '" ' +
        'aria-pressed="' + (k === ruolo ? 'true' : 'false') + '">' + esc(RUOLI[k].nome) + '</button>';
    }).join('');

    var el = document.createElement('header');
    el.className = 'testata';
    el.innerHTML =
      '<div class="testata__corpo">' +
        '<a class="marchio" href="index.html">' +
          '<span class="marchio__segno" aria-hidden="true">F</span>FERMO' +
        '</a>' +
        '<nav class="menu" aria-label="Principale">' + voci + '</nav>' +
        '<div class="spinta"></div>' +
        '<div class="lato" role="group" aria-label="Cambia lato del mercato">' + lati + '</div>' +
        '<button class="chip solo-stretto" type="button" data-azione="scambia" ' +
          'aria-label="Stai navigando come ' + esc(RUOLI[ruolo].nome.toLowerCase()) +
          '. Tocca per passare al lato ' + esc(RUOLI[ruolo].altro) + '">' +
          esc(RUOLI[ruolo].nome) + icona('scambio') +
        '</button>' +
        '<button class="tondo" type="button" data-azione="menu" aria-label="Altre opzioni">' +
          icona('altro') + '</button>' +
      '</div>';
    document.body.insertBefore(el, document.body.firstChild);

    el.addEventListener('click', function (e) {
      var l = e.target.closest('[data-lato]');
      if (l) { cambiaLato(l.getAttribute('data-lato')); return; }
      if (e.target.closest('[data-azione="scambia"]')) { cambiaLato(RUOLI[ruolo].altro); return; }
      if (e.target.closest('[data-azione="menu"]')) apriMenu();
    });
  }

  /* Barra di navigazione in basso: il pollice arriva, il menu a tendina no. */
  function montaTab(corrente) {
    var ruolo = ruoloCorrente();
    var n = bolli();
    var el = document.createElement('nav');
    el.className = 'tab';
    el.setAttribute('aria-label', 'Navigazione principale');
    el.innerHTML = RUOLI[ruolo].pagine.map(function (p) {
      var attiva = p.href === corrente ? ' aria-current="page"' : '';
      var b = p.bollo && n[p.bollo]
        ? '<span class="tab__bollo">' + n[p.bollo] + '</span>' : '';
      return '<a class="tab__voce" href="' + p.href + '"' + attiva + '>' +
        icona(p.icona) + b + '<span>' + esc(p.nome) + '</span></a>';
    }).join('') +
      '<button class="tab__voce tab__voce--altro" type="button" data-lato="' + RUOLI[ruolo].altro + '">' +
        icona('scambio') + '<span>' + esc(RUOLI[RUOLI[ruolo].altro].nome) + '</span></button>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var l = e.target.closest('[data-lato]');
      if (l) cambiaLato(l.getAttribute('data-lato'));
    });
  }

  /* -------------------------------------------------------- menu «altro» -- */
  function apriMenu() {
    var scuro = temaScuro();
    var p = pannello({
      titolo: 'Opzioni',
      corpo:
        '<div class="pila pila--fitta">' +
          '<button class="btn btn--largo" type="button" data-m="tema">' +
            icona(scuro ? 'sole' : 'luna') + (scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro') + '</button>' +
          '<button class="btn btn--largo" type="button" data-m="guida">' +
            icona('info') + 'Che cosa posso provare</button>' +
          '<button class="btn btn--largo" type="button" data-m="azzera">' +
            icona('cestino') + 'Azzera i dati della demo</button>' +
        '</div>' +
        '<p class="piccolo fioco" style="margin-top:16px">' +
          'Prototipo dimostrativo: venditori, macchine e prezzi sono inventati. ' +
          'Quello che fai resta nel tuo browser.</p>'
    });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]');
      if (!b) return;
      var azione = b.getAttribute('data-m');
      if (azione === 'tema') {
        var prossimo = temaScuro() ? 'light' : 'dark';
        applicaTema(prossimo);
        store.aggiorna(function (s) { s.tema = prossimo; });
        p.close();
      }
      if (azione === 'guida') {
        p.close();
        if (global.FERMO_DEMO) global.FERMO_DEMO.apriGuida();
      }
      if (azione === 'azzera') {
        if (confirm('Cancello acquisti, preferiti e annunci salvati in questo browser?')) {
          store.azzera();
          location.reload();
        }
      }
    });
    apri(p);
  }

  /* ------------------------------------------------------------- pannelli - */
  /* Foglio che sale dal basso sul telefono, riquadro al centro sullo schermo
     grande. Un solo componente per filtri, opzioni e guida. */
  function pannello(opz) {
    var d = document.createElement('dialog');
    d.className = 'pannello';
    d.innerHTML =
      '<div class="pannello__testa">' + esc(opz.titolo) +
        '<button class="tondo spinta" type="button" data-chiudi aria-label="Chiudi">' +
          icona('chiudi') + '</button>' +
      '</div>' +
      '<div class="pannello__corpo">' + opz.corpo + '</div>' +
      (opz.piede ? '<div class="pannello__piede">' + opz.piede + '</div>' : '');
    document.body.appendChild(d);
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-chiudi]')) d.close();
    });
    d.addEventListener('close', function () {
      if (opz.effimero !== false) setTimeout(function () { d.remove(); }, 0);
    });
    return d;
  }
  function apri(d) {
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
  }

  /* ------------------------------------------------------------------ tema */
  function temaScuro() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function applicaTema(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }

  /* ====================================================== QUADRO SEDI ====== */
  /* Proiezione equirettangolare delle sedi reali. Nessun contorno disegnato:
     la sagoma esce dai punti, e cio' che non sappiamo non lo inventiamo. */
  function quadro(beni, opzioni) {
    opzioni = opzioni || {};
    var latMin = 37.4, latMax = 47.0, lonMin = 6.9, lonMax = 18.2;
    var kx = Math.cos(42 * Math.PI / 180);          /* compressione dei meridiani */
    var margine = 26;
    var Lint = (lonMax - lonMin) * kx, Aint = latMax - latMin;
    var scala = 44;
    var L = Lint * scala + margine * 2;
    var A = Aint * scala + margine * 2;

    var px = function (lon) { return margine + (lon - lonMin) * kx * scala; };
    var py = function (lat) { return margine + (latMax - lat) * scala; };

    /* raggruppo per citta': una sede, un punto, raggio per numero di macchine */
    var sedi = {};
    beni.forEach(function (b) {
      var c = D.coord(b.citta);
      if (!c) return;
      if (!sedi[b.citta]) sedi[b.citta] = { citta: b.citta, lat: c[0], lon: c[1], beni: [] };
      sedi[b.citta].beni.push(b);
    });
    var elenco = Object.keys(sedi).map(function (k) { return sedi[k]; });
    /* Raggio proporzionale all'area, non al raggio: e' l'area che l'occhio
       legge come quantita'. Restano piccoli, cosi' sedi vicine come Brescia e
       Lumezzane (12 km) non si coprono a vicenda. */
    var raggio = function (n) { return 4 + 2.6 * Math.sqrt(n - 1); };

    /* graticolato: paralleli e meridiani interi, filo sottile */
    var rete = '';
    for (var la = 38; la <= 46; la += 2) {
      rete += '<line class="rete" x1="' + margine + '" y1="' + py(la).toFixed(1) +
              '" x2="' + (L - margine) + '" y2="' + py(la).toFixed(1) + '"/>' +
              '<text class="rete__nome" x="4" y="' + (py(la) + 3).toFixed(1) + '">' + la + '°N</text>';
    }
    for (var lo = 8; lo <= 18; lo += 2) {
      rete += '<line class="rete" x1="' + px(lo).toFixed(1) + '" y1="' + margine +
              '" x2="' + px(lo).toFixed(1) + '" y2="' + (A - margine) + '"/>' +
              '<text class="rete__nome" x="' + px(lo).toFixed(1) + '" y="' + (A - 6) +
              '" text-anchor="middle">' + lo + '°E</text>';
    }

    /* Il nome si scrive solo dove c'è spazio: se un'altra sede sta a meno di
       30 px le etichette si accavallerebbero, e allora resta l'elenco accanto.
       È una regola che si adatta da sola ai filtri, non un elenco a mano. */
    function isolata(s) {
      return !elenco.some(function (o) {
        if (o === s) return false;
        var dx = px(o.lon) - px(s.lon), dy = py(o.lat) - py(s.lat);
        return Math.sqrt(dx * dx + dy * dy) < 30;
      });
    }

    /* I punti grandi si disegnano per primi: quelli piccoli restano sopra e
       quindi sempre raggiungibili col dito. L'elenco accanto al quadro resta
       comunque la via precisa per scegliere una sede qualsiasi. */
    var punti = elenco.sort(function (a, b) { return b.beni.length - a.beni.length; })
      .map(function (s) {
        var r = raggio(s.beni.length);
        var valore = s.beni.reduce(function (t, b) { return t + prezzoCorrente(b); }, 0);
        var etichetta = s.citta + ': ' + s.beni.length +
          (s.beni.length === 1 ? ' macchina' : ' macchine') + ', ' + fmt.euroTondo(valore) + ' a listino';
        var grande = isolata(s);
        return '<g class="sede" tabindex="0" role="button" data-citta="' + esc(s.citta) + '" ' +
            'aria-label="' + esc(etichetta) + '. Filtra il listino su questa città.">' +
          '<title>' + esc(etichetta) + '</title>' +
          '<circle class="sede__alone" cx="' + px(s.lon).toFixed(1) + '" cy="' + py(s.lat).toFixed(1) +
            '" r="' + (r + 5).toFixed(1) + '"/>' +
          '<circle class="sede__punto" cx="' + px(s.lon).toFixed(1) + '" cy="' + py(s.lat).toFixed(1) +
            '" r="' + r.toFixed(1) + '"/>' +
          (grande ? '<text class="sede__nome" x="' + (px(s.lon) + r + 4).toFixed(1) + '" y="' +
            (py(s.lat) + 3).toFixed(1) + '">' + esc(s.citta) + '</text>' : '') +
        '</g>';
      }).join('');

    return '<svg class="quadro" viewBox="0 0 ' + L.toFixed(0) + ' ' + A.toFixed(0) + '" ' +
      'role="img" aria-label="' + esc(opzioni.descrizione ||
        ('Quadro delle sedi: ' + elenco.length + ' città con macchine a listino')) + '">' +
      rete + punti + '</svg>';
  }

  /* ================================================ AVANZAMENTO PRATICA ==== */
  var TAPPE = [
    { id: 'inviata',   nome: 'Proposta inviata',      breve: 'Inviata' },
    { id: 'accettata', nome: 'Accettata dal venditore', breve: 'Accettata' },
    { id: 'deposito',  nome: 'Pagamento in deposito', breve: 'In deposito' },
    { id: 'ritiro',    nome: 'Ritiro concordato',     breve: 'Ritiro' },
    { id: 'conclusa',  nome: 'Conclusa',              breve: 'Conclusa' }
  ];
  function indiceTappa(stato) {
    for (var i = 0; i < TAPPE.length; i++) if (TAPPE[i].id === stato) return i;
    return 0;
  }
  function linea(stato) {
    if (stato === 'annullata') {
      return '<div class="avviso"><span>Percorso interrotto: la pratica è stata annullata.</span></div>';
    }
    var qui = indiceTappa(stato);
    return '<ol class="percorso">' + TAPPE.map(function (t, i) {
      var st = i < qui ? 'fatta' : i === qui ? 'qui' : 'attesa';
      return '<li class="percorso__tappa" data-stato="' + st + '">' +
        '<span class="percorso__bollo" aria-hidden="true">' + (i < qui ? '✓' : i + 1) + '</span>' +
        '<span>' + esc(t.breve) + '</span>' +
        (st === 'qui' ? '<span class="sr">(fase attuale)</span>' : '') +
      '</li>';
    }).join('') + '</ol>';
  }

  /* ========================================================= RECENSIONI ==== */
  function stelle(voto) {
    var pieno = Math.round(voto);
    var s = '';
    for (var i = 1; i <= 5; i++) s += i <= pieno ? '★' : '☆';
    return '<span class="stelle" aria-label="' + voto.toFixed(1) + ' su 5">' + s + '</span>';
  }

  function muroRecensioni(a) {
    var voci = D.recensioni(a);
    if (!voci.length) {
      return '<p class="tenue piccolo">Nessuna recensione: è un venditore appena iscritto.</p>';
    }
    return '<div class="pila pila--larga">' + voci.map(function (v) {
      return '<article class="recensione">' +
        '<div class="riga riga--fra">' +
          '<strong>' + esc(v.autore) + '</strong>' +
          '<span class="riga" style="gap:8px">' + stelle(v.voto) +
            '<span class="piccolo fioco num">' + fmt.data(v.quando) + '</span></span>' +
        '</div>' +
        '<p class="tenue" style="margin:6px 0 0">' + esc(v.testo) + '</p>' +
      '</article>';
    }).join('') + '</div>';
  }

  /* ============================================================== PIEDE ==== */
  function montaPiede() {
    var el = document.createElement('footer');
    el.className = 'piede';
    el.innerHTML =
      '<div class="piede__corpo">' +
        '<div>' +
          '<strong>FERMO</strong> — il mercato dei macchinari usati.<br>' +
          '<span class="fioco">Prototipo dimostrativo: dati inventati, nessun pagamento reale.</span>' +
        '</div>' +
        '<div class="riga" style="gap:14px">' +
          '<a href="catalogo.html">Listino</a>' +
          '<a href="pubblica.html">Vendi</a>' +
          '<a href="console.html">Console</a>' +
          '<a href="acquisti.html">Acquisti</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
  }

  /* ============================================================ AVVISI ===== */
  function brindisi(titolo, testo) {
    var box = document.querySelector('.brindisi');
    if (!box) {
      box = document.createElement('div');
      box.className = 'brindisi';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var v = document.createElement('div');
    v.className = 'brindisi__voce';
    v.innerHTML = '<b>' + esc(titolo) + '</b><span>' + esc(testo) + '</span>';
    box.appendChild(v);
    setTimeout(function () {
      v.style.transition = 'opacity .2s linear';
      v.style.opacity = '0';
      setTimeout(function () { v.remove(); }, 220);
    }, 4200);
  }

  /* ========================================================== PREFERITI ==== */
  function preferito(id) { return store.tutto().preferiti.indexOf(id) !== -1; }
  function commutaPreferito(id) {
    var dentro;
    store.aggiorna(function (s) {
      var i = s.preferiti.indexOf(id);
      if (i === -1) { s.preferiti.push(id); dentro = true; }
      else { s.preferiti.splice(i, 1); dentro = false; }
    });
    return dentro;
  }

  /* ============================================================ SCHEDA ===== */
  /* Sul telefono è una riga con la figura a sinistra; da tablet in su la
     stessa marcatura diventa una scheda in colonna. Un solo componente. */
  function scheda(a) {
    var cat = D.categoria(a.cat);
    var cond = D.condizione(a.condizione);
    var via = 'asset.html?id=' + encodeURIComponent(a.id);
    var sc = sconto(a);

    var segni = [];
    if (a.origine === 'utente') segni.push('<span class="pillola pillola--accento">Tuo annuncio</span>');
    if (inAsta(a)) {
      segni.push('<span class="pillola pillola--ambra">Asta · ' +
        (a.asta.scadeFra <= 1 ? 'ultimo giorno' : a.asta.scadeFra + ' giorni') + '</span>');
    } else if (a.mod.indexOf('fisso') === -1) {
      segni.push('<span class="pillola pillola--blu">Trattativa</span>');
    }
    segni.push('<span class="pillola">' + esc(cond.nome) + '</span>');
    if (a.pezzi > 1) segni.push('<span class="pillola">' + fmt.pezzi(a.pezzi) + '</span>');

    var sotto = inAsta(a)
      ? 'offerta più alta · ' + a.asta.offerte + (a.asta.offerte === 1 ? ' rilancio' : ' rilanci')
      : (sc != null && sc > 0.05 ? '−' + Math.round(sc * 100) + ' % dal nuovo' : 'IVA esclusa');

    return '' +
      '<article class="bene" data-id="' + esc(a.id) + '">' +
        '<div class="bene__fig">' + glifo(cat.glifo) + '</div>' +
        '<button class="bene__cuore" type="button" data-azione="preferito" ' +
          'aria-pressed="' + (preferito(a.id) ? 'true' : 'false') + '" ' +
          'aria-label="Salva ' + esc(a.titolo) + ' tra i preferiti">' + icona('cuore') + '</button>' +
        '<div class="bene__corpo">' +
          '<a class="bene__titolo" href="' + via + '">' + esc(a.titolo) + '</a>' +
          '<div class="bene__dove">' + esc(a.citta) + ' (' + esc(a.prov) + ') · ' +
            esc(cat.breve) + ' · ' + (a.anno || '—') + '</div>' +
          '<div class="riga" style="gap:6px">' + segni.join('') + '</div>' +
          '<div class="bene__prezzo">' + fmt.euroTondo(prezzoCorrente(a)) +
            ' <small>' + esc(sotto) + '</small></div>' +
        '</div>' +
      '</article>';
  }

  /* Vita residua dichiarata: il misuratore dice a colpo d'occhio se stai
     comprando una macchina rodata o un cantiere. */
  function livello(quota) {
    if (quota >= 0.75) return 'ottimo';
    if (quota >= 0.5) return 'buono';
    if (quota >= 0.25) return 'scarso';
    return 'critico';
  }

  function misuraCondizione(a) {
    var cond = D.condizione(a.condizione);
    var c = contatore(a);
    return '' +
      '<div class="metro">' +
        '<div class="metro__testa">' +
          '<span>Stato dichiarato</span>' +
          '<span class="num">' + esc(cond.nome) + (c ? ' · ' + esc(c) : '') + '</span>' +
        '</div>' +
        '<div class="metro__traccia" role="img" aria-label="Stato ' + esc(cond.nome) +
          ': vita residua stimata ' + fmt.pct(cond.quota) + '">' +
          '<div class="metro__pieno" data-livello="' + livello(cond.quota) + '" style="width:' +
            (cond.quota * 100).toFixed(1) + '%"></div>' +
        '</div>' +
        '<span class="campo__aiuto">' + esc(cond.nota) + '</span>' +
      '</div>';
  }

  /* ============================================================ GRAFICI ==== */
  /* Tetto della scala su una cifra tonda: 6.420 diventa 8.000, cosi' la tacca
     in alto non ripete il valore gia' scritto sulla colonna piu' alta. */
  var PASSI = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10];
  function arrotondaSu(v) {
    if (v <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var m = v / e;
    for (var i = 0; i < PASSI.length; i++) if (m <= PASSI[i]) return PASSI[i] * e;
    return 10 * e;
  }

  /* Colonne a serie singola: nessuna legenda (il titolo dice cosa e' tracciato),
     etichetta diretta solo sul massimo, scala in una corsia dedicata. */
  function colonne(dati, opzioni) {
    opzioni = opzioni || {};
    var L = 520, A = 180, base = A - 28, cima = 18;
    var corsia = 54;
    var n = dati.length;
    var passo = (L - corsia) / n;
    var spessore = Math.min(26, passo - 8);
    var max = Math.max.apply(null, dati.map(function (d) { return d.valore; })) || 1;
    var tetto = arrotondaSu(max);
    var scala = function (v) { return (v / tetto) * (base - cima); };
    var maxIdx = dati.reduce(function (best, d, i) { return d.valore > dati[best].valore ? i : best; }, 0);

    var barre = dati.map(function (d, i) {
      var h = Math.max(2, scala(d.valore));
      var x = corsia + i * passo + (passo - spessore) / 2;
      var y = base - h;
      var r = Math.min(5, spessore / 2, h);
      var p = 'M' + x + ' ' + base + ' V' + (y + r) +
              ' q0 ' + (-r) + ' ' + r + ' ' + (-r) +
              ' h' + (spessore - 2 * r) +
              ' q' + r + ' 0 ' + r + ' ' + r +
              ' V' + base + ' Z';
      var etichetta = (i === maxIdx || (opzioni.etichettaUltima && i === n - 1))
        ? '<text class="valore" x="' + (x + spessore / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' +
          esc(opzioni.formato ? opzioni.formato(d.valore) : d.valore) + '</text>'
        : '';
      return '<g><title>' + esc(d.nome + ': ' + (opzioni.formato ? opzioni.formato(d.valore) : d.valore)) + '</title>' +
             '<path class="colonna" d="' + p + '"/>' + etichetta + '</g>' +
             '<text x="' + (x + spessore / 2) + '" y="' + (base + 16) + '" text-anchor="middle">' + esc(d.nome) + '</text>';
    }).join('');

    /* Due sole tacche — il tetto e la meta' — per dare la scala ai valori
       che non hanno etichetta diretta. */
    var tacche = [1, 0.5].map(function (f) {
      var y = base - (base - cima) * f;
      var v = tetto * f;
      return '<line class="asse" x1="' + corsia + '" y1="' + y.toFixed(1) +
        '" x2="' + L + '" y2="' + y.toFixed(1) + '"/>' +
        '<text x="' + (corsia - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' +
        esc(opzioni.formato ? opzioni.formato(v) : v) + '</text>';
    }).join('');

    return '<svg class="grafico" viewBox="0 0 ' + L + ' ' + A + '" preserveAspectRatio="xMidYMid meet" ' +
      'role="img" aria-label="' + esc(opzioni.descrizione || 'Grafico a colonne') + '">' +
      tacche +
      '<line class="asse" x1="' + corsia + '" y1="' + base + '" x2="' + L + '" y2="' + base + '"/>' +
      barre + '</svg>';
  }

  /* Barre orizzontali: leggibili anche in una colonna stretta */
  function barre(dati, opzioni) {
    opzioni = opzioni || {};
    var max = Math.max.apply(null, dati.map(function (d) { return d.valore; })) || 1;
    return '<div class="pila">' + dati.map(function (d) {
      var pct = (d.valore / max) * 100;
      return '<div>' +
        '<div class="metro__testa">' +
          '<span>' + esc(d.nome) + '</span>' +
          '<span class="num">' + esc(opzioni.formato ? opzioni.formato(d.valore) : d.valore) + '</span>' +
        '</div>' +
        '<div class="metro__traccia" style="height:10px">' +
          '<div class="metro__pieno" style="width:' + pct.toFixed(1) + '%;background:' +
            (d.colore || 'var(--serie-1)') + '"></div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Tabella alternativa: ogni grafico ne ha una, apribile. Nessun dato solo-colore. */
  function tabellaDati(dati, intestazioni, opzioni) {
    opzioni = opzioni || {};
    return '<details class="apribile">' +
      '<summary>Vedi i dati in tabella</summary>' +
      '<div class="scorre" style="margin-top:10px"><table class="tabella">' +
      '<thead><tr><th>' + esc(intestazioni[0]) + '</th><th class="num">' + esc(intestazioni[1]) + '</th></tr></thead>' +
      '<tbody>' + dati.map(function (d) {
        return '<tr><td>' + esc(d.nome) + '</td><td class="num">' +
          esc(opzioni.formato ? opzioni.formato(d.valore) : d.valore) + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
  }

  /* ============================================================ ACQUISTO === */
  /* Il conto del compratore: il prezzo pattuito piu' i servizi che sceglie.
     La commissione non compare qui — la paga il venditore sul venduto. */
  function preventivo(a, importo, extra) {
    extra = extra || {};
    var perizia = extra.perizia ? D.PERIZIA : 0;
    var trasporto = extra.trasporto ? D.TRASPORTO : 0;
    var smontaggio = extra.smontaggio ? D.SMONTAGGIO : 0;
    var imponibile = importo + perizia + trasporto + smontaggio;
    var iva = imponibile * D.IVA;
    return {
      prezzo: importo,
      perizia: perizia,
      trasporto: trasporto,
      smontaggio: smontaggio,
      imponibile: imponibile,
      iva: iva,
      totale: imponibile + iva
    };
  }

  /* Quello che resta al venditore, tolta la commissione della piattaforma. */
  function nettoVenditore(importo) { return importo * (1 - D.COMMISSIONE); }

  function nuovoAcquisto(dati) {
    var codice = 'PRA-' + String(Date.now()).slice(-6);
    store.aggiorna(function (s) {
      s.acquisti.unshift(Object.assign({
        codice: codice,
        creata: new Date().toISOString(),
        stato: 'inviata'
      }, dati));
    });
    return codice;
  }

  /* ================================================================ VIA ==== */
  function param(nome) {
    return new URLSearchParams(location.search).get(nome);
  }

  function avvia(pagina) {
    /* la demo si popola prima di disegnare, così nessuna pagina parte vuota */
    if (global.FERMO_DEMO) global.FERMO_DEMO.semina();

    /* aprire una pagina dell'altro lato allinea il ruolo, invece di mostrare
       un menu che non contiene la pagina in cui ti trovi */
    var atteso = RUOLO_DI[pagina] || RUOLO_DI[location.pathname.split('/').pop()];
    if (atteso && store.tutto().ruolo !== atteso) {
      store.aggiorna(function (st) { st.ruolo = atteso; });
    }

    var s = store.tutto();
    applicaTema(s.tema);
    var acceso = TAB_DI[pagina] || pagina;
    montaTestata(acceso);
    montaPiede();
    montaTab(acceso);

    /* i preferiti si commutano ovunque compaia una scheda */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-azione="preferito"]');
      if (!b) return;
      var art = b.closest('[data-id]');
      if (!art) return;
      var dentro = commutaPreferito(art.getAttribute('data-id'));
      b.setAttribute('aria-pressed', dentro ? 'true' : 'false');
      brindisi(dentro ? 'Salvata' : 'Rimossa',
        dentro ? 'La ritrovi in Acquisti, sotto “Seguite”.' : 'Tolta dalle macchine seguite.');
      document.dispatchEvent(new CustomEvent('fermo:preferiti'));
    });

    if (global.FERMO_DEMO) global.FERMO_DEMO.primoAccesso();
  }

  /* Il tema si applica subito, prima del primo disegno, per evitare il lampo */
  (function preTema() {
    try {
      var s = JSON.parse(localStorage.getItem(CHIAVE) || '{}');
      if (s.tema) document.documentElement.setAttribute('data-theme', s.tema);
    } catch (e) {}
  })();

  global.FERMO = {
    D: D,
    store: store,
    catalogo: catalogo,
    trova: trova,
    fmt: fmt,
    esc: esc,
    icona: icona,
    glifo: glifo,
    scheda: scheda,
    misuraCondizione: misuraCondizione,
    livello: livello,
    prezzoCorrente: prezzoCorrente,
    offertaCorrente: offertaCorrente,
    inAsta: inAsta,
    sconto: sconto,
    eta: eta,
    colonne: colonne,
    barre: barre,
    tabellaDati: tabellaDati,
    quadro: quadro,
    linea: linea,
    TAPPE: TAPPE,
    stelle: stelle,
    muroRecensioni: muroRecensioni,
    ruoloCorrente: ruoloCorrente,
    RUOLI: RUOLI,
    pannello: pannello,
    apri: apri,
    preventivo: preventivo,
    nettoVenditore: nettoVenditore,
    nuovoAcquisto: nuovoAcquisto,
    preferito: preferito,
    brindisi: brindisi,
    param: param,
    avvia: avvia
  };
})(window);
