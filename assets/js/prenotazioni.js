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
    'annullata': { testo: 'Annullata', timbro: 'timbro--tenue',
                   nota: 'Nessun addebito.' }
  };

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

          '<p class="campo__aiuto" style="margin-top:12px">' + st.nota + '</p>' +

          (x.stato === 'annullata' ? '' :
          '<div class="riga" style="margin-top:14px">' +
            (x.stato === 'in-attesa' ?
              '<button class="bottone bottone--piccolo bottone--primario" data-azione="conferma" data-i="' + i + '">' +
              'Simula conferma del fornitore</button>' : '') +
            '<button class="bottone bottone--piccolo bottone--nudo" data-azione="annulla" data-i="' + i + '">' +
            'Annulla</button>' +
          '</div>') +
        '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function campo(k, v) {
    return '<div><div class="etichetta">' + FERMO.esc(k) + '</div>' +
      '<div class="numerico" style="font-size:13px">' + FERMO.esc(v) + '</div></div>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-azione="annulla"], [data-azione="conferma"]');
    if (!b) return;
    var i = parseInt(b.getAttribute('data-i'), 10);
    var azione = b.getAttribute('data-azione');
    if (azione === 'annulla' && !confirm('Annullo questa richiesta?')) return;
    FERMO.store.aggiorna(function (s) {
      if (s.prenotazioni[i]) s.prenotazioni[i].stato = azione === 'annulla' ? 'annullata' : 'confermata';
    });
    FERMO.brindisi(azione === 'annulla' ? 'Richiesta annullata' : 'Richiesta confermata',
      azione === 'annulla' ? 'Nessun addebito, la capacità torna disponibile.'
                           : 'Il fornitore ha accettato: importo vincolato fino alla consegna.');
    disegnaPrenotazioni();
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
