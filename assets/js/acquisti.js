/* =============================================================================
   FERMO — lato domanda: pratiche di acquisto e macchine seguite
   Ogni pratica è una carta: stato in alto, percorso in mezzo, conversazione
   richiudibile in fondo. Sul telefono non c'è niente da far scorrere di lato.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('acquisti.html');

  var g = function (id) { return document.getElementById(id); };
  var esc = FERMO.esc;

  var STATI = {
    'inviata':   { testo: 'In attesa di risposta', pillola: 'pillola--ambra',
                   nota: 'Il venditore ha 48 ore per rispondere. Nessun addebito per ora.' },
    'accettata': { testo: 'Accettata', pillola: 'pillola--verde',
                   nota: 'Prezzo bloccato: il passo successivo è il versamento in deposito.' },
    'deposito':  { testo: 'Pagamento in deposito', pillola: 'pillola--blu',
                   nota: 'L\'importo è vincolato e si libera al venditore quando la macchina è caricata.' },
    'ritiro':    { testo: 'Ritiro concordato', pillola: 'pillola--blu',
                   nota: 'Data e mezzi concordati. Controlla la macchina prima di firmare il carico.' },
    'conclusa':  { testo: 'Conclusa', pillola: 'pillola--verde',
                   nota: 'Pratica chiusa. Puoi lasciare una valutazione al venditore.' },
    'annullata': { testo: 'Annullata', pillola: '',
                   nota: 'Nessun addebito.' }
  };

  var TIPI = {
    acquisto: 'Acquisto al prezzo esposto',
    proposta: 'Proposta di acquisto',
    rilancio: 'Rilancio in asta'
  };

  /* risposte pronte del venditore, così la conversazione risponde davvero */
  var RISPOSTE = [
    'Ricevuto, controlliamo in officina e le rispondiamo entro fine giornata.',
    'Va bene: le prepariamo il contratto e le mandiamo le foto del carico.',
    'Possiamo fare, ma il ritiro slitta di una settimana: le va bene?',
    'Le confermiamo che i documenti e il libretto delle manutenzioni ci sono tutti.'
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
      : (x.stato === 'inviata' || voci.length > 2);
    return '<details class="apribile" data-filo="' + esc(x.codice) + '"' + (aperta ? ' open' : '') + '>' +
      '<summary>Conversazione col venditore' +
        (voci.length ? ' (' + voci.length + ')' : ' — nessun messaggio') + '</summary>' +
      '<div class="filo" style="margin-top:14px">' +
        (voci.length ? voci.map(function (m) {
          return '<div class="messaggio" data-da="' + m.da + '">' +
            '<div class="messaggio__testa">' +
              (m.da === 'compratore' ? 'Tu' : esc(x.venditore)) + ' · ' +
              FERMO.fmt.data(new Date(m.quando)) +
            '</div>' +
            '<div class="messaggio__corpo">' + esc(m.testo) + '</div>' +
          '</div>';
        }).join('') : '<p class="piccolo fioco">Nessun messaggio su questa pratica.</p>') +
      '</div>' +
      (x.stato === 'annullata' ? '' :
      '<form class="riga riga--stretta" data-invia="' + i + '" style="margin-top:14px;gap:8px">' +
        '<label class="sr" for="msg-' + i + '">Scrivi al venditore</label>' +
        '<input type="text" id="msg-' + i + '" placeholder="Scrivi al venditore…" ' +
          'autocomplete="off" style="flex:1">' +
        '<button class="btn btn--piccolo" type="submit">Invia</button>' +
      '</form>') +
    '</details>';
  }

  /* ---------------------------------------------------------- pratiche --- */
  function disegnaPratiche() {
    var p = FERMO.store.tutto().acquisti;
    var box = g('lista-pratiche');

    if (!p.length) {
      g('riepilogo').textContent = 'Nessuna pratica aperta';
      box.innerHTML =
        '<div class="vuoto">' +
          '<h3>Non hai ancora comprato niente</h3>' +
          '<p class="piccolo">Apri una scheda, prenota una visione e fai la tua proposta: ' +
            'la pratica compare qui.</p>' +
          '<a class="btn btn--primario" href="catalogo.html" style="margin-top:14px">Vai al listino</a>' +
        '</div>';
      return;
    }

    var attive = p.filter(function (x) { return x.stato !== 'annullata'; });
    var somma = attive.reduce(function (t, x) { return t + x.totale; }, 0);
    g('riepilogo').textContent = attive.length + ' pratiche attive · ' +
      FERMO.fmt.euroTondo(somma) + ' impegnati';

    box.innerHTML = p.map(function (x, i) {
      var st = STATI[x.stato] || STATI['inviata'];
      var visita = x.visita ? FERMO.fmt.data(new Date(x.visita)) : 'non prenotata';

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
                esc(x.venditore) + ' · ' + esc(x.citta) + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex:none">' +
              '<div class="grassetto num" style="font-size:18px">' + FERMO.fmt.euroTondo(x.totale) + '</div>' +
              '<div class="piccolo fioco">IVA e servizi inclusi</div>' +
            '</div>' +
          '</div>' +

          '<div class="griglia griglia--2" style="margin-top:16px;gap:12px">' +
            fatto('Importo pattuito', FERMO.fmt.euroTondo(x.importo)) +
            fatto('Visione in sede', visita) +
            fatto('Come', TIPI[x.tipo] || FERMO.D.formula(x.formula).nome) +
            fatto('Aperta il', FERMO.fmt.data(new Date(x.creata))) +
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
    if (azione === 'annulla' && !confirm('Annullo questa pratica?')) return;

    var nuovo;
    FERMO.store.aggiorna(function (s) {
      var p = s.acquisti[i];
      if (!p) return;
      p.stato = azione === 'annulla' ? 'annullata' : idProssima(p.stato);
      nuovo = p.stato;
    });
    var messaggi = {
      'accettata': ['Proposta accettata', 'Il venditore ha bloccato il prezzo per te.'],
      'deposito':  ['Importo in deposito', 'Si libera al venditore quando la macchina è caricata.'],
      'ritiro':    ['Ritiro concordato', 'Controlla la macchina prima di firmare il documento di carico.'],
      'conclusa':  ['Pratica conclusa', 'Importo liberato al venditore. Puoi lasciare una valutazione.'],
      'annullata': ['Pratica annullata', 'Nessun addebito, la macchina torna a listino.']
    };
    var m = messaggi[nuovo] || ['Aggiornata', 'Stato della pratica aggiornato.'];
    FERMO.brindisi(m[0], m[1]);
    disegnaPratiche();
  });

  /* invio di un messaggio: il venditore risponde dopo un attimo, così si
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
      var p = s.acquisti[i];
      if (!p) return;
      codice = p.codice;
      s.messaggi = s.messaggi || {};
      s.messaggi[codice] = s.messaggi[codice] || [];
      s.messaggi[codice].push({ da: 'compratore', testo: testo, quando: new Date().toISOString() });
    });
    campo.value = '';
    apertaFilo[codice] = true;
    disegnaPratiche();
    /* si continua a scrivere da dove si era: il ridisegno non ruba il cursore */
    var dinuovo = g('msg-' + i);
    if (dinuovo) dinuovo.focus();

    setTimeout(function () {
      var r = RISPOSTE[Math.floor(Math.random() * RISPOSTE.length)];
      FERMO.store.aggiorna(function (s) {
        if (!s.messaggi[codice]) return;
        s.messaggi[codice].push({ da: 'venditore', testo: r, quando: new Date().toISOString() });
      });
      FERMO.brindisi('Nuovo messaggio', 'Il venditore ha risposto sulla pratica ' + codice + '.');
      disegnaPratiche();
    }, 1400);
  });

  /* ------------------------------------------------------------ preferiti */
  function disegnaPreferiti() {
    var ids = FERMO.store.tutto().preferiti;
    var beni = ids.map(FERMO.trova).filter(Boolean);
    g('conteggio-preferiti').textContent = beni.length +
      (beni.length === 1 ? ' macchina' : ' macchine');
    g('lista-preferiti').innerHTML = beni.map(FERMO.scheda).join('');
    g('preferiti-vuoti').innerHTML = beni.length ? '' :
      '<div class="vuoto"><h3>Non stai seguendo niente</h3>' +
      '<p class="piccolo">Il cuore su ogni scheda tiene da parte le macchine che ti interessano.</p></div>';
  }

  document.addEventListener('fermo:preferiti', disegnaPreferiti);

  disegnaPratiche();
  disegnaPreferiti();
})();
