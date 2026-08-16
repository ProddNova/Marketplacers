/* =============================================================================
   FERMO — scheda del singolo bene: specifiche, calendario, preventivo, prenotazione
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('');

  var D = FERMO.D;
  var a = FERMO.trova(FERMO.param('id'));
  var contenuto = document.getElementById('contenuto');

  if (!a) {
    document.getElementById('briciola').textContent = 'scheda non trovata';
    contenuto.innerHTML =
      '<div class="vuoto"><div class="cifra" style="color:var(--filo)">404</div>' +
      '<p style="margin-top:12px"><strong>Questa matricola non è a catalogo.</strong></p>' +
      '<a class="bottone" href="catalogo.html">Torna al catalogo</a></div>';
    return;
  }

  var cat = D.categoria(a.cat);
  var u = FERMO.fmt.unita(a.prezzo.unita);
  var inVendita = a.prezzo.unita === 'corpo';
  document.title = a.titolo + ' — FERMO';
  document.getElementById('briciola').textContent = cat.breve + ' / ' + a.id;

  /* ------------------------------------------------------------ modalità */
  var timbriMod = a.mod.map(function (m) {
    var md = D.modalita(m);
    var stile = m === 'vendita' ? 'timbro--accento' : m === 'servizio' ? 'timbro--blu' : 'timbro--tenue';
    return '<span class="timbro ' + stile + '">' + FERMO.esc(md.nome) + '</span>';
  }).join('');

  /* ---------------------------------------------------------- calendario */
  var cal = D.calendario(a, 28);
  var scelto = null;

  function grigliaCalendario() {
    var testa = D.GIORNI.map(function (g) {
      return '<div class="calendario__intestazione">' + g + '</div>';
    }).join('');
    /* allineo il primo giorno alla colonna del suo giorno della settimana */
    var vuoti = '';
    for (var v = 0; v < cal[0].dow; v++) vuoti += '<div></div>';
    var celle = cal.map(function (g, i) {
      var libero = g.stato === 'libero' || g.stato === 'parziale';
      var etichetta = g.data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) +
        ' — ' + ({ libero: 'libero', parziale: 'parzialmente libero', occupato: 'occupato', chiuso: 'non prenotabile' })[g.stato];
      return '<button class="giorno" type="button" data-stato="' + g.stato + '" data-i="' + i + '" ' +
        (libero ? '' : 'disabled ') +
        'aria-pressed="' + (scelto === i ? 'true' : 'false') + '" title="' + FERMO.esc(etichetta) + '">' +
        '<span class="numerico">' + g.data.getDate() + '</span>' +
        '<small>' + (g.stato === 'parziale' ? g.oreLibere + 'h' : g.stato === 'libero' ? 'lib' : '—') + '</small>' +
        '</button>';
    }).join('');
    return '<div class="calendario">' + testa + vuoti + celle + '</div>';
  }

  /* -------------------------------------------------------------- disegno */
  var specifiche = (a.specifiche || []).map(function (s) {
    return '<tr><td>' + FERMO.esc(s[0]) + '</td><td><strong>' + FERMO.esc(s[1]) + '</strong></td></tr>';
  }).join('');

  var elenco = function (voci, segno) {
    return '<ul style="margin:0;padding-left:0;list-style:none">' + voci.map(function (v) {
      return '<li style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--filo)">' +
        '<span aria-hidden="true" style="color:' + (segno === '+' ? 'var(--verde)' : 'var(--allarme)') + ';font-weight:700">' +
        segno + '</span><span>' + FERMO.esc(v) + '</span></li>';
    }).join('') + '</ul>';
  };

  contenuto.innerHTML = '' +
  '<div class="impianto">' +

    /* ------------------------------------------------ colonna principale */
    '<div class="pila">' +

      '<div class="blocco">' +
        '<div class="blocco__testa">' +
          '<span class="numerico">' + FERMO.esc(a.id) + '</span>' +
          '<span class="spinta">' + FERMO.esc(cat.nome) + '</span>' +
        '</div>' +
        '<div class="scheda__figura" style="border-bottom:2px solid var(--inchiostro);aspect-ratio:auto;padding:26px">' +
          FERMO.glifo(cat.glifo) +
        '</div>' +
        '<div class="blocco__corpo">' +
          '<div class="riga" style="gap:6px;margin-bottom:12px">' + timbriMod +
            (a.verificato ? '<span class="timbro timbro--verde">✓ Fornitore verificato</span>' : '<span class="timbro timbro--tenue">Non verificato</span>') +
            (a.origine === 'utente' ? '<span class="timbro timbro--hivis">Tuo annuncio</span>' : '') +
          '</div>' +
          '<h1 style="font-size:clamp(22px,3.4vw,34px);text-transform:none">' + FERMO.esc(a.titolo) + '</h1>' +
          '<p class="piccolo tenue" style="margin:10px 0 16px">' +
            FERMO.esc(a.fornitore) + ' · ' + FERMO.esc(a.citta) + ' (' + FERMO.esc(a.prov) + '), ' + FERMO.esc(a.regione) +
            ' · attivo dal ' + a.dal +
            (a.recensioni ? ' · ★ ' + a.rating.toFixed(1) + ' su ' + a.recensioni + ' lavori' : '') +
          '</p>' +
          '<p>' + FERMO.esc(a.sintesi) + '</p>' +
          (a.oreSettimana ? '<div style="margin-top:16px">' + FERMO.misuraSaturazione(a) + '</div>' : '') +
        '</div>' +
      '</div>' +

      '<div class="blocco">' +
        '<div class="blocco__testa">Scheda tecnica</div>' +
        '<div class="involucro-scorrevole">' +
          '<table class="tabella tabella--specifiche"><tbody>' + specifiche +
          '<tr><td>Impegno minimo</td><td><strong>' + FERMO.esc(a.minimo) + '</strong></td></tr>' +
          '<tr><td>Preavviso</td><td><strong>' + a.preavviso + ' giorni</strong></td></tr>' +
          '<tr><td>Logistica</td><td><strong>' +
            ({ 'in-sede': 'Lavorazione in sede del fornitore', 'spedizione': 'Spedizione pezzi a carico del cliente',
               'ritiro': 'Ritiro e riconsegna sul posto' })[a.logistica] + '</strong></td></tr>' +
          '</tbody></table>' +
        '</div>' +
      '</div>' +

      '<div class="griglia-2">' +
        '<div class="blocco"><div class="blocco__testa">Compreso nel prezzo</div>' +
          '<div class="blocco__corpo">' + elenco(a.incluso, '+') + '</div></div>' +
        '<div class="blocco"><div class="blocco__testa">A parte</div>' +
          '<div class="blocco__corpo">' + elenco(a.escluso, '−') + '</div></div>' +
      '</div>' +

      (a.certificazioni.length ?
      '<div class="blocco"><div class="blocco__testa">Certificazioni e conformità</div>' +
        '<div class="blocco__corpo riga">' + a.certificazioni.map(function (c) {
          return '<span class="timbro timbro--verde">' + FERMO.esc(c) + '</span>';
        }).join('') + '</div></div>' : '') +

      (inVendita ? '' :
      '<div class="blocco" id="blocco-calendario">' +
        '<div class="blocco__testa">Disponibilità · prossimi 28 giorni</div>' +
        '<div class="blocco__corpo">' +
          '<div class="legenda" style="margin-bottom:12px">' +
            '<span><i style="background:var(--pannello)"></i>Libero</span>' +
            '<span><i style="background:var(--hivis)"></i>Parziale</span>' +
            '<span><i style="background:var(--traccia)"></i>Occupato</span>' +
            '<span><i style="background:transparent;border-style:dashed"></i>Fuori preavviso</span>' +
          '</div>' +
          '<div id="calendario-innesto">' + grigliaCalendario() + '</div>' +
          '<p class="campo__aiuto" style="margin-top:10px">Scegli il giorno di inizio. ' +
            'I giorni entro il preavviso di ' + a.preavviso + ' giorni non sono prenotabili.</p>' +
        '</div>' +
      '</div>') +

    '</div>' +

    /* ---------------------------------------------------- colonna laterale */
    '<div class="pila appiccicoso">' +
      '<div class="blocco">' +
        '<div class="blocco__testa">' + (inVendita ? 'Proposta d\'acquisto' : 'Preventivo') + '</div>' +
        '<div class="blocco__corpo pila">' +

          '<div>' +
            '<div class="prezzo numerico" style="font-size:30px">' +
              (inVendita ? FERMO.fmt.euroTondo(a.prezzo.valore) : FERMO.fmt.euro(a.prezzo.valore)) +
              '<small>' + FERMO.esc(u.suffisso) + '</small>' +
            '</div>' +
            '<div class="piccolo tenue">Minimo: ' + FERMO.esc(a.minimo) + '</div>' +
          '</div>' +

          (a.mod.length > 1 ?
          '<div class="campo"><span class="campo__nome">Modalità</span>' +
            '<div class="scelte">' + a.mod.map(function (m, i) {
              return '<label class="scelta"><input type="radio" name="modalita" value="' + m + '"' +
                (i === 0 ? ' checked' : '') + '><span>' + FERMO.esc(D.modalita(m).nome) + '</span></label>';
            }).join('') + '</div>' +
            '<p class="campo__aiuto" id="nota-modalita"></p>' +
          '</div>' : '<p class="campo__aiuto" id="nota-modalita"></p>') +

          (inVendita ?
          '<label class="campo"><span class="campo__nome">La tua offerta (€)</span>' +
            '<input type="number" id="quantita" min="0" step="100" value="' + a.prezzo.valore + '">' +
            '<span class="campo__aiuto">Prezzo richiesto ' + FERMO.fmt.euroTondo(a.prezzo.valore) + '. Le proposte sotto il 15 % vengono raramente accettate.</span>' +
          '</label>'
          :
          '<label class="campo"><span class="campo__nome">' + FERMO.esc(u.quantita) + '</span>' +
            '<input type="number" id="quantita" min="1" step="1" value="' + quantitaIniziale() + '">' +
            '<span class="campo__aiuto" id="finestra">—</span>' +
          '</label>') +

          '<div class="campo"><span class="campo__nome">Opzioni</span>' +
            '<label class="riga" style="gap:9px;flex-wrap:nowrap;cursor:pointer">' +
              '<input type="checkbox" id="opt-assicurazione" style="width:auto" checked>' +
              '<span class="piccolo">Copertura danni (3,5 %)</span></label>' +
            '<label class="riga" style="gap:9px;flex-wrap:nowrap;cursor:pointer;margin-top:7px">' +
              '<input type="checkbox" id="opt-trasporto" style="width:auto">' +
              '<span class="piccolo">Trasporto andata/ritorno (180 €)</span></label>' +
          '</div>' +

          '<div class="involucro-scorrevole" style="border-top:2px solid var(--inchiostro);padding-top:6px">' +
            '<table class="tabella piccolo" id="conto"></table>' +
          '</div>' +

          '<button class="bottone bottone--primario bottone--largo" type="button" id="prenota">' +
            (inVendita ? 'Invia proposta' : 'Prenota') + '</button>' +
          '<button class="bottone bottone--largo bottone--nudo" type="button" data-azione="preferito" ' +
            'aria-pressed="' + (FERMO.preferito(a.id) ? 'true' : 'false') + '">★ Salva tra i preferiti</button>' +
          '<p class="campo__aiuto centrato">Nessun addebito: è una demo. ' +
            'La richiesta finisce nelle tue prenotazioni.</p>' +
        '</div>' +
      '</div>' +

      '<div class="blocco blocco--piatto">' +
        '<div class="blocco__testa">Il fornitore</div>' +
        '<div class="blocco__corpo pila piccolo">' +
          '<div><strong>' + FERMO.esc(a.fornitore) + '</strong></div>' +
          '<div class="tenue">' + FERMO.esc(a.citta) + ' (' + FERMO.esc(a.prov) + ') · sul mercato dal ' + a.dal + '</div>' +
          (a.recensioni ?
            '<div class="riga riga--fra"><span class="etichetta">Valutazione</span>' +
            '<span class="numerico">★ ' + a.rating.toFixed(1) + ' / 5 · ' + a.recensioni + ' lavori</span></div>' : '') +
          '<div class="riga riga--fra"><span class="etichetta">Risposta media</span><span class="numerico">' +
            (a.verificato ? 'entro 6 ore' : 'entro 2 giorni') + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +

  '<section class="sezione">' +
    '<div class="capo"><span class="capo__n">[SIM]</span><h2>Capacità simile</h2>' +
    '<span class="capo__nota">Stessa categoria</span></div>' +
    '<div class="esiti" id="simili"></div>' +
  '</section>';

  /* ------------------------------------------------------ dati derivati */
  function quantitaIniziale() {
    var m = String(a.minimo).match(/\d+/);
    return m ? parseInt(m[0], 10) : 1;
  }

  /* --------------------------------------------------------- interazioni */
  var elQuantita = document.getElementById('quantita');
  var elConto = document.getElementById('conto');
  var elFinestra = document.getElementById('finestra');
  var elAss = document.getElementById('opt-assicurazione');
  var elTra = document.getElementById('opt-trasporto');
  var notaMod = document.getElementById('nota-modalita');

  function modalitaScelta() {
    var r = document.querySelector('input[name="modalita"]:checked');
    return r ? r.value : a.mod[0];
  }

  function finestra() {
    if (inVendita || scelto === null) return null;
    var q = Math.max(1, parseInt(elQuantita.value, 10) || 1);
    var inizio = cal[scelto].data;
    var giorni = { ora: 1, giorno: q, settimana: q * 7, mese: q * 30, pezzo: Math.ceil(q / 50),
                   m3mese: q ? 30 : 1, palletmese: 30, km: 1 }[a.prezzo.unita] || 1;
    var fine = new Date(inizio.getTime() + Math.max(0, giorni - 1) * 86400000);
    return { inizio: inizio, fine: fine };
  }

  function aggiorna() {
    var q = Math.max(inVendita ? 0 : 1, parseFloat(elQuantita.value) || 0);
    var p;

    if (inVendita) {
      var sconto = 1 - q / a.prezzo.valore;
      p = { imponibile: q, commissione: q * D.COMMISSIONE, assicurazione: 0,
            trasporto: elTra.checked ? 180 : 0 };
      p.netto = p.imponibile + p.commissione + p.trasporto;
      p.iva = p.netto * D.IVA;
      p.totale = p.netto + p.iva;
      elConto.innerHTML =
        riga('Offerta', FERMO.fmt.euroTondo(p.imponibile)) +
        riga('Scarto sul richiesto', (sconto >= 0 ? '−' : '+') + Math.abs(sconto * 100).toFixed(1) + ' %') +
        riga('Commissione 9 %', FERMO.fmt.euro(p.commissione)) +
        (p.trasporto ? riga('Trasporto', FERMO.fmt.euro(p.trasporto)) : '') +
        riga('IVA 22 %', FERMO.fmt.euro(p.iva)) +
        riga('<strong>Totale se accettata</strong>', '<strong>' + FERMO.fmt.euroTondo(p.totale) + '</strong>');
    } else {
      p = FERMO.preventivo(a, q, { assicurazione: elAss.checked, trasporto: elTra.checked });
      elConto.innerHTML =
        riga(q + ' × ' + FERMO.fmt.euro(a.prezzo.valore), FERMO.fmt.euro(p.imponibile)) +
        riga('Commissione 9 %', FERMO.fmt.euro(p.commissione)) +
        (p.assicurazione ? riga('Copertura danni', FERMO.fmt.euro(p.assicurazione)) : '') +
        (p.trasporto ? riga('Trasporto', FERMO.fmt.euro(p.trasporto)) : '') +
        riga('IVA 22 %', FERMO.fmt.euro(p.iva)) +
        riga('<strong>Totale</strong>', '<strong>' + FERMO.fmt.euro(p.totale) + '</strong>');

      var f = finestra();
      elFinestra.textContent = f
        ? 'Dal ' + FERMO.fmt.data(f.inizio) + ' al ' + FERMO.fmt.data(f.fine)
        : 'Scegli il giorno di inizio dal calendario qui a fianco.';
    }

    if (notaMod) notaMod.textContent = D.modalita(modalitaScelta()).nota;
    return p;
  }

  function riga(k, v) {
    return '<tr><td>' + k + '</td><td class="num numerico">' + v + '</td></tr>';
  }

  document.addEventListener('input', function (e) {
    if (e.target.closest('.appiccicoso')) aggiorna();
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest('.appiccicoso')) aggiorna();
  });

  var innesto = document.getElementById('calendario-innesto');
  if (innesto) {
    innesto.addEventListener('click', function (e) {
      var b = e.target.closest('.giorno');
      if (!b || b.disabled) return;
      scelto = parseInt(b.getAttribute('data-i'), 10);
      innesto.innerHTML = grigliaCalendario();
      aggiorna();
    });
  }

  document.getElementById('prenota').addEventListener('click', function () {
    var q = parseFloat(elQuantita.value) || 0;
    if (!inVendita && scelto === null) {
      FERMO.brindisi('Manca la data', 'Scegli il giorno di inizio nel calendario prima di prenotare.');
      var bc = document.getElementById('blocco-calendario');
      if (bc) bc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (q <= 0) {
      FERMO.brindisi('Quantità non valida', 'Inserisci un valore maggiore di zero.');
      return;
    }
    var p = aggiorna();
    var f = finestra();
    var codice = FERMO.nuovaPrenotazione({
      assetId: a.id,
      titolo: a.titolo,
      fornitore: a.fornitore,
      citta: a.citta,
      modalita: modalitaScelta(),
      quantita: q,
      unita: a.prezzo.unita,
      inizio: f ? f.inizio.toISOString() : null,
      fine: f ? f.fine.toISOString() : null,
      totale: p.totale,
      tipo: inVendita ? 'offerta' : 'prenotazione'
    });
    FERMO.brindisi(inVendita ? 'Proposta inviata · ' + codice : 'Prenotazione registrata · ' + codice,
      inVendita ? 'Il fornitore risponde entro 48 ore. La trovi in Prenotazioni.'
                : 'In attesa di conferma dal fornitore. La trovi in Prenotazioni.');
    setTimeout(function () { location.href = 'prenotazioni.html'; }, 1100);
  });

  /* ------------------------------------------------------------- simili */
  var simili = FERMO.catalogo().filter(function (x) {
    return x.id !== a.id && (x.cat === a.cat || x.regione === a.regione);
  }).slice(0, 3);
  document.getElementById('simili').innerHTML = simili.length
    ? simili.map(FERMO.scheda).join('')
    : '<p class="tenue">Nessuna scheda simile a catalogo.</p>';

  aggiorna();
})();
