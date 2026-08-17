/* =============================================================================
   FERMO — regia della demo
   Al primo accesso il mercato deve sembrare in esercizio da mesi: pratiche in
   corso, trattative aperte, annunci seguiti, proposte gia' decise. Un listino
   senza traffico non fa capire il prodotto.
   Gira prima di core.js: parla solo con FERMO_DATA e con localStorage.
   ========================================================================== */
(function (global) {
  'use strict';

  var CHIAVE = 'fermo.v2';
  var D = global.FERMO_DATA;
  var GIORNO = 86400000;

  function leggi() {
    try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}'); } catch (e) { return {}; }
  }
  function scrivi(s) {
    try { localStorage.setItem(CHIAVE, JSON.stringify(s)); } catch (e) {}
  }

  /* --------------------------------------------------------------- semina */
  /* Tre pratiche a stadi diversi del percorso, così l'avanzamento si vede
     senza dover prima cliccare in giro: una chiusa, una col denaro in
     deposito e in attesa del ritiro, una proposta appena fatta. */
  var COPIONE = [
    {
      assetId: 'FRM-TAG-0207', codice: 'PRA-104882', stato: 'conclusa',
      tipo: 'proposta', importo: 162000, giorniFa: 38, visitaFra: -30,
      conversazione: [
        ['compratore', 'Buongiorno, saremmo interessati al laser. Possiamo vederlo in funzione e portare due nostri lamierati di prova?', 38],
        ['venditore', 'Certo. Venite martedì mattina, la macchina è in produzione: vi facciamo tagliare i vostri pezzi e vi diamo i report della sorgente.', 37],
        ['compratore', 'Visto martedì. Facciamo 162.000 con il cambio pallet e il chiller compresi?', 31],
        ['venditore', 'Accettiamo a 162.000 se il ritiro resta entro luglio. Vi mandiamo il contratto.', 30],
        ['venditore', 'Macchina caricata e partita stamattina. Buon lavoro.', 6]
      ]
    },
    {
      assetId: 'FRM-MOV-0138', codice: 'PRA-107310', stato: 'deposito',
      tipo: 'acquisto', importo: 18900, giorniFa: 9, visitaFra: -4,
      conversazione: [
        ['compratore', 'Confermo l\'acquisto al prezzo esposto. La batteria ha ancora la garanzia del costruttore?', 9],
        ['venditore', 'Sì, fino a marzo 2027: vi giriamo il certificato con la fattura originale.', 8],
        ['compratore', 'Perfetto, bonifico partito sul deposito della piattaforma.', 6],
        ['venditore', 'Ricevuta la conferma del deposito. Consegna prevista giovedì prossimo, ci serve un\'ora e un piazzale libero.', 2]
      ]
    },
    {
      assetId: 'FRM-DEF-0501', codice: 'PRA-108455', stato: 'inviata',
      tipo: 'rilancio', importo: 21000, giorniFa: 1, visitaFra: 3,
      conversazione: [
        ['compratore', 'Ho rilanciato a 21.000. Prima della chiusura vorrei vedere la macchina piegare una lamiera da 8 mm: si può?', 1]
      ]
    },
    /* Una pratica su un lotto, perche' comprare ventiquattro portatili non e'
       comprare una macchina: si tratta sul prezzo a pezzo, e prima di firmare
       si vuole sapere che fine hanno fatto i dati di chi li usava. */
    {
      assetId: 'FRM-INF-0210', codice: 'PRA-108120', stato: 'accettata',
      tipo: 'proposta', importo: 5760, giorniFa: 4, visitaFra: 2,
      conversazione: [
        ['compratore', 'Buongiorno, ci servono venti postazioni per il nuovo ufficio. Sul lotto intero facciamo 240 € a macchina, quindi 5.760?', 4],
        ['venditore', 'Ci sta, ma solo sul blocco da 24: sotto quel numero restiamo a 270. Vi mandiamo l\'elenco delle matricole con la salute delle batterie una per una.', 3],
        ['compratore', 'Va bene per le 24. Una domanda: la cancellazione dei dati com\'è documentata? Ci serve per il nostro registro dei trattamenti.', 3],
        ['venditore', 'Rapporto NIST 800-88 per matricola, firmato dal tecnico. Ve ne alleghiamo uno di esempio: se lo approvate, blocchiamo il prezzo.', 2]
      ]
    }
  ];

  var PREFERITI = ['FRM-CNC-0142', 'FRM-PER-0287', 'FRM-LAB-0410', 'FRM-ADD-0620'];

  function semina() {
    var s = leggi();
    if (s.seminato) return;

    s.preferiti = s.preferiti || [];
    s.acquisti = s.acquisti || [];
    s.messaggi = s.messaggi || {};
    s.annunci = s.annunci || [];
    s.decisioni = s.decisioni || {};
    if (!s.ruolo) s.ruolo = 'compratore';

    COPIONE.forEach(function (c) {
      var a = D.byId(c.assetId);
      if (!a) return;
      var imponibile = c.importo + D.PERIZIA;

      s.acquisti.push({
        codice: c.codice,
        assetId: a.id,
        titolo: a.titolo,
        venditore: a.venditore,
        citta: a.citta,
        formula: a.mod[0],
        importo: c.importo,
        totale: imponibile * (1 + D.IVA),
        visita: new Date(Date.now() + c.visitaFra * GIORNO).toISOString(),
        tipo: c.tipo,
        stato: c.stato,
        creata: new Date(Date.now() - c.giorniFa * GIORNO).toISOString()
      });

      s.messaggi[c.codice] = c.conversazione.map(function (m) {
        return { da: m[0], testo: m[1], quando: new Date(Date.now() - m[2] * GIORNO).toISOString() };
      });
    });

    /* le più recenti in cima, come le mostra la pagina */
    s.acquisti.sort(function (x, y) { return new Date(y.creata) - new Date(x.creata); });

    PREFERITI.forEach(function (id) {
      if (D.byId(id) && s.preferiti.indexOf(id) === -1) s.preferiti.push(id);
    });

    /* un po' di storico anche sulla console del venditore */
    s.decisioni['OFF-100'] = 'accettata';
    s.decisioni['OFF-121'] = 'rifiutata';

    s.seminato = true;
    scrivi(s);
  }

  /* ---------------------------------------------------------------- guida */
  /* Quattro tappe, una per lato del mercato. Si apre da sola al primo accesso
     e poi resta sotto il menu «altre opzioni»: nessun pulsante fisso addosso
     al contenuto. */
  var TAPPE = [
    {
      titolo: 'Cerca la macchina',
      testo: 'Cinquantacinque annunci: macchine, portatili, lotti di monitor e tastiere, arredo, cucine. Quattro famiglie in alto, i filtri fini in un pannello.',
      dove: 'catalogo.html', invito: 'Apri il listino'
    },
    {
      titolo: 'Vedila prima di comprarla',
      testo: 'Sulla scheda prenoti la visione in sede, chiedi la perizia indipendente e vedi il conto completo: trasporto, smontaggio, IVA.',
      dove: 'asset.html?id=FRM-CNC-0142', invito: 'Guarda una scheda'
    },
    {
      titolo: 'Tratta, o rilancia',
      testo: 'Prezzo fisso, proposta libera o asta a tempo. Sui lotti si tratta sul prezzo a pezzo. Ogni pratica ha cinque tappe e una conversazione col venditore: ne trovi quattro in corso.',
      dove: 'acquisti.html', invito: 'Vedi le pratiche'
    },
    {
      titolo: 'Passa dall\'altro lato',
      testo: 'Da venditore vedi il valore a listino, le visite alle schede e le proposte da accettare. Oppure metti in vendita una macchina tua.',
      dove: 'console.html', invito: 'Entra nella console'
    }
  ];

  function apriGuida() {
    var F = global.FERMO;
    var corpo =
      '<p class="tenue" style="margin-bottom:18px">' +
        'Prototipo dimostrativo del mercato dell\'attrezzatura da lavoro usata. ' +
        'Venditori, attrezzature e prezzi sono inventati; non ci sono pagamenti né account.' +
      '</p>' +
      '<div class="pila pila--larga">' +
        TAPPE.map(function (t, i) {
          return '<div class="riga riga--stretta" style="align-items:flex-start;gap:12px">' +
            '<span class="pillola pillola--piena" style="margin-top:2px">' + (i + 1) + '</span>' +
            '<div>' +
              '<strong>' + t.titolo + '</strong>' +
              '<p class="piccolo tenue" style="margin:2px 0 8px">' + t.testo + '</p>' +
              '<a class="btn btn--piccolo" href="' + t.dove + '">' + t.invito + '</a>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';

    var d = F.pannello({ titolo: 'Che cosa puoi provare', corpo: corpo });
    F.apri(d);
    return d;
  }

  /* Al primo accesso la guida si apre da sola, una volta sola. */
  function primoAccesso() {
    var s = leggi();
    if (s.tour) return;
    s.tour = true;
    scrivi(s);
    apriGuida();
  }

  global.FERMO_DEMO = {
    semina: semina,
    apriGuida: apriGuida,
    primoAccesso: primoAccesso,
    TAPPE: TAPPE
  };
})(window);
