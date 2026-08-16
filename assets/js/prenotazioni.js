/* =============================================================================
   FERMO — lato domanda: richieste inviate e beni salvati
   Ogni richiesta è una carta: stato in alto, percorso in mezzo, conversazione
   richiudibile in fondo. Sul telefono non c'è niente da far scorrere di lato.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('prenotazioni.html');

  var g = function (id) { return document.getElementById(id); };
  var esc = FERMO.esc;

  var STATI = {
    'in-attesa':   { testo: 'In attesa di conferma', pillola: 'pillola--ambra',
                     nota: 'Il fornitore ha 24 ore per rispondere. Nessun addebito per ora.' },
    'confermata':  { testo: 'Confermata', pillola: 'pillola--verde',
                     nota: 'Importo vincolato: si libera al fornitore a lavoro consegnato.' },
    'lavorazione': { testo: 'In lavorazione', pillola: 'pillola--blu',
                     nota: 'Il fornitore ha preso in carico il lavoro.' },
    'consegnata':  { testo: 'Consegnata', pillola: 'pillola--verde',
                     nota: 'Hai cinque giorni lavorativi per contestare, poi si salda.' },
    'pagata':      { testo: 'Saldata', pillola: 'pillola--verde',
                     nota: 'Pratica chiusa. Puoi lasciare una valutazione al fornitore.' },
    'annullata':   { testo: 'Annullata', pillola: '',
                     nota: 'Nessun addebito.' }
  };

  /* risposte pronte del fornitore, così la conversazione risponde davvero */
  var RISPOSTE = [
    'Ricevuto, controlliamo in reparto e le confermiamo entro fine giornata.',
    'Va bene. Le mando conferma appena il programma è in macchina.',
    'Possiamo fare, ma servirebbe un giorno in più: le va bene?',
    'Perfetto, procediamo così. Grazie per la precisione dei dati.'
  ];

  function fatto(k, v) {
    return '<div><div class="piccolo fioco">' + esc(k) + '</div>' +
      '<div class="grassetto piccolo num">' + esc(v) + '</div></div>';
  }

  /* ------------------------------------------------------- avanzamento --- */
  function avanzabile(stato) {
    var i = FERMO.TAPPE.findIndex(function (t) { return t.id === stato; });
    return i > -1 && i < FERMO.TAPPE.length - 1;
  }
  function prossimaTappa(stato) {
    var i = FERMO.TAPPE.findIndex(function (t) { return t.id === stato; });
    return i > -1 && i < FERMO.TAPPE.length - 1 ? FERMO.TAPPE[i + 1].nome : '';
  }
  function idProssima(stato) {
    var i = FERMO.TAPPE.findIndex(function (t) { return t.id === stato; });
    return i > -1 && i < FERMO.TAPPE.length - 1 ? FERMO.TAPPE[i + 1].id : stato;
  }

  /* ------------------------------------------------------ conversazione --- */
  /* La pagina si ridisegna a ogni azione: senza memoria, un filo aperto a mano
     si richiuderebbe proprio mentre ci stai scrivendo dentro. */
  var apertaFilo = {};

  function conversazione(x, i) {
    var fili = FERMO.store.tutto().messaggi || {};
    var voci = fili[x.codice] || [];
    var aperta = apertaFilo[x.codice] !== undefined
      ? apertaFilo[x.codice]
      : (x.stato === 'in-attesa' || voci.length > 2);
    return '<details class="apribile" data-filo="' + esc(x.codice) + '"' + (aperta ? ' open' : '') + '>' +
      '<summary>Conversazione col fornitore' +
        (voci.length ? ' (' + voci.length + ')' : ' — nessun messaggio') + '</summary>' +
      '<div class="filo" style="margin-top:14px">' +
        (voci.length ? voci.map(function (m) {
          return '<div class="messaggio" data-da="' + m.da + '">' +
            '<div class="messaggio__testa">' +
              (m.da === 'cliente' ? 'Tu' : esc(x.fornitore)) + ' · ' +
              FERMO.fmt.data(new Date(m.quando)) +
            '</div>' +
            '<div class="messaggio__corpo">' + esc(m.testo) + '</div>' +
          '</div>';
        }).join('') : '<p class="piccolo fioco">Nessun messaggio su questa richiesta.</p>') +
      '</div>' +
      (x.stato === 'annullata' ? '' :
      '<form class="riga riga--stretta" data-invia="' + i + '" style="margin-top:14px;gap:8px">' +
        '<label class="sr" for="msg-' + i + '">Scrivi al fornitore</label>' +
        '<input type="text" id="msg-' + i + '" placeholder="Scrivi al fornitore…" ' +
          'autocomplete="off" style="flex:1">' +
        '<button class="btn btn--piccolo" type="submit">Invia</button>' +
      '</form>') +
    '</details>';
  }

  /* --------------------------------------------------------- richieste --- */
  function disegnaPrenotazioni() {
    var p = FERMO.store.tutto().prenotazioni;
    var box = g('lista-prenotazioni');

    if (!p.length) {
      g('riepilogo').textContent = 'Nessuna richiesta';
      box.innerHTML =
        '<div class="vuoto">' +
          '<h3>Non hai ancora prenotato niente</h3>' +
          '<p class="piccolo">Apri una scheda, scegli il giorno e la quantità: ' +
            'la richiesta compare qui.</p>' +
          '<a class="btn btn--primario" href="catalogo.html" style="margin-top:14px">Vai al catalogo</a>' +
        '</div>';
      return;
    }

    var attive = p.filter(function (x) { return x.stato !== 'annullata'; });
    var somma = attive.reduce(function (t, x) { return t + x.totale; }, 0);
    g('riepilogo').textContent = attive.length + ' attive · ' + FERMO.fmt.euroTondo(somma) + ' impegnati';

    box.innerHTML = p.map(function (x, i) {
      var st = STATI[x.stato] || STATI['in-attesa'];
      var quando = x.inizio
        ? FERMO.fmt.data(new Date(x.inizio)) +
          (x.fine && x.fine !== x.inizio ? ' → ' + FERMO.fmt.data(new Date(x.fine)) : '')
        : 'da concordare';

      return '<article class="carta">' +
        '<div class="carta__testa">' +
          '<span class="codice">' + esc(x.codice) + '</span>' +
          '<span class="spinta pillola ' + st.pillola + '">' + st.testo + '</span>' +
        '</div>' +
        '<div class="carta__corpo">' +

          '<div class="riga riga--fra" style="align-items:flex-start;gap:14px">' +
            '<div style="min-width:0">' +
              '<a href="asset.html?id=' + encodeURIComponent(x.assetId) + '" class="grassetto tocco">' +
                esc(x.titolo) + '</a>' +
              '<div class="piccolo tenue" style="margin-top:4px">' +
                esc(x.fornitore) + ' · ' + esc(x.citta) + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex:none">' +
              '<div class="grassetto num" style="font-size:18px">' + FERMO.fmt.euro(x.totale) + '</div>' +
              '<div class="piccolo fioco">IVA inclusa</div>' +
            '</div>' +
          '</div>' +

          '<div class="griglia griglia--2" style="margin-top:16px;gap:12px">' +
            fatto('Quando', quando) +
            fatto('Quantità', x.tipo === 'offerta' ? FERMO.fmt.euroTondo(x.quantita) :
              FERMO.fmt.conta(x.quantita, x.unita)) +
            fatto('Modalità', FERMO.D.modalita(x.modalita).nome) +
            fatto('Richiesta il', FERMO.fmt.data(new Date(x.creata))) +
          '</div>' +

          '<div style="margin-top:20px">' + FERMO.linea(x.stato) + '</div>' +
          '<p class="campo__aiuto">' + st.nota + '</p>' +

          conversazione(x, i) +

          (x.stato === 'annullata' ? '' :
          '<div class="riga" style="margin-top:14px;gap:8px">' +
            (avanzabile(x.stato) ?
              '<button class="btn btn--piccolo btn--primario" data-azione="avanza" data-i="' + i + '">' +
              esc(prossimaTappa(x.stato)) + '</button>' : '') +
            '<button class="btn btn--piccolo" data-azione="annulla" data-i="' + i + '">Annulla</button>' +
            '<span class="piccolo fioco spinta">Nella demo il percorso lo avanzi tu.</span>' +
          '</div>') +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* l'evento «toggle» non risale: si ascolta in cattura */
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.tagName === 'DETAILS' && d.hasAttribute('data-filo')) {
      apertaFilo[d.getAttribute('data-filo')] = d.open;
    }
  }, true);

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-azione="annulla"], [data-azione="avanza"]');
    if (!b) return;
    var i = parseInt(b.getAttribute('data-i'), 10);
    var azione = b.getAttribute('data-azione');
    if (azione === 'annulla' && !confirm('Annullo questa richiesta?')) return;

    var nuovo;
    FERMO.store.aggiorna(function (s) {
      var p = s.prenotazioni[i];
      if (!p) return;
      p.stato = azione === 'annulla' ? 'annullata' : idProssima(p.stato);
      nuovo = p.stato;
    });
    var messaggi = {
      'confermata':  ['Richiesta confermata', 'Importo vincolato fino alla consegna.'],
      'lavorazione': ['Lavoro in corso', 'Il fornitore ha preso in carico la commessa.'],
      'consegnata':  ['Consegnata', 'Hai cinque giorni lavorativi per contestare.'],
      'pagata':      ['Saldata', 'Pratica chiusa: l\'importo è stato liberato al fornitore.'],
      'annullata':   ['Richiesta annullata', 'Nessun addebito, la capacità torna disponibile.']
    };
    var m = messaggi[nuovo] || ['Aggiornata', 'Stato della richiesta aggiornato.'];
    FERMO.brindisi(m[0], m[1]);
    disegnaPrenotazioni();
  });

  /* invio di un messaggio: il fornitore risponde dopo un attimo, così si
     vede che il filo è vivo senza far finta che ci sia un backend */
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-invia]');
    if (!f) return;
    e.preventDefault();
    var i = parseInt(f.getAttribute('data-invia'), 10);
    var campo = f.querySelector('input');
    var testo = campo.value.trim();
    if (!testo) return;

    var codice;
    FERMO.store.aggiorna(function (s) {
      var p = s.prenotazioni[i];
      if (!p) return;
      codice = p.codice;
      s.messaggi = s.messaggi || {};
      s.messaggi[codice] = s.messaggi[codice] || [];
      s.messaggi[codice].push({ da: 'cliente', testo: testo, quando: new Date().toISOString() });
    });
    campo.value = '';
    apertaFilo[codice] = true;
    disegnaPrenotazioni();
    /* si continua a scrivere da dove si era: il ridisegno non ruba il cursore */
    var dinuovo = g('msg-' + i);
    if (dinuovo) dinuovo.focus();

    setTimeout(function () {
      var r = RISPOSTE[Math.floor(Math.random() * RISPOSTE.length)];
      FERMO.store.aggiorna(function (s) {
        if (!s.messaggi[codice]) return;
        s.messaggi[codice].push({ da: 'fornitore', testo: r, quando: new Date().toISOString() });
      });
      FERMO.brindisi('Nuovo messaggio', 'Il fornitore ha risposto sulla richiesta ' + codice + '.');
      disegnaPrenotazioni();
    }, 1400);
  });

  /* ------------------------------------------------------------ preferiti */
  function disegnaPreferiti() {
    var ids = FERMO.store.tutto().preferiti;
    var beni = ids.map(FERMO.trova).filter(Boolean);
    g('conteggio-preferiti').textContent = beni.length + (beni.length === 1 ? ' bene' : ' beni');
    g('lista-preferiti').innerHTML = beni.map(FERMO.scheda).join('');
    g('preferiti-vuoti').innerHTML = beni.length ? '' :
      '<div class="vuoto"><h3>Nessun bene salvato</h3>' +
      '<p class="piccolo">Il cuore su ogni scheda tiene da parte quello che ti serve.</p></div>';
  }

  document.addEventListener('fermo:preferiti', disegnaPreferiti);

  disegnaPrenotazioni();
  disegnaPreferiti();
})();
