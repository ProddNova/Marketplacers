/* =============================================================================
   FERMO — scheda della singola macchina
   Sul telefono la pagina è una colonna sola nell'ordine in cui si decide:
   che cos'è, in che stato è, quando la puoi vedere, quanto costa portarla via.
   Il prezzo e il pulsante restano fissi in basso, così non si perdono di vista.
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
        '<h3>Questa matricola non è a listino</h3>' +
        '<p class="piccolo">Il collegamento può essere vecchio, oppure l\'annuncio è già stato chiuso.</p>' +
        '<a class="btn btn--primario" href="catalogo.html" style="margin-top:14px">Torna al listino</a>' +
      '</div>';
    document.getElementById('pagina').classList.remove('pagina--azioni');
    return;
  }

  var cat = D.categoria(a.cat);
  var cond = D.condizione(a.condizione);
  var asta = FERMO.inAsta(a);
  var corrente = FERMO.prezzoCorrente(a);
  var sc = FERMO.sconto(a);
  document.title = a.titolo + ' — FERMO';
  g('briciola').textContent = cat.breve;

  /* La formula di partenza: se è all'asta si rilancia, altrimenti si compra
     al prezzo esposto e in mancanza di quello si tratta. */
  var formulaScelta = asta ? 'asta' : (a.mod.indexOf('fisso') !== -1 ? 'fisso' : 'trattativa');
  var visitaScelta = null;                /* indice del giorno di visione */
  var cal = D.calendario(a, 28);

  var CONSEGNA = {
    ritiro:  'Ritiro a carico dell\'acquirente',
    inclusa: 'Consegna compresa nel prezzo',
    accordo: 'Trasporto da concordare'
  };
  var SMONTAGGIO = {
    incluso:        'Smontaggio e carico a carico del venditore',
    acquirente:     'Smontaggio e carico a carico dell\'acquirente',
    'gia-smontato': 'Già smontata, pronta al carico',
    venditore:      'Smontaggio dal venditore, a preventivo',
    'non-serve':    'Nessuno smontaggio: si carica com\'è'
  };

  /* --------------------------------------------------------- calendario -- */
  function grigliaCalendario() {
    var testa = D.GIORNI.map(function (x) {
      return '<div class="calendario__testa">' + x + '</div>';
    }).join('');
    var vuoti = '';
    for (var v = 0; v < cal[0].dow; v++) vuoti += '<div></div>';
    var celle = cal.map(function (x, i) {
      var libero = x.stato === 'libero' || x.stato === 'mezza';
      var etichetta = x.data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) +
        ' — ' + ({ libero: 'visione libera', mezza: 'solo mattina', occupato: 'già occupato',
                   chiuso: 'chiuso' })[x.stato] +
        (x.ritirabile ? ', ritirabile' : ', non ancora ritirabile');
      return '<button class="giorno" type="button" data-stato="' +
        (x.stato === 'mezza' ? 'parziale' : x.stato) + '" data-i="' + i + '" ' +
        (libero ? '' : 'disabled ') +
        'aria-pressed="' + (visitaScelta === i ? 'true' : 'false') + '" title="' + FERMO.esc(etichetta) + '">' +
        '<span>' + x.data.getDate() + '</span>' +
        '<small>' + (x.stato === 'mezza' ? 'am' : x.stato === 'libero' ? 'ok' : '—') + '</small>' +
      '</button>';
    }).join('');
    return '<div class="calendario">' + testa + vuoti + celle + '</div>';
  }

  /* ------------------------------------------------------------- pezzi ---- */
  var pillole = a.mod.map(function (m) {
    var f = D.formula(m);
    var stile = m === 'asta' ? ' pillola--ambra' : m === 'trattativa' ? ' pillola--blu' : '';
    return '<span class="pillola' + stile + '">' + FERMO.esc(f.nome) + '</span>';
  }).join('') +
    '<span class="pillola">' + FERMO.esc(cond.nome) + '</span>' +
    (a.verificato ? '<span class="pillola pillola--verde">✓ Venditore verificato</span>' : '') +
    (a.origine === 'utente' ? '<span class="pillola pillola--accento">Tuo annuncio</span>' : '');

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

  var testoRitiro = a.ritiroFra === 0 ? 'Subito' : 'Fra ' + FERMO.fmt.giorni(a.ritiroFra);
  var testoGaranzia = a.garanzia ? FERMO.fmt.mesi(a.garanzia) + ' dal venditore' : 'Vista e piaciuta';

  /* Su un lotto il prezzo del blocco non basta a decidere: la riga sotto la
     cifra dice quanto viene il pezzo, che è il numero con cui si confronta. */
  var perPezzo = FERMO.perPezzo(a);
  var notaPrezzo = asta
    ? 'Base ' + FERMO.fmt.euroTondo(a.asta.base) + ' · ' + a.asta.offerte + ' rilanci · ' +
      'chiude fra ' + FERMO.fmt.giorni(a.asta.scadeFra)
    : (sc != null && sc > 0.02
        ? 'Da nuovo ' + FERMO.fmt.euroTondo(a.nuovo) + ' — risparmi il ' + Math.round(sc * 100) + ' %'
        : 'Prezzo richiesto dal venditore');
  if (perPezzo != null) {
    notaPrezzo += ' · ' + FERMO.fmt.euroTondo(perPezzo) + ' a pezzo su ' + FERMO.fmt.pezzi(a.pezzi) +
      ', in blocco';
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
            FERMO.esc(a.venditore) + ' · ' + FERMO.esc(a.citta) + ' (' + FERMO.esc(a.prov) + ')' +
            ' · sul mercato dal ' + a.dal +
            (a.recensioni ? ' · ★ ' + a.rating.toFixed(1) + ' su ' + a.recensioni + ' vendite' : '') +
          '</p>' +
          '<p class="tenue">' + FERMO.esc(a.sintesi) + '</p>' +
          '<div style="margin-top:16px">' + FERMO.misuraCondizione(a) + '</div>' +
        '</div>' +
        '<div class="carta__piede">' +
          '<div class="griglia griglia--2" style="gap:14px">' +
            fatto('Anno', a.anno ? String(a.anno) : '—') +
            fatto('Contatore', FERMO.fmt.contatore(a) || 'Non presente') +
            fatto('Ritirabile', testoRitiro) +
            fatto('Garanzia', testoGaranzia) +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="carta" id="blocco-calendario">' +
        '<div class="carta__testa">Quando puoi vederla' +
          '<span class="spinta piccolo fioco">prossimi 28 giorni</span></div>' +
        '<div class="carta__corpo">' +
          '<div class="riga" style="gap:6px;margin-bottom:14px">' +
            '<span class="pillola">Libero</span>' +
            '<span class="pillola pillola--ambra">Solo mattina</span>' +
            '<span class="pillola">Occupato</span>' +
          '</div>' +
          '<div id="calendario-innesto">' + grigliaCalendario() + '</div>' +
          '<p class="campo__aiuto" id="nota-visita">Tocca il giorno in cui vuoi venire a vederla. ' +
            'L\'usato si compra guardandolo: la visione non impegna a niente.</p>' +
          '<p class="campo__aiuto">' + (a.ritiroFra === 0
            ? 'Si può portare via subito dopo l\'accordo.'
            : 'È ancora in servizio: si ritira fra ' + FERMO.fmt.giorni(a.ritiroFra) + '.') +
          '</p>' +
        '</div>' +
      '</div>' +

    '</div>' +

    /* ------------------------------------------ colonna: quanto costa */
    '<div class="pila attaccata">' +
      '<div class="carta carta--rilievo" id="acquisto" data-id="' + FERMO.esc(a.id) + '">' +
        '<div class="carta__testa">' + (asta ? 'Asta in corso' : 'Prezzo e conto') + '</div>' +
        '<div class="carta__corpo">' +

          '<div class="riga riga--fra" style="margin-bottom:4px">' +
            '<span class="cifra cifra--piccola">' + FERMO.fmt.euroTondo(corrente) + '</span>' +
            '<span class="piccolo fioco">' + (asta ? 'offerta più alta' : 'IVA esclusa') + '</span>' +
          '</div>' +
          '<p class="piccolo fioco" style="margin-bottom:16px">' + FERMO.esc(notaPrezzo) + '</p>' +

          (a.mod.length > 1 ?
          '<div class="campo">' +
            '<span class="campo__nome">Come vuoi chiuderla</span>' +
            '<div class="riga" style="gap:8px">' + a.mod.map(function (m) {
              return '<button class="chip" type="button" data-formula="' + m + '" aria-pressed="' +
                (m === formulaScelta ? 'true' : 'false') + '">' +
                FERMO.esc(D.formula(m).nome) + '</button>';
            }).join('') + '</div>' +
            '<span class="campo__aiuto" id="nota-formula"></span>' +
          '</div>' : '<p class="campo__aiuto" id="nota-formula" style="margin-top:0"></p>') +

          '<div id="blocco-importo"></div>' +

          '<div class="campo">' +
            '<span class="campo__nome">Servizi</span>' +
            '<label class="spunta"><input type="checkbox" id="opt-perizia" checked> ' +
              'Perizia indipendente (' + FERMO.fmt.euroTondo(D.PERIZIA) + ')</label>' +
            (a.consegna === 'inclusa' ? '' :
            '<label class="spunta"><input type="checkbox" id="opt-trasporto"> ' +
              'Trasporto in Italia (stima ' + FERMO.fmt.euroTondo(D.TRASPORTO) + ')</label>') +
            (a.smontaggio === 'acquirente' || a.smontaggio === 'venditore' ?
            '<label class="spunta"><input type="checkbox" id="opt-smontaggio"> ' +
              'Smontaggio e carico (stima ' + FERMO.fmt.euroTondo(D.SMONTAGGIO) + ')</label>' : '') +
          '</div>' +

          '<table class="tabella tabella--conto" id="conto" style="margin-top:6px"></table>' +

          '<div class="pila pila--fitta" style="margin-top:18px">' +
            '<button class="btn btn--primario btn--largo" type="button" id="compra">Compra</button>' +
            '<button class="btn btn--largo" type="button" data-azione="preferito" id="salva" ' +
              'aria-pressed="' + (FERMO.preferito(a.id) ? 'true' : 'false') + '">' +
              (FERMO.preferito(a.id) ? 'Lo segui ✓' : 'Segui questo annuncio') + '</button>' +
          '</div>' +
          '<p class="campo__aiuto centrato">Nessun addebito: è una demo. ' +
            'La pratica finisce fra le tue.</p>' +
        '</div>' +
      '</div>' +

      '<div class="carta">' +
        '<div class="carta__testa">Il venditore</div>' +
        '<div class="carta__corpo pila pila--fitta">' +
          '<strong>' + FERMO.esc(a.venditore) + '</strong>' +
          '<span class="piccolo tenue">' + FERMO.esc(a.citta) + ' (' + FERMO.esc(a.prov) + ') · ' +
            FERMO.esc(a.regione) + ' · sul mercato dal ' + a.dal + '</span>' +
          (a.recensioni ?
            '<div class="riga riga--fra piccolo"><span class="tenue">Valutazione</span>' +
            '<span class="num grassetto">★ ' + a.rating.toFixed(1) + ' / 5 · ' + a.recensioni + ' vendite</span></div>' : '') +
          '<div class="riga riga--fra piccolo"><span class="tenue">Perché la vende</span>' +
            '<span class="grassetto" style="text-align:right">' + FERMO.esc(D.motivo(a.motivo)) + '</span></div>' +
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
        '<tr><td>Anno di costruzione</td><td class="grassetto">' + (a.anno || '—') + '</td></tr>' +
        (perPezzo != null
          ? '<tr><td>Composizione del lotto</td><td class="grassetto">' +
              FERMO.esc(FERMO.fmt.pezzi(a.pezzi)) + ', si vende in blocco</td></tr>' +
            '<tr><td>Prezzo a pezzo</td><td class="grassetto">' +
              FERMO.esc(FERMO.fmt.euroTondo(perPezzo)) + '</td></tr>'
          : '') +
        '<tr><td>Stato dichiarato</td><td class="grassetto">' + FERMO.esc(cond.nome) + '</td></tr>' +
        '<tr><td>Ritirabile</td><td class="grassetto">' + FERMO.esc(testoRitiro) + '</td></tr>' +
        '<tr><td>Consegna</td><td class="grassetto">' + FERMO.esc(CONSEGNA[a.consegna] || '—') + '</td></tr>' +
        '<tr><td>Smontaggio</td><td class="grassetto">' + FERMO.esc(SMONTAGGIO[a.smontaggio] || '—') + '</td></tr>' +
        '<tr><td>Garanzia</td><td class="grassetto">' + FERMO.esc(testoGaranzia) + '</td></tr>' +
        '<tr><td>Motivo della vendita</td><td class="grassetto">' + FERMO.esc(D.motivo(a.motivo)) + '</td></tr>' +
      '</tbody></table>' +
    '</div></div>' +

    '<div class="griglia griglia--auto" style="margin-top:16px">' +
      '<div class="carta"><div class="carta__testa">Compreso nel prezzo</div>' +
        '<div class="carta__corpo">' + elenco(a.incluso, true) + '</div></div>' +
      '<div class="carta"><div class="carta__testa">A carico dell\'acquirente</div>' +
        '<div class="carta__corpo">' + elenco(a.escluso, false) + '</div></div>' +
    '</div>' +

    (a.certificazioni.length ?
    '<div class="carta" style="margin-top:16px"><div class="carta__testa">Documenti e conformità</div>' +
      '<div class="carta__corpo riga" style="gap:8px">' + a.certificazioni.map(function (c) {
        return '<span class="pillola pillola--verde">' + FERMO.esc(c) + '</span>';
      }).join('') + '</div></div>' : '') +
  '</section>' +

  '<section class="sezione">' +
    '<div class="capo"><h2>Chi ha comprato da questo venditore</h2>' +
      '<span class="capo__nota">' + (a.recensioni ? a.recensioni + ' vendite valutate' : 'nessuno storico') + '</span></div>' +
    '<div class="carta"><div class="carta__corpo">' +
      (a.recensioni ?
        '<div class="riga" style="gap:14px;padding-bottom:14px;margin-bottom:16px;' +
             'border-bottom:1px solid var(--bordo)">' +
          '<span class="cifra cifra--piccola">' + a.rating.toFixed(1) + '</span>' +
          '<div>' + FERMO.stelle(a.rating) +
            '<div class="piccolo fioco">su ' + a.recensioni + ' vendite concluse</div></div>' +
        '</div>' : '') +
      FERMO.muroRecensioni(a) +
    '</div></div>' +
  '</section>' +

  '<section class="sezione">' +
    '<div class="capo"><h2>Annunci simili</h2></div>' +
    '<div class="elenco-beni" id="simili"></div>' +
  '</section>';

  /* barra fissa in basso: il prezzo e l'azione restano sempre a portata */
  var barra = document.createElement('div');
  barra.className = 'azioni-fisse';
  barra.innerHTML =
    '<div class="azioni-fisse__prezzo">' +
      '<div class="grassetto num" style="font-size:18px">' + FERMO.fmt.euroTondo(corrente) + '</div>' +
      '<div class="piccolo fioco">' + (asta ? 'offerta più alta' : 'IVA esclusa') + '</div>' +
    '</div>' +
    '<button class="btn btn--primario spinta" type="button" id="compra-fisso">Compra</button>';
  document.body.appendChild(barra);
  document.body.classList.add('ha-azioni');

  /* il pulsante «segui» dice anche in che stato è finito */
  document.addEventListener('fermo:preferiti', function () {
    var b = g('salva');
    if (b) b.textContent = b.getAttribute('aria-pressed') === 'true' ? 'Lo segui ✓' : 'Segui questo annuncio';
  });

  /* ------------------------------------------------- importo per formula -- */
  /* Prezzo fisso: non c'è niente da scrivere, il numero è quello.
     Trattativa: scrivi la tua proposta e vedi subito quanto stai chiedendo.
     Asta: il rilancio parte dal minimo consentito.                          */
  var minimoRilancio = asta ? corrente + a.asta.rilancio : 0;

  function corpoImporto() {
    if (formulaScelta === 'fisso') {
      return '<div class="avviso avviso--ok" style="margin-bottom:16px">' +
        '<span><strong>Prezzo bloccato.</strong> ' + FERMO.fmt.euroTondo(a.prezzo) +
        ' più IVA: chi accetta per primo se la prende.</span></div>';
    }
    if (formulaScelta === 'asta') {
      return '<label class="campo"><span class="campo__nome">Il tuo rilancio (€)</span>' +
        '<input type="number" id="importo" min="' + minimoRilancio + '" step="' + a.asta.rilancio +
          '" value="' + minimoRilancio + '">' +
        '<span class="campo__aiuto" id="nota-importo">Minimo ' + FERMO.fmt.euroTondo(minimoRilancio) +
          ': offerta più alta più un rilancio da ' + FERMO.fmt.euroTondo(a.asta.rilancio) + '.</span>' +
      '</label>';
    }
    var partenza = Math.round(a.prezzo * 0.9 / 100) * 100;
    return '<label class="campo"><span class="campo__nome">La tua proposta (€)</span>' +
      '<input type="number" id="importo" min="0" step="100" value="' + partenza + '">' +
      '<span class="campo__aiuto" id="nota-importo">—</span>' +
    '</label>';
  }

  function importoAttuale() {
    if (formulaScelta === 'fisso') return a.prezzo;
    var campo = g('importo');
    return campo ? (parseFloat(campo.value) || 0) : 0;
  }

  var ETICHETTA = { fisso: 'Compra ora', trattativa: 'Invia la proposta', asta: 'Rilancia' };

  /* -------------------------------------------------------- dati derivati */
  var elConto = g('conto');
  var notaFormula = g('nota-formula');
  var pannelloAcq = g('acquisto');

  function extra() {
    var t = g('opt-trasporto'), s = g('opt-smontaggio'), p = g('opt-perizia');
    return {
      perizia: !!(p && p.checked),
      trasporto: !!(t && t.checked),
      smontaggio: !!(s && s.checked)
    };
  }

  function riga(k, v) {
    return '<tr><td>' + k + '</td><td class="num">' + v + '</td></tr>';
  }

  function aggiorna() {
    var importo = importoAttuale();
    var p = FERMO.preventivo(a, importo, extra());

    elConto.innerHTML =
      riga(formulaScelta === 'asta' ? 'Rilancio' : formulaScelta === 'trattativa' ? 'La tua proposta' : 'Prezzo',
        FERMO.fmt.euroTondo(p.prezzo)) +
      (p.perizia ? riga('Perizia indipendente', FERMO.fmt.euro(p.perizia)) : '') +
      (p.trasporto ? riga('Trasporto (stima)', FERMO.fmt.euro(p.trasporto)) : '') +
      (p.smontaggio ? riga('Smontaggio e carico (stima)', FERMO.fmt.euro(p.smontaggio)) : '') +
      riga('IVA 22 %', FERMO.fmt.euro(p.iva)) +
      riga({ fisso: 'Totale', trattativa: 'Totale se accettata', asta: 'Totale se te la aggiudichi' }[formulaScelta],
        FERMO.fmt.euroTondo(p.totale));

    var nota = g('nota-importo');
    if (nota) {
      if (formulaScelta === 'trattativa') {
        var scarto = 1 - importo / a.prezzo;
        nota.textContent = importo > 0
          ? 'Richiesto ' + FERMO.fmt.euroTondo(a.prezzo) + ': stai offrendo il ' +
            Math.abs(scarto * 100).toFixed(1) + ' % ' + (scarto >= 0 ? 'in meno' : 'in più') +
            (scarto > 0.2 ? '. Sotto il 20 % le proposte vengono raramente accettate.' : '.')
          : 'Scrivi quanto sei disposto a pagare.';
      } else if (formulaScelta === 'asta' && importo < minimoRilancio) {
        nota.textContent = 'Troppo basso: il minimo è ' + FERMO.fmt.euroTondo(minimoRilancio) + '.';
      }
    }

    if (notaFormula) notaFormula.textContent = D.formula(formulaScelta).nota;

    var etichetta = ETICHETTA[formulaScelta];
    g('compra').textContent = etichetta;
    g('compra-fisso').textContent = etichetta;
    return p;
  }

  function rifaiImporto() {
    g('blocco-importo').innerHTML = corpoImporto();
    aggiorna();
  }

  /* -------------------------------------------------------- interazioni -- */
  pannelloAcq.addEventListener('input', aggiorna);
  pannelloAcq.addEventListener('change', aggiorna);
  pannelloAcq.addEventListener('click', function (e) {
    var b = e.target.closest('[data-formula]');
    if (!b) return;
    formulaScelta = b.getAttribute('data-formula');
    Array.prototype.forEach.call(pannelloAcq.querySelectorAll('[data-formula]'), function (x) {
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
    });
    rifaiImporto();
  });

  var innesto = g('calendario-innesto');
  innesto.addEventListener('click', function (e) {
    var b = e.target.closest('.giorno');
    if (!b || b.disabled) return;
    visitaScelta = parseInt(b.getAttribute('data-i'), 10);
    innesto.innerHTML = grigliaCalendario();
    var giorno = cal[visitaScelta];
    g('nota-visita').textContent = 'Visione richiesta per ' + FERMO.fmt.data(giorno.data) +
      (giorno.stato === 'mezza' ? ', al mattino.' : '.') +
      (giorno.ritirabile ? ' Quel giorno la macchina è già ritirabile.'
                         : ' Quel giorno si può vedere ma non ancora portare via.');
  });

  function concludi() {
    var importo = importoAttuale();
    if (importo <= 0) {
      FERMO.brindisi('Importo non valido', 'Scrivi quanto sei disposto a pagare.');
      return;
    }
    if (formulaScelta === 'asta' && importo < minimoRilancio) {
      FERMO.brindisi('Rilancio troppo basso', 'Il minimo è ' + FERMO.fmt.euroTondo(minimoRilancio) + '.');
      return;
    }
    var p = aggiorna();
    var codice = FERMO.nuovoAcquisto({
      assetId: a.id,
      titolo: a.titolo,
      venditore: a.venditore,
      citta: a.citta,
      formula: formulaScelta,
      importo: importo,
      totale: p.totale,
      visita: visitaScelta !== null ? cal[visitaScelta].data.toISOString() : null,
      tipo: formulaScelta === 'fisso' ? 'acquisto' : formulaScelta === 'asta' ? 'rilancio' : 'proposta'
    });
    var messaggi = {
      fisso:      ['Acquisto avviato · ' + codice, 'Il venditore conferma la disponibilità entro 24 ore.'],
      trattativa: ['Proposta inviata · ' + codice, 'Il venditore risponde entro 48 ore.'],
      asta:       ['Rilancio registrato · ' + codice, 'Ti avvisiamo se qualcuno ti supera.']
    };
    FERMO.brindisi(messaggi[formulaScelta][0], messaggi[formulaScelta][1]);
    setTimeout(function () { location.href = 'acquisti.html'; }, 1100);
  }

  g('compra').addEventListener('click', concludi);
  g('compra-fisso').addEventListener('click', concludi);

  /* ------------------------------------------------------------- simili --
     Con un listino che va dal tornio al bancale di tastiere, «stessa regione»
     non è più una somiglianza: accostare un centro di lavoro a un lotto di
     monitor perché stanno entrambi in Lombardia non aiuta nessuno. Conta
     prima la categoria, poi la famiglia, e solo dopo la vicinanza. */
  var famiglia = D.famigliaDi(a);
  var simili = FERMO.catalogo()
    .filter(function (x) {
      return x.id !== a.id &&
        (x.cat === a.cat || D.famigliaDi(x) === famiglia || x.regione === a.regione);
    })
    .map(function (x) {
      var punti = (x.cat === a.cat ? 100 : 0) +
                  (D.famigliaDi(x) === famiglia ? 40 : 0) +
                  (x.regione === a.regione ? 12 : 0) +
                  /* a pari categoria, il prezzo più vicino a questo */
                  Math.max(0, 10 - Math.abs(Math.log((FERMO.prezzoCorrente(x) || 1) /
                                                     (corrente || 1))) * 4);
      return { bene: x, punti: punti };
    })
    .sort(function (x, y) { return y.punti - x.punti; })
    .slice(0, 4)
    .map(function (v) { return v.bene; });
  g('simili').innerHTML = simili.length
    ? simili.map(FERMO.scheda).join('')
    : '<p class="tenue">Nessun annuncio simile a listino.</p>';

  rifaiImporto();
})();
