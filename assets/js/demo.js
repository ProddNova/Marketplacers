/* =============================================================================
   FERMO — regia della demo
   Al primo accesso il marketplace deve sembrare in esercizio da mesi: richieste
   in corso, conversazioni aperte, preferiti, decisioni gia' prese. Una demo che
   parte vuota non fa capire il prodotto.
   Gira prima di core.js: parla solo con FERMO_DATA e con localStorage.
   ========================================================================== */
(function (global) {
  'use strict';

  var CHIAVE = 'fermo.v1';
  var D = global.FERMO_DATA;
  var GIORNO = 86400000;

  function leggi() {
    try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}'); } catch (e) { return {}; }
  }
  function scrivi(s) {
    try { localStorage.setItem(CHIAVE, JSON.stringify(s)); } catch (e) {}
  }

  /* --------------------------------------------------------------- semina */
  /* Tre richieste a stadi diversi del percorso, così l'avanzamento si vede
     senza dover prima cliccare in giro. */
  /* iniziaFra: giorni da oggi, negativi nel passato. La finestra di lavoro deve
     concordare con lo stato — una commessa "in lavorazione" non può avere una
     finestra già chiusa mentre il fornitore la racconta in corso. */
  var COPIONE = [
    {
      assetId: 'FRM-TAG-0207', codice: 'ORD-104882', stato: 'consegnata',
      quantita: 6, giorniFa: 21, iniziaFra: -17, durata: 1,
      conversazione: [
        ['cliente',   'Buongiorno, allego il DXF: 42 pezzi in acciaio S355 da 8 mm. Riuscite entro venerdì?', 21],
        ['fornitore', 'Ricevuto. Il nesting ci sta su una lastra sola, quindi confermiamo venerdì mattina. Vi giro il piano di taglio.', 21],
        ['fornitore', 'Tagliato e sbavato. Ritiro dalle 8 alle 17, bancale al banco 3.', 17],
        ['cliente',   'Ritirato oggi, tutto conforme. Grazie.', 16]
      ]
    },
    {
      assetId: 'FRM-ADD-0455', codice: 'ORD-107310', stato: 'lavorazione',
      quantita: 18, giorniFa: 6, iniziaFra: -2, durata: 5,
      conversazione: [
        ['cliente',   'Diciotto pezzi in PA2200, pareti da 2 mm. Serve la sabbiatura, la tintura no.', 6],
        ['fornitore', 'Entrano nel riempimento di giovedì. Vi avviso a camera chiusa.', 5],
        ['fornitore', 'Camera partita stanotte, raffreddamento fino a domani sera. Depolveriamo venerdì.', 1]
      ]
    },
    {
      assetId: 'FRM-MOV-0138', codice: 'ORD-108455', stato: 'in-attesa',
      quantita: 2, giorniFa: 1, iniziaFra: 4, durata: 14,
      conversazione: [
        ['cliente',   'Ci servirebbe per due settimane a partire da lunedì, consegna in cantiere a Treviglio. Fattibile?', 1]
      ]
    }
  ];

  var PREFERITI = ['FRM-CNC-0142', 'FRM-LAB-0410', 'FRM-MAG-0021'];

  function semina() {
    var s = leggi();
    if (s.seminato) return;

    s.preferiti = s.preferiti || [];
    s.prenotazioni = s.prenotazioni || [];
    s.messaggi = s.messaggi || {};
    s.annunci = s.annunci || [];
    s.decisioni = s.decisioni || {};
    if (!s.ruolo) s.ruolo = 'cliente';

    COPIONE.forEach(function (c) {
      var a = D.byId(c.assetId);
      if (!a) return;
      var inizio = new Date(Date.now() + c.iniziaFra * GIORNO);
      var fine = new Date(inizio.getTime() + Math.max(0, c.durata - 1) * GIORNO);
      var imponibile = a.prezzo.valore * c.quantita;
      var netto = imponibile * (1 + D.COMMISSIONE + D.ASSICURAZIONE);

      s.prenotazioni.push({
        codice: c.codice,
        assetId: a.id,
        titolo: a.titolo,
        fornitore: a.fornitore,
        citta: a.citta,
        modalita: a.mod[0],
        quantita: c.quantita,
        unita: a.prezzo.unita,
        inizio: inizio.toISOString(),
        fine: fine.toISOString(),
        totale: netto * (1 + D.IVA),
        tipo: 'prenotazione',
        stato: c.stato,
        creata: new Date(Date.now() - c.giorniFa * GIORNO).toISOString()
      });

      s.messaggi[c.codice] = c.conversazione.map(function (m) {
        return { da: m[0], testo: m[1], quando: new Date(Date.now() - m[2] * GIORNO).toISOString() };
      });
    });

    /* le più recenti in cima, come le mostra la pagina */
    s.prenotazioni.sort(function (x, y) { return new Date(y.creata) - new Date(x.creata); });

    PREFERITI.forEach(function (id) {
      if (D.byId(id) && s.preferiti.indexOf(id) === -1) s.preferiti.push(id);
    });

    /* un po' di storico anche sulla console del fornitore */
    s.decisioni['REQ-100'] = 'accettata';
    s.decisioni['REQ-121'] = 'rifiutata';

    s.seminato = true;
    scrivi(s);
  }

  /* ---------------------------------------------------------------- guida */
  var TAPPE = [
    {
      titolo: 'Cerca capacità ferma',
      testo: 'Il catalogo si filtra per categoria, modalità, città e disponibilità. ' +
             'Il quadro delle sedi mostra dov\'è il ferro.',
      dove: 'catalogo.html', invito: 'Apri il catalogo'
    },
    {
      titolo: 'Configura un preventivo',
      testo: 'Sulla scheda scegli il giorno di inizio nel calendario e la quantità: ' +
             'commissione, copertura e IVA si ricalcolano mentre scegli.',
      dove: 'asset.html?id=FRM-CNC-0142', invito: 'Guarda una scheda'
    },
    {
      titolo: 'Segui la richiesta',
      testo: 'Ogni richiesta ha un avanzamento e una conversazione col fornitore. ' +
             'Ne trovi tre già in corso.',
      dove: 'prenotazioni.html', invito: 'Vedi le richieste'
    },
    {
      titolo: 'Passa dall\'altro lato',
      testo: 'Come fornitore vedi transato, occupazione per macchina e le richieste ' +
             'da accettare o rifiutare. Oppure pubblichi una macchina tua.',
      dove: 'console.html', invito: 'Entra nella console'
    }
  ];

  function montaGuida() {
    var s = leggi();

    var d = document.createElement('dialog');
    d.className = 'guida';
    d.innerHTML =
      '<form method="dialog" class="guida__x">' +
        '<button class="bottone bottone--piccolo bottone--nudo" aria-label="Chiudi la guida">Chiudi ×</button>' +
      '</form>' +
      '<div class="guida__corpo">' +
        '<div class="occhiello">Visita guidata · 4 tappe</div>' +
        '<h2 style="margin-bottom:10px">Che cosa puoi provare</h2>' +
        '<p class="tenue piccolo" style="margin-bottom:18px">' +
          'Questa è una dimostrazione: i fornitori e i prezzi sono inventati, non ci sono ' +
          'pagamenti né account. Quello che fai resta nel tuo browser e si azzera dal fondo pagina.' +
        '</p>' +
        '<ol class="guida__elenco">' +
          TAPPE.map(function (t, i) {
            return '<li>' +
              '<span class="guida__n">' + (i + 1) + '</span>' +
              '<div><strong>' + t.titolo + '</strong>' +
                '<p class="piccolo tenue" style="margin:3px 0 8px">' + t.testo + '</p>' +
                '<a class="bottone bottone--piccolo" href="' + t.dove + '">' + t.invito + ' →</a>' +
              '</div></li>';
          }).join('') +
        '</ol>' +
      '</div>';
    document.body.appendChild(d);

    /* pulsante di richiamo, sempre disponibile */
    var b = document.createElement('button');
    b.className = 'richiamo';
    b.type = 'button';
    b.innerHTML = '<span aria-hidden="true">?</span><span class="richiamo__testo">Guida</span>';
    b.setAttribute('aria-label', 'Apri la visita guidata della demo');
    b.addEventListener('click', function () { apri(d); });
    document.body.appendChild(b);

    if (!s.tour) {
      apri(d);
      var st = leggi(); st.tour = true; scrivi(st);
    }
  }

  function apri(d) {
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
  }

  global.FERMO_DEMO = { semina: semina, montaGuida: montaGuida, TAPPE: TAPPE };
})(window);
