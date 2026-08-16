/* =============================================================================
   FERMO — nucleo comune
   Stato locale, formattazione, testata/piede, glifi tecnici, grafici.
   Nessuna dipendenza, nessun modulo: si apre anche facendo doppio clic sui file.
   ========================================================================== */
(function (global) {
  'use strict';

  var D = global.FERMO_DATA;
  var CHIAVE = 'fermo.v1';

  /* ====================================================== STATO LOCALE ===== */
  var vuoto = {
    preferiti: [], prenotazioni: [], annunci: [], tema: null, visti: [],
    ruolo: 'cliente',      /* cliente | fornitore */
    messaggi: {},          /* codice ordine → elenco messaggi */
    decisioni: {},         /* codice richiesta → accettata | rifiutata */
    richiesteAperte: 0,    /* conteggio per il bollo in testata */
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

  /* Catalogo = dataset di base + annunci pubblicati dall'utente in questa demo */
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

  var UNITA = {
    ora:        { suffisso: '/ora',            quantita: 'Ore',        singolo: 'ora',       plurale: 'ore' },
    giorno:     { suffisso: '/giorno',         quantita: 'Giorni',     singolo: 'giorno',    plurale: 'giorni' },
    settimana:  { suffisso: '/settimana',      quantita: 'Settimane',  singolo: 'settimana', plurale: 'settimane' },
    mese:       { suffisso: '/mese',           quantita: 'Mesi',       singolo: 'mese',      plurale: 'mesi' },
    pezzo:      { suffisso: '/pezzo',          quantita: 'Pezzi',      singolo: 'pezzo',     plurale: 'pezzi' },
    m3mese:     { suffisso: '/m³ al mese',     quantita: 'Metri cubi', singolo: 'm³',        plurale: 'm³' },
    palletmese: { suffisso: '/pallet al mese', quantita: 'Pallet',     singolo: 'pallet',    plurale: 'pallet' },
    km:         { suffisso: '/km',             quantita: 'Chilometri', singolo: 'km',        plurale: 'km' },
    corpo:      { suffisso: ' in blocco',      quantita: 'Lotti',      singolo: 'lotto',     plurale: 'lotti' }
  };
  function unita(id) {
    return UNITA[id] || { suffisso: '', quantita: 'Quantita\'', singolo: 'unita\'', plurale: 'unita\'' };
  }
  /* "1 ora" ma "6 ore": l'accordo si fa qui, non nei template */
  function conta(n, id) {
    var u = unita(id);
    return fNum.format(n) + ' ' + (Math.abs(n) === 1 ? u.singolo : u.plurale);
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
    unita: unita,
    conta: conta
  };

  /* HTML sicuro: tutto il testo variabile passa da qui */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================================= GLIFI ===== */
  /* Disegni schematici, tratto su fondo tratteggiato. Niente immagini esterne. */
  var contaGlifi = 0;
  var TRATTI = {
    cnc: '<rect x="14" y="58" width="92" height="10"/><path d="M24 58V26h72v32"/><path d="M40 26v14h40V26"/>' +
         '<path d="M60 40v10"/><path d="M52 50h16l-8 8z"/><rect x="44" y="66" width="32" height="0.1"/>' +
         '<path d="M30 68v6M90 68v6"/>',
    stampante: '<rect x="20" y="14" width="80" height="54"/><path d="M20 30h80"/><path d="M60 30v10"/>' +
         '<path d="M52 40h16v6H52z"/><path d="M60 46v6"/><rect x="40" y="52" width="40" height="8"/>' +
         '<path d="M40 56h40"/><path d="M34 68v6M86 68v6"/>',
    laser: '<rect x="16" y="52" width="88" height="16"/><path d="M60 14v18"/><path d="M52 32h16v8H52z"/>' +
         '<path d="M60 40v12" stroke-dasharray="3 3"/><circle cx="60" cy="60" r="6"/>' +
         '<path d="M30 60h14M76 60h14"/><path d="M24 46v-8h72v8"/>',
    officina: '<rect x="12" y="46" width="96" height="8"/><path d="M20 54v18M100 54v18"/>' +
         '<rect x="44" y="30" width="32" height="16"/><path d="M52 30v-8h16v8"/>' +
         '<path d="M36 46h-8M92 46h8"/><path d="M60 22V10"/><path d="M54 14l6-6 6 6"/>',
    lab: '<rect x="16" y="18" width="52" height="50"/><path d="M16 32h52"/><circle cx="30" cy="25" r="3"/>' +
         '<path d="M28 44h28v18H28z"/><path d="M82 22v14l-10 26h28L90 36V22z"/><path d="M78 22h16"/>' +
         '<path d="M76 52h24"/>',
    magazzino: '<path d="M14 68V16h92v52"/><path d="M14 34h92M14 51h92"/><path d="M40 16v52M80 16v52"/>' +
         '<rect x="18" y="38" width="18" height="11"/><rect x="44" y="21" width="32" height="11"/>' +
         '<rect x="84" y="55" width="18" height="11"/><rect x="44" y="55" width="18" height="11"/>',
    furgone: '<path d="M10 56V26h56v30"/><path d="M66 34h18l14 14v8H66z"/><path d="M70 38h12l8 8H70z"/>' +
         '<circle cx="32" cy="60" r="8"/><circle cx="84" cy="60" r="8"/><path d="M10 56h12M40 56h36"/>' +
         '<path d="M18 34h30"/>',
    muletto: '<path d="M28 58V32h30v26"/><path d="M58 40h12v18H58z"/><path d="M70 20v38"/><path d="M70 52h22"/>' +
         '<path d="M70 20h10"/><circle cx="38" cy="62" r="7"/><circle cx="62" cy="62" r="5"/>' +
         '<path d="M92 52v-6"/><rect x="76" y="40" width="16" height="12"/>'
  };

  function glifo(nome, classe) {
    var pid = 'tratteggio-' + (++contaGlifi);
    var tratto = TRATTI[nome] || TRATTI.officina;
    return '<svg viewBox="0 0 120 80" class="' + (classe || '') + '" role="img" aria-hidden="true" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">' +
      '<defs><pattern id="' + pid + '" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" stroke-width="1" opacity=".18"/></pattern></defs>' +
      '<rect x="0" y="0" width="120" height="80" fill="url(#' + pid + ')" stroke="none"/>' +
      tratto + '</svg>';
  }

  /* ========================================================== TESTATA ====== */
  /* Il marketplace ha due lati e la navigazione lo dice: si entra come chi
     cerca capacita' o come chi ne cede, e il menu cambia di conseguenza.     */
  var RUOLI = {
    cliente: {
      nome: 'Cliente',
      nota: 'Cerchi capacità: sfogli il catalogo, configuri un preventivo, segui le tue richieste.',
      pagine: [
        { href: 'index.html', nome: 'Manifesto' },
        { href: 'catalogo.html', nome: 'Catalogo' },
        { href: 'prenotazioni.html', nome: 'Le mie richieste', bollo: 'prenotazioni' }
      ]
    },
    fornitore: {
      nome: 'Fornitore',
      nota: 'Hai capacità ferma: la pubblichi, e dalla console accetti o rifiuti le richieste che arrivano.',
      pagine: [
        { href: 'index.html', nome: 'Manifesto' },
        { href: 'console.html', nome: 'Console', bollo: 'richieste' },
        { href: 'pubblica.html', nome: 'Pubblica' }
      ]
    }
  };
  /* Aprire una pagina dell'altro lato cambia ruolo da sola: nessun vicolo cieco. */
  var RUOLO_DI = {
    'catalogo.html': 'cliente', 'prenotazioni.html': 'cliente', 'asset.html': 'cliente',
    'console.html': 'fornitore', 'pubblica.html': 'fornitore'
  };

  function ruoloCorrente() { return store.tutto().ruolo || 'cliente'; }

  function montaTestata(corrente) {
    var s = store.tutto();
    var ruolo = RUOLI[s.ruolo] ? s.ruolo : 'cliente';
    var voci = RUOLI[ruolo].pagine.map(function (p) {
      var attiva = p.href === corrente ? ' aria-current="page"' : '';
      var bollo = '';
      if (p.bollo === 'prenotazioni') {
        var aperte = s.prenotazioni.filter(function (x) { return x.stato !== 'annullata'; }).length;
        if (aperte) bollo = '<span class="navi__bollo numerico">' + aperte + '</span>';
      }
      if (p.bollo === 'richieste') {
        var da = s.richiesteAperte || 0;
        if (da) bollo = '<span class="navi__bollo numerico">' + da + '</span>';
      }
      return '<a href="' + p.href + '"' + attiva + '>' + esc(p.nome) + bollo + '</a>';
    }).join('');

    var scambio = Object.keys(RUOLI).map(function (k) {
      return '<button class="ruolo__voce" type="button" data-ruolo-scelto="' + k + '" ' +
        'aria-pressed="' + (k === ruolo ? 'true' : 'false') + '">' + esc(RUOLI[k].nome) + '</button>';
    }).join('');

    var el = document.createElement('header');
    el.className = 'testata';
    el.innerHTML =
      '<div class="testata__corpo">' +
        '<a class="marchio" href="index.html">' +
          '<span class="marchio__q" aria-hidden="true">◧</span>FERMO' +
          '<span class="marchio__coda">CAP. INUTILIZZATA</span>' +
        '</a>' +
        '<button class="apri-navi" type="button" aria-expanded="false" aria-controls="navi-principale">MENU ≡</button>' +
        '<nav class="navi" id="navi-principale" aria-label="Principale">' + voci + '</nav>' +
        '<div class="testata__coda">' +
          '<div class="ruolo" role="group" aria-label="Entra come">' +
            '<span class="ruolo__etichetta">Sei</span>' + scambio +
          '</div>' +
          '<button class="interruttore" type="button" data-azione="tema">' +
            '<span class="interruttore__spia" aria-hidden="true"></span>' +
            '<span data-ruolo="etichetta-tema">Turno giorno</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(el, document.body.firstChild);

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ruolo-scelto]');
      if (!b) return;
      var scelto = b.getAttribute('data-ruolo-scelto');
      store.aggiorna(function (st) { st.ruolo = scelto; });
      var casa = RUOLI[scelto].pagine[1];
      location.href = casa ? casa.href : 'index.html';
    });

    el.querySelector('.apri-navi').addEventListener('click', function () {
      var nav = el.querySelector('.navi');
      var aperta = nav.classList.toggle('aperta');
      this.setAttribute('aria-expanded', String(aperta));
    });
    el.querySelector('[data-azione="tema"]').addEventListener('click', function () {
      var attuale = document.documentElement.getAttribute('data-theme');
      var prossimo = attuale === 'dark' ? 'light' : 'dark';
      applicaTema(prossimo);
      store.aggiorna(function (s) { s.tema = prossimo; });
    });
    sincronizzaEtichettaTema();
  }

  function applicaTema(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    sincronizzaEtichettaTema();
  }
  function sincronizzaEtichettaTema() {
    var et = document.querySelector('[data-ruolo="etichetta-tema"]');
    if (!et) return;
    var scuro = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
       global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
    et.textContent = scuro ? 'Turno notte' : 'Turno giorno';
  }

  /* Striscia sotto la testata: dice in che panni sei e che è una demo. */
  function montaStriscia() {
    var ruolo = RUOLI[ruoloCorrente()] || RUOLI.cliente;
    var el = document.createElement('div');
    el.className = 'striscia';
    el.innerHTML =
      '<div class="striscia__corpo">' +
        '<span class="timbro timbro--pieno">Demo</span>' +
        '<span class="striscia__testo"><strong>Stai navigando come ' + esc(ruolo.nome.toLowerCase()) +
          '.</strong> ' + esc(ruolo.nota) + '</span>' +
        '<button class="striscia__x" type="button" data-azione="chiudi-striscia" ' +
          'aria-label="Chiudi la striscia informativa">×</button>' +
      '</div>';
    var testata = document.querySelector('.testata');
    testata.parentNode.insertBefore(el, testata.nextSibling);
    el.querySelector('[data-azione="chiudi-striscia"]').addEventListener('click', function () {
      el.remove();
    });
  }

  /* ====================================================== QUADRO SEDI ====== */
  /* Proiezione equirettangolare delle sedi reali. Nessun contorno disegnato:
     la sagoma esce dai punti, e cio' che non sappiamo non lo inventiamo. */
  function quadro(beni, opzioni) {
    opzioni = opzioni || {};
    /* Riquadro un po' più stretto dei limiti d'Italia: resta il margine sopra
       Trento e sotto Palermo, e il vuoto del Sud si vede — perché è un dato,
       non uno spazio sprecato. */
    var latMin = 37.4, latMax = 47.0, lonMin = 6.9, lonMax = 18.2;
    var kx = Math.cos(42 * Math.PI / 180);          /* compressione dei meridiani */
    var margine = 26;
    var Lint = (lonMax - lonMin) * kx, Aint = latMax - latMin;
    var scala = 44;
    var L = Lint * scala + margine * 2;
    var A = Aint * scala + margine * 2;

    var px = function (lon) { return margine + (lon - lonMin) * kx * scala; };
    var py = function (lat) { return margine + (latMax - lat) * scala; };

    /* raggruppo per citta': una sede, un punto, raggio per numero di schede */
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
        var ore = s.beni.reduce(function (t, b) { return t + b.oreLibere; }, 0);
        var etichetta = s.citta + ': ' + s.beni.length +
          (s.beni.length === 1 ? ' scheda' : ' schede') + ', ' + ore + ' ore libere a settimana';
        var grande = isolata(s);
        return '<g class="sede" tabindex="0" role="button" data-citta="' + esc(s.citta) + '" ' +
            'aria-label="' + esc(etichetta) + '. Filtra il catalogo su questa città.">' +
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
        ('Quadro delle sedi: ' + elenco.length + ' città con capacità a catalogo')) + '">' +
      rete + punti + '</svg>';
  }

  /* ================================================ AVANZAMENTO ORDINE ===== */
  var TAPPE = [
    { id: 'in-attesa',    nome: 'Richiesta inviata' },
    { id: 'confermata',   nome: 'Confermata' },
    { id: 'lavorazione',  nome: 'In lavorazione' },
    { id: 'consegnata',   nome: 'Consegnata' },
    { id: 'pagata',       nome: 'Saldata' }
  ];
  function indiceTappa(stato) {
    for (var i = 0; i < TAPPE.length; i++) if (TAPPE[i].id === stato) return i;
    return 0;
  }
  function linea(stato) {
    if (stato === 'annullata') {
      return '<div class="linea linea--ferma"><span class="timbro timbro--tenue">Percorso interrotto — richiesta annullata</span></div>';
    }
    var qui = indiceTappa(stato);
    return '<ol class="linea">' + TAPPE.map(function (t, i) {
      var st = i < qui ? 'fatta' : i === qui ? 'qui' : 'attesa';
      return '<li class="linea__tappa" data-stato="' + st + '">' +
        '<span class="linea__bollo" aria-hidden="true">' + (i < qui ? '✓' : i + 1) + '</span>' +
        '<span class="linea__nome">' + esc(t.nome) + '</span>' +
        (st === 'qui' ? '<span class="solo-lettori">(fase attuale)</span>' : '') +
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
      return '<p class="tenue piccolo">Nessuna recensione: è una scheda appena pubblicata.</p>';
    }
    return '<div class="pila">' + voci.map(function (v) {
      return '<article class="recensione">' +
        '<div class="riga riga--fra">' +
          '<div><strong>' + esc(v.autore) + '</strong> ' +
            '<span class="timbro timbro--tenue">' + esc(D.modalita(v.modalita).nome) + '</span></div>' +
          '<div class="riga" style="gap:8px">' + stelle(v.voto) +
            '<span class="piccolo tenue numerico">' + fmt.data(v.quando) + '</span></div>' +
        '</div>' +
        '<p style="margin:8px 0 0">' + esc(v.testo) + '</p>' +
      '</article>';
    }).join('') + '</div>';
  }

  function montaPiede() {
    var el = document.createElement('footer');
    el.className = 'piede';
    el.innerHTML =
      '<div class="piede__nastro zebrato"></div>' +
      '<div class="piede__corpo">' +
        '<div>' +
          '<strong>FERMO</strong> — marketplace della capacita\' inutilizzata.<br>' +
          '<span class="tenue">Prototipo dimostrativo. Dati inventati, nessun pagamento reale, ' +
          'tutto lo stato resta nel browser.</span>' +
        '</div>' +
        '<div>' +
          '<a href="catalogo.html">Catalogo</a> · <a href="pubblica.html">Pubblica</a> · ' +
          '<a href="console.html">Console</a> · <a href="prenotazioni.html">Prenotazioni</a><br>' +
          '<button class="bottone bottone--piccolo bottone--nudo" type="button" data-azione="azzera" ' +
          'style="margin-top:10px">Azzera dati demo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('[data-azione="azzera"]').addEventListener('click', function () {
      if (confirm('Cancello prenotazioni, preferiti e annunci salvati in questo browser?')) {
        store.azzera();
        location.reload();
      }
    });
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
    v.innerHTML = '<b>' + esc(titolo) + '</b>' + esc(testo);
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
  function saturazione(a) {
    if (!a.oreSettimana) return 0;
    return Math.max(0, Math.min(1, 1 - a.oreLibere / a.oreSettimana));
  }
  function livello(sat) {
    if (sat < 0.4) return 'basso';
    if (sat < 0.7) return 'medio';
    if (sat < 0.9) return 'alto';
    return 'pieno';
  }

  function scheda(a) {
    var cat = D.categoria(a.cat);
    var u = unita(a.prezzo.unita);
    var mio = (a.origine === 'utente');
    var prezzo = a.prezzo.unita === 'corpo' ? fmt.euroTondo(a.prezzo.valore) : fmt.euro(a.prezzo.valore);

    var sigle = a.mod.map(function (m) {
      var md = D.modalita(m);
      var stile = m === 'vendita' ? 'timbro--accento' : m === 'servizio' ? 'timbro--blu' : 'timbro--tenue';
      return '<span class="timbro ' + stile + '">' + esc(md.nome) + '</span>';
    }).join('');

    return '' +
      '<article class="scheda" data-id="' + esc(a.id) + '">' +
        '<a class="scheda__figura" href="asset.html?id=' + encodeURIComponent(a.id) + '" ' +
           'aria-label="Apri la scheda di ' + esc(a.titolo) + '">' +
          glifo(cat.glifo) +
          '<span class="scheda__matricola numerico">' + esc(a.id) + '</span>' +
        '</a>' +
        '<button class="scheda__preferito" type="button" data-azione="preferito" ' +
          'aria-pressed="' + (preferito(a.id) ? 'true' : 'false') + '" ' +
          'aria-label="Salva ' + esc(a.titolo) + ' tra i preferiti">★</button>' +
        '<div class="scheda__corpo">' +
          '<div class="riga" style="gap:6px">' + sigle +
            (mio ? '<span class="timbro timbro--hivis">Tuo annuncio</span>' : '') +
            (a.verificato ? '<span class="timbro timbro--verde">✓ Verificato</span>' : '') +
          '</div>' +
          '<a class="scheda__titolo" href="asset.html?id=' + encodeURIComponent(a.id) + '" ' +
             'style="text-decoration:none">' + esc(a.titolo) + '</a>' +
          '<div class="scheda__dove">' + esc(a.citta) + ' (' + esc(a.prov) + ') · ' + esc(cat.breve) + '</div>' +
          (a.oreSettimana ? misuraSaturazione(a) : '') +
        '</div>' +
        '<div class="scheda__piede">' +
          '<div class="prezzo numerico">' + prezzo + '<small>' + esc(u.suffisso) + '</small></div>' +
          '<div class="piccolo tenue">' + (a.recensioni ? '★ ' + a.rating.toFixed(1) + ' (' + a.recensioni + ')' : 'Nuovo') + '</div>' +
        '</div>' +
      '</article>';
  }

  function misuraSaturazione(a) {
    var sat = saturazione(a);
    var lv = livello(sat);
    return '' +
      '<div class="misura">' +
        '<div class="misura__testa">' +
          '<span class="etichetta">Occupazione</span>' +
          '<span class="numerico">' + fmt.pct(sat) + ' · ' + a.oreLibere + ' h libere</span>' +
        '</div>' +
        '<div class="misura__traccia" role="img" aria-label="Occupazione ' + fmt.pct(sat) +
          ', ' + a.oreLibere + ' ore libere su ' + a.oreSettimana + ' a settimana">' +
          '<div class="misura__pieno" data-livello="' + lv + '" style="width:' + (sat * 100).toFixed(1) + '%"></div>' +
        '</div>' +
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
     etichetta diretta solo sul massimo, tacca di base a filo, 2 px d'aria
     fra colonne adiacenti. */
  function colonne(dati, opzioni) {
    opzioni = opzioni || {};
    var L = 520, A = 170, base = A - 26, cima = 16;
    var corsia = 52;                       /* corsia a sinistra per le tacche */
    var n = dati.length;
    var passo = (L - corsia) / n;
    var spessore = Math.min(24, passo - 8);
    var max = Math.max.apply(null, dati.map(function (d) { return d.valore; })) || 1;
    var tetto = arrotondaSu(max);          /* la scala si ferma su una cifra tonda */
    var scala = function (v) { return (v / tetto) * (base - cima); };
    var maxIdx = dati.reduce(function (best, d, i) { return d.valore > dati[best].valore ? i : best; }, 0);

    var barre = dati.map(function (d, i) {
      var h = Math.max(2, scala(d.valore));
      var x = corsia + i * passo + (passo - spessore) / 2;
      var y = base - h;
      var r = Math.min(4, spessore / 2, h);
      /* estremita' arrotondata in alto, squadrata sulla linea di base */
      var p = 'M' + x + ' ' + base + ' V' + (y + r) +
              ' q0 ' + (-r) + ' ' + r + ' ' + (-r) +
              ' h' + (spessore - 2 * r) +
              ' q' + r + ' 0 ' + r + ' ' + r +
              ' V' + base + ' Z';
      var etichetta = (i === maxIdx || opzioni.etichettaUltima && i === n - 1)
        ? '<text class="etichetta-valore" x="' + (x + spessore / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' +
          esc(opzioni.formato ? opzioni.formato(d.valore) : d.valore) + '</text>'
        : '';
      return '<g><title>' + esc(d.nome + ': ' + (opzioni.formato ? opzioni.formato(d.valore) : d.valore)) + '</title>' +
             '<path class="colonna" d="' + p + '"/>' + etichetta + '</g>' +
             '<text x="' + (x + spessore / 2) + '" y="' + (base + 14) + '" text-anchor="middle">' + esc(d.nome) + '</text>';
    }).join('');

    /* Due sole tacche — il tetto e la meta' — per dare la scala ai valori
       che non hanno etichetta diretta. Filo sottile, mai tratteggiato. */
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

  /* Barre orizzontali a serie singola con etichetta di valore in punta */
  function barre(dati, opzioni) {
    opzioni = opzioni || {};
    var max = Math.max.apply(null, dati.map(function (d) { return d.valore; })) || 1;
    return '<div class="pila">' + dati.map(function (d) {
      var pct = (d.valore / max) * 100;
      return '<div>' +
        '<div class="misura__testa">' +
          '<span>' + esc(d.nome) + '</span>' +
          '<span class="numerico">' + esc(opzioni.formato ? opzioni.formato(d.valore) : d.valore) + '</span>' +
        '</div>' +
        '<div class="misura__traccia" style="height:14px">' +
          '<div class="misura__pieno" style="width:' + pct.toFixed(1) + '%;background:' +
            (d.colore || 'var(--serie-1)') + '"></div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* Tabella alternativa: ogni grafico ne ha una, apribile. Nessun dato solo-colore. */
  function tabellaDati(dati, intestazioni, opzioni) {
    opzioni = opzioni || {};
    return '<details class="piccolo" style="margin-top:12px">' +
      '<summary style="cursor:pointer;letter-spacing:.1em;text-transform:uppercase;font-size:11px">' +
      'Vedi i dati in tabella</summary>' +
      '<div class="involucro-scorrevole" style="margin-top:8px"><table class="tabella">' +
      '<thead><tr><th>' + esc(intestazioni[0]) + '</th><th class="num">' + esc(intestazioni[1]) + '</th></tr></thead>' +
      '<tbody>' + dati.map(function (d) {
        return '<tr><td>' + esc(d.nome) + '</td><td class="num">' +
          esc(opzioni.formato ? opzioni.formato(d.valore) : d.valore) + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
  }

  /* ======================================================== PRENOTAZIONI === */
  function preventivo(a, quantita, extra) {
    extra = extra || {};
    var imponibile = a.prezzo.valore * quantita;
    var commissione = imponibile * D.COMMISSIONE;
    var assicurazione = extra.assicurazione ? imponibile * D.ASSICURAZIONE : 0;
    var trasporto = extra.trasporto ? 180 : 0;
    var netto = imponibile + commissione + assicurazione + trasporto;
    var iva = netto * D.IVA;
    return {
      imponibile: imponibile,
      commissione: commissione,
      assicurazione: assicurazione,
      trasporto: trasporto,
      netto: netto,
      iva: iva,
      totale: netto + iva
    };
  }

  function nuovaPrenotazione(dati) {
    var codice = 'ORD-' + String(Date.now()).slice(-6);
    store.aggiorna(function (s) {
      s.prenotazioni.unshift(Object.assign({
        codice: codice,
        creata: new Date().toISOString(),
        stato: 'in-attesa'
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
    montaTestata(pagina);
    montaStriscia();
    montaPiede();
    /* i preferiti si commutano ovunque compaia una scheda */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-azione="preferito"]');
      if (!b) return;
      var art = b.closest('[data-id]');
      if (!art) return;
      var dentro = commutaPreferito(art.getAttribute('data-id'));
      b.setAttribute('aria-pressed', dentro ? 'true' : 'false');
      brindisi(dentro ? 'Salvato' : 'Rimosso',
        dentro ? 'Aggiunto alla tua lista dei preferiti.' : 'Tolto dalla lista dei preferiti.');
      document.dispatchEvent(new CustomEvent('fermo:preferiti'));
    });

    if (global.FERMO_DEMO) global.FERMO_DEMO.montaGuida();
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
    glifo: glifo,
    scheda: scheda,
    misuraSaturazione: misuraSaturazione,
    saturazione: saturazione,
    livello: livello,
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
    preventivo: preventivo,
    nuovaPrenotazione: nuovaPrenotazione,
    preferito: preferito,
    brindisi: brindisi,
    param: param,
    avvia: avvia
  };
})(window);
