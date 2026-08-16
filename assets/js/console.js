/* =============================================================================
   FERMO — console del proprietario
   Grafici a serie singola: nessuna legenda dove il titolo basta, etichetta
   diretta solo sull'estremo, tabella dei dati sempre disponibile.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('console.html');

  var D = FERMO.D;
  var g = function (id) { return document.getElementById(id); };

  /* Parco dimostrativo + tutto ciò che l'utente ha pubblicato in questa demo */
  var DEMO = ['FRM-CNC-0142', 'FRM-TAG-0207', 'FRM-MAG-0021', 'FRM-VEI-0092', 'FRM-ADD-0455'];
  var miei = (FERMO.store.tutto().annunci || []);
  var parco = miei.concat(DEMO.map(FERMO.trova).filter(Boolean));

  /* ------------------------------------------------------------- ricavi -- */
  var serie = new Array(12).fill(0);
  parco.forEach(function (a) {
    D.storicoRicavi(a.id).forEach(function (v, i) { serie[i] += v; });
  });
  var totale = serie.reduce(function (t, v) { return t + v; }, 0);
  var ultima = serie[11], penultima = serie[10] || 1;
  var delta = (ultima - penultima) / penultima;

  g('periodo').textContent = parco.length + ' beni · 12 settimane';
  g('ricavo-totale').textContent = FERMO.fmt.euroTondo(totale);
  g('ricavo-nota').innerHTML = 'Ultima settimana ' + FERMO.fmt.euroTondo(ultima) +
    ', <strong style="color:' + (delta >= 0 ? 'var(--verde)' : 'var(--allarme)') + '">' +
    (delta >= 0 ? '▲ +' : '▼ ') + (delta * 100).toFixed(1) + ' %</strong> sulla precedente. ' +
    'Al netto della commissione del 9 %: ' + FERMO.fmt.euroTondo(totale * 0.91) + '.';

  /* ------------------------------------------------------------ tessere -- */
  var oreVendute = parco.reduce(function (t, a) { return t + (a.oreSettimana - a.oreLibere); }, 0);
  var oreTotali = parco.reduce(function (t, a) { return t + a.oreSettimana; }, 0);
  var oreFerme = parco.reduce(function (t, a) { return t + a.oreLibere; }, 0);
  var satMedia = oreTotali ? oreVendute / oreTotali : 0;

  function tariffaOraria(a) {
    switch (a.prezzo.unita) {
      case 'ora': return a.prezzo.valore;
      case 'giorno': return a.prezzo.valore / 8;
      case 'settimana': return a.prezzo.valore / 40;
      case 'mese': return a.prezzo.valore / 170;
      case 'corpo': return 0;
      default: return a.prezzo.valore * 1.5;
    }
  }
  var mancato = parco.reduce(function (t, a) { return t + a.oreLibere * tariffaOraria(a); }, 0);

  g('t-ore').textContent = FERMO.fmt.num(oreVendute);
  g('t-ore-nota').textContent = 'su ' + FERMO.fmt.num(oreTotali) + ' disponibili';
  g('t-sat').textContent = FERMO.fmt.pct(satMedia);
  g('t-sat-nota').textContent = oreFerme + ' ore ferme a settimana';
  g('t-persa').textContent = FERMO.fmt.euroTondo(mancato);

  /* -------------------------------------------------- grafico settimane -- */
  var oggi = new Date();
  var datiSettimane = serie.map(function (v, i) {
    var d = new Date(oggi.getTime() - (11 - i) * 7 * 86400000);
    return { nome: FERMO.fmt.dataCorta(d), valore: v };
  });

  g('grafico-settimane').innerHTML = FERMO.colonne(datiSettimane, {
    formato: FERMO.fmt.euroTondo,
    descrizione: 'Transato lordo per ciascuna delle ultime 12 settimane, in euro'
  });
  g('tabella-settimane').innerHTML = FERMO.tabellaDati(datiSettimane,
    ['Settimana', 'Transato'], { formato: FERMO.fmt.euroTondo });

  /* lettura al passaggio del mouse e da tastiera */
  var letto = g('letto-settimane');
  var colonne = g('grafico-settimane').querySelectorAll('.colonna');
  Array.prototype.forEach.call(colonne, function (c, i) {
    var d = datiSettimane[i];
    c.setAttribute('tabindex', '0');
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', 'Settimana del ' + d.nome + ': ' + FERMO.fmt.euroTondo(d.valore));
    function mostra() {
      letto.innerHTML = '<strong>Settimana del ' + d.nome + '</strong> — ' +
        '<span class="numerico">' + FERMO.fmt.euroTondo(d.valore) + '</span> lordi, ' +
        '<span class="numerico">' + FERMO.fmt.euroTondo(d.valore * 0.91) + '</span> netti.';
    }
    c.addEventListener('mouseenter', mostra);
    c.addEventListener('focus', mostra);
    c.addEventListener('mouseleave', function () {
      letto.textContent = 'Passa sopra una colonna per leggere il valore.';
    });
  });

  /* ------------------------------------------------- grafico categorie -- */
  var perCat = {};
  parco.forEach(function (a) {
    var k = D.categoria(a.cat).breve;
    perCat[k] = (perCat[k] || 0) + (a.oreSettimana - a.oreLibere);
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

  g('grafico-categorie').innerHTML = FERMO.barre(mostrate, {
    formato: function (v) { return v + ' h'; }
  });
  g('legenda-categorie').innerHTML = mostrate.map(function (d) {
    return '<span><i style="background:' + d.colore + '"></i>' + FERMO.esc(d.nome) + '</span>';
  }).join('');
  g('tabella-categorie').innerHTML = FERMO.tabellaDati(ordinate,
    ['Categoria', 'Ore vendute / sett.'], { formato: function (v) { return v + ' h'; } });

  /* -------------------------------------------------------------- parco -- */
  g('tabella-parco').querySelector('tbody').innerHTML = parco.map(function (a) {
    var sat = FERMO.saturazione(a);
    var perso = a.oreLibere * tariffaOraria(a);
    return '<tr>' +
      '<td class="numerico">' + FERMO.esc(a.id) + (a.origine === 'utente' ?
        ' <span class="timbro timbro--hivis">tuo</span>' : '') + '</td>' +
      '<td><a href="asset.html?id=' + encodeURIComponent(a.id) + '">' + FERMO.esc(a.titolo) + '</a>' +
        '<div class="piccolo tenue">' + FERMO.esc(a.citta) + '</div></td>' +
      '<td style="min-width:170px">' +
        '<div class="misura__traccia" role="img" aria-label="Occupazione ' + FERMO.fmt.pct(sat) + '">' +
          '<div class="misura__pieno" data-livello="' + FERMO.livello(sat) + '" style="width:' +
          (sat * 100).toFixed(1) + '%"></div></div>' +
        '<div class="piccolo tenue numerico" style="margin-top:3px">' + FERMO.fmt.pct(sat) + '</div>' +
      '</td>' +
      '<td class="num numerico">' + a.oreLibere + ' h</td>' +
      '<td class="num numerico">' + FERMO.fmt.euroTondo(perso) + '</td>' +
      '<td class="num"><a class="piccolo" href="asset.html?id=' + encodeURIComponent(a.id) + '">apri →</a></td>' +
    '</tr>';
  }).join('');

  /* ---------------------------------------------------------- richieste -- */
  var CLIENTI = ['Studio Tecnico Ferrari', 'Nautica Sanremo srl', 'Prototipi Bianchi',
                 'Cooperativa Agricola Sud', 'Elettromeccanica Ionica', 'Design Lab Milano',
                 'Restauri Monumentali spa', 'Impianti Rossi & C.'];

  function richiesteGenerate() {
    var out = [];
    parco.forEach(function (a, k) {
      var r = D.rng(a.id + '|req');
      var quante = Math.floor(r() * 3);
      for (var i = 0; i < quante; i++) {
        var q = Math.ceil(r() * 12) + 2;
        var giorni = Math.ceil(r() * 20) + a.preavviso;
        var p = FERMO.preventivo(a, q, { assicurazione: r() > 0.5, trasporto: r() > 0.75 });
        out.push({
          codice: 'REQ-' + (100 + k * 10 + i),
          assetId: a.id,
          titolo: a.titolo,
          cliente: CLIENTI[Math.floor(r() * CLIENTI.length)],
          quando: new Date(Date.now() + giorni * 86400000),
          quantita: q,
          unita: a.prezzo.unita,
          importo: p.totale
        });
      }
    });
    return out;
  }

  var richieste = richiesteGenerate();
  var decisioni = FERMO.store.tutto().decisioni || {};

  function disegnaRichieste() {
    var corpo = g('tabella-richieste').querySelector('tbody');
    if (!richieste.length) {
      corpo.innerHTML = '<tr><td colspan="7"><div class="vuoto" style="border:0;padding:26px">' +
        'Nessuna richiesta aperta sul parco.</div></td></tr>';
      g('conteggio-richieste').textContent = '0 aperte';
      g('t-richieste').textContent = '0';
      return;
    }
    corpo.innerHTML = richieste.map(function (r) {
      var d = decisioni[r.codice];
      var timbro = d === 'accettata'
        ? '<span class="timbro timbro--verde">Accettata</span>'
        : d === 'rifiutata'
          ? '<span class="timbro timbro--tenue">Rifiutata</span>'
          : '<span class="timbro timbro--hivis">Da evadere</span>';
      var comandi = d
        ? '<span class="piccolo tenue">—</span>'
        : '<div class="riga" style="gap:6px;flex-wrap:nowrap">' +
          '<button class="bottone bottone--piccolo bottone--primario" data-decidi="accettata" data-cod="' +
            r.codice + '">Accetta</button>' +
          '<button class="bottone bottone--piccolo bottone--nudo" data-decidi="rifiutata" data-cod="' +
            r.codice + '">Rifiuta</button></div>';
      return '<tr>' +
        '<td class="numerico">' + r.codice + '</td>' +
        '<td><a href="asset.html?id=' + encodeURIComponent(r.assetId) + '">' +
          FERMO.esc(r.titolo.slice(0, 34)) + (r.titolo.length > 34 ? '…' : '') + '</a>' +
          '<div class="piccolo tenue numerico">' + FERMO.esc(FERMO.fmt.conta(r.quantita, r.unita)) +
          '</div></td>' +
        '<td>' + FERMO.esc(r.cliente) + '</td>' +
        '<td class="numerico">' + FERMO.fmt.data(r.quando) + '</td>' +
        '<td class="num numerico">' + FERMO.fmt.euro(r.importo) + '</td>' +
        '<td>' + timbro + '</td>' +
        '<td class="num">' + comandi + '</td>' +
      '</tr>';
    }).join('');

    var aperte = richieste.filter(function (r) { return !decisioni[r.codice]; });
    var valore = aperte.reduce(function (t, r) { return t + r.importo; }, 0);
    g('conteggio-richieste').textContent = aperte.length + ' aperte · ' + FERMO.fmt.euroTondo(valore);
    g('t-richieste').textContent = aperte.length;
  }

  g('tabella-richieste').addEventListener('click', function (e) {
    var b = e.target.closest('[data-decidi]');
    if (!b) return;
    var cod = b.getAttribute('data-cod');
    var scelta = b.getAttribute('data-decidi');
    decisioni[cod] = scelta;
    FERMO.store.aggiorna(function (s) {
      s.decisioni = s.decisioni || {};
      s.decisioni[cod] = scelta;
    });
    FERMO.brindisi(scelta === 'accettata' ? 'Richiesta accettata' : 'Richiesta rifiutata',
      cod + ' — il cliente riceve la notifica e l\'importo resta vincolato fino alla consegna.');
    disegnaRichieste();
  });

  disegnaRichieste();
})();
