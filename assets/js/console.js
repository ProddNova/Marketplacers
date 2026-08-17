/* =============================================================================
   FERMO — console del venditore
   Le proposte da decidere vengono prima dei grafici: sono l'unica cosa su cui
   si deve decidere qualcosa. Niente tabelle da far scorrere di lato: ogni riga
   si impila da sola sul telefono.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('console.html');

  var D = FERMO.D;
  var g = function (id) { return document.getElementById(id); };

  /* Parco dimostrativo + tutto ciò che l'utente ha messo in vendita qui */
  var DEMO = ['FRM-CNC-0142', 'FRM-TAG-0207', 'FRM-DEF-0501', 'FRM-VEI-0092', 'FRM-ADD-0455'];
  var miei = (FERMO.store.tutto().annunci || []);
  var parco = miei.concat(DEMO.map(FERMO.trova).filter(Boolean));

  /* ------------------------------------------------ valore e interesse -- */
  var valore = parco.reduce(function (t, a) { return t + FERMO.prezzoCorrente(a); }, 0);
  var netto = FERMO.nettoVenditore(valore);

  var serie = new Array(12).fill(0);
  parco.forEach(function (a) {
    D.storicoVisite(a.id).forEach(function (v, i) { serie[i] += v; });
  });
  var visiteTotali = serie.reduce(function (t, v) { return t + v; }, 0);
  var ultima = serie[11], penultima = serie[10] || 1;
  var delta = (ultima - penultima) / penultima;

  var interessi = parco.map(function (a) { return D.interesse(a.id); });
  var giorniMedi = Math.round(
    interessi.reduce(function (t, i) { return t + i.giorni; }, 0) / (interessi.length || 1));
  var piuVecchio = parco.reduce(function (best, a, i) {
    return interessi[i].giorni > interessi[best].giorni ? i : best;
  }, 0);

  g('periodo').textContent = parco.length + ' macchine in vendita · ultime 12 settimane';
  g('valore-totale').textContent = FERMO.fmt.euroTondo(valore);
  g('valore-nota').innerHTML = 'Se vendi tutto ti restano ' +
    '<strong>' + FERMO.fmt.euroTondo(netto) + '</strong> al netto della commissione del 6 %. ' +
    'Visite alle schede <strong style="color:' + (delta >= 0 ? 'var(--verde)' : 'var(--rosso)') + '">' +
    (delta >= 0 ? '▲ +' : '▼ −') + Math.abs(delta * 100).toFixed(1) + ' %</strong> ' +
    'sulla settimana precedente.';

  g('t-annunci').textContent = FERMO.fmt.num(parco.length);
  g('t-annunci-nota').textContent = parco.filter(FERMO.inAsta).length + ' in asta';
  g('t-visite').textContent = FERMO.fmt.num(visiteTotali);
  g('t-giorni').textContent = FERMO.fmt.num(giorniMedi);
  g('t-giorni-nota').textContent = 'la più vecchia da ' +
    FERMO.fmt.giorni(interessi[piuVecchio].giorni);

  /* ---------------------------------------------------------- proposte -- */
  var COMPRATORI = ['Studio Tecnico Ferrari', 'Nautica Sanremo srl', 'Prototipi Bianchi',
                    'Cooperativa Agricola Sud', 'Elettromeccanica Ionica', 'Design Lab Milano',
                    'Restauri Monumentali spa', 'Impianti Rossi & C.'];

  function proposteGenerate() {
    var out = [];
    parco.forEach(function (a, k) {
      var r = D.rng(a.id + '|off');
      var quante = Math.floor(r() * 3);
      var base = FERMO.prezzoCorrente(a);
      for (var i = 0; i < quante; i++) {
        var asta = FERMO.inAsta(a);
        var precedente = asta ? base + i * a.asta.rilancio : null;
        var importo = asta
          ? precedente + a.asta.rilancio
          : Math.round(base * (0.72 + r() * 0.23) / 100) * 100;
        out.push({
          codice: 'OFF-' + (100 + k * 10 + i),
          assetId: a.id,
          titolo: a.titolo,
          compratore: COMPRATORI[Math.floor(r() * COMPRATORI.length)],
          scade: new Date(Date.now() + (1 + Math.ceil(r() * 4)) * 86400000),
          importo: importo,
          precedente: precedente,
          richiesto: a.prezzo,
          tipo: asta ? 'rilancio' : (a.mod.indexOf('fisso') !== -1 && r() > 0.6 ? 'acquisto' : 'proposta'),
          visita: r() > 0.45
        });
      }
    });
    return out;
  }

  var proposte = proposteGenerate();
  var decisioni = FERMO.store.tutto().decisioni || {};

  var ETICHETTA = {
    rilancio: '<span class="pillola pillola--ambra">Rilancio d\'asta</span>',
    acquisto: '<span class="pillola pillola--verde">Compra al prezzo esposto</span>',
    proposta: '<span class="pillola pillola--blu">Proposta</span>'
  };

  function disegnaProposte() {
    var box = g('lista-proposte');
    if (!proposte.length) {
      box.innerHTML = '<div class="vuoto"><h3>Nessuna proposta aperta</h3>' +
        '<p class="piccolo">Quando qualcuno fa un\'offerta su una tua macchina, compare qui.</p></div>';
      g('conteggio-proposte').textContent = '0 aperte';
      g('t-proposte').textContent = '0';
      return;
    }

    /* prima quelle su cui c'è ancora da decidere */
    var ordinate = proposte.slice().sort(function (x, y) {
      return (decisioni[x.codice] ? 1 : 0) - (decisioni[y.codice] ? 1 : 0);
    });

    box.innerHTML = ordinate.map(function (r) {
      var d = decisioni[r.codice];
      var pillola = d === 'accettata'
        ? '<span class="pillola pillola--verde">Accettata</span>'
        : d === 'rifiutata'
          ? '<span class="pillola">Rifiutata</span>'
          : '<span class="pillola pillola--ambra">Da decidere</span>';
      var scarto = r.richiesto ? 1 - r.importo / r.richiesto : 0;
      var sotto = r.tipo === 'rilancio'
        ? FERMO.fmt.euroTondo(r.importo - r.precedente) + ' sopra l\'offerta precedente'
        : scarto > 0.005 ? '−' + (scarto * 100).toFixed(0) + ' % dal richiesto'
                         : 'al prezzo esposto';
      return '<article class="carta">' +
        '<div class="carta__testa">' +
          '<span class="codice">' + FERMO.esc(r.codice) + '</span>' +
          '<span class="spinta">' + pillola + '</span>' +
        '</div>' +
        '<div class="carta__corpo">' +
          '<div class="riga riga--fra" style="align-items:flex-start;gap:14px">' +
            '<div style="min-width:0">' +
              '<a href="asset.html?id=' + encodeURIComponent(r.assetId) + '" class="grassetto tocco">' +
                FERMO.esc(r.titolo) + '</a>' +
              '<div class="piccolo tenue" style="margin-top:4px">' + FERMO.esc(r.compratore) + '</div>' +
            '</div>' +
            '<div style="text-align:right;flex:none">' +
              '<div class="grassetto num" style="font-size:17px">' + FERMO.fmt.euroTondo(r.importo) + '</div>' +
              '<div class="piccolo fioco num">' + FERMO.esc(sotto) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="riga" style="gap:6px;margin-top:10px">' + ETICHETTA[r.tipo] +
            (r.visita ? '<span class="pillola">Ha già visto la macchina</span>' : '') + '</div>' +
          '<div class="piccolo tenue" style="margin-top:10px">Scade il ' +
            FERMO.fmt.data(r.scade) + '</div>' +
          (d ? '' :
          '<div class="riga" style="gap:8px;margin-top:14px">' +
            '<button class="btn btn--primario btn--piccolo" type="button" data-decidi="accettata" ' +
              'data-cod="' + r.codice + '">Accetta</button>' +
            '<button class="btn btn--piccolo" type="button" data-decidi="rifiutata" ' +
              'data-cod="' + r.codice + '">Rifiuta</button>' +
          '</div>') +
        '</div>' +
      '</article>';
    }).join('');

    var aperte = proposte.filter(function (r) { return !decisioni[r.codice]; });
    var somma = aperte.reduce(function (t, r) { return t + r.importo; }, 0);
    g('conteggio-proposte').textContent = aperte.length + ' aperte · ' + FERMO.fmt.euroTondo(somma);
    g('t-proposte').textContent = aperte.length;
    /* il bollo in navigazione legge questo conteggio anche dalle altre pagine */
    FERMO.store.aggiorna(function (s) { s.offerteAperte = aperte.length; });
  }

  g('lista-proposte').addEventListener('click', function (e) {
    var b = e.target.closest('[data-decidi]');
    if (!b) return;
    var cod = b.getAttribute('data-cod');
    var scelta = b.getAttribute('data-decidi');
    decisioni[cod] = scelta;
    FERMO.store.aggiorna(function (s) {
      s.decisioni = s.decisioni || {};
      s.decisioni[cod] = scelta;
    });
    FERMO.brindisi(scelta === 'accettata' ? 'Proposta accettata' : 'Proposta rifiutata',
      cod + ' — il compratore riceve la notifica.');
    disegnaProposte();
  });

  disegnaProposte();

  /* -------------------------------------------------- grafico settimane -- */
  var oggi = new Date();
  var datiSettimane = serie.map(function (v, i) {
    var d = new Date(oggi.getTime() - (11 - i) * 7 * 86400000);
    return { nome: FERMO.fmt.dataCorta(d), valore: v };
  });

  g('grafico-settimane').innerHTML = FERMO.colonne(datiSettimane, {
    formato: FERMO.fmt.num,
    descrizione: 'Visite alle schede in ciascuna delle ultime 12 settimane'
  });
  g('tabella-settimane').innerHTML = FERMO.tabellaDati(datiSettimane,
    ['Settimana', 'Visite'], { formato: FERMO.fmt.num });

  /* lettura al tocco, col mouse e da tastiera */
  var letto = g('letto-settimane');
  var colonne = g('grafico-settimane').querySelectorAll('.colonna');
  Array.prototype.forEach.call(colonne, function (c, i) {
    var d = datiSettimane[i];
    c.setAttribute('tabindex', '0');
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', 'Settimana del ' + d.nome + ': ' + FERMO.fmt.num(d.valore) + ' visite');
    function mostra() {
      letto.innerHTML = '<strong>Settimana del ' + d.nome + '</strong> — ' +
        '<span class="num">' + FERMO.fmt.num(d.valore) + '</span> visite alle tue schede, ' +
        'circa <span class="num">' + FERMO.fmt.num(Math.round(d.valore / 22)) + '</span> contatti.';
    }
    c.addEventListener('mouseenter', mostra);
    c.addEventListener('click', mostra);
    c.addEventListener('focus', mostra);
    c.addEventListener('mouseleave', function () {
      letto.textContent = 'Tocca una colonna per leggere il valore.';
    });
  });

  /* ------------------------------------------------- grafico categorie -- */
  var perCat = {};
  parco.forEach(function (a) {
    var k = D.categoria(a.cat).breve;
    perCat[k] = (perCat[k] || 0) + FERMO.prezzoCorrente(a);
  });
  var ordinate = Object.keys(perCat)
    .map(function (k) { return { nome: k, valore: perCat[k] }; })
    .sort(function (x, y) { return y.valore - x.valore; });

  /* Tre slot categoriali validati; il resto confluisce in "Altro". */
  var COLORI = ['var(--serie-1)', 'var(--serie-2)', 'var(--serie-3)'];
  var mostrate = ordinate.slice(0, 3).map(function (d, i) {
    return { nome: d.nome, valore: d.valore, colore: COLORI[i] };
  });
  var resto = ordinate.slice(3);
  if (resto.length) {
    mostrate.push({
      nome: 'Altro (' + resto.length + ')',
      valore: resto.reduce(function (t, d) { return t + d.valore; }, 0),
      colore: 'var(--serie-altro)'
    });
  }

  g('grafico-categorie').innerHTML = FERMO.barre(mostrate, { formato: FERMO.fmt.euroTondo });
  g('tabella-categorie').innerHTML = FERMO.tabellaDati(ordinate,
    ['Categoria', 'Valore a listino'], { formato: FERMO.fmt.euroTondo });

  /* -------------------------------------------------------------- parco -- */
  g('lista-parco').innerHTML = parco.map(function (a, i) {
    var cond = D.condizione(a.condizione);
    var int = interessi[i];
    var aperte = proposte.filter(function (p) {
      return p.assetId === a.id && !decisioni[p.codice];
    }).length;
    return '<div class="voce-dati">' +
      '<div class="voce-dati__nome">' +
        '<a href="asset.html?id=' + encodeURIComponent(a.id) + '" class="grassetto tocco">' +
          FERMO.esc(a.titolo) + '</a>' +
        (a.origine === 'utente' ? ' <span class="pillola pillola--accento">tuo</span>' : '') +
        (FERMO.inAsta(a) ? ' <span class="pillola pillola--ambra">asta</span>' : '') +
        '<div class="piccolo fioco">' + FERMO.esc(a.citta) + ' · ' + FERMO.esc(a.id) +
          ' · ' + int.visite + ' visite · ' + int.salvati + ' la seguono</div>' +
        '<div style="margin-top:8px">' +
          '<div class="metro__traccia" role="img" aria-label="Stato ' + FERMO.esc(cond.nome) + '">' +
            '<div class="metro__pieno" data-livello="' + FERMO.livello(cond.quota) + '" style="width:' +
            (cond.quota * 100).toFixed(1) + '%"></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="voce-dati__coda">' +
        '<span class="num tenue">' + FERMO.esc(cond.nome) + ' · ' + FERMO.fmt.giorni(int.giorni) + '</span>' +
        '<span class="num grassetto">' + FERMO.fmt.euroTondo(FERMO.prezzoCorrente(a)) +
          (aperte ? ' <span class="pillola pillola--ambra">' + aperte + '</span>' : '') + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
})();
