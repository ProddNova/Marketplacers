/* =============================================================================
   FERMO — scheda del singolo bene
   Sul telefono la pagina è una colonna sola nell'ordine in cui si decide:
   che cos'è, quando è libera, quanto costa. Il prezzo e il pulsante di
   prenotazione restano fissi in basso, così non si perdono mai di vista.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('asset.html');

  var D = FERMO.D;
  var a = FERMO.trova(FERMO.param('id'));
  var contenuto = document.getElementById('contenuto');
  var g = function (id) { return document.getElementById(id); };

  if (!a) {
    g('briciola').textContent = 'scheda non trovata';
    contenuto.innerHTML =
      '<div class="vuoto">' +
        '<h3>Questa matricola non è a catalogo</h3>' +
        '<p class="piccolo">Il collegamento può essere vecchio, o la scheda è stata ritirata.</p>' +
        '<a class="btn btn--primario" href="catalogo.html" style="margin-top:14px">Torna al catalogo</a>' +
      '</div>';
    document.getElementById('pagina').classList.remove('pagina--azioni');
    return;
  }

  var cat = D.categoria(a.cat);
  var u = FERMO.fmt.unita(a.prezzo.unita);
  var inVendita = a.prezzo.unita === 'corpo';
  var prezzoTesto = inVendita ? FERMO.fmt.euroTondo(a.prezzo.valore) : FERMO.fmt.euro(a.prezzo.valore);
  document.title = a.titolo + ' — FERMO';
  g('briciola').textContent = cat.breve;

  var modScelta = a.mod[0];
  var scelto = null;                      /* indice del giorno di inizio */
  var cal = D.calendario(a, 28);

  /* --------------------------------------------------------- calendario -- */
  function grigliaCalendario() {
    var testa = D.GIORNI.map(function (x) {
      return '<div class="calendario__testa">' + x + '</div>';
    }).join('');
    var vuoti = '';
    for (var v = 0; v < cal[0].dow; v++) vuoti += '<div></div>';
    var celle = cal.map(function (x, i) {
      var libero = x.stato === 'libero' || x.stato === 'parziale';
      var etichetta = x.data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) +
        ' — ' + ({ libero: 'libero', parziale: 'parzialmente libero', occupato: 'occupato',
                   chiuso: 'non prenotabile' })[x.stato];
      return '<button class="giorno" type="button" data-stato="' + x.stato + '" data-i="' + i + '" ' +
        (libero ? '' : 'disabled ') +
        'aria-pressed="' + (scelto === i ? 'true' : 'false') + '" title="' + FERMO.esc(etichetta) + '">' +
        '<span>' + x.data.getDate() + '</span>' +
        '<small>' + (x.stato === 'parziale' ? x.oreLibere + 'h' : x.stato === 'libero' ? 'lib' : '—') + '</small>' +
      '</button>';
    }).join('');
    return '<div class="calendario">' + testa + vuoti + celle + '</div>';
  }

  /* ------------------------------------------------------------- pezzi ---- */
  var pillole = a.mod.map(function (m) {
    var md = D.modalita(m);
    var stile = m === 'vendita' ? ' pillola--accento' : m === 'servizio' ? ' pillola--blu' : '';
    return '<span class="pillola' + stile + '">' + FERMO.esc(md.nome) + '</span>';
  }).join('') +
    (a.verificato ? '<span class="pillola pillola--verde">✓ Fornitore verificato</span>' : '') +
    (a.origine === 'utente' ? '<span class="pillola pillola--accento">Tuo annuncio</span>' : '');

  var LOGISTICA = {
    'in-sede': 'Si lavora in sede del fornitore',
    'spedizione': 'Il cliente spedisce i pezzi',
    'ritiro': 'Ritiro e riconsegna sul posto'
  };

  function fatto(nome, valore) {
    return '<div><div class="piccolo fioco">' + FERMO.esc(nome) + '</div>' +
      '<div class="grassetto" style="font-size:14.5px">' + FERMO.esc(valore) + '</div></div>';
  }

  var specifiche = (a.specifiche || []).map(function (s) {
    return '<tr><td>' + FERMO.esc(s[0]) + '</td><td class="grassetto">' + FERMO.esc(s[1]) + '</td></tr>';
  }).join('');

  function elenco(voci, dentro) {
    if (!voci.length) return '<p class="piccolo fioco">Niente di dichiarato.</p>';
    return '<ul class="pila pila--fitta" style="margin:0;padding:0;list-style:none">' + voci.map(function (v) {
      return '<li class="riga riga--stretta" style="gap:8px;align-items:flex-start">' +
        '<span style="color:var(--' + (dentro ? 'verde' : 'testo-3') + ');font-weight:700">' +
          (dentro ? '✓' : '−') + '</span>' +
        '<span class="piccolo">' + FERMO.esc(v) + '</span></li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------------------- disegno -- */
  contenuto.innerHTML = '' +
  '<div class="doppia">' +

    /* --------------------------------------------- colonna: che cos'è */
    '<div class="pila">' +

      '<div class="carta">' +
        '<div class="bene__fig" style="aspect-ratio:16/9;border-bottom:1px solid var(--bordo);' +
             'border-radius:12px 12px 0 0">' + FERMO.glifo(cat.glifo) + '</div>' +
        '<div class="carta__corpo">' +
          '<div class="riga" style="gap:6px;margin-bottom:12px">' + pillole + '</div>' +
          '<h1 style="font-size:clamp(22px,5.5vw,30px)">' + FERMO.esc(a.titolo) + '</h1>' +
          '<p class="piccolo tenue" style="margin:10px 0 14px">' +
            FERMO.esc(a.fornitore) + ' · ' + FERMO.esc(a.citta) + ' (' + FERMO.esc(a.prov) + ')' +
            ' · sul mercato dal ' + a.dal +
            (a.recensioni ? ' · ★ ' + a.rating.toFixed(1) + ' su ' + a.recensioni + ' lavori' : '') +
          '</p>' +
          '<p class="tenue">' + FERMO.esc(a.sintesi) + '</p>' +
          (a.oreSettimana ? '<div style="margin-top:16px">' + FERMO.misuraSaturazione(a) + '</div>' : '') +
        '</div>' +
        '<div class="carta__piede">' +
          '<div class="griglia griglia--2" style="gap:14px">' +
            fatto('Impegno minimo', a.minimo) +
            fatto('Preavviso', a.preavviso + ' giorni') +
            fatto('Logistica', LOGISTICA[a.logistica] || '—') +
            fatto('Categoria', cat.nome) +
          '</div>' +
        '</div>' +
      '</div>' +

      (inVendita ? '' :
      '<div class="carta" id="blocco-calendario">' +
        '<div class="carta__testa">Quando è libera' +
          '<span class="spinta piccolo fioco">prossimi 28 giorni</span></div>' +
        '<div class="carta__corpo">' +
          '<div class="riga" style="gap:6px;margin-bottom:14px">' +
            '<span class="pillola">Libero</span>' +
            '<span class="pillola pillola--ambra">Parziale</span>' +
            '<span class="pillola">Occupato</span>' +
          '</div>' +
          '<div id="calendario-innesto">' + grigliaCalendario() + '</div>' +
          '<p class="campo__aiuto">Tocca il giorno di inizio. I giorni entro il preavviso di ' +
            a.preavviso + ' giorni non sono prenotabili.</p>' +
        '</div>' +
      '</div>') +

    '</div>' +

    /* ------------------------------------------ colonna: quanto costa */
    '<div class="pila attaccata">' +
      '<div class="carta carta--rilievo" id="preventivo" data-id="' + FERMO.esc(a.id) + '">' +
        '<div class="carta__testa">' + (inVendita ? 'Fai una proposta' : 'Preventivo') + '</div>' +
        '<div class="carta__corpo">' +

          '<div class="riga riga--fra" style="margin-bottom:16px">' +
            '<span class="cifra cifra--piccola">' + prezzoTesto +
              ' <span class="piccolo fioco" style="font-weight:500">' + FERMO.esc(u.suffisso) + '</span></span>' +
            '<span class="piccolo fioco">min. ' + FERMO.esc(a.minimo) + '</span>' +
          '</div>' +

          (a.mod.length > 1 ?
          '<div class="campo">' +
            '<span class="campo__nome">Modalità</span>' +
            '<div class="riga" style="gap:8px">' + a.mod.map(function (m, i) {
              return '<button class="chip" type="button" data-modalita="' + m + '" aria-pressed="' +
                (i === 0 ? 'true' : 'false') + '">' + FERMO.esc(D.modalita(m).nome) + '</button>';
            }).join('') + '</div>' +
            '<span class="campo__aiuto" id="nota-modalita"></span>' +
          '</div>' : '<p class="campo__aiuto" id="nota-modalita" style="margin-top:0"></p>') +

          (inVendita ?
          '<label class="campo"><span class="campo__nome">La tua offerta (€)</span>' +
            '<input type="number" id="quantita" min="0" step="100" value="' + a.prezzo.valore + '">' +
            '<span class="campo__aiuto">Prezzo richiesto ' + FERMO.fmt.euroTondo(a.prezzo.valore) +
              '. Sotto il 15 % le proposte vengono raramente accettate.</span>' +
          '</label>'
          :
          '<label class="campo"><span class="campo__nome">' + FERMO.esc(u.quantita) + '</span>' +
            '<input type="number" id="quantita" min="1" step="1" value="' + quantitaIniziale() + '">' +
            '<span class="campo__aiuto" id="finestra">—</span>' +
          '</label>') +

          '<div class="campo">' +
            '<span class="campo__nome">Opzioni</span>' +
            (inVendita ? '' :
            '<label class="spunta"><input type="checkbox" id="opt-assicurazione" checked> ' +
              'Copertura danni (3,5 %)</label>') +
            '<label class="spunta"><input type="checkbox" id="opt-trasporto"> ' +
              'Trasporto andata e ritorno (180 €)</label>' +
          '</div>' +

          '<table class="tabella tabella--conto" id="conto" style="margin-top:6px"></table>' +

          '<div class="pila pila--fitta" style="margin-top:18px">' +
            '<button class="btn btn--primario btn--largo" type="button" id="prenota">' +
              (inVendita ? 'Invia la proposta' : 'Prenota') + '</button>' +
            '<button class="btn btn--largo" type="button" data-azione="preferito" id="salva" ' +
              'aria-pressed="' + (FERMO.preferito(a.id) ? 'true' : 'false') + '">' +
              (FERMO.preferito(a.id) ? 'Salvato ✓' : 'Salva tra i preferiti') + '</button>' +
          '</div>' +
          '<p class="campo__aiuto centrato">Nessun addebito: è una demo. ' +
            'La richiesta finisce fra le tue.</p>' +
        '</div>' +
      '</div>' +

      '<div class="carta">' +
        '<div class="carta__testa">Il fornitore</div>' +
        '<div class="carta__corpo pila pila--fitta">' +
          '<strong>' + FERMO.esc(a.fornitore) + '</strong>' +
          '<span class="piccolo tenue">' + FERMO.esc(a.citta) + ' (' + FERMO.esc(a.prov) + ') · ' +
            FERMO.esc(a.regione) + ' · sul mercato dal ' + a.dal + '</span>' +
          (a.recensioni ?
            '<div class="riga riga--fra piccolo"><span class="tenue">Valutazione</span>' +
            '<span class="num grassetto">★ ' + a.rating.toFixed(1) + ' / 5 · ' + a.recensioni + ' lavori</span></div>' : '') +
          '<div class="riga riga--fra piccolo"><span class="tenue">Risposta media</span>' +
            '<span class="grassetto">' + (a.verificato ? 'entro 6 ore' : 'entro 2 giorni') + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +

  /* ------------------------------------------------------- il resto */
  '<section class="sezione">' +
    '<div class="capo"><h2>Scheda tecnica</h2></div>' +
    '<div class="carta"><div class="scorre">' +
      '<table class="tabella tabella--chiave"><tbody>' + specifiche +
        '<tr><td>Impegno minimo</td><td class="grassetto">' + FERMO.esc(a.minimo) + '</td></tr>' +
        '<tr><td>Preavviso</td><td class="grassetto">' + a.preavviso + ' giorni</td></tr>' +
        '<tr><td>Logistica</td><td class="grassetto">' + FERMO.esc(LOGISTICA[a.logistica] || '—') + '</td></tr>' +
      '</tbody></table>' +
    '</div></div>' +

    '<div class="griglia griglia--auto" style="margin-top:16px">' +
      '<div class="carta"><div class="carta__testa">Compreso nel prezzo</div>' +
        '<div class="carta__corpo">' + elenco(a.incluso, true) + '</div></div>' +
      '<div class="carta"><div class="carta__testa">A parte</div>' +
        '<div class="carta__corpo">' + elenco(a.escluso, false) + '</div></div>' +
    '</div>' +

    (a.certificazioni.length ?
    '<div class="carta" style="margin-top:16px"><div class="carta__testa">Certificazioni</div>' +
      '<div class="carta__corpo riga" style="gap:8px">' + a.certificazioni.map(function (c) {
        return '<span class="pillola pillola--verde">' + FERMO.esc(c) + '</span>';
      }).join('') + '</div></div>' : '') +
  '</section>' +

  '<section class="sezione">' +
    '<div class="capo"><h2>Chi ci ha lavorato</h2>' +
      '<span class="capo__nota">' + (a.recensioni ? a.recensioni + ' lavori valutati' : 'nessuno storico') + '</span></div>' +
    '<div class="carta"><div class="carta__corpo">' +
      (a.recensioni ?
        '<div class="riga" style="gap:14px;padding-bottom:14px;margin-bottom:16px;' +
             'border-bottom:1px solid var(--bordo)">' +
          '<span class="cifra cifra--piccola">' + a.rating.toFixed(1) + '</span>' +
          '<div>' + FERMO.stelle(a.rating) +
            '<div class="piccolo fioco">su ' + a.recensioni + ' lavori conclusi</div></div>' +
        '</div>' : '') +
      FERMO.muroRecensioni(a) +
    '</div></div>' +
  '</section>' +

  '<section class="sezione">' +
    '<div class="capo"><h2>Capacità simile</h2></div>' +
    '<div class="elenco-beni" id="simili"></div>' +
  '</section>';

  /* barra fissa in basso: il prezzo e l'azione restano sempre a portata */
  var barra = document.createElement('div');
  barra.className = 'azioni-fisse';
  barra.innerHTML =
    '<div class="azioni-fisse__prezzo">' +
      '<div class="grassetto num" style="font-size:18px">' + prezzoTesto + '</div>' +
      '<div class="piccolo fioco">' + FERMO.esc(u.suffisso.replace(/^ /, '')) + '</div>' +
    '</div>' +
    '<button class="btn btn--primario spinta" type="button" id="prenota-fisso">' +
      (inVendita ? 'Fai una proposta' : 'Prenota') + '</button>';
  document.body.appendChild(barra);
  document.body.classList.add('ha-azioni');

  /* il pulsante «salva» dice anche in che stato è finito */
  document.addEventListener('fermo:preferiti', function () {
    var b = g('salva');
    if (b) b.textContent = b.getAttribute('aria-pressed') === 'true' ? 'Salvato ✓' : 'Salva tra i preferiti';
  });

  /* ------------------------------------------------------ dati derivati -- */
  function quantitaIniziale() {
    var m = String(a.minimo).match(/\d+/);
    return m ? parseInt(m[0], 10) : 1;
  }

  var elQuantita = g('quantita');
  var elConto = g('conto');
  var elFinestra = g('finestra');
  var elAss = g('opt-assicurazione');
  var elTra = g('opt-trasporto');
  var notaMod = g('nota-modalita');

  function finestra() {
    if (inVendita || scelto === null) return null;
    var q = Math.max(1, parseInt(elQuantita.value, 10) || 1);
    var inizio = cal[scelto].data;
    var giorni = { ora: 1, giorno: q, settimana: q * 7, mese: q * 30, pezzo: Math.ceil(q / 50),
                   m3mese: q ? 30 : 1, palletmese: 30, km: 1 }[a.prezzo.unita] || 1;
    var fine = new Date(inizio.getTime() + Math.max(0, giorni - 1) * 86400000);
    return { inizio: inizio, fine: fine };
  }

  function riga(k, v) {
    return '<tr><td>' + k + '</td><td class="num">' + v + '</td></tr>';
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
        riga('Totale se accettata', FERMO.fmt.euroTondo(p.totale));
    } else {
      p = FERMO.preventivo(a, q, { assicurazione: elAss.checked, trasporto: elTra.checked });
      elConto.innerHTML =
        riga(q + ' × ' + FERMO.fmt.euro(a.prezzo.valore), FERMO.fmt.euro(p.imponibile)) +
        riga('Commissione 9 %', FERMO.fmt.euro(p.commissione)) +
        (p.assicurazione ? riga('Copertura danni', FERMO.fmt.euro(p.assicurazione)) : '') +
        (p.trasporto ? riga('Trasporto', FERMO.fmt.euro(p.trasporto)) : '') +
        riga('IVA 22 %', FERMO.fmt.euro(p.iva)) +
        riga('Totale', FERMO.fmt.euro(p.totale));

      var f = finestra();
      elFinestra.textContent = f
        ? 'Dal ' + FERMO.fmt.data(f.inizio) + ' al ' + FERMO.fmt.data(f.fine)
        : 'Scegli il giorno di inizio nel calendario.';
    }

    if (notaMod) notaMod.textContent = D.modalita(modScelta).nota;
    return p;
  }

  /* -------------------------------------------------------- interazioni -- */
  var pannelloPrev = g('preventivo');
  pannelloPrev.addEventListener('input', aggiorna);
  pannelloPrev.addEventListener('change', aggiorna);
  pannelloPrev.addEventListener('click', function (e) {
    var b = e.target.closest('[data-modalita]');
    if (!b) return;
    modScelta = b.getAttribute('data-modalita');
    Array.prototype.forEach.call(pannelloPrev.querySelectorAll('[data-modalita]'), function (x) {
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
    });
    aggiorna();
  });

  var innesto = g('calendario-innesto');
  if (innesto) {
    innesto.addEventListener('click', function (e) {
      var b = e.target.closest('.giorno');
      if (!b || b.disabled) return;
      scelto = parseInt(b.getAttribute('data-i'), 10);
      innesto.innerHTML = grigliaCalendario();
      aggiorna();
    });
  }

  function prenota() {
    var q = parseFloat(elQuantita.value) || 0;
    if (!inVendita && scelto === null) {
      FERMO.brindisi('Manca la data', 'Scegli il giorno di inizio nel calendario.');
      var bc = g('blocco-calendario');
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
      modalita: modScelta,
      quantita: q,
      unita: a.prezzo.unita,
      inizio: f ? f.inizio.toISOString() : null,
      fine: f ? f.fine.toISOString() : null,
      totale: p.totale,
      tipo: inVendita ? 'offerta' : 'prenotazione'
    });
    FERMO.brindisi(inVendita ? 'Proposta inviata · ' + codice : 'Richiesta inviata · ' + codice,
      inVendita ? 'Il fornitore risponde entro 48 ore.'
                : 'In attesa di conferma dal fornitore.');
    setTimeout(function () { location.href = 'prenotazioni.html'; }, 1100);
  }

  g('prenota').addEventListener('click', prenota);
  g('prenota-fisso').addEventListener('click', prenota);

  /* ------------------------------------------------------------- simili -- */
  var simili = FERMO.catalogo().filter(function (x) {
    return x.id !== a.id && (x.cat === a.cat || x.regione === a.regione);
  }).slice(0, 4);
  g('simili').innerHTML = simili.length
    ? simili.map(FERMO.scheda).join('')
    : '<p class="tenue">Nessuna scheda simile a catalogo.</p>';

  aggiorna();
})();
