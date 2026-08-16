/* =============================================================================
   FERMO — DATASET DIMOSTRATIVO
   Nessuna rete, nessun backend: il catalogo vive qui dentro.
   Le disponibilita' e gli storici sono generati con un PRNG seminato dall'ID,
   cosi' la demo e' identica a ogni ricaricamento ma non e' scritta a mano.
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
    { id: 'cnc',            nome: 'Macchine utensili CNC', breve: 'CNC',            glifo: 'cnc' },
    { id: 'additivo',       nome: 'Stampa 3D e additivo',  breve: 'Additivo',       glifo: 'stampante' },
    { id: 'taglio',         nome: 'Taglio laser e waterjet', breve: 'Taglio',       glifo: 'laser' },
    { id: 'officina',       nome: 'Postazioni e saldatura', breve: 'Officina',      glifo: 'officina' },
    { id: 'laboratorio',    nome: 'Laboratori e collaudo', breve: 'Laboratorio',    glifo: 'lab' },
    { id: 'magazzino',      nome: 'Magazzini e celle',     breve: 'Magazzino',      glifo: 'magazzino' },
    { id: 'veicoli',        nome: 'Furgoni e trasporto',   breve: 'Veicoli',        glifo: 'furgone' },
    { id: 'movimentazione', nome: 'Sollevamento e movimentazione', breve: 'Movimentazione', glifo: 'muletto' }
  ];

  var MODALITA = [
    { id: 'affitto',  nome: 'Noleggio',    sigla: 'NOL', nota: 'Usi tu la macchina, in autonomia o con affiancamento.' },
    { id: 'servizio', nome: 'Conto lavoro', sigla: 'C/L', nota: 'Lavora il fornitore. Tu mandi il file o il pezzo.' },
    { id: 'vendita',  nome: 'Dismissione', sigla: 'VEN', nota: 'Macchina in vendita, visionabile in sede.' }
  ];

  /* --- Asset -------------------------------------------------------------- */
  /* prezzo.unita: ora | giorno | settimana | mese | pezzo | m3mese | palletmese | km */
  var ASSET = [
    {
      id: 'FRM-CNC-0142', cat: 'cnc', mod: ['affitto', 'servizio'],
      titolo: 'Centro di lavoro 5 assi Haas UMC-750',
      citta: 'Brescia', prov: 'BS', regione: 'Lombardia',
      fornitore: 'Meccanica Vallecamonica srl', dal: 2009, rating: 4.8, recensioni: 132, verificato: true,
      prezzo: { valore: 48, unita: 'ora' }, minimo: '4 ore', preavviso: 2,
      oreSettimana: 45, oreLibere: 21,
      sintesi: 'Terzo turno scoperto da marzo. Cediamo le notti e i sabati con operatore o in autonomia previo patentino.',
      specifiche: [
        ['Corse X/Y/Z', '762 × 508 × 508 mm'],
        ['Tavola rotobasculante', 'Ø 500 mm, 300 kg'],
        ['Mandrino', '8.100 giri/min, 22,4 kW'],
        ['Magazzino utensili', '40 posti, cambio 4,5 s'],
        ['Controllo', 'Haas NGC — post Fusion 360 / Mastercam'],
        ['Tolleranza tipica', '± 0,015 mm'],
        ['Materiali', 'Acciai, inox, alluminio, titanio Gr.5']
      ],
      certificazioni: ['ISO 9001:2015', 'EN 9100'],
      incluso: ['Refrigerante e trucioli', 'Attrezzaggio base morse', 'Metrologia a campione'],
      escluso: ['Utensili speciali', 'Programmazione CAM', 'Trasporto pezzi'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-CNC-0088', cat: 'cnc', mod: ['servizio'],
      titolo: 'Tornio a fantina mobile Citizen L20',
      citta: 'Lumezzane', prov: 'BS', regione: 'Lombardia',
      fornitore: 'Torneria Bortolotti', dal: 1998, rating: 4.6, recensioni: 74, verificato: true,
      prezzo: { valore: 0.42, unita: 'pezzo' }, minimo: '2.000 pezzi', preavviso: 10,
      oreSettimana: 120, oreLibere: 34,
      sintesi: 'Barra fino a Ø 20. Abbiamo liberato una macchina dopo la chiusura di una commessa automotive.',
      specifiche: [
        ['Diametro barra', 'max Ø 20 mm'],
        ['Assi', '5 assi, 2 mandrini, utensili motorizzati'],
        ['Caricatore', 'LNS Sprint 20, barre 3 m'],
        ['Cicli non presidiati', 'fino a 14 ore'],
        ['Tolleranza tipica', '± 0,008 mm'],
        ['Materiali', 'Ottone, automatici, inox 303/316']
      ],
      certificazioni: ['ISO 9001:2015'],
      incluso: ['Programmazione', 'Controllo dimensionale SPC', 'Lavaggio pezzi'],
      escluso: ['Materia prima', 'Trattamenti galvanici'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-CNC-0311', cat: 'cnc', mod: ['affitto'],
      titolo: 'Fresatrice a portale 3 assi per legno e compositi',
      citta: 'Pesaro', prov: 'PU', regione: 'Marche',
      fornitore: 'Falegnameria Rossini snc', dal: 2014, rating: 4.4, recensioni: 41, verificato: false,
      prezzo: { valore: 26, unita: 'ora' }, minimo: '3 ore', preavviso: 3,
      oreSettimana: 40, oreLibere: 26,
      sintesi: 'Area di lavoro 3 × 1,5 m. Aperta a designer e allestitori nei pomeriggi e il venerdi tutto il giorno.',
      specifiche: [
        ['Piano di lavoro', '3.050 × 1.550 mm'],
        ['Corsa Z', '200 mm'],
        ['Elettromandrino', '9 kW raffreddato ad aria'],
        ['Aspirazione', 'Impianto 7,5 kW con filtro a maniche'],
        ['Tenuta pezzo', 'Vuoto a 4 settori'],
        ['Materiali', 'Multistrato, MDF, HPL, alveolare, PVC espanso']
      ],
      certificazioni: [],
      incluso: ['Aspirazione', 'Frese standard Ø 6-12', 'Piano sacrificale'],
      escluso: ['Frese diamantate', 'Smaltimento sfridi oltre 2 m³'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-ADD-0455', cat: 'additivo', mod: ['servizio'],
      titolo: 'Sinterizzazione laser SLS — EOS P396',
      citta: 'Torino', prov: 'TO', regione: 'Piemonte',
      fornitore: 'Additive Lab Piemonte', dal: 2016, rating: 4.9, recensioni: 218, verificato: true,
      prezzo: { valore: 4.8, unita: 'pezzo' }, minimo: '1 pezzo', preavviso: 4,
      oreSettimana: 100, oreLibere: 28,
      sintesi: 'Vendiamo il riempimento della camera: se il tuo lotto entra negli spazi vuoti, paghi solo il volume occupato.',
      specifiche: [
        ['Volume di costruzione', '340 × 340 × 600 mm'],
        ['Materiale', 'PA2200 (nylon 12), PA12 caricato vetro'],
        ['Spessore layer', '0,10 / 0,12 mm'],
        ['Tolleranza tipica', '± 0,3 % (min ± 0,3 mm)'],
        ['Finiture', 'Sabbiata, tinta nera, vibrofinitura'],
        ['Lead time', '72 ore su lotti sotto 2 dm³']
      ],
      certificazioni: ['ISO 9001:2015'],
      incluso: ['Depolverizzazione', 'Sabbiatura', 'Report di stampa'],
      escluso: ['Tintura', 'Certificazione materiale su lotto'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-ADD-0173', cat: 'additivo', mod: ['affitto', 'servizio'],
      titolo: 'Farm di 8 stampanti FDM industriali',
      citta: 'Bologna', prov: 'BO', regione: 'Emilia-Romagna',
      fornitore: 'Officina Zero Nove', dal: 2019, rating: 4.5, recensioni: 96, verificato: true,
      prezzo: { valore: 39, unita: 'giorno' }, minimo: '1 giorno', preavviso: 1,
      oreSettimana: 168, oreLibere: 92,
      sintesi: 'Otto macchine in rete, prenotabili singolarmente. Coda gestita da noi, tu carichi lo G-code.',
      specifiche: [
        ['Macchine', '8 × 300 × 300 × 400 mm'],
        ['Materiali', 'PLA, PETG, ABS, ASA, PA-CF'],
        ['Ugello', '0,4 / 0,6 / 0,8 mm intercambiabile'],
        ['Camera', 'Chiusa e riscaldata su 4 macchine'],
        ['Monitoraggio', 'Webcam e stop remoto per ogni macchina'],
        ['Prezzo indicato', 'per macchina/giorno, filamento escluso']
      ],
      certificazioni: [],
      incluso: ['Manutenzione', 'Accesso remoto', 'Prima messa a punto profilo'],
      escluso: ['Filamento', 'Post-processing'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-ADD-0620', cat: 'additivo', mod: ['servizio'],
      titolo: 'Fusione laser metallo LPBF — acciaio e AlSi10Mg',
      citta: 'Modena', prov: 'MO', regione: 'Emilia-Romagna',
      fornitore: 'Tecnopolvere spa', dal: 2012, rating: 4.7, recensioni: 63, verificato: true,
      prezzo: { valore: 310, unita: 'giorno' }, minimo: '1 job', preavviso: 12,
      oreSettimana: 110, oreLibere: 19,
      sintesi: 'Slot di camera condivisa due volte a settimana. Ideale per prototipi funzionali e ricambi fuori produzione.',
      specifiche: [
        ['Volume di costruzione', '250 × 250 × 300 mm'],
        ['Materiali', '1.2709, 316L, AlSi10Mg, Inconel 718'],
        ['Spessore layer', '0,03 / 0,05 mm'],
        ['Post-trattamenti', 'Distensione, taglio a filo, HIP su richiesta'],
        ['Densita\' tipica', '> 99,7 %'],
        ['Controlli', 'Certificato di colata e report densita\'']
      ],
      certificazioni: ['ISO 9001:2015', 'ISO 13485'],
      incluso: ['Distensione in forno', 'Taglio dalla piastra', 'Report'],
      escluso: ['Lavorazioni di finitura', 'HIP'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-TAG-0207', cat: 'taglio', mod: ['servizio'],
      titolo: 'Laser fibra 6 kW — lamiera fino a 20 mm',
      citta: 'Vicenza', prov: 'VI', regione: 'Veneto',
      fornitore: 'Carpenteria Bassano srl', dal: 2004, rating: 4.7, recensioni: 187, verificato: true,
      prezzo: { valore: 92, unita: 'ora' }, minimo: '1 ora', preavviso: 2,
      oreSettimana: 90, oreLibere: 24,
      sintesi: 'Secondo turno scarico. Accettiamo DXF con nesting a nostro carico, preventivo entro 4 ore lavorative.',
      specifiche: [
        ['Area di taglio', '3.000 × 1.500 mm'],
        ['Sorgente', 'Fibra 6 kW'],
        ['Spessori', 'Acciaio 20 mm · Inox 12 mm · Allumino 10 mm'],
        ['Cambio pallet', 'Automatico, 25 s'],
        ['Tolleranza tipica', '± 0,1 mm'],
        ['Servizi collegati', 'Piegatura fino a 3 m, 135 t']
      ],
      certificazioni: ['ISO 9001:2015', 'EN 1090-2 EXC3'],
      incluso: ['Nesting', 'Sbavatura leggera', 'Imballo su bancale'],
      escluso: ['Materiale', 'Zincatura'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-TAG-0512', cat: 'taglio', mod: ['servizio', 'affitto'],
      titolo: 'Waterjet 5 assi per marmo, vetro e compositi',
      citta: 'Carrara', prov: 'MS', regione: 'Toscana',
      fornitore: 'Apuane Stone Lab', dal: 2011, rating: 4.6, recensioni: 58, verificato: true,
      prezzo: { valore: 78, unita: 'ora' }, minimo: '2 ore', preavviso: 5,
      oreSettimana: 50, oreLibere: 27,
      sintesi: 'Taglio a freddo senza zona termicamente alterata. Fermo nei mesi di bassa stagione del settore lapideo.',
      specifiche: [
        ['Area di taglio', '4.000 × 2.000 mm'],
        ['Pressione', '4.100 bar'],
        ['Spessore max', '150 mm in pietra, 80 mm in acciaio'],
        ['Testa', '5 assi con compensazione conicita\''],
        ['Materiali', 'Marmo, granito, vetro, carbonio, gomma, titanio'],
        ['Consumo abrasivo', 'incluso fino a 12 kg/h']
      ],
      certificazioni: ['ISO 9001:2015'],
      incluso: ['Abrasivo', 'Smaltimento fanghi', 'Carico/scarico con ponte 5 t'],
      escluso: ['Lucidatura bordi', 'Trasporto lastre'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-TAG-0349', cat: 'taglio', mod: ['affitto'],
      titolo: 'Laser CO2 90 W da banco — legno, tessuto, plexiglass',
      citta: 'Napoli', prov: 'NA', regione: 'Campania',
      fornitore: 'Fablab Sanita\'', dal: 2017, rating: 4.3, recensioni: 149, verificato: false,
      prezzo: { valore: 14, unita: 'ora' }, minimo: '1 ora', preavviso: 1,
      oreSettimana: 60, oreLibere: 38,
      sintesi: 'Macchina aperta al pubblico, tariffa oraria a consumo. Corso di abilitazione di 90 minuti una tantum.',
      specifiche: [
        ['Area di lavoro', '900 × 600 mm'],
        ['Sorgente', 'CO₂ 90 W con raffreddamento a chiller'],
        ['Spessori', 'Compensato 10 mm · PMMA 12 mm · Feltro 8 mm'],
        ['Incisione', '1.000 dpi'],
        ['Software', 'LightBurn su postazione in sede'],
        ['Aspirazione', 'Filtro a carboni attivi']
      ],
      certificazioni: [],
      incluso: ['Assistenza in sala', 'Aspirazione', 'Scarti di prova'],
      escluso: ['Materiale', 'Abilitazione (35 € una tantum)'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-OFF-0119', cat: 'officina', mod: ['affitto'],
      titolo: 'Isola di saldatura TIG/MIG con banco 3 m',
      citta: 'Padova', prov: 'PD', regione: 'Veneto',
      fornitore: 'Officina Meccanica Zaccaria', dal: 2001, rating: 4.5, recensioni: 62, verificato: true,
      prezzo: { valore: 180, unita: 'settimana' }, minimo: '1 settimana', preavviso: 4,
      oreSettimana: 45, oreLibere: 45,
      sintesi: 'Isola liberata dopo il pensionamento di un saldatore. Banco, aspirazione fumi e generatori pronti all\'uso.',
      specifiche: [
        ['Banco', '3.000 × 1.500 mm forato Ø 16'],
        ['Generatori', 'TIG AC/DC 250 A · MIG sinergico 400 A'],
        ['Aspirazione', 'Braccio articolato 3 m certificato'],
        ['Gas', 'Argon e mix in bombole da 50 l'],
        ['Attrezzatura', 'Squadre magnetiche, morsetti, positioner 150 kg'],
        ['Accesso', 'Lun-ven 7:00-19:00, badge personale']
      ],
      certificazioni: ['EN 1090-2 EXC2'],
      incluso: ['Gas fino a 2 bombole/mese', 'Aspirazione', 'DPI di reparto'],
      escluso: ['Materiale d\'apporto', 'Patentino (obbligatorio)'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-OFF-0388', cat: 'officina', mod: ['affitto'],
      titolo: 'Cabina di verniciatura pressurizzata 7 m',
      citta: 'Prato', prov: 'PO', regione: 'Toscana',
      fornitore: 'Verniciature Bisenzio', dal: 2007, rating: 4.4, recensioni: 88, verificato: true,
      prezzo: { valore: 240, unita: 'giorno' }, minimo: '1 giorno', preavviso: 6,
      oreSettimana: 45, oreLibere: 16,
      sintesi: 'Cabina scarica il lunedi e il venerdi. Ciclo completo con essiccazione a 60 °C.',
      specifiche: [
        ['Dimensioni utili', '7.000 × 4.000 × 3.000 mm'],
        ['Filtrazione', 'Plenum + filtri a pavimento, ricambio 25.000 m³/h'],
        ['Essiccazione', 'Fino a 60 °C, ciclo programmabile'],
        ['Alimentazione aria', 'Compressore 10 bar essiccato'],
        ['Illuminazione', '1.200 lux, resa cromatica 90'],
        ['Autorizzazioni', 'AUA in corso di validita\'']
      ],
      certificazioni: ['ISO 9001:2015', 'AUA regionale'],
      incluso: ['Filtri', 'Smaltimento overspray', 'Aria compressa'],
      escluso: ['Vernici e catalizzatori', 'Mascheratura'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-OFF-0501', cat: 'officina', mod: ['vendita'],
      titolo: 'Pressa piegatrice Gasparini 100 t — 3.100 mm',
      citta: 'Udine', prov: 'UD', regione: 'Friuli-Venezia Giulia',
      fornitore: 'Fratelli Toppan srl in liquidazione', dal: 1994, rating: 4.1, recensioni: 12, verificato: true,
      prezzo: { valore: 21500, unita: 'corpo' }, minimo: '—', preavviso: 15,
      oreSettimana: 0, oreLibere: 0,
      sintesi: 'Dismissione per cessata attivita\'. Macchina del 2008, revisionata nel 2021, visionabile con appuntamento.',
      specifiche: [
        ['Forza', '100 t'],
        ['Lunghezza di piega', '3.100 mm'],
        ['Assi controllati', 'Y1, Y2, X, R'],
        ['Controllo', 'ESA S630 grafico'],
        ['Ore macchina', '18.400'],
        ['Utensili inclusi', 'Set punzoni e matrici 12 pezzi'],
        ['Stato', 'Funzionante, in produzione fino a giugno']
      ],
      certificazioni: ['Marcatura CE', 'Verifica periodica 2025'],
      incluso: ['Set utensili', 'Manuali e schemi', 'Assistenza al carico'],
      escluso: ['Smontaggio', 'Trasporto', 'IVA'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-LAB-0264', cat: 'laboratorio', mod: ['servizio'],
      titolo: 'Camera climatica 1.000 l — cicli termici accelerati',
      citta: 'Roma', prov: 'RM', regione: 'Lazio',
      fornitore: 'Istituto Prove Materiali Tiburtina', dal: 1988, rating: 4.9, recensioni: 204, verificato: true,
      prezzo: { valore: 420, unita: 'settimana' }, minimo: '72 ore', preavviso: 8,
      oreSettimana: 168, oreLibere: 61,
      sintesi: 'I cicli lunghi lasciano buchi di giorni interi. Vendiamo le finestre libere con supervisione tecnica inclusa.',
      specifiche: [
        ['Volume', '1.000 l'],
        ['Temperatura', '−40 °C ÷ +180 °C'],
        ['Umidita\'', '10 % ÷ 98 % UR'],
        ['Gradiente', '5 °C/min'],
        ['Registrazione', 'Dati ogni 10 s, export CSV firmato'],
        ['Norme', 'IEC 60068-2-1/2/14/30']
      ],
      certificazioni: ['ISO/IEC 17025', 'Taratura ACCREDIA 2026'],
      incluso: ['Supervisione tecnica', 'Report dati', 'Fissaggio provini standard'],
      escluso: ['Rapporto di prova accreditato (+180 €)', 'Attrezzature speciali'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-LAB-0410', cat: 'laboratorio', mod: ['servizio', 'affitto'],
      titolo: 'Tomografo industriale CT per controllo non distruttivo',
      citta: 'Trento', prov: 'TN', regione: 'Trentino-Alto Adige',
      fornitore: 'Metrologia Alpina srl', dal: 2015, rating: 4.8, recensioni: 47, verificato: true,
      prezzo: { valore: 145, unita: 'ora' }, minimo: '2 ore', preavviso: 7,
      oreSettimana: 40, oreLibere: 14,
      sintesi: 'Analisi porosita\' e confronto CAD-parte senza tagliare il pezzo. Slot infrasettimanali dopo le 17.',
      specifiche: [
        ['Tensione tubo', '225 kV microfocus'],
        ['Pezzo max', 'Ø 300 × 400 mm, 20 kg'],
        ['Risoluzione voxel', 'da 5 µm'],
        ['Analisi', 'Porosita\', spessori, confronto nominale/attuale'],
        ['Output', 'Report PDF + volume VGL/STL'],
        ['Norme', 'VDI/VDE 2630']
      ],
      certificazioni: ['ISO/IEC 17025', 'ISO 9001:2015'],
      incluso: ['Scansione', 'Elaborazione volume', 'Report sintetico'],
      escluso: ['Analisi statistica multi-lotto', 'Perizia firmata'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-LAB-0733', cat: 'laboratorio', mod: ['affitto'],
      titolo: 'Laboratorio microbiologico BSL-2 — 2 postazioni',
      citta: 'Perugia', prov: 'PG', regione: 'Umbria',
      fornitore: 'BioIncubatore Umbro', dal: 2018, rating: 4.6, recensioni: 33, verificato: true,
      prezzo: { valore: 950, unita: 'mese' }, minimo: '1 mese', preavviso: 20,
      oreSettimana: 55, oreLibere: 30,
      sintesi: 'Due banchi liberi in un laboratorio condiviso. Include cappa a flusso laminare, incubatori e autoclave.',
      specifiche: [
        ['Classe', 'BSL-2 con accesso controllato'],
        ['Postazione', 'Banco 2,4 m con cappa classe II'],
        ['Strumenti condivisi', 'Autoclave, centrifuga refrigerata, PCR real-time'],
        ['Stoccaggio', 'Freezer −80 °C, 1 rack per postazione'],
        ['Rifiuti', 'Gestione sanitari inclusa'],
        ['Accesso', '7 giorni su 7, badge nominale']
      ],
      certificazioni: ['Notifica ASL', 'ISO 9001:2015'],
      incluso: ['Consumabili di reparto', 'Smaltimento', 'Manutenzione strumenti'],
      escluso: ['Reagenti', 'Personale tecnico dedicato'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-MAG-0021', cat: 'magazzino', mod: ['affitto'],
      titolo: 'Cella frigo +2/+6 °C — 220 posti pallet',
      citta: 'Cesena', prov: 'FC', regione: 'Emilia-Romagna',
      fornitore: 'Ortofrutta Romagna Logistica', dal: 1996, rating: 4.7, recensioni: 91, verificato: true,
      prezzo: { valore: 11.5, unita: 'palletmese' }, minimo: '20 pallet', preavviso: 5,
      oreSettimana: 168, oreLibere: 74,
      sintesi: 'Fuori dalla stagione della frutta estiva restano vuoti 220 posti su 600. Contratti anche mensili.',
      specifiche: [
        ['Temperatura', '+2 ÷ +6 °C, registrata h24'],
        ['Posti pallet liberi', '220 su 600'],
        ['Altezza utile', '9,5 m — scaffalatura portapallet'],
        ['Baie di carico', '4 con livellatori e tunnel coibentati'],
        ['Gruppo elettrogeno', 'Si\', autonomia 36 ore'],
        ['Gestionale', 'WMS con accesso cliente in sola lettura']
      ],
      certificazioni: ['HACCP', 'IFS Logistics', 'BIO'],
      incluso: ['Carico/scarico', 'Monitoraggio temperature', 'Inventario mensile'],
      escluso: ['Picking a collo', 'Etichettatura'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-MAG-0304', cat: 'magazzino', mod: ['affitto'],
      titolo: 'Capannone logistico 1.400 m² con ufficio',
      citta: 'Piacenza', prov: 'PC', regione: 'Emilia-Romagna',
      fornitore: 'Immobiliare Val Trebbia', dal: 2005, rating: 4.2, recensioni: 24, verificato: false,
      prezzo: { valore: 4.2, unita: 'm3mese' }, minimo: '3 mesi', preavviso: 14,
      oreSettimana: 168, oreLibere: 168,
      sintesi: 'Porzione di capannone sfitta da otto mesi, divisibile. A 900 m dal casello A21.',
      specifiche: [
        ['Superficie', '1.400 m² divisibili da 400 m²'],
        ['Altezza sottotrave', '8 m'],
        ['Portata pavimento', '5 t/m²'],
        ['Accessi', '2 ribalte + 1 portone carrabile'],
        ['Uffici', '90 m² climatizzati'],
        ['Piazzale', '1.200 m² con manovra bilico']
      ],
      certificazioni: ['CPI vigente', 'APE classe C'],
      incluso: ['Spese condominiali', 'Vigilanza notturna', 'Parcheggio'],
      escluso: ['Utenze', 'Scaffalature'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-MAG-0588', cat: 'magazzino', mod: ['affitto'],
      titolo: 'Deposito doganale e fiscale — 80 pallet',
      citta: 'Genova', prov: 'GE', regione: 'Liguria',
      fornitore: 'Spedizionieri Riuniti Porto Vecchio', dal: 1979, rating: 4.8, recensioni: 143, verificato: true,
      prezzo: { valore: 19, unita: 'palletmese' }, minimo: '10 pallet', preavviso: 7,
      oreSettimana: 130, oreLibere: 41,
      sintesi: 'Sospensione dei dazi finche\' la merce resta in deposito. Utile a chi importa e rivende su piu\' mercati.',
      specifiche: [
        ['Regime', 'Deposito doganale tipo C + deposito IVA'],
        ['Posti liberi', '80 pallet'],
        ['Distanza dal terminal', '2,4 km'],
        ['Servizi', 'Sdoganamento, bollettazione, controllo qualita\''],
        ['Videosorveglianza', 'h24 con registrazione 30 giorni'],
        ['Assicurazione merci', 'Fino a 250.000 € inclusa']
      ],
      certificazioni: ['AEO-F', 'ISO 9001:2015'],
      incluso: ['Pratiche doganali standard', 'Assicurazione base', 'Reportistica'],
      escluso: ['Dazi e IVA', 'Perizie merceologiche'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-VEI-0092', cat: 'veicoli', mod: ['affitto'],
      titolo: 'Furgone frigo 3,5 t con doppia temperatura',
      citta: 'Bari', prov: 'BA', regione: 'Puglia',
      fornitore: 'Trasporti Adriatici Cotugno', dal: 2010, rating: 4.5, recensioni: 118, verificato: true,
      prezzo: { valore: 135, unita: 'giorno' }, minimo: '1 giorno', preavviso: 2,
      oreSettimana: 60, oreLibere: 32,
      sintesi: 'Ferma il martedi e il giovedi tra due giri fissi. Con o senza autista.',
      specifiche: [
        ['Portata utile', '1.150 kg'],
        ['Vano', '3,7 × 1,8 × 1,9 m, 12 m³'],
        ['Temperature', '+4 °C / −18 °C a doppio scomparto'],
        ['Sponda', 'Idraulica 750 kg'],
        ['Telematica', 'GPS e registratore temperature'],
        ['Km inclusi', '150 km/giorno, poi 0,28 €/km']
      ],
      certificazioni: ['ATP in corso di validita\'', 'HACCP trasporto'],
      incluso: ['Assicurazione kasko con franchigia 800 €', 'Manutenzione', 'Telepass'],
      escluso: ['Carburante', 'Autista (+180 €/giorno)'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-VEI-0447', cat: 'veicoli', mod: ['affitto', 'servizio'],
      titolo: 'Motrice con gru 15 tm e cassone ribaltabile',
      citta: 'Verona', prov: 'VR', regione: 'Veneto',
      fornitore: 'Autotrasporti Scaligeri', dal: 1992, rating: 4.6, recensioni: 76, verificato: true,
      prezzo: { valore: 340, unita: 'giorno' }, minimo: '1 giorno', preavviso: 4,
      oreSettimana: 50, oreLibere: 18,
      sintesi: 'Mezzo scarico nelle settimane in cui il cantiere principale e\' fermo per approvvigionamenti.',
      specifiche: [
        ['Massa complessiva', '18 t'],
        ['Portata utile', '9,2 t'],
        ['Gru', 'Palfinger 15 tm, sbraccio 12 m'],
        ['Cassone', 'Ribaltabile trilaterale 6,2 m'],
        ['Emissioni', 'Euro 6, accesso ZTL merci'],
        ['Autista', 'Incluso nella tariffa giornaliera']
      ],
      certificazioni: ['Verifica gru annuale', 'ISO 39001'],
      incluso: ['Autista 8 ore', 'Assicurazione merci 50.000 €', 'Imbracature'],
      escluso: ['Ore eccedenti (42 €/h)', 'Pedaggi fuori regione'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-VEI-0655', cat: 'veicoli', mod: ['vendita'],
      titolo: 'Flotta di 4 furgoni compatti Euro 6 — 2019',
      citta: 'Palermo', prov: 'PA', regione: 'Sicilia',
      fornitore: 'Servizi Ambientali Conca d\'Oro', dal: 2003, rating: 4.0, recensioni: 19, verificato: false,
      prezzo: { valore: 9800, unita: 'corpo' }, minimo: 'lotto da 4', preavviso: 10,
      oreSettimana: 0, oreLibere: 0,
      sintesi: 'Rinnovo flotta a fine anno: cediamo in blocco quattro mezzi con tagliandi regolari.',
      specifiche: [
        ['Anno', '2019, prima immatricolazione marzo'],
        ['Chilometraggio', 'da 118.000 a 149.000 km'],
        ['Motore', '1.5 diesel 102 CV Euro 6d'],
        ['Vano', '3,3 m³'],
        ['Manutenzione', 'Tagliandi ufficiali, libretto completo'],
        ['Prezzo', 'per singolo mezzo, sconto 8 % sul lotto']
      ],
      certificazioni: ['Revisione valida fino a 2027'],
      incluso: ['Passaggio di proprieta\' a nostro carico', 'Set gomme invernali'],
      escluso: ['Trasporto', 'Garanzia meccanica'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-MOV-0138', cat: 'movimentazione', mod: ['affitto'],
      titolo: 'Carrello elevatore elettrico 2,5 t con batteria al litio',
      citta: 'Bergamo', prov: 'BG', regione: 'Lombardia',
      fornitore: 'Logistica Serio srl', dal: 2013, rating: 4.4, recensioni: 55, verificato: true,
      prezzo: { valore: 310, unita: 'settimana' }, minimo: '1 settimana', preavviso: 3,
      oreSettimana: 45, oreLibere: 29,
      sintesi: 'Mezzo di scorta che usiamo solo nei picchi. Consegna e ritiro entro 40 km inclusi.',
      specifiche: [
        ['Portata', '2.500 kg a 500 mm'],
        ['Sollevamento', '4.700 mm, montante triplex'],
        ['Alimentazione', 'Litio 48 V, ricarica rapida 1 h'],
        ['Autonomia', '7-8 ore di lavoro continuo'],
        ['Accessori', 'Traslatore, quarta via idraulica'],
        ['Uso', 'Interno ed esterno su pavimentazione']
      ],
      certificazioni: ['Verifica periodica INAIL 2026', 'Marcatura CE'],
      incluso: ['Consegna e ritiro entro 40 km', 'Manutenzione ordinaria', 'Caricabatterie'],
      escluso: ['Operatore', 'Danni da uso improprio'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-MOV-0392', cat: 'movimentazione', mod: ['affitto'],
      titolo: 'Piattaforma aerea articolata 20 m fuoristrada',
      citta: 'Firenze', prov: 'FI', regione: 'Toscana',
      fornitore: 'Noleggi Arno Attrezzature', dal: 2008, rating: 4.7, recensioni: 129, verificato: true,
      prezzo: { valore: 195, unita: 'giorno' }, minimo: '2 giorni', preavviso: 3,
      oreSettimana: 45, oreLibere: 22,
      sintesi: 'Disponibile nelle settimane pari, quando il cantiere di riferimento e\' fermo per collaudi.',
      specifiche: [
        ['Altezza di lavoro', '20,1 m'],
        ['Sbraccio', '9,7 m'],
        ['Portata cestello', '230 kg (2 persone)'],
        ['Trazione', '4×4 diesel con stabilizzatori automatici'],
        ['Rotazione', '360° continua'],
        ['Peso', '6.900 kg — trasporto con carrellone']
      ],
      certificazioni: ['Verifica periodica INAIL 2026', 'Marcatura CE'],
      incluso: ['Imbracature', 'Libretto verifiche', 'Assistenza telefonica'],
      escluso: ['Trasporto (180 € a tratta)', 'Operatore abilitato'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-MOV-0704', cat: 'movimentazione', mod: ['vendita'],
      titolo: 'Scaffalatura portapallet 480 posti — smontata',
      citta: 'Novara', prov: 'NO', regione: 'Piemonte',
      fornitore: 'Cartotecnica del Ticino spa', dal: 1985, rating: 4.3, recensioni: 8, verificato: true,
      prezzo: { valore: 7400, unita: 'corpo' }, minimo: 'lotto intero', preavviso: 12,
      oreSettimana: 0, oreLibere: 0,
      sintesi: 'Liberata dopo il trasloco in un nuovo sito. Gia\' smontata, pallettizzata e pronta al carico.',
      specifiche: [
        ['Posti pallet', '480 (4 livelli)'],
        ['Spalle', '80 pezzi h 7.500 mm'],
        ['Correnti', '960 pezzi, luce 2.700 mm'],
        ['Portata', '2.400 kg per coppia di correnti'],
        ['Marca', 'Modulblok, installazione 2016'],
        ['Stato', 'Buono, con relazione di calcolo originale']
      ],
      certificazioni: ['Relazione di calcolo', 'Dichiarazione di conformita\''],
      incluso: ['Relazione di calcolo', 'Piani di carico', 'Bancali di trasporto'],
      escluso: ['Trasporto', 'Montaggio', 'IVA'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-CNC-0577', cat: 'cnc', mod: ['servizio'],
      titolo: 'Rettifica in tondo CNC per alberi fino a 800 mm',
      citta: 'Reggio Emilia', prov: 'RE', regione: 'Emilia-Romagna',
      fornitore: 'Rettifiche Padane', dal: 1990, rating: 4.8, recensioni: 97, verificato: true,
      prezzo: { valore: 64, unita: 'ora' }, minimo: '2 ore', preavviso: 5,
      oreSettimana: 80, oreLibere: 23,
      sintesi: 'Reparto scarico al mattino presto. Lavoriamo anche pezzi singoli di manutenzione e ricambi urgenti.',
      specifiche: [
        ['Distanza tra le punte', '800 mm'],
        ['Diametro max', 'Ø 320 mm'],
        ['Tolleranza tipica', 'IT4, rugosita\' Ra 0,2'],
        ['Mola', 'CBN con equilibratura automatica'],
        ['Misura in macchina', 'Marposs in-process'],
        ['Trattamenti collegati', 'Tempra a induzione presso terzista']
      ],
      certificazioni: ['ISO 9001:2015'],
      incluso: ['Controllo dimensionale', 'Protettivo antiruggine', 'Imballo'],
      escluso: ['Trattamenti termici', 'Certificato 3.1'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-LAB-0855', cat: 'laboratorio', mod: ['servizio'],
      titolo: 'Banco prova motori elettrici fino a 250 kW',
      citta: 'Ancona', prov: 'AN', regione: 'Marche',
      fornitore: 'Adriatic Power Test', dal: 2017, rating: 4.5, recensioni: 29, verificato: true,
      prezzo: { valore: 780, unita: 'giorno' }, minimo: '1 giorno', preavviso: 9,
      oreSettimana: 45, oreLibere: 20,
      sintesi: 'Banco a freno rigenerativo. Vendiamo le giornate residue tra una campagna di prove e l\'altra.',
      specifiche: [
        ['Potenza max', '250 kW'],
        ['Coppia', '1.200 Nm fino a 6.000 giri/min'],
        ['Freno', 'Rigenerativo in rete'],
        ['Acquisizione', '200 canali, 10 kHz'],
        ['Prove', 'Rendimento, mappe, endurance, derating termico'],
        ['Norme', 'IEC 60034-2-1']
      ],
      certificazioni: ['ISO 9001:2015'],
      incluso: ['Tecnico di banco', 'Acquisizione dati', 'Report grezzo'],
      escluso: ['Staffaggi dedicati', 'Elaborazione statistica'],
      logistica: 'spedizione'
    },
    {
      id: 'FRM-OFF-0666', cat: 'officina', mod: ['affitto'],
      titolo: 'Reparto sartoriale industriale — 6 macchine',
      citta: 'Carpi', prov: 'MO', regione: 'Emilia-Romagna',
      fornitore: 'Confezioni Emilia snc', dal: 1999, rating: 4.6, recensioni: 51, verificato: true,
      prezzo: { valore: 620, unita: 'mese' }, minimo: '2 mesi', preavviso: 10,
      oreSettimana: 45, oreLibere: 27,
      sintesi: 'Sei postazioni ferme dopo il calo degli ordini. Adatte a piccole produzioni e campionari.',
      specifiche: [
        ['Macchine', '2 lineari, 2 taglia-cuci, 1 ricopritura, 1 travetta'],
        ['Taglio', 'Tavolo 6 m con taglierina verticale'],
        ['Stiro', 'Caldaia industriale con 2 ferri'],
        ['Postazioni', '6, illuminazione dedicata'],
        ['Accesso', 'Lun-ven 6:00-22:00'],
        ['Extra', 'Modellista disponibile a ore']
      ],
      certificazioni: ['ISO 9001:2015'],
      incluso: ['Manutenzione macchine', 'Energia', 'Magazzino 20 m²'],
      escluso: ['Filati e tessuti', 'Personale'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-MAG-0777', cat: 'magazzino', mod: ['affitto'],
      titolo: 'Silos e stoccaggio sfusi alimentari — 3 celle',
      citta: 'Foggia', prov: 'FG', regione: 'Puglia',
      fornitore: 'Molini del Tavoliere', dal: 1971, rating: 4.7, recensioni: 38, verificato: true,
      prezzo: { valore: 3.1, unita: 'm3mese' }, minimo: '50 m³', preavviso: 12,
      oreSettimana: 168, oreLibere: 96,
      sintesi: 'Capacita\' di stoccaggio libera tra un raccolto e l\'altro, con movimentazione pneumatica inclusa.',
      specifiche: [
        ['Celle disponibili', '3 da 400 m³'],
        ['Prodotti ammessi', 'Cereali, sfarinati, legumi secchi'],
        ['Movimentazione', 'Pneumatica 30 t/h'],
        ['Controllo', 'Termometria a sonde, aerazione forzata'],
        ['Pesatura', 'Pesa a ponte 60 t certificata'],
        ['Analisi', 'Laboratorio interno per umidita\' e proteine']
      ],
      certificazioni: ['HACCP', 'ISO 22000', 'GMP+'],
      incluso: ['Carico e scarico', 'Termometria', 'Analisi in ingresso'],
      escluso: ['Trattamenti antiparassitari', 'Insacco'],
      logistica: 'in-sede'
    },
    {
      id: 'FRM-VEI-0808', cat: 'veicoli', mod: ['affitto'],
      titolo: 'Bilico centinato con autista — tratte Nord-Sud',
      citta: 'Caserta', prov: 'CE', regione: 'Campania',
      fornitore: 'Trasporti Volturno', dal: 2006, rating: 4.4, recensioni: 84, verificato: true,
      prezzo: { valore: 1.35, unita: 'km' }, minimo: '250 km', preavviso: 3,
      oreSettimana: 70, oreLibere: 25,
      sintesi: 'Vendiamo i viaggi di ritorno a vuoto: se la tua tratta coincide, il prezzo scende di un terzo.',
      specifiche: [
        ['Portata utile', '28 t'],
        ['Semirimorchio', 'Centinato 13,6 m, 33 pallet'],
        ['Sponde', 'Apertura laterale totale e posteriore'],
        ['Tracciamento', 'GPS con accesso cliente'],
        ['Tratte scoperte', 'Rientri da Lombardia e Veneto'],
        ['Assicurazione', 'CMR fino a 150.000 €']
      ],
      certificazioni: ['ISO 39001', 'Albo autotrasportatori'],
      incluso: ['Autista', 'Pedaggi', 'Assicurazione CMR'],
      escluso: ['Facchinaggio', 'Soste oltre 2 ore'],
      logistica: 'ritiro'
    },
    {
      id: 'FRM-ADD-0931', cat: 'additivo', mod: ['affitto'],
      titolo: 'Stereolitografia resine tecniche — 3 macchine',
      citta: 'Milano', prov: 'MI', regione: 'Lombardia',
      fornitore: 'Prototipi Lambrate', dal: 2020, rating: 4.5, recensioni: 112, verificato: true,
      prezzo: { valore: 55, unita: 'giorno' }, minimo: '1 giorno', preavviso: 1,
      oreSettimana: 168, oreLibere: 71,
      sintesi: 'Tre macchine SLA in una stanza dedicata, prenotabili anche per una notte sola.',
      specifiche: [
        ['Volume', '192 × 120 × 245 mm per macchina'],
        ['Risoluzione XY', '50 µm'],
        ['Resine', 'Tough, High Temp, Flexible, Dental'],
        ['Post-processo', 'Lavaggio e polimerizzazione inclusi'],
        ['Software', 'PreForm su postazione locale o remota'],
        ['Prezzo indicato', 'per macchina/giorno, resina esclusa']
      ],
      certificazioni: [],
      incluso: ['Lavaggio e cura', 'Serbatoi e piattaforme', 'Alcol isopropilico'],
      escluso: ['Resina (da 89 €/l)', 'Supporti rimossi a mano'],
      logistica: 'spedizione'
    }
  ];

  /* --- Derivazioni -------------------------------------------------------- */
  var GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  /* Calendario deterministico: 28 giorni a partire da oggi.
     stato: libero | parziale | occupato | chiuso                              */
  function calendario(asset, giorni) {
    var r = rng(asset.id + '|cal');
    var oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    var out = [];
    var saturazione = asset.oreSettimana ? 1 - asset.oreLibere / asset.oreSettimana : 1;
    for (var i = 0; i < (giorni || 28); i++) {
      var d = new Date(oggi.getTime() + i * 86400000);
      var dow = (d.getDay() + 6) % 7; // 0 = lunedi
      var stato;
      if (i < asset.preavviso) {
        stato = 'chiuso';
      } else if (dow === 6 && asset.oreSettimana < 100) {
        stato = 'chiuso';
      } else {
        var p = r();
        if (p < saturazione * 0.75) stato = 'occupato';
        else if (p < saturazione * 0.75 + 0.22) stato = 'parziale';
        else stato = 'libero';
      }
      out.push({ data: d, dow: dow, stato: stato, oreLibere: stato === 'libero' ? 8 : stato === 'parziale' ? 3 : 0 });
    }
    return out;
  }

  /* Storico ricavi per la console proprietario: 12 settimane */
  function storicoRicavi(assetId) {
    var r = rng(assetId + '|ric');
    var base = 380 + r() * 900;
    var out = [];
    for (var i = 11; i >= 0; i--) {
      var trend = 1 + (11 - i) * 0.045;
      var rumore = 0.62 + r() * 0.8;
      out.push(Math.round(base * trend * rumore / 10) * 10);
    }
    return out;
  }

  function byId(id) {
    for (var i = 0; i < ASSET.length; i++) if (ASSET[i].id === id) return ASSET[i];
    return null;
  }
  function categoria(id) {
    for (var i = 0; i < CATEGORIE.length; i++) if (CATEGORIE[i].id === id) return CATEGORIE[i];
    return { id: id, nome: id, breve: id, glifo: 'officina' };
  }
  function modalita(id) {
    for (var i = 0; i < MODALITA.length; i++) if (MODALITA[i].id === id) return MODALITA[i];
    return { id: id, nome: id, sigla: '???', nota: '' };
  }
  function citta() {
    var set = {};
    ASSET.forEach(function (a) { set[a.citta] = (set[a.citta] || 0) + 1; });
    return Object.keys(set).sort().map(function (c) { return { nome: c, n: set[c] }; });
  }

  global.FERMO_DATA = {
    CATEGORIE: CATEGORIE,
    MODALITA: MODALITA,
    ASSET: ASSET,
    GIORNI: GIORNI,
    rng: rng,
    calendario: calendario,
    storicoRicavi: storicoRicavi,
    byId: byId,
    categoria: categoria,
    modalita: modalita,
    citta: citta,
    /* Parametri commerciali della piattaforma */
    COMMISSIONE: 0.09,
    ASSICURAZIONE: 0.035,
    IVA: 0.22
  };
})(window);
