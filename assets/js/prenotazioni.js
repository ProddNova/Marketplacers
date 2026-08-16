/* =============================================================================
   FERMO — lato domanda: richieste inviate e beni salvati
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('prenotazioni.html');

  var g = function (id) { return document.getElementById(id); };

  var STATI = {
    'in-attesa': { testo: 'In attesa di conferma', timbro: 'timbro--hivis',
                   nota: 'Il fornitore ha 24 ore per rispondere. L\'importo non è ancora addebitato.' },
    'confermata': { testo: 'Confermata', timbro: 'timbro--verde',
                    nota: 'Importo vincolato: viene liberato al fornitore a lavoro consegnato.' },
    'lavorazione': { testo: 'In lavorazione', timbro: 'timbro--blu',
                     nota: 'Il fornitore ha preso in carico il lavoro. Aggiornamenti nella conversazione.' },
    'consegnata': { testo: 'Consegnata', timbro: 'timbro--verde',
                    nota: 'Hai cinque giorni lavorativi per contestare, poi l\'importo viene saldato.' },
    'pagata': { testo: 'Saldata', timbro: 'timbro--verde',
                nota: 'Pratica chiusa. Puoi lasciare una valutazione al fornitore.' },
    'annullata': { testo: 'Annullata', timbro: 'timbro--tenue',
                   nota: 'Nessun addebito.' }
  };

  /* risposte pronte del fornitore, così la conversazione risponde davvero */
  var RISPOSTE = [
    'Ricevuto, controlliamo in reparto e le confermiamo entro fine giornata.',
    'Va bene. Le mando conferma appena il programma è in macchina.',
    'Possiamo fare, ma servirebbe un giorno in più: le va bene?',
    'Perfetto, procediamo così. Grazie per la precisione dei dati.'
  ];

  function disegnaPrenotazioni() {
    var p = FERMO.store.tutto().prenotazioni;
    var box = g('lista-prenotazioni');

    if (!p.length) {
      g('riepilogo').textContent = 'nessuna richiesta';
      box.innerHTML =
        '<div class="vuoto">' +
          '<div class="cifra" style="color:var(--filo)">∅</div>' +
          '<p style="margin-top:12px"><strong>Non hai ancora prenotato niente.</strong></p>' +
          '<p class="piccolo">Apri una scheda, scegli il giorno di inizio e la quantità: ' +
            'la richiesta compare qui.</p>' +
          '<a class="bottone bottone--primario" href="catalogo.html">Vai al catalogo →</a>' +
        '</div>';
      return;
    }

    var attive = p.filter(function (x) { return x.stato !== 'annullata'; });
    var somma = attive.reduce(function (t, x) { return t + x.totale; }, 0);
    g('riepilogo').textContent = attive.length + ' attive · ' + FERMO.fmt.euroTondo(somma);

    box.innerHTML = '<div class="pila">' + p.map(function (x, i) {
      var st = STATI[x.stato] || STATI['in-attesa'];
      var quando = x.inizio
        ? FERMO.fmt.data(new Date(x.inizio)) +
          (x.fine && x.fine !== x.inizio ? ' → ' + FERMO.fmt.data(new Date(x.fine)) : '')
        : 'da concordare';

      return '<article class="blocco">' +
        '<div class="blocco__testa">' +
          '<span class="numerico">' + FERMO.esc(x.codice) + '</span>' +
          '<span class="timbro ' + st.timbro + '">' + st.testo + '</span>' +
          '<span class="spinta piccolo tenue">' +
            (x.tipo === 'offerta' ? 'Proposta d\'acquisto' : 'Prenotazione') + ' · ' +
            FERMO.fmt.data(new Date(x.creata)) + '</span>' +
        '</div>' +
        '<div class="blocco__corpo">' +
          '<div class="riga riga--fra" style="align-items:flex-start">' +
            '<div style="max-width:52ch">' +
              '<a href="asset.html?id=' + encodeURIComponent(x.assetId) + '"><strong>' +
                FERMO.esc(x.titolo) + '</strong></a>' +
              '<div class="piccolo tenue" style="margin-top:4px">' +
                FERMO.esc(x.fornitore) + ' · ' + FERMO.esc(x.citta) + '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<div class="cifra cifra--media numerico">' + FERMO.fmt.euro(x.totale) + '</div>' +
              '<div class="piccolo tenue">IVA inclusa</div>' +
            '</div>' +
          '</div>' +

          '<div class="griglia-4" style="margin-top:18px;border-top:1px solid var(--filo);padding-top:14px">' +
            campo('Quando', quando) +
            campo('Quantità', x.tipo === 'offerta' ? FERMO.fmt.euroTondo(x.quantita) :
              FERMO.fmt.conta(x.quantita, x.unita)) +
            campo('Modalità', FERMO.D.modalita(x.modalita).nome) +
            campo('Stato', st.testo) +
          '</div>' +

          '<div style="margin-top:16px">' + FERMO.linea(x.stato) + '</div>' +

          '<p class="campo__aiuto" style="margin-top:12px">' + st.nota + '</p>' +

          conversazione(x, i) +

          (x.stato === 'annullata' ? '' :
          '<div class="riga" style="margin-top:14px;border-top:1px solid var(--filo);padding-top:14px">' +
            (avanzabile(x.stato) ?
              '<button class="bottone bottone--piccolo bottone--primario" data-azione="avanza" data-i="' + i + '">' +
              esc(prossimaTappa(x.stato)) + ' →</button>' : '') +
            '<button class="bottone bottone--piccolo bottone--nudo" data-azione="annulla" data-i="' + i + '">' +
            'Annulla</button>' +
            '<span class="piccolo tenue spinta">Nella demo avanzi tu il percorso al posto del fornitore.</span>' +
          '</div>') +
        '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function campo(k, v) {
    return '<div><div class="etichetta">' + FERMO.esc(k) + '</div>' +
      '<div class="numerico" style="font-size:13px">' + FERMO.esc(v) + '</div></div>';
  }
  function esc(s) { return FERMO.esc(s); }

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
  function conversazione(x, i) {
    var fili = FERMO.store.tutto().messaggi || {};
    var voci = fili[x.codice] || [];
    return '<details class="filo-guscio" style="margin-top:16px" ' +
      (x.stato === 'in-attesa' || voci.length > 2 ? 'open' : '') + '>' +
      '<summary style="cursor:pointer;font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:700">' +
        'Conversazione col fornitore' +
        (voci.length ? ' <span class="tenue">(' + voci.length + ')</span>' : ' <span class="tenue">(nessun messaggio)</span>') +
      '</summary>' +
      '<div class="filo" style="margin-top:14px">' +
        (voci.length ? voci.map(function (m) {
          return '<div class="messaggio" data-da="' + m.da + '">' +
            '<div class="messaggio__testa">' +
              (m.da === 'cliente' ? 'Tu' : esc(x.fornitore)) + ' · ' +
              FERMO.fmt.data(new Date(m.quando)) +
            '</div>' +
            '<div class="messaggio__corpo">' + esc(m.testo) + '</div>' +
          '</div>';
        }).join('') : '<p class="tenue piccolo">Nessun messaggio su questa richiesta.</p>') +
      '</div>' +
      (x.stato === 'annullata' ? '' :
      '<form class="riga" data-invia="' + i + '" style="margin-top:14px;flex-wrap:nowrap;gap:8px">' +
        '<label class="solo-lettori" for="msg-' + i + '">Scrivi al fornitore</label>' +
        '<input type="text" id="msg-' + i + '" placeholder="Scrivi al fornitore…" ' +
          'autocomplete="off" style="flex:1">' +
        '<button class="bottone bottone--piccolo" type="submit">Invia</button>' +
      '</form>') +
    '</details>';
  }

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
      'confermata': ['Richiesta confermata', 'Importo vincolato fino alla consegna.'],
      'lavorazione': ['Lavoro in corso', 'Il fornitore ha preso in carico la commessa.'],
      'consegnata': ['Consegnata', 'Hai cinque giorni lavorativi per contestare.'],
      'pagata': ['Saldata', 'Pratica chiusa: l\'importo è stato liberato al fornitore.'],
      'annullata': ['Richiesta annullata', 'Nessun addebito, la capacità torna disponibile.']
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
    disegnaPrenotazioni();

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
      '<div class="vuoto"><p><strong>Nessun bene salvato.</strong></p>' +
      '<p class="piccolo">Il pulsante ★ su ogni scheda tiene da parte quello che ti serve.</p></div>';
  }

  document.addEventListener('fermo:preferiti', disegnaPreferiti);

  disegnaPrenotazioni();
  disegnaPreferiti();
})();
