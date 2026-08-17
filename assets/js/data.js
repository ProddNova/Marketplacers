/* =============================================================================
   FERMO — DATASET DIMOSTRATIVO
   Mercato dell'usato industriale: macchine che si vendono, non che si affittano.
   Nessuna rete, nessun backend: il listino vive qui dentro.
   Le visite, gli storici e le recensioni sono generati con un PRNG seminato
   dall'ID, cosi' la demo e' identica a ogni ricaricamento ma non e' scritta a mano.
   ========================================================================== */
(function (global) {
  'use strict';

  /* --- PRNG deterministico (mulberry32) ---------------------------------- */
  function seedOf(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seedStr) {
    var a = seedOf(seedStr);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --- Tassonomia --------------------------------------------------------- */
  var CATEGORIE = [
    { id: 'cnc',            nome: 'Macchine utensili CNC',     breve: 'CNC',            glifo: 'cnc' },
    { id: 'additivo',       nome: 'Stampa 3D e additivo',      breve: 'Additivo',       glifo: 'stampante' },
    { id: 'taglio',         nome: 'Taglio laser e waterjet',   breve: 'Taglio',         glifo: 'laser' },
    { id: 'deformazione',   nome: 'Presse e piegatrici',       breve: 'Deformazione',   glifo: 'pressa' },
    { id: 'officina',       nome: 'Attrezzature d\'officina',  breve: 'Officina',       glifo: 'officina' },
    { id: 'laboratorio',    nome: 'Misura e laboratorio',      breve: 'Laboratorio',    glifo: 'lab' },
    { id: 'magazzino',      nome: 'Scaffalature e stoccaggio', breve: 'Magazzino',      glifo: 'magazzino' },
    { id: 'veicoli',        nome: 'Veicoli e mezzi d\'opera',  breve: 'Veicoli',        glifo: 'furgone' },
    { id: 'movimentazione', nome: 'Sollevamento e carrelli',   breve: 'Movimentazione', glifo: 'muletto' }
  ];

  /* Tre modi di chiudere una vendita, perche' sono tre trattative diverse. */
  var FORMULE = [
    { id: 'fisso',      nome: 'Prezzo fisso', sigla: 'FIS',
      nota: 'Prezzo esposto e bloccato: chi lo accetta per primo se la prende.' },
    { id: 'trattativa', nome: 'Trattativa',   sigla: 'TRA',
      nota: 'Fai la tua proposta: il venditore accetta, rifiuta o rilancia.' },
    { id: 'asta',       nome: 'Asta a tempo', sigla: 'AST',
      nota: 'Si rilancia fino alla scadenza. Se la base non viene coperta, non si vende.' }
  ];

  /* Lo stato dichiarato dal venditore, con la quota di vita residua che ne
     deriva: e' quella che disegna il misuratore sulla scheda. */
  var CONDIZIONI = [
    { id: 'come-nuovo',     nome: 'Come nuovo',     quota: 0.95,
      nota: 'Poche ore di lavoro, nessun intervento fatto.' },
    { id: 'ottimo',         nome: 'Ottimo',         quota: 0.80,
      nota: 'In produzione fino a oggi, manutenzioni regolari e documentate.' },
    { id: 'buono',          nome: 'Buono',          quota: 0.58,
      nota: 'Segni d\'uso normali per l\'età. Funziona, ma va messa a punto.' },
    { id: 'da-revisionare', nome: 'Da revisionare', quota: 0.32,
      nota: 'Serve un intervento prima di rimetterla in produzione. Il prezzo ne tiene conto.' },
    { id: 'ricambi',        nome: 'Per ricambi',    quota: 0.12,
      nota: 'Non funzionante: si compra per i pezzi o per il recupero.' }
  ];

  /* --- Listino ------------------------------------------------------------
     prezzo   : euro richiesti, IVA esclusa
     nuovo    : quanto costa oggi la stessa macchina nuova (serve al risparmio)
     contatore: ore, km, battute o cicli — null se la macchina non ne ha uno
     pezzi    : quante unita' compone il lotto (1 = macchina singola)
     ritiroFra: giorni prima che si possa portare via
     garanzia : mesi coperti dal venditore (0 = venduta vista e piaciuta)
     consegna : ritiro | inclusa | accordo
     smontaggio: incluso | acquirente | gia-smontato
     asta     : { base, rilancio, scadeFra, offerte } se la formula lo prevede  */
  var ASSET = [
    {
      id: 'FRM-CNC-0142', cat: 'cnc', mod: ['fisso', 'trattativa'],
      titolo: 'Centro di lavoro 5 assi Haas UMC-750',
      citta: 'Brescia', prov: 'BS', regione: 'Lombardia',
      venditore: 'Meccanica Vallecamonica srl', dal: 2009, rating: 4.8, recensioni: 132, verificato: true,
      prezzo: 118000, nuovo: 310000,
      anno: 2016, contatore: { valore: 14200, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 21, garanzia: 6, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Sostituita da un cinque assi più grande. Esce dalla produzione a fine mese, con tutta l\'attrezzatura e i post processor già fatti.',
      specifiche: [
        ['Corse X/Y/Z', '762 × 508 × 508 mm'],
        ['Tavola rotobasculante', 'Ø 500 mm, 300 kg'],
        ['Mandrino', '8.100 giri/min, 22,4 kW'],
        ['Magazzino utensili', '40 posti, cambio 4,5 s'],
        ['Controllo', 'Haas NGC — post Fusion 360 / Mastercam'],
        ['Ore mandrino', '9.100 sulle 14.200 macchina'],
        ['Ultimo intervento', 'Revisione mandrino e guide, marzo 2025']
      ],
      certificazioni: ['Marcatura CE', 'Verifica periodica 2025'],
      incluso: ['40 portautensili con attacco', 'Set morse e staffaggi', 'Manuali, schemi e licenze controllo'],
      escluso: ['Trasporto', 'Utensili da taglio', 'Riqualificazione elettrica in sede tua'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-CNC-0088', cat: 'cnc', mod: ['trattativa'],
      titolo: 'Tornio a fantina mobile Citizen L20 con caricatore',
      citta: 'Lumezzane', prov: 'BS', regione: 'Lombardia',
      venditore: 'Torneria Bortolotti', dal: 1998, rating: 4.6, recensioni: 74, verificato: true,
      prezzo: 46500, nuovo: 168000,
      anno: 2011, contatore: { valore: 38400, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 10, garanzia: 3, consegna: 'ritiro', smontaggio: 'incluso',
      sintesi: 'Chiusa la commessa automotive che la teneva occupata, il reparto si accorcia. Macchina rodata, mai ferma più di una settimana.',
      specifiche: [
        ['Diametro barra', 'max Ø 20 mm'],
        ['Assi', '5 assi, 2 mandrini, utensili motorizzati'],
        ['Caricatore', 'LNS Sprint 20 incluso, barre 3 m'],
        ['Ore mandrino principale', '38.400'],
        ['Pinze e portautensili', 'Corredo completo compreso'],
        ['Note', 'Sostituite pinze e cinghie nel 2024']
      ],
      certificazioni: ['Marcatura CE'],
      incluso: ['Caricatore barre LNS', 'Corredo pinze e portautensili', 'Programmi delle lavorazioni storiche'],
      escluso: ['Trasporto', 'Olio e refrigerante', 'Smaltimento fanghi'],
      motivo: 'fine-commessa'
    },
    {
      id: 'FRM-CNC-0311', cat: 'cnc', mod: ['fisso'],
      titolo: 'Fresatrice a portale 3 assi per legno e compositi',
      citta: 'Pesaro', prov: 'PU', regione: 'Marche',
      venditore: 'Falegnameria Rossini snc', dal: 2014, rating: 4.4, recensioni: 41, verificato: false,
      prezzo: 21800, nuovo: 58000,
      anno: 2018, contatore: { valore: 6900, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 5, garanzia: 0, consegna: 'ritiro', smontaggio: 'acquirente',
      sintesi: 'Comprata per una linea di arredo che non abbiamo più. Piano 3 × 1,5 m, vuoto a quattro settori, aspirazione compresa.',
      specifiche: [
        ['Piano di lavoro', '3.050 × 1.550 mm'],
        ['Corsa Z', '200 mm'],
        ['Elettromandrino', '9 kW raffreddato ad aria, 1.100 ore'],
        ['Aspirazione', 'Impianto 7,5 kW con filtro a maniche, compreso'],
        ['Tenuta pezzo', 'Vuoto a 4 settori con pompa da 250 m³/h'],
        ['Controllo', 'Osai con postazione e licenza CAM']
      ],
      certificazioni: [],
      incluso: ['Impianto di aspirazione', 'Pompa del vuoto', 'Frese standard Ø 6-12', 'Piano sacrificale nuovo'],
      escluso: ['Trasporto', 'Smontaggio e carico', 'Frese diamantate'],
      motivo: 'cambio-produzione'
    },
    {
      id: 'FRM-CNC-0577', cat: 'cnc', mod: ['fisso', 'trattativa'],
      titolo: 'Rettificatrice in tondo CNC per alberi fino a 800 mm',
      citta: 'Reggio Emilia', prov: 'RE', regione: 'Emilia-Romagna',
      venditore: 'Rettifiche Padane', dal: 1990, rating: 4.8, recensioni: 97, verificato: true,
      prezzo: 63000, nuovo: 195000,
      anno: 2013, contatore: { valore: 26800, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 30, garanzia: 6, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Accorpiamo due reparti in un sito solo e una delle due rettifiche resta fuori. Geometrie verificate a gennaio, rapporto allegato.',
      specifiche: [
        ['Distanza tra le punte', '800 mm'],
        ['Diametro max', 'Ø 320 mm'],
        ['Mola', 'CBN con equilibratura automatica'],
        ['Misura in macchina', 'Marposs in-process, funzionante'],
        ['Precisione verificata', 'IT4, rugosità Ra 0,2 — collaudo 01/2026'],
        ['Ricambi', 'Mandrino di scorta revisionato compreso']
      ],
      certificazioni: ['Marcatura CE', 'Collaudo geometrico 2026'],
      incluso: ['Mandrino di scorta', 'Misuratore Marposs', 'Rapporto di collaudo'],
      escluso: ['Trasporto', 'Mole', 'Impianto di aspirazione nebbie'],
      motivo: 'accorpamento'
    },
    {
      id: 'FRM-ADD-0455', cat: 'additivo', mod: ['trattativa'],
      titolo: 'Sinterizzazione laser SLS — EOS P396',
      citta: 'Torino', prov: 'TO', regione: 'Piemonte',
      venditore: 'Additive Lab Piemonte', dal: 2016, rating: 4.9, recensioni: 218, verificato: true,
      prezzo: 96000, nuovo: 265000,
      anno: 2017, contatore: { valore: 11400, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 14, garanzia: 6, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Passiamo a una macchina a camera più grande. Questa ha lavorato solo PA12, con polvere sempre certificata.',
      specifiche: [
        ['Volume di costruzione', '340 × 340 × 600 mm'],
        ['Laser', 'CO₂ 70 W, sostituito nel 2023'],
        ['Materiali lavorati', 'Solo PA2200 e PA12 caricato vetro'],
        ['Ore laser', '4.900 dal cambio sorgente'],
        ['Stazione di setaccio', 'Compresa, con aspiratore ATEX'],
        ['Software', 'Licenze EOSPRINT trasferibili']
      ],
      certificazioni: ['Marcatura CE', 'Contratto di assistenza attivo fino al 2027'],
      incluso: ['Stazione di setaccio e depolverizzazione', 'Due piattaforme di costruzione', 'Licenze software'],
      escluso: ['Polvere di scorta', 'Trasporto', 'Installazione'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-ADD-0173', cat: 'additivo', mod: ['fisso'],
      titolo: 'Lotto di 8 stampanti FDM industriali con carrelli',
      citta: 'Bologna', prov: 'BO', regione: 'Emilia-Romagna',
      venditore: 'Officina Zero Nove', dal: 2019, rating: 4.5, recensioni: 96, verificato: true,
      prezzo: 14400, nuovo: 41000,
      anno: 2020, contatore: { valore: 9800, unita: 'ore' }, condizione: 'buono',
      pezzi: 8, ritiroFra: 2, garanzia: 3, consegna: 'inclusa', smontaggio: 'gia-smontato',
      sintesi: 'La farm si ferma: chiudiamo il servizio di stampa conto terzi. Otto macchine identiche, ricambi in comune, si vendono solo in blocco.',
      specifiche: [
        ['Macchine', '8 unità identiche, 300 × 300 × 400 mm'],
        ['Camera', 'Chiusa e riscaldata su 4 delle 8'],
        ['Ugelli', 'Corredo 0,4 / 0,6 / 0,8 mm per ciascuna'],
        ['Ore medie per macchina', '1.225'],
        ['Stato', 'Tutte funzionanti, tre con piano sostituito'],
        ['Prezzo', 'Riferito all\'intero lotto, 1.800 € a macchina']
      ],
      certificazioni: [],
      incluso: ['Otto carrelli porta-macchina', 'Ricambi di scorta (ugelli, piani, cinghie)', 'Profili di stampa collaudati'],
      escluso: ['Filamento', 'Postazione di controllo'],
      motivo: 'cessazione-ramo'
    },
    {
      id: 'FRM-ADD-0620', cat: 'additivo', mod: ['asta'],
      titolo: 'Fusione laser metallo LPBF — acciaio e AlSi10Mg',
      citta: 'Modena', prov: 'MO', regione: 'Emilia-Romagna',
      venditore: 'Tecnopolvere spa', dal: 2012, rating: 4.7, recensioni: 63, verificato: true,
      prezzo: 132000, nuovo: 480000,
      anno: 2015, contatore: { valore: 21600, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 25, garanzia: 0, consegna: 'accordo', smontaggio: 'incluso',
      asta: { base: 78000, rilancio: 1000, scadeFra: 6, offerte: 9 },
      sintesi: 'Dismissione del reparto metallo dopo il cambio di proprietà. Si vende all\'asta perché il valore lo faccia il mercato, non noi.',
      specifiche: [
        ['Volume di costruzione', '250 × 250 × 300 mm'],
        ['Sorgente', 'Fibra 400 W, ore laser 12.800'],
        ['Materiali lavorati', '1.2709, 316L, AlSi10Mg'],
        ['Impianto gas', 'Generatore di azoto compreso'],
        ['Ultimo service', 'Ottobre 2025, filtri e guarnizioni'],
        ['Stato', 'In produzione fino alla settimana scorsa']
      ],
      certificazioni: ['Marcatura CE', 'Registro manutenzioni completo'],
      incluso: ['Generatore di azoto', 'Due piastre di costruzione', 'Stazione di depolverizzazione'],
      escluso: ['Polveri', 'Trasporto', 'Forno di distensione'],
      motivo: 'dismissione-reparto'
    },
    {
      id: 'FRM-ADD-0931', cat: 'additivo', mod: ['fisso'],
      titolo: 'Tre stampanti SLA per resine tecniche, con post-processo',
      citta: 'Milano', prov: 'MI', regione: 'Lombardia',
      venditore: 'Prototipi Lambrate', dal: 2020, rating: 4.5, recensioni: 112, verificato: true,
      prezzo: 6900, nuovo: 19500,
      anno: 2021, contatore: { valore: 5200, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 3, ritiroFra: 1, garanzia: 3, consegna: 'inclusa', smontaggio: 'gia-smontato',
      sintesi: 'Ci siamo spostati sull\'additivo a polvere e le SLA restano ferme in una stanza. Tre macchine più lavaggio e polimerizzazione.',
      specifiche: [
        ['Macchine', '3 unità, volume 192 × 120 × 245 mm'],
        ['Risoluzione XY', '50 µm'],
        ['Post-processo', 'Stazione di lavaggio e forno di cura compresi'],
        ['Serbatoi', 'Sei serbatoi, due nuovi mai montati'],
        ['Ore medie per macchina', '1.730'],
        ['Prezzo', 'Riferito al lotto completo']
      ],
      certificazioni: [],
      incluso: ['Stazione lavaggio e cura', 'Sei serbatoi e quattro piattaforme', 'Due litri di resina Tough'],
      escluso: ['Resine oltre l\'avanzo', 'Cappa di aspirazione'],
      motivo: 'cambio-tecnologia'
    },
    {
      id: 'FRM-TAG-0207', cat: 'taglio', mod: ['fisso', 'trattativa'],
      titolo: 'Laser fibra 6 kW con cambio pallet — lamiera fino a 20 mm',
      citta: 'Vicenza', prov: 'VI', regione: 'Veneto',
      venditore: 'Carpenteria Bassano srl', dal: 2004, rating: 4.7, recensioni: 187, verificato: true,
      prezzo: 168000, nuovo: 430000,
      anno: 2019, contatore: { valore: 18900, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 45, garanzia: 12, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Arriva un 12 kW a giugno e questa esce. Lavora tutti i giorni fino al ritiro, quindi si vede in funzione su appuntamento.',
      specifiche: [
        ['Area di taglio', '3.000 × 1.500 mm'],
        ['Sorgente', 'Fibra 6 kW, 18.900 ore totali'],
        ['Spessori', 'Acciaio 20 mm · Inox 12 mm · Alluminio 10 mm'],
        ['Cambio pallet', 'Automatico, 25 s — compreso'],
        ['Aspirazione', 'Impianto filtrante 2023, filtri nuovi'],
        ['Garanzia', '12 mesi sulla sorgente, contratto trasferibile']
      ],
      certificazioni: ['Marcatura CE', 'Contratto assistenza trasferibile'],
      incluso: ['Cambio pallet automatico', 'Impianto di aspirazione', 'Chiller', 'Software di nesting con licenza'],
      escluso: ['Trasporto eccezionale', 'Gas tecnici', 'Opere murarie'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-TAG-0512', cat: 'taglio', mod: ['trattativa'],
      titolo: 'Waterjet 5 assi 4 × 2 m per marmo, vetro e compositi',
      citta: 'Carrara', prov: 'MS', regione: 'Toscana',
      venditore: 'Apuane Stone Lab', dal: 2011, rating: 4.6, recensioni: 58, verificato: true,
      prezzo: 74000, nuovo: 215000,
      anno: 2013, contatore: { valore: 24500, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 20, garanzia: 3, consegna: 'ritiro', smontaggio: 'incluso',
      sintesi: 'Il lapideo tira meno e la seconda macchina non serve più. Pompa revisionata a novembre con documenti.',
      specifiche: [
        ['Area di taglio', '4.000 × 2.000 mm'],
        ['Pompa', '4.100 bar, revisione completa 11/2025'],
        ['Testa', '5 assi con compensazione conicità'],
        ['Spessore max', '150 mm in pietra, 80 mm in acciaio'],
        ['Ore pompa dal service', '900'],
        ['Impianto abrasivo', 'Silo e dosatore compresi']
      ],
      certificazioni: ['Marcatura CE', 'Fattura di revisione pompa'],
      incluso: ['Silo abrasivo e dosatore', 'Vasca e sistema di scarico fanghi', 'Ricambi teste di taglio'],
      escluso: ['Trasporto', 'Ponte di sollevamento', 'Abrasivo'],
      motivo: 'calo-ordini'
    },
    {
      id: 'FRM-TAG-0349', cat: 'taglio', mod: ['fisso'],
      titolo: 'Laser CO2 90 W da banco — legno, tessuto, plexiglass',
      citta: 'Napoli', prov: 'NA', regione: 'Campania',
      venditore: 'Fablab Sanità', dal: 2017, rating: 4.3, recensioni: 149, verificato: false,
      prezzo: 2400, nuovo: 7800,
      anno: 2019, contatore: { valore: 3200, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 0, garanzia: 0, consegna: 'ritiro', smontaggio: 'acquirente',
      sintesi: 'Abbiamo preso una macchina più grande e questa è di troppo. Tubo sostituito da 400 ore, aspirazione compresa.',
      specifiche: [
        ['Area di lavoro', '900 × 600 mm'],
        ['Sorgente', 'CO₂ 90 W, tubo nuovo da 400 ore'],
        ['Raffreddamento', 'Chiller compreso'],
        ['Spessori', 'Compensato 10 mm · PMMA 12 mm'],
        ['Aspirazione', 'Filtro a carboni attivi compreso'],
        ['Software', 'LightBurn, licenza da riacquistare']
      ],
      certificazioni: [],
      incluso: ['Chiller', 'Filtro a carboni attivi', 'Due tubi di scorta'],
      escluso: ['Licenza software', 'Trasporto', 'Materiali'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-DEF-0501', cat: 'deformazione', mod: ['asta'],
      titolo: 'Pressa piegatrice Gasparini 100 t — 3.100 mm',
      citta: 'Udine', prov: 'UD', regione: 'Friuli-Venezia Giulia',
      venditore: 'Fratelli Toppan srl in liquidazione', dal: 1994, rating: 4.1, recensioni: 12, verificato: true,
      prezzo: 21500, nuovo: 98000,
      anno: 2008, contatore: { valore: 18400, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 15, garanzia: 0, consegna: 'ritiro', smontaggio: 'acquirente',
      asta: { base: 12500, rilancio: 500, scadeFra: 3, offerte: 17 },
      sintesi: 'Cessata attività: il curatore vende all\'asta tutto il reparto. Macchina in produzione fino a giugno, revisionata nel 2021.',
      specifiche: [
        ['Forza', '100 t'],
        ['Lunghezza di piega', '3.100 mm'],
        ['Assi controllati', 'Y1, Y2, X, R'],
        ['Controllo', 'ESA S630 grafico, funzionante'],
        ['Ore macchina', '18.400'],
        ['Utensili', 'Set punzoni e matrici, 12 pezzi, compreso']
      ],
      certificazioni: ['Marcatura CE', 'Verifica periodica 2025'],
      incluso: ['Set utensili 12 pezzi', 'Manuali e schemi elettrici', 'Assistenza al carico con muletto'],
      escluso: ['Smontaggio', 'Trasporto', 'Fermo macchina oltre i 15 giorni'],
      motivo: 'liquidazione'
    },
    {
      id: 'FRM-DEF-0233', cat: 'deformazione', mod: ['fisso', 'trattativa'],
      titolo: 'Cesoia a ghigliottina idraulica 3.000 × 10 mm',
      citta: 'Padova', prov: 'PD', regione: 'Veneto',
      venditore: 'Officina Meccanica Zaccaria', dal: 2001, rating: 4.5, recensioni: 62, verificato: true,
      prezzo: 16500, nuovo: 54000,
      anno: 2010, contatore: { valore: 42000, unita: 'cicli' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 7, garanzia: 3, consegna: 'ritiro', smontaggio: 'incluso',
      sintesi: 'Da quando tagliamo al laser la cesoia lavora due giorni al mese. Lame girate l\'anno scorso, tre taglienti ancora buoni.',
      specifiche: [
        ['Lunghezza di taglio', '3.000 mm'],
        ['Spessore max', '10 mm su acciaio dolce'],
        ['Angolo di taglio', 'Regolabile, registro motorizzato 600 mm'],
        ['Lame', 'Girate nel 2025, tre taglienti disponibili'],
        ['Controllo', 'Delem DAC-310'],
        ['Cicli contati', '42.000']
      ],
      certificazioni: ['Marcatura CE', 'Verifica periodica 2025'],
      incluso: ['Registro posteriore motorizzato', 'Set lame di scorta', 'Carrello raccolta sfridi'],
      escluso: ['Trasporto', 'Basamento'],
      motivo: 'cambio-tecnologia'
    },
    {
      id: 'FRM-DEF-0788', cat: 'deformazione', mod: ['trattativa'],
      titolo: 'Pressa eccentrica 160 t con svolgitore e raddrizzatore',
      citta: 'Bergamo', prov: 'BG', regione: 'Lombardia',
      venditore: 'Stampi e Tranciati Brembo srl', dal: 1987, rating: 4.4, recensioni: 38, verificato: true,
      prezzo: 38000, nuovo: 150000,
      anno: 1998, contatore: { valore: 12400000, unita: 'battute' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 30, garanzia: 0, consegna: 'ritiro', smontaggio: 'venditore',
      sintesi: 'Linea completa: pressa, svolgitore e raddrizzatore si vendono insieme. Frizione e freno rifatti nel 2022 con certificato.',
      specifiche: [
        ['Forza', '160 t'],
        ['Corsa', '120 mm regolabile'],
        ['Piano', '1.400 × 800 mm'],
        ['Linea', 'Svolgitore 2 t e raddrizzatore compresi'],
        ['Sicurezze', 'Barriere ottiche e doppio comando a norma'],
        ['Battute contate', '12,4 milioni']
      ],
      certificazioni: ['Marcatura CE', 'Verifica frizione-freno 2022', 'Fascicolo tecnico'],
      incluso: ['Svolgitore e raddrizzatore', 'Barriere ottiche', 'Fascicolo tecnico e schemi'],
      escluso: ['Stampi', 'Trasporto', 'Fondazione'],
      motivo: 'accorpamento'
    },
    {
      id: 'FRM-OFF-0119', cat: 'officina', mod: ['fisso'],
      titolo: 'Isola di saldatura TIG/MIG con banco 3 m e aspirazione',
      citta: 'Piacenza', prov: 'PC', regione: 'Emilia-Romagna',
      venditore: 'Carpenteria Val Trebbia srl', dal: 2005, rating: 4.2, recensioni: 24, verificato: false,
      prezzo: 7900, nuovo: 26500,
      anno: 2015, contatore: null, condizione: 'buono',
      pezzi: 1, ritiroFra: 3, garanzia: 0, consegna: 'ritiro', smontaggio: 'acquirente',
      sintesi: 'Il saldatore è andato in pensione e l\'isola resta ferma. Si vende tutta insieme: banco, generatori, aspirazione e attrezzatura.',
      specifiche: [
        ['Banco', '3.000 × 1.500 mm forato Ø 16, piano ancora piano'],
        ['Generatori', 'TIG AC/DC 250 A (2016) · MIG sinergico 400 A (2015)'],
        ['Aspirazione', 'Braccio articolato 3 m con filtro, certificato'],
        ['Attrezzatura', 'Squadre magnetiche, morsetti, positioner 150 kg'],
        ['Stato', 'Funzionante, torce da sostituire'],
        ['Contatore', 'Nessuno: ore non registrate']
      ],
      certificazioni: ['Marcatura CE sui generatori'],
      incluso: ['Positioner 150 kg', 'Squadre e morsetti', 'Impianto di aspirazione'],
      escluso: ['Bombole', 'Trasporto', 'Torce di ricambio'],
      motivo: 'pensionamento'
    },
    {
      id: 'FRM-OFF-0388', cat: 'officina', mod: ['trattativa'],
      titolo: 'Cabina di verniciatura pressurizzata 7 m — smontata',
      citta: 'Prato', prov: 'PO', regione: 'Toscana',
      venditore: 'Verniciature Bisenzio', dal: 2007, rating: 4.4, recensioni: 88, verificato: true,
      prezzo: 18500, nuovo: 68000,
      anno: 2012, contatore: null, condizione: 'buono',
      pezzi: 1, ritiroFra: 0, garanzia: 0, consegna: 'ritiro', smontaggio: 'gia-smontato',
      sintesi: 'Abbiamo cambiato capannone e la cabina non ci sta. È già smontata, pallettizzata e numerata pezzo per pezzo.',
      specifiche: [
        ['Dimensioni utili', '7.000 × 4.000 × 3.000 mm'],
        ['Filtrazione', 'Plenum e filtri a pavimento, ricambio 25.000 m³/h'],
        ['Essiccazione', 'Bruciatore fino a 60 °C, funzionante'],
        ['Illuminazione', '1.200 lux, resa cromatica 90'],
        ['Stato', 'Smontata, numerata, su otto bancali'],
        ['Documenti', 'Disegni di montaggio e schemi compresi']
      ],
      certificazioni: ['Marcatura CE', 'Dichiarazione di conformità impianto'],
      incluso: ['Disegni di montaggio', 'Bruciatore e quadro elettrico', 'Filtri nuovi imballati'],
      escluso: ['Trasporto', 'Rimontaggio', 'Pratica AUA nella tua sede'],
      motivo: 'trasloco'
    },
    {
      id: 'FRM-OFF-0666', cat: 'officina', mod: ['fisso'],
      titolo: 'Lotto di 6 macchine da cucire industriali con tavolo taglio',
      citta: 'Carpi', prov: 'MO', regione: 'Emilia-Romagna',
      venditore: 'Confezioni Emilia snc', dal: 1999, rating: 4.6, recensioni: 51, verificato: true,
      prezzo: 5400, nuovo: 22000,
      anno: 2016, contatore: null, condizione: 'buono',
      pezzi: 6, ritiroFra: 12, garanzia: 0, consegna: 'inclusa', smontaggio: 'incluso',
      sintesi: 'Sei postazioni ferme dopo il calo degli ordini. Si vendono in blocco con il tavolo di taglio e la caldaia da stiro.',
      specifiche: [
        ['Macchine', '2 lineari, 2 taglia-cuci, 1 ricopritura, 1 travetta'],
        ['Marca', 'Juki e Pegasus, tutte revisionate nel 2024'],
        ['Tavolo di taglio', '6 m con taglierina verticale, compreso'],
        ['Stiro', 'Caldaia industriale con due ferri, compresa'],
        ['Stato', 'Tutte in ordine, cinghie nuove'],
        ['Prezzo', 'Riferito all\'intero lotto']
      ],
      certificazioni: ['Marcatura CE'],
      incluso: ['Tavolo di taglio 6 m', 'Caldaia da stiro e due ferri', 'Ricambi e aghi'],
      escluso: ['Filati e tessuti', 'Sedute'],
      motivo: 'calo-ordini'
    },
    {
      id: 'FRM-OFF-0902', cat: 'officina', mod: ['asta'],
      titolo: 'Compressore a vite 55 kW con essiccatore e serbatoio 1.000 l',
      citta: 'Cesena', prov: 'FC', regione: 'Emilia-Romagna',
      venditore: 'Conserve Romagna spa', dal: 1996, rating: 4.7, recensioni: 91, verificato: true,
      prezzo: 6800, nuovo: 29000,
      anno: 2014, contatore: { valore: 21000, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 8, garanzia: 0, consegna: 'ritiro', smontaggio: 'incluso',
      asta: { base: 3400, rilancio: 100, scadeFra: 2, offerte: 23 },
      sintesi: 'Sostituito da due macchine più piccole a inverter. Va all\'asta con l\'essiccatore e il serbatoio, in blocco.',
      specifiche: [
        ['Potenza', '55 kW, 8 bar'],
        ['Portata', '9,8 m³/min'],
        ['Ore totali', '21.000, tagliando alle 20.500'],
        ['Essiccatore', 'A ciclo frigorifero, compreso'],
        ['Serbatoio', '1.000 l con certificato INAIL'],
        ['Stato', 'In esercizio fino al ritiro']
      ],
      certificazioni: ['Marcatura CE', 'Verifica INAIL serbatoio 2025'],
      incluso: ['Essiccatore', 'Serbatoio 1.000 l certificato', 'Filtri di linea'],
      escluso: ['Trasporto', 'Tubazioni fisse', 'Quadro di alimentazione'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-LAB-0264', cat: 'laboratorio', mod: ['trattativa'],
      titolo: 'Camera climatica 1.000 l — da −40 a +180 °C',
      citta: 'Roma', prov: 'RM', regione: 'Lazio',
      venditore: 'Istituto Prove Materiali Tiburtina', dal: 1988, rating: 4.9, recensioni: 204, verificato: true,
      prezzo: 24500, nuovo: 82000,
      anno: 2014, contatore: { valore: 31800, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 18, garanzia: 6, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Sostituita da una camera più capiente. Tarata a gennaio, con certificato ACCREDIA ancora valido.',
      specifiche: [
        ['Volume', '1.000 l'],
        ['Temperatura', '−40 °C ÷ +180 °C'],
        ['Umidità', '10 % ÷ 98 % UR'],
        ['Gradiente', '5 °C/min'],
        ['Taratura', 'ACCREDIA gennaio 2026, certificato compreso'],
        ['Gruppo frigo', 'Compressore sostituito nel 2023']
      ],
      certificazioni: ['Marcatura CE', 'Certificato di taratura ACCREDIA 2026'],
      incluso: ['Certificato di taratura', 'Software di registrazione con licenza', 'Ripiani e passacavi'],
      escluso: ['Trasporto', 'Nuova taratura dopo lo spostamento'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-LAB-0410', cat: 'laboratorio', mod: ['fisso', 'trattativa'],
      titolo: 'Tomografo industriale CT 225 kV per controllo non distruttivo',
      citta: 'Trento', prov: 'TN', regione: 'Trentino-Alto Adige',
      venditore: 'Metrologia Alpina srl', dal: 2015, rating: 4.8, recensioni: 47, verificato: true,
      prezzo: 145000, nuovo: 395000,
      anno: 2018, contatore: { valore: 7400, unita: 'ore' }, condizione: 'come-nuovo',
      pezzi: 1, ritiroFra: 40, garanzia: 12, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Il socio che la usava ha aperto un laboratorio suo e ci separiamo. Poche ore, bunker e software compresi.',
      specifiche: [
        ['Tensione tubo', '225 kV microfocus, 7.400 ore'],
        ['Pezzo max', 'Ø 300 × 400 mm, 20 kg'],
        ['Risoluzione voxel', 'da 5 µm'],
        ['Cabina', 'Schermata, smontabile, compresa'],
        ['Software', 'VGSTUDIO MAX, licenza trasferibile'],
        ['Verifica', 'VDI/VDE 2630 superata a dicembre']
      ],
      certificazioni: ['Marcatura CE', 'Verifica radioprotezione 2025'],
      incluso: ['Cabina schermata smontabile', 'Licenza VGSTUDIO MAX', 'Postazione di elaborazione'],
      escluso: ['Trasporto', 'Pratica di radioprotezione nella tua sede'],
      motivo: 'scissione'
    },
    {
      id: 'FRM-LAB-0855', cat: 'laboratorio', mod: ['trattativa'],
      titolo: 'Banco prova motori elettrici fino a 250 kW, freno rigenerativo',
      citta: 'Ancona', prov: 'AN', regione: 'Marche',
      venditore: 'Adriatic Power Test', dal: 2017, rating: 4.5, recensioni: 29, verificato: true,
      prezzo: 92000, nuovo: 245000,
      anno: 2017, contatore: { valore: 9600, unita: 'ore' }, condizione: 'ottimo',
      pezzi: 1, ritiroFra: 35, garanzia: 6, consegna: 'accordo', smontaggio: 'incluso',
      sintesi: 'Chiudiamo la sede di Ancona e concentriamo le prove al nord. Banco completo, acquisizione e staffaggi compresi.',
      specifiche: [
        ['Potenza max', '250 kW'],
        ['Coppia', '1.200 Nm fino a 6.000 giri/min'],
        ['Freno', 'Rigenerativo in rete, quadro compreso'],
        ['Acquisizione', '200 canali a 10 kHz, con software'],
        ['Ore banco', '9.600'],
        ['Staffaggi', 'Nove attrezzature specifiche comprese']
      ],
      certificazioni: ['Marcatura CE', 'Taratura celle di carico 2025'],
      incluso: ['Sistema di acquisizione e software', 'Nove staffaggi', 'Quadro di rigenerazione'],
      escluso: ['Trasporto', 'Basamento antivibrante', 'Allacciamento in media tensione'],
      motivo: 'chiusura-sede'
    },
    {
      id: 'FRM-MAG-0704', cat: 'magazzino', mod: ['fisso'],
      titolo: 'Scaffalatura portapallet 480 posti — smontata e pallettizzata',
      citta: 'Novara', prov: 'NO', regione: 'Piemonte',
      venditore: 'Cartotecnica del Ticino spa', dal: 1985, rating: 4.3, recensioni: 18, verificato: true,
      prezzo: 7400, nuovo: 27000,
      anno: 2016, contatore: null, condizione: 'buono',
      pezzi: 1, ritiroFra: 0, garanzia: 0, consegna: 'ritiro', smontaggio: 'gia-smontato',
      sintesi: 'Liberata dopo il trasloco nel nuovo sito. Già smontata e pronta al carico, con la relazione di calcolo originale.',
      specifiche: [
        ['Posti pallet', '480 su 4 livelli'],
        ['Spalle', '80 pezzi, h 7.500 mm'],
        ['Correnti', '960 pezzi, luce 2.700 mm'],
        ['Portata', '2.400 kg per coppia di correnti'],
        ['Marca', 'Modulblok, installazione 2016'],
        ['Stato', 'Buono, sei correnti da sostituire (segnalate)']
      ],
      certificazioni: ['Relazione di calcolo originale', 'Dichiarazione di conformità'],
      incluso: ['Relazione di calcolo', 'Piani di carico', 'Bancali di trasporto'],
      escluso: ['Trasporto', 'Montaggio', 'Nuovo collaudo'],
      motivo: 'trasloco'
    },
    {
      id: 'FRM-MAG-0021', cat: 'magazzino', mod: ['trattativa'],
      titolo: 'Cella frigo modulare +2/+6 °C, 180 m³ — smontabile',
      citta: 'Genova', prov: 'GE', regione: 'Liguria',
      venditore: 'Frigoriferi del Porto srl', dal: 1979, rating: 4.8, recensioni: 143, verificato: true,
      prezzo: 12500, nuovo: 46000,
      anno: 2015, contatore: { valore: 42000, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 25, garanzia: 3, consegna: 'ritiro', smontaggio: 'venditore',
      sintesi: 'Ridisegniamo il magazzino e questa cella esce. Pannelli in buono stato, gruppo frigo revisionato l\'anno scorso.',
      specifiche: [
        ['Volume', '180 m³ — 10 × 6 × 3 m'],
        ['Temperatura', '+2 ÷ +6 °C'],
        ['Pannelli', 'Poliuretano 100 mm, aggancio a camma'],
        ['Gruppo frigo', 'Revisionato 2025, gas R449A'],
        ['Porte', 'Una scorrevole 1,8 m e una pedonale'],
        ['Ore gruppo', '42.000']
      ],
      certificazioni: ['Marcatura CE', 'Libretto impianto F-gas aggiornato'],
      incluso: ['Gruppo frigo e evaporatori', 'Porte e ferramenta', 'Registratore di temperatura'],
      escluso: ['Trasporto', 'Rimontaggio', 'Carica gas dopo lo spostamento'],
      motivo: 'riorganizzazione'
    },
    {
      id: 'FRM-MAG-0777', cat: 'magazzino', mod: ['trattativa'],
      titolo: 'Due silos in acciaio da 60 m³ con coclee di scarico',
      citta: 'Foggia', prov: 'FG', regione: 'Puglia',
      venditore: 'Molini del Tavoliere', dal: 1971, rating: 4.7, recensioni: 38, verificato: true,
      prezzo: 18500, nuovo: 62000,
      anno: 2011, contatore: null, condizione: 'buono',
      pezzi: 2, ritiroFra: 60, garanzia: 0, consegna: 'ritiro', smontaggio: 'venditore',
      sintesi: 'Sostituiti da un impianto più grande dopo il raccolto. Si smontano a settembre, quando le celle sono vuote.',
      specifiche: [
        ['Capienza', '60 m³ l\'uno, 120 m³ in totale'],
        ['Materiale', 'Acciaio zincato, fondo conico'],
        ['Coclee', 'Due da 30 t/h, comprese'],
        ['Altezza', '9,2 m con scala e piattaforma'],
        ['Prodotti stoccati', 'Solo cereali e sfarinati'],
        ['Stato', 'Zincatura integra, tenuta verificata']
      ],
      certificazioni: ['Dichiarazione di conformità', 'Relazione di calcolo strutturale'],
      incluso: ['Coclee di scarico', 'Scala e piattaforma', 'Relazione strutturale'],
      escluso: ['Smontaggio prima di settembre', 'Trasporto eccezionale', 'Fondazioni'],
      motivo: 'sostituzione'
    },
    {
      id: 'FRM-VEI-0092', cat: 'veicoli', mod: ['fisso', 'trattativa'],
      titolo: 'Furgone frigo 3,5 t con doppia temperatura e sponda',
      citta: 'Bari', prov: 'BA', regione: 'Puglia',
      venditore: 'Trasporti Adriatici Cotugno', dal: 2010, rating: 4.5, recensioni: 118, verificato: true,
      prezzo: 21500, nuovo: 54000,
      anno: 2019, contatore: { valore: 148000, unita: 'km' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 5, garanzia: 3, consegna: 'ritiro', smontaggio: 'gia-smontato',
      sintesi: 'Rinnoviamo la flotta con mezzi elettrici e i diesel escono uno alla volta. Tagliandi in concessionaria, libretto completo.',
      specifiche: [
        ['Immatricolazione', 'Marzo 2019, Euro 6d'],
        ['Chilometri', '148.000 certificati'],
        ['Vano', '3,7 × 1,8 × 1,9 m, 12 m³'],
        ['Temperature', '+4 °C / −18 °C a doppio scomparto'],
        ['Sponda', 'Idraulica 750 kg, verifica 2025'],
        ['Manutenzione', 'Tagliandi ufficiali, ultimo a 143.000 km']
      ],
      certificazioni: ['ATP valida fino al 2027', 'Revisione fino al 2027'],
      incluso: ['Passaggio di proprietà a nostro carico', 'Set gomme invernali', 'Registratore di temperatura'],
      escluso: ['Trasporto (si guida via)', 'Assicurazione'],
      motivo: 'rinnovo-flotta'
    },
    {
      id: 'FRM-VEI-0447', cat: 'veicoli', mod: ['trattativa'],
      titolo: 'Motrice 18 t con gru 15 tm e cassone ribaltabile',
      citta: 'Verona', prov: 'VR', regione: 'Veneto',
      venditore: 'Autotrasporti Scaligeri', dal: 1992, rating: 4.6, recensioni: 76, verificato: true,
      prezzo: 58000, nuovo: 165000,
      anno: 2015, contatore: { valore: 410000, unita: 'km' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 10, garanzia: 3, consegna: 'ritiro', smontaggio: 'gia-smontato',
      sintesi: 'Il cantiere che la teneva impegnata è finito e non ne apriamo altri. Gru con verifica annuale fatta a maggio.',
      specifiche: [
        ['Massa complessiva', '18 t'],
        ['Chilometri', '410.000'],
        ['Gru', 'Palfinger 15 tm, sbraccio 12 m, verifica 05/2025'],
        ['Cassone', 'Ribaltabile trilaterale 6,2 m'],
        ['Emissioni', 'Euro 6, accesso ZTL merci'],
        ['Manutenzione', 'Officina autorizzata, storico completo']
      ],
      certificazioni: ['Verifica periodica gru 2025', 'Revisione fino al 2026'],
      incluso: ['Imbracature e bilancino', 'Passaggio di proprietà', 'Storico manutenzioni'],
      escluso: ['Trasporto', 'Sostituzione pneumatici posteriori'],
      motivo: 'fine-cantiere'
    },
    {
      id: 'FRM-VEI-0655', cat: 'veicoli', mod: ['fisso'],
      titolo: 'Lotto di 4 furgoni compatti Euro 6 — 2019',
      citta: 'Palermo', prov: 'PA', regione: 'Sicilia',
      venditore: 'Servizi Ambientali Conca d\'Oro', dal: 2003, rating: 4.0, recensioni: 19, verificato: false,
      prezzo: 34500, nuovo: 96000,
      anno: 2019, contatore: { valore: 134000, unita: 'km' }, condizione: 'buono',
      pezzi: 4, ritiroFra: 30, garanzia: 0, consegna: 'ritiro', smontaggio: 'gia-smontato',
      sintesi: 'Rinnovo flotta a fine anno: quattro mezzi con tagliandi regolari, si vendono in blocco. Chilometri da 118.000 a 149.000.',
      specifiche: [
        ['Mezzi', '4 unità, prima immatricolazione marzo 2019'],
        ['Chilometraggio', 'da 118.000 a 149.000 km, media 134.000'],
        ['Motore', '1.5 diesel 102 CV Euro 6d'],
        ['Vano', '3,3 m³ ciascuno'],
        ['Manutenzione', 'Tagliandi ufficiali, libretti completi'],
        ['Prezzo', 'Riferito al lotto — 8.625 € a mezzo']
      ],
      certificazioni: ['Revisione valida fino al 2027'],
      incluso: ['Passaggi di proprietà a nostro carico', 'Quattro set di gomme invernali'],
      escluso: ['Trasporto', 'Garanzia meccanica', 'Vendita di un singolo mezzo'],
      motivo: 'rinnovo-flotta'
    },
    {
      id: 'FRM-VEI-0808', cat: 'veicoli', mod: ['asta'],
      titolo: 'Semirimorchio centinato 13,6 m — 33 pallet',
      citta: 'Caserta', prov: 'CE', regione: 'Campania',
      venditore: 'Trasporti Volturno', dal: 2006, rating: 4.4, recensioni: 84, verificato: true,
      prezzo: 14500, nuovo: 42000,
      anno: 2012, contatore: null, condizione: 'buono',
      pezzi: 1, ritiroFra: 4, garanzia: 0, consegna: 'ritiro', smontaggio: 'gia-smontato',
      asta: { base: 7800, rilancio: 200, scadeFra: 5, offerte: 11 },
      sintesi: 'Ridimensioniamo la flotta e mettiamo all\'asta due semirimorchi: questo è il primo. Telaio sano, centine rifatte nel 2023.',
      specifiche: [
        ['Portata utile', '28 t'],
        ['Lunghezza', '13,6 m, 33 pallet'],
        ['Sponde', 'Apertura laterale totale e posteriore'],
        ['Centine', 'Rifatte nel 2023'],
        ['Freni', 'EBS, pastiglie nuove'],
        ['Revisione', 'Valida fino a ottobre 2026']
      ],
      certificazioni: ['Revisione fino al 2026'],
      incluso: ['Cinghie e barre di sponda', 'Ruota di scorta', 'Passaggio di proprietà'],
      escluso: ['Trasporto', 'Trattore stradale'],
      motivo: 'ridimensionamento'
    },
    {
      id: 'FRM-MOV-0138', cat: 'movimentazione', mod: ['fisso', 'trattativa'],
      titolo: 'Carrello elevatore elettrico 2,5 t con batteria al litio',
      citta: 'Perugia', prov: 'PG', regione: 'Umbria',
      venditore: 'Logistica Umbra srl', dal: 2013, rating: 4.4, recensioni: 55, verificato: true,
      prezzo: 18900, nuovo: 44000,
      anno: 2021, contatore: { valore: 2400, unita: 'ore' }, condizione: 'come-nuovo',
      pezzi: 1, ritiroFra: 2, garanzia: 6, consegna: 'inclusa', smontaggio: 'gia-smontato',
      sintesi: 'Comprato per un picco che non si è ripetuto: 2.400 ore in quattro anni. Batteria al litio con la sua garanzia residua.',
      specifiche: [
        ['Portata', '2.500 kg a 500 mm'],
        ['Sollevamento', '4.700 mm, montante triplex'],
        ['Batteria', 'Litio 48 V, 2.400 ore, garanzia fino al 2027'],
        ['Ricarica', 'Caricabatterie rapido compreso'],
        ['Accessori', 'Traslatore e quarta via idraulica'],
        ['Verifica', 'INAIL valida fino al 2027']
      ],
      certificazioni: ['Marcatura CE', 'Verifica periodica INAIL 2027'],
      incluso: ['Caricabatterie rapido', 'Traslatore e quarta via', 'Consegna entro 300 km'],
      escluso: ['Forche speciali', 'Formazione operatori'],
      motivo: 'sovradimensionamento'
    },
    {
      id: 'FRM-MOV-0392', cat: 'movimentazione', mod: ['trattativa'],
      titolo: 'Piattaforma aerea articolata 20 m fuoristrada',
      citta: 'Firenze', prov: 'FI', regione: 'Toscana',
      venditore: 'Noleggi Arno Attrezzature', dal: 2008, rating: 4.7, recensioni: 129, verificato: true,
      prezzo: 27500, nuovo: 78000,
      anno: 2016, contatore: { valore: 4100, unita: 'ore' }, condizione: 'buono',
      pezzi: 1, ritiroFra: 6, garanzia: 3, consegna: 'accordo', smontaggio: 'gia-smontato',
      sintesi: 'Rinnoviamo il parco noleggio e le macchine oltre gli otto anni escono. Verifica INAIL fatta, libretto in regola.',
      specifiche: [
        ['Altezza di lavoro', '20,1 m'],
        ['Sbraccio', '9,7 m'],
        ['Portata cestello', '230 kg (2 persone)'],
        ['Trazione', '4×4 diesel con stabilizzatori automatici'],
        ['Ore motore', '4.100'],
        ['Verifica', 'INAIL valida fino al 2027']
      ],
      certificazioni: ['Marcatura CE', 'Verifica periodica INAIL 2027'],
      incluso: ['Imbracature', 'Libretto verifiche completo', 'Set ricambi filtri'],
      escluso: ['Trasporto con carrellone', 'Formazione PLE'],
      motivo: 'rinnovo-parco'
    }
  ];

  /* --- Coordinate reali delle citta' a listino ----------------------------
     Servono al quadro delle sedi: i punti sono i luoghi dove il ferro sta
     davvero, proiettati in equirettangolare. La sagoma che si vede e' formata
     dalle sedi stesse, non da un contorno disegnato a mano.                  */
  var COORD = {
    'Ancona': [43.62, 13.51],        'Bari': [41.12, 16.87],
    'Bergamo': [45.70, 9.67],        'Bologna': [44.49, 11.34],
    'Brescia': [45.54, 10.22],       'Carpi': [44.78, 10.88],
    'Carrara': [44.08, 10.10],       'Caserta': [41.07, 14.33],
    'Cesena': [44.14, 12.24],        'Firenze': [43.77, 11.26],
    'Foggia': [41.46, 15.55],        'Genova': [44.41, 8.93],
    'Lumezzane': [45.65, 10.26],     'Milano': [45.46, 9.19],
    'Modena': [44.65, 10.93],        'Napoli': [40.85, 14.27],
    'Novara': [45.45, 8.62],         'Padova': [45.41, 11.88],
    'Palermo': [38.12, 13.36],       'Perugia': [43.11, 12.39],
    'Pesaro': [43.91, 12.90],        'Piacenza': [45.05, 9.69],
    'Prato': [43.88, 11.10],         'Reggio Emilia': [44.70, 10.63],
    'Roma': [41.90, 12.50],          'Torino': [45.07, 7.69],
    'Trento': [46.07, 11.12],        'Udine': [46.06, 13.24],
    'Verona': [45.44, 10.99],        'Vicenza': [45.55, 11.55]
  };
  function coord(citta) { return COORD[citta] || null; }

  /* --- Perche' si vende ---------------------------------------------------
     La ragione della vendita conta quanto la scheda tecnica: dice se stai
     comprando un problema o un cambio di programma. */
  var MOTIVI = {
    'sostituzione':       'Sostituita da una macchina nuova',
    'fine-commessa':      'Finita la commessa che la teneva occupata',
    'cambio-produzione':  'Cambio di produzione',
    'cambio-tecnologia':  'Cambio di tecnologia',
    'accorpamento':       'Accorpamento di due reparti',
    'cessazione-ramo':    'Chiusura di un ramo d\'attività',
    'dismissione-reparto':'Dismissione del reparto',
    'liquidazione':       'Liquidazione dell\'azienda',
    'pensionamento':      'Pensionamento di chi la usava',
    'trasloco':           'Trasloco in un altro capannone',
    'calo-ordini':        'Calo degli ordini',
    'chiusura-sede':      'Chiusura della sede',
    'scissione':          'Scissione societaria',
    'riorganizzazione':   'Riorganizzazione del magazzino',
    'rinnovo-flotta':     'Rinnovo della flotta',
    'rinnovo-parco':      'Rinnovo del parco noleggio',
    'ridimensionamento':  'Ridimensionamento della flotta',
    'sovradimensionamento': 'Comprata più grande del necessario'
  };

  /* --- Recensioni ---------------------------------------------------------
     Generate dall'ID: coerenti col voto dichiarato del venditore.            */
  var AUTORI = [
    'Studio Tecnico Ferrari', 'Nautica Sanremo srl', 'Prototipi Bianchi',
    'Elettromeccanica Ionica', 'Design Lab Milano', 'Impianti Rossi & C.',
    'Meccanica Superiore snc', 'Arredi Contract Veneto', 'Restauri Monumentali spa',
    'Cooperativa Agricola Sud', 'Automazioni Brianza', 'Serramenti Alpini'
  ];
  var GIUDIZI = {
    alto: [
      'Macchina esattamente come descritta. Caricata in due ore, documenti tutti in ordine.',
      'Ci hanno lasciato provare un pezzo prima di firmare. Da allora lavora tutti i giorni.',
      'Le ore dichiarate erano quelle vere: le abbiamo verificate a controllo acceso.',
      'Hanno segnalato loro un difetto che non avevamo visto, e scalato il prezzo di conseguenza.',
      'Smontaggio e carico fatti da loro nei tempi promessi. Zero sorprese in fattura.'
    ],
    medio: [
      'Tutto corretto, ma il ritiro è slittato di una settimana rispetto agli accordi.',
      'Macchina buona. La documentazione mancava di due schemi, poi recuperati.',
      'Prezzo giusto per lo stato. Abbiamo dovuto rifare noi l\'impianto elettrico di bordo.',
      'Venditore serio, un po\' lento a rispondere nella prima settimana.'
    ],
    basso: [
      'Funziona, ma serviva più revisione di quanta ne fosse dichiarata.',
      'Il trasporto è stato un problema nostro: nell\'annuncio poteva essere più chiaro.'
    ]
  };

  function recensioni(asset) {
    if (!asset.recensioni) return [];
    var r = rng(asset.id + '|rec');
    var quante = Math.min(4, Math.max(2, Math.round(asset.recensioni / 40)));
    var out = [];
    for (var i = 0; i < quante; i++) {
      var scarto = (r() - 0.35) * 1.4;
      var voto = Math.max(3, Math.min(5, Math.round((asset.rating + scarto) * 2) / 2));
      var fascia = voto >= 4.5 ? 'alto' : voto >= 4 ? 'medio' : 'basso';
      var pool = GIUDIZI[fascia];
      out.push({
        autore: AUTORI[Math.floor(r() * AUTORI.length)],
        voto: voto,
        testo: pool[Math.floor(r() * pool.length)],
        quando: new Date(Date.now() - Math.floor(r() * 240 + 8 + i * 30) * 86400000)
      });
    }
    return out.sort(function (a, b) { return b.quando - a.quando; });
  }

  /* --- Derivazioni -------------------------------------------------------- */
  var GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  /* Calendario deterministico delle visite in sede: 28 giorni da oggi.
     Prima del ritiro la macchina si puo' comunque vedere, ma non portare via.
     stato: libero | mezza | occupato | chiuso                                */
  function calendario(asset, giorni) {
    var r = rng(asset.id + '|vis');
    var oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    var out = [];
    for (var i = 0; i < (giorni || 28); i++) {
      var d = new Date(oggi.getTime() + i * 86400000);
      var dow = (d.getDay() + 6) % 7; /* 0 = lunedi */
      var stato;
      if (i < 1) {
        stato = 'chiuso';                       /* oggi non si organizza piu' */
      } else if (dow >= 5) {
        stato = 'chiuso';                       /* sabato e domenica chiuso */
      } else {
        var p = r();
        if (p < 0.22) stato = 'occupato';       /* altre visite gia' fissate */
        else if (p < 0.45) stato = 'mezza';
        else stato = 'libero';
      }
      out.push({
        data: d, dow: dow, stato: stato,
        ritirabile: i >= asset.ritiroFra
      });
    }
    return out;
  }

  /* Visite alla scheda, ultime 12 settimane: e' il polso dell'interesse. */
  function storicoVisite(assetId) {
    var r = rng(assetId + '|vis12');
    var base = 40 + r() * 120;
    var out = [];
    for (var i = 11; i >= 0; i--) {
      var trend = 1 + (11 - i) * 0.03;
      var rumore = 0.55 + r() * 0.9;
      out.push(Math.round(base * trend * rumore));
    }
    return out;
  }

  /* Quanto si muove un annuncio: visite, salvataggi, proposte, giorni a listino */
  function interesse(assetId) {
    var r = rng(assetId + '|int');
    var visite = Math.round(180 + r() * 900);
    return {
      visite: visite,
      salvati: Math.round(visite * (0.03 + r() * 0.05)),
      offerte: Math.floor(r() * 6),
      giorni: Math.round(4 + r() * 90)
    };
  }

  function byId(id) {
    for (var i = 0; i < ASSET.length; i++) if (ASSET[i].id === id) return ASSET[i];
    return null;
  }
  function categoria(id) {
    for (var i = 0; i < CATEGORIE.length; i++) if (CATEGORIE[i].id === id) return CATEGORIE[i];
    return { id: id, nome: id, breve: id, glifo: 'officina' };
  }
  function formula(id) {
    for (var i = 0; i < FORMULE.length; i++) if (FORMULE[i].id === id) return FORMULE[i];
    return { id: id, nome: id, sigla: '???', nota: '' };
  }
  function condizione(id) {
    for (var i = 0; i < CONDIZIONI.length; i++) if (CONDIZIONI[i].id === id) return CONDIZIONI[i];
    return { id: id, nome: id, quota: 0.5, nota: '' };
  }
  function motivo(id) { return MOTIVI[id] || 'Non dichiarato'; }
  function citta() {
    var set = {};
    ASSET.forEach(function (a) { set[a.citta] = (set[a.citta] || 0) + 1; });
    return Object.keys(set).sort().map(function (c) { return { nome: c, n: set[c] }; });
  }

  global.FERMO_DATA = {
    CATEGORIE: CATEGORIE,
    FORMULE: FORMULE,
    CONDIZIONI: CONDIZIONI,
    ASSET: ASSET,
    GIORNI: GIORNI,
    rng: rng,
    calendario: calendario,
    storicoVisite: storicoVisite,
    interesse: interesse,
    byId: byId,
    categoria: categoria,
    formula: formula,
    condizione: condizione,
    motivo: motivo,
    citta: citta,
    coord: coord,
    recensioni: recensioni,
    /* Parametri commerciali della piattaforma */
    COMMISSIONE: 0.06,   /* la trattiene la piattaforma sul venduto, al venditore */
    PERIZIA: 290,        /* verifica tecnica indipendente prima dell'acquisto */
    TRASPORTO: 480,      /* stima di trasporto su gomma in Italia */
    SMONTAGGIO: 350,     /* stima di smontaggio e carico */
    IVA: 0.22
  };
})(window);
