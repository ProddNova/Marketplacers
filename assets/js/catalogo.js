/* =============================================================================
   FERMO — listino dell'usato
   Sul telefono comandano tre cose sole: la ricerca, le famiglie e un pannello
   di filtri che si apre quando serve. Tutto il resto sta dentro il pannello,
   così l'elenco dei risultati parte subito invece che dopo due schermate.
   Con diciassette categorie la fila in alto porta le quattro FAMIGLIE — il
   filtro grosso — e le categorie stanno raggruppate dentro il pannello.
   Lo stato resta nella barra dell'indirizzo: una ricerca si può condividere.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('catalogo.html');

  var D = FERMO.D;
  var TUTTI = FERMO.catalogo();
  var g = function (id) { return document.getElementById(id); };

  var stato = {
    q: '', fam: [], cat: [], mod: [], prezzo: null, citta: '', anno: '', condizione: '',
    ritiro: '', verificato: false, garanzia: false, lotto: false, preferiti: false,
    ordina: 'rilevanza'
  };

  var el = {
    q: g('q'),
    ordina: g('ordina'),
    risultati: g('risultati'),
    niente: g('niente'),
    gettoni: g('gettoni'),
    conteggio: g('stato-conteggio'),
    pulisci: g('pulisci'),
    contaFiltri: g('conta-filtri'),
    chipFam: g('chip-famiglie')
  };

  /* icone dei comandi */
  g('icona-lente').innerHTML = FERMO.icona('lente');
  g('icona-filtro').innerHTML = FERMO.icona('filtro');
  g('icona-mappa').innerHTML = FERMO.icona('mappa');

  /* --------------------------------------------------------- scala prezzi --
     Il listino va da poche centinaia di euro a centosessantottomila: su una
     scala lineare tutta la metà bassa — dove stanno i lotti di periferiche —
     si perderebbe nei primi due millimetri di corsa del cursore. Il cursore
     lavora quindi su una curva esponenziale, e il valore che ne esce viene
     arrotondato a una cifra tonda perché un filtro a 3.847 € non lo vuole
     nessuno. */
  var PREZZI = TUTTI.map(FERMO.prezzoCorrente);
  var PREZZO_MAX = Math.max.apply(null, PREZZI);
  var PREZZO_MIN = Math.max(100, Math.min.apply(null, PREZZI));
  var CURSORE_MAX = 100;

  function arrotondaPrezzo(v) {
    var passo = v >= 100000 ? 5000 : v >= 20000 ? 1000 : v >= 5000 ? 500 : v >= 1000 ? 100 : 20;
    return Math.max(passo, Math.round(v / passo) * passo);
  }
  function prezzoDaCursore(p) {
    if (p >= CURSORE_MAX) return PREZZO_MAX;
    var lo = Math.log(PREZZO_MIN), hi = Math.log(PREZZO_MAX);
    return arrotondaPrezzo(Math.exp(lo + (hi - lo) * (p / CURSORE_MAX)));
  }
  function cursoreDaPrezzo(v) {
    if (v == null || v >= PREZZO_MAX) return CURSORE_MAX;
    var lo = Math.log(PREZZO_MIN), hi = Math.log(PREZZO_MAX);
    return Math.round(((Math.log(Math.max(PREZZO_MIN, v)) - lo) / (hi - lo)) * CURSORE_MAX);
  }

  /* -------------------------------------------------- chip delle famiglie --
     Quattro voci: ci stanno su uno schermo da 390 px senza scorrere. */
  function quanteFam(famId) {
    return TUTTI.filter(function (a) { return D.famigliaDi(a) === famId; }).length;
  }
  function quanteCat(catId) {
    return TUTTI.filter(function (a) { return a.cat === catId; }).length;
  }

  el.chipFam.innerHTML = D.FAMIGLIE.map(function (f) {
    return '<button class="chip" type="button" data-fam="' + f.id + '" aria-pressed="false" ' +
      'title="' + FERMO.esc(f.nota) + '">' +
      FERMO.esc(f.breve) + '<span class="chip__n">' + quanteFam(f.id) + '</span></button>';
  }).join('');

  el.chipFam.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fam]');
    if (!b) return;
    var id = b.getAttribute('data-fam');
    var i = stato.fam.indexOf(id);
    if (i === -1) stato.fam.push(id); else stato.fam.splice(i, 1);
    /* scegliere una famiglia scarta le categorie di un'altra: altrimenti si
       resta con zero risultati senza capire perché */
    stato.cat = stato.cat.filter(function (c) {
      return !stato.fam.length || stato.fam.indexOf(D.categoria(c).fam) !== -1;
    });
    disegna();
  });

  function sincronizzaChip() {
    Array.prototype.forEach.call(el.chipFam.querySelectorAll('[data-fam]'), function (b) {
      b.setAttribute('aria-pressed', stato.fam.indexOf(b.getAttribute('data-fam')) !== -1 ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------ lettura dall'URL */
  function daURL() {
    var p = new URLSearchParams(location.search);
    stato.q = p.get('q') || '';
    stato.fam = (p.get('fam') || '').split(',').filter(Boolean);
    stato.cat = (p.get('cat') || '').split(',').filter(Boolean);
    stato.mod = (p.get('mod') || '').split(',').filter(Boolean);
    stato.citta = p.get('citta') || '';
    stato.anno = p.get('anno') || '';
    stato.condizione = p.get('stato') || '';
    stato.ritiro = p.get('ritiro') || '';
    stato.verificato = p.get('verificato') === '1';
    stato.garanzia = p.get('garanzia') === '1';
    stato.lotto = p.get('lotto') === '1';
    stato.preferiti = p.get('preferiti') === '1';
    stato.ordina = p.get('ordina') || 'rilevanza';
    var pr = p.get('prezzo');
    stato.prezzo = pr ? parseFloat(pr) : null;
    el.q.value = stato.q;
    el.ordina.value = stato.ordina;
  }

  function inURL() {
    var p = new URLSearchParams();
    if (stato.q) p.set('q', stato.q);
    if (stato.fam.length) p.set('fam', stato.fam.join(','));
    if (stato.cat.length) p.set('cat', stato.cat.join(','));
    if (stato.mod.length) p.set('mod', stato.mod.join(','));
    if (stato.prezzo != null && stato.prezzo < PREZZO_MAX) p.set('prezzo', String(stato.prezzo));
    if (stato.citta) p.set('citta', stato.citta);
    if (stato.anno) p.set('anno', stato.anno);
    if (stato.condizione) p.set('stato', stato.condizione);
    if (stato.ritiro) p.set('ritiro', stato.ritiro);
    if (stato.verificato) p.set('verificato', '1');
    if (stato.garanzia) p.set('garanzia', '1');
    if (stato.lotto) p.set('lotto', '1');
    if (stato.preferiti) p.set('preferiti', '1');
    if (stato.ordina !== 'rilevanza') p.set('ordina', stato.ordina);
    var s = p.toString();
    history.replaceState(null, '', s ? '?' + s : location.pathname);
  }

  /* ---------------------------------------------------------- filtraggio */
  function testo(a) {
    return [a.titolo, a.venditore, a.citta, a.prov, a.regione, a.sintesi,
            D.categoria(a.cat).nome, D.famiglia(D.famigliaDi(a)).nome,
            D.condizione(a.condizione).nome, a.anno, a.id,
            (a.specifiche || []).map(function (s) { return s.join(' '); }).join(' ')]
      .join(' ').toLowerCase();
  }

  function filtra() {
    var q = stato.q.trim().toLowerCase();
    var parole = q ? q.split(/\s+/) : [];
    var salvati = FERMO.store.tutto().preferiti;
    var quotaMin = stato.condizione ? D.condizione(stato.condizione).quota : null;

    return TUTTI.filter(function (a) {
      if (parole.length) {
        var t = testo(a);
        for (var i = 0; i < parole.length; i++) if (t.indexOf(parole[i]) === -1) return false;
      }
      if (stato.fam.length && stato.fam.indexOf(D.famigliaDi(a)) === -1) return false;
      if (stato.cat.length && stato.cat.indexOf(a.cat) === -1) return false;
      if (stato.mod.length && !stato.mod.some(function (m) { return a.mod.indexOf(m) !== -1; })) return false;
      if (stato.prezzo != null && FERMO.prezzoCorrente(a) > stato.prezzo) return false;
      if (stato.citta && a.citta !== stato.citta) return false;
      if (stato.anno && (!a.anno || a.anno < parseInt(stato.anno, 10))) return false;
      /* lo stato scelto è una soglia: «buono» tiene dentro anche ottimo e come nuovo */
      if (quotaMin != null && D.condizione(a.condizione).quota < quotaMin - 0.01) return false;
      if (stato.ritiro && a.ritiroFra > parseInt(stato.ritiro, 10)) return false;
      if (stato.verificato && !a.verificato) return false;
      if (stato.garanzia && !a.garanzia) return false;
      if (stato.lotto && !FERMO.lotto(a)) return false;
      if (stato.preferiti && salvati.indexOf(a.id) === -1) return false;
      return true;
    });
  }

  function ordina(lista) {
    var c = lista.slice();
    switch (stato.ordina) {
      case 'prezzo-su':  return c.sort(function (a, b) { return FERMO.prezzoCorrente(a) - FERMO.prezzoCorrente(b); });
      case 'prezzo-giu': return c.sort(function (a, b) { return FERMO.prezzoCorrente(b) - FERMO.prezzoCorrente(a); });
      /* sui lotti il prezzo del blocco non dice niente: qui si ordina per
         quanto viene il singolo pezzo, e i beni singoli valgono per sé */
      case 'pezzo':      return c.sort(function (a, b) {
        return (FERMO.perPezzo(a) || FERMO.prezzoCorrente(a)) -
               (FERMO.perPezzo(b) || FERMO.prezzoCorrente(b));
      });
      case 'recenti':    return c.sort(function (a, b) { return (b.anno || 0) - (a.anno || 0); });
      case 'stato':      return c.sort(function (a, b) {
        return D.condizione(b.condizione).quota - D.condizione(a.condizione).quota;
      });
      case 'sconto':     return c.sort(function (a, b) { return (FERMO.sconto(b) || 0) - (FERMO.sconto(a) || 0); });
      case 'asta':       return c.sort(function (a, b) {
        var sa = FERMO.inAsta(a) ? a.asta.scadeFra : 999;
        var sb = FERMO.inAsta(b) ? b.asta.scadeFra : 999;
        return sa - sb;
      });
      default:
        /* rilevanza: prima i tuoi annunci, poi i venditori verificati con
           lo scarto più alto sul nuovo */
        return c.sort(function (a, b) {
          var pa = (a.verificato ? 2 : 0) + (a.origine === 'utente' ? 5 : 0) + (FERMO.sconto(a) || 0) * 3;
          var pb = (b.verificato ? 2 : 0) + (b.origine === 'utente' ? 5 : 0) + (FERMO.sconto(b) || 0) * 3;
          return pb - pa;
        });
    }
  }

  /* --------------------------------------------------------- filtri attivi */
  function attivi() {
    var voci = [];
    if (stato.q) voci.push({ k: 'q', t: '“' + stato.q + '”' });
    stato.fam.forEach(function (f) { voci.push({ k: 'fam:' + f, t: D.famiglia(f).breve }); });
    stato.cat.forEach(function (c) { voci.push({ k: 'cat:' + c, t: D.categoria(c).breve }); });
    stato.mod.forEach(function (m) { voci.push({ k: 'mod:' + m, t: D.formula(m).nome }); });
    if (stato.prezzo != null && stato.prezzo < PREZZO_MAX) {
      voci.push({ k: 'prezzo', t: 'fino a ' + FERMO.fmt.euroTondo(stato.prezzo) });
    }
    if (stato.citta) voci.push({ k: 'citta', t: stato.citta });
    if (stato.anno) voci.push({ k: 'anno', t: 'dal ' + stato.anno });
    if (stato.condizione) voci.push({ k: 'stato', t: 'almeno ' + D.condizione(stato.condizione).nome.toLowerCase() });
    if (stato.ritiro) voci.push({ k: 'ritiro', t: 'ritiro entro ' + stato.ritiro + ' gg' });
    if (stato.verificato) voci.push({ k: 'verificato', t: 'verificati' });
    if (stato.garanzia) voci.push({ k: 'garanzia', t: 'con garanzia' });
    if (stato.lotto) voci.push({ k: 'lotto', t: 'solo lotti' });
    if (stato.preferiti) voci.push({ k: 'preferiti', t: 'che seguo' });
    return voci;
  }

  function togli(k) {
    if (k === 'q') { stato.q = ''; el.q.value = ''; }
    else if (k.indexOf('fam:') === 0) stato.fam = stato.fam.filter(function (x) { return x !== k.slice(4); });
    else if (k.indexOf('cat:') === 0) stato.cat = stato.cat.filter(function (x) { return x !== k.slice(4); });
    else if (k.indexOf('mod:') === 0) stato.mod = stato.mod.filter(function (x) { return x !== k.slice(4); });
    else if (k === 'prezzo') stato.prezzo = null;
    else if (k === 'citta') stato.citta = '';
    else if (k === 'anno') stato.anno = '';
    else if (k === 'stato') stato.condizione = '';
    else if (k === 'ritiro') stato.ritiro = '';
    else if (k === 'verificato') stato.verificato = false;
    else if (k === 'garanzia') stato.garanzia = false;
    else if (k === 'lotto') stato.lotto = false;
    else if (k === 'preferiti') stato.preferiti = false;
  }

  el.gettoni.addEventListener('click', function (e) {
    var b = e.target.closest('[data-togli]');
    if (!b) return;
    togli(b.getAttribute('data-togli'));
    disegna();
  });

  function pulisci() {
    stato.q = ''; stato.fam = []; stato.cat = []; stato.mod = []; stato.prezzo = null;
    stato.citta = ''; stato.anno = ''; stato.condizione = ''; stato.ritiro = '';
    stato.verificato = false; stato.garanzia = false; stato.lotto = false;
    stato.preferiti = false;
    el.q.value = '';
    disegna();
  }
  el.pulisci.addEventListener('click', pulisci);

  /* ==================================================== PANNELLO DEI FILTRI */
  /* Sul telefono i filtri non possono stare sempre a schermo: rubano lo spazio
     ai risultati. Stanno qui dentro, si applicano dal vivo e il piede dice
     sempre quante schede restano. */
  var citta = {};
  TUTTI.forEach(function (a) { citta[a.citta] = (citta[a.citta] || 0) + 1; });

  /* Le categorie, raggruppate per famiglia: diciassette voci in fila non si
     leggono, quattro gruppetti da tre o cinque sì. */
  function corpoCategorie() {
    var famiglie = stato.fam.length
      ? D.FAMIGLIE.filter(function (f) { return stato.fam.indexOf(f.id) !== -1; })
      : D.FAMIGLIE;
    return famiglie.map(function (f) {
      return '<div class="gruppo-cat">' +
        '<span class="gruppo-cat__nome">' + FERMO.esc(f.nome) + '</span>' +
        '<div class="riga" style="gap:6px">' + D.categorieDi(f.id).map(function (c) {
          return '<button class="chip chip--fitto" type="button" data-cat="' + c.id + '" ' +
            'aria-pressed="' + (stato.cat.indexOf(c.id) !== -1 ? 'true' : 'false') + '">' +
            FERMO.esc(c.breve) + '<span class="chip__n">' + quanteCat(c.id) + '</span></button>';
        }).join('') + '</div>' +
      '</div>';
    }).join('');
  }

  function corpoFiltri() {
    var cursore = cursoreDaPrezzo(stato.prezzo);
    var valore = prezzoDaCursore(cursore);
    var annoOggi = new Date().getFullYear();

    return '' +
      '<div class="campo">' +
        '<span class="campo__nome">Categoria</span>' +
        corpoCategorie() +
        '<span class="campo__aiuto">' + (stato.fam.length
          ? 'Mostrate le categorie delle famiglie scelte in alto.'
          : 'Le quattro famiglie in alto restringono questo elenco.') + '</span>' +
      '</div>' +

      '<div class="campo">' +
        '<span class="campo__nome">Come si compra</span>' +
        '<div class="riga" style="gap:8px">' + D.FORMULE.map(function (m) {
          return '<button class="chip" type="button" data-mod="' + m.id + '" aria-pressed="' +
            (stato.mod.indexOf(m.id) !== -1 ? 'true' : 'false') + '">' + FERMO.esc(m.nome) + '</button>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="campo">' +
        '<span class="campo__nome">Prezzo massimo ' +
          '<span class="num accento" id="f-prezzo-valore">' + FERMO.fmt.euroTondo(valore) + '</span></span>' +
        '<input type="range" id="f-prezzo" min="0" max="' + CURSORE_MAX + '" step="1" ' +
          'value="' + cursore + '" aria-label="Prezzo massimo">' +
        '<span class="campo__aiuto">IVA esclusa. Il cursore si muove a scatti fitti in basso e ' +
          'larghi in alto, così i lotti da poche centinaia di euro restano raggiungibili. ' +
          'In asta conta l\'offerta più alta di adesso, non il prezzo richiesto.</span>' +
      '</div>' +

      '<label class="campo">' +
        '<span class="campo__nome">Dove</span>' +
        '<select id="f-citta"><option value="">Tutta Italia</option>' +
          Object.keys(citta).sort().map(function (c) {
            return '<option value="' + FERMO.esc(c) + '"' + (stato.citta === c ? ' selected' : '') + '>' +
              FERMO.esc(c) + ' (' + citta[c] + ')</option>';
          }).join('') +
        '</select>' +
        '<span class="campo__aiuto">Il ritiro parte da qui: più è lontano, più costa portarla via.</span>' +
      '</label>' +

      '<label class="campo">' +
        '<span class="campo__nome">Non più vecchia di</span>' +
        '<select id="f-anno">' +
          [['', 'Qualsiasi anno'],
           [String(annoOggi - 3), '3 anni (dal ' + (annoOggi - 3) + ')'],
           [String(annoOggi - 5), '5 anni (dal ' + (annoOggi - 5) + ')'],
           [String(annoOggi - 10), '10 anni (dal ' + (annoOggi - 10) + ')'],
           [String(annoOggi - 15), '15 anni (dal ' + (annoOggi - 15) + ')']
          ].map(function (v) {
            return '<option value="' + v[0] + '"' + (stato.anno === v[0] ? ' selected' : '') + '>' +
              FERMO.esc(v[1]) + '</option>';
          }).join('') +
        '</select>' +
        '<span class="campo__aiuto">Su un portatile tre anni contano quanto quindici su una pressa.</span>' +
      '</label>' +

      '<label class="campo">' +
        '<span class="campo__nome">Stato almeno</span>' +
        '<select id="f-stato">' +
          '<option value="">Qualsiasi stato</option>' +
          D.CONDIZIONI.map(function (c) {
            return '<option value="' + c.id + '"' + (stato.condizione === c.id ? ' selected' : '') + '>' +
              FERMO.esc(c.nome) + '</option>';
          }).join('') +
        '</select>' +
        '<span class="campo__aiuto">È una soglia: scegliendo «buono» restano dentro anche le migliori.</span>' +
      '</label>' +

      '<label class="campo">' +
        '<span class="campo__nome">Ritirabile entro</span>' +
        '<select id="f-ritiro">' +
          ['', '7', '15', '30'].map(function (v) {
            var nome = v ? v + ' giorni' : 'Quando capita';
            return '<option value="' + v + '"' + (stato.ritiro === v ? ' selected' : '') + '>' + nome + '</option>';
          }).join('') +
        '</select>' +
        '<span class="campo__aiuto">Molte attrezzature sono ancora in servizio: escono quando le sostituiscono.</span>' +
      '</label>' +

      '<div class="campo">' +
        '<label class="spunta"><input type="checkbox" id="f-lotto"' +
          (stato.lotto ? ' checked' : '') + '> Solo lotti da più pezzi</label>' +
        '<label class="spunta"><input type="checkbox" id="f-verificato"' +
          (stato.verificato ? ' checked' : '') + '> Solo venditori verificati</label>' +
        '<label class="spunta"><input type="checkbox" id="f-garanzia"' +
          (stato.garanzia ? ' checked' : '') + '> Solo con garanzia del venditore</label>' +
        '<label class="spunta"><input type="checkbox" id="f-preferiti"' +
          (stato.preferiti ? ' checked' : '') + '> Solo quelli che seguo</label>' +
      '</div>';
  }

  function apriFiltri() {
    var d = FERMO.pannello({
      titolo: 'Filtri',
      corpo: corpoFiltri(),
      piede: '<button class="btn" type="button" data-f="azzera">Azzera</button>' +
             '<button class="btn btn--primario" type="button" data-chiudi id="f-conferma">Vedi risultati</button>'
    });

    function leggi() {
      stato.citta = d.querySelector('#f-citta').value;
      stato.anno = d.querySelector('#f-anno').value;
      stato.condizione = d.querySelector('#f-stato').value;
      stato.ritiro = d.querySelector('#f-ritiro').value;
      stato.lotto = d.querySelector('#f-lotto').checked;
      stato.verificato = d.querySelector('#f-verificato').checked;
      stato.garanzia = d.querySelector('#f-garanzia').checked;
      stato.preferiti = d.querySelector('#f-preferiti').checked;
      var pr = d.querySelector('#f-prezzo');
      var v = prezzoDaCursore(parseFloat(pr.value));
      stato.prezzo = parseFloat(pr.value) >= CURSORE_MAX ? null : v;
      var et = d.querySelector('#f-prezzo-valore');
      if (et) et.textContent = FERMO.fmt.euroTondo(v);
      disegna();
      aggiornaPiede(d);
    }

    function rifai(dd) {
      dd.querySelector('.pannello__corpo').innerHTML = corpoFiltri();
      disegna();
      aggiornaPiede(dd);
    }

    d.addEventListener('input', leggi);
    d.addEventListener('change', leggi);
    d.addEventListener('click', function (e) {
      var c = e.target.closest('[data-cat]');
      if (c) {
        var idc = c.getAttribute('data-cat');
        var ic = stato.cat.indexOf(idc);
        if (ic === -1) stato.cat.push(idc); else stato.cat.splice(ic, 1);
        c.setAttribute('aria-pressed', ic === -1 ? 'true' : 'false');
        disegna();
        aggiornaPiede(d);
        return;
      }
      var m = e.target.closest('[data-mod]');
      if (m) {
        var id = m.getAttribute('data-mod');
        var i = stato.mod.indexOf(id);
        if (i === -1) stato.mod.push(id); else stato.mod.splice(i, 1);
        m.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
        disegna();
        aggiornaPiede(d);
        return;
      }
      if (e.target.closest('[data-f="azzera"]')) {
        pulisci();
        rifai(d);
      }
    });

    aggiornaPiede(d);
    FERMO.apri(d);
  }

  function aggiornaPiede(d) {
    var b = d.querySelector('#f-conferma');
    if (!b) return;
    var n = filtra().length;
    b.textContent = n ? 'Vedi ' + n + (n === 1 ? ' annuncio' : ' annunci') : 'Nessun risultato';
  }

  g('apri-filtri').addEventListener('click', apriFiltri);

  /* ------------------------------------------------------- mappa delle sedi */
  var pannelloQuadro = g('pannello-quadro');
  var innestoQuadro = g('quadro-innesto');
  var tabellaQuadro = g('quadro-tabella').querySelector('tbody');
  var lettoQuadro = g('quadro-letto');
  var mappaAperta = false;

  g('commuta-mappa').addEventListener('click', function () {
    mappaAperta = !mappaAperta;
    this.setAttribute('aria-pressed', String(mappaAperta));
    pannelloQuadro.classList.toggle('nascosto', !mappaAperta);
    if (mappaAperta) disegnaQuadro(stato.citta ? TUTTI : ordina(filtra()));
  });

  function disegnaQuadro(lista) {
    if (!mappaAperta) return;
    innestoQuadro.innerHTML = FERMO.quadro(lista, {
      descrizione: 'Sedi con attrezzature a listino, per città'
    });
    if (stato.citta) {
      var g2 = innestoQuadro.querySelector('[data-citta="' + CSS.escape(stato.citta) + '"]');
      if (g2) g2.setAttribute('data-scelta', 'si');
    }
    var sedi = {};
    lista.forEach(function (b) { sedi[b.citta] = (sedi[b.citta] || 0) + 1; });
    tabellaQuadro.innerHTML = Object.keys(sedi)
      .sort(function (a, b) { return sedi[b] - sedi[a] || a.localeCompare(b); })
      .map(function (c) {
        return '<tr><td><button class="link" type="button" data-citta="' + FERMO.esc(c) + '">' +
          FERMO.esc(c) + '</button></td><td class="num">' + sedi[c] + '</td></tr>';
      }).join('');
  }

  function scegliSede(c) {
    stato.citta = (stato.citta === c) ? '' : c;
    lettoQuadro.textContent = stato.citta
      ? 'Filtrato su ' + stato.citta + ' — tocca di nuovo per togliere'
      : 'Tocca una sede per filtrare';
    disegna();
  }

  pannelloQuadro.addEventListener('click', function (e) {
    var el2 = e.target.closest('[data-citta]');
    if (el2) scegliSede(el2.getAttribute('data-citta'));
  });
  pannelloQuadro.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el2 = e.target.closest('g[data-citta]');
    if (!el2) return;
    e.preventDefault();
    scegliSede(el2.getAttribute('data-citta'));
  });

  /* ------------------------------------------------------------- disegno -- */
  function disegna() {
    var lista = ordina(filtra());
    var voci = attivi();

    el.conteggio.textContent = lista.length === TUTTI.length
      ? TUTTI.length + ' annunci a listino'
      : lista.length + (lista.length === 1 ? ' annuncio' : ' annunci') + ' su ' + TUTTI.length;

    el.pulisci.classList.toggle('nascosto', !voci.length);
    el.contaFiltri.textContent = voci.length;
    el.contaFiltri.classList.toggle('nascosto', !voci.length);

    el.gettoni.innerHTML = voci.map(function (v) {
      return '<span class="gettone">' + FERMO.esc(v.t) +
        '<button type="button" data-togli="' + FERMO.esc(v.k) + '" aria-label="Togli il filtro ' +
        FERMO.esc(v.t) + '">×</button></span>';
    }).join('');

    el.risultati.innerHTML = lista.map(FERMO.scheda).join('');
    el.niente.innerHTML = lista.length ? '' :
      '<div class="vuoto">' +
        '<h3>Nessun annuncio con questi filtri</h3>' +
        '<p class="piccolo">Allarga il raggio: togli la città, alza il prezzo, apri un\'altra ' +
          'famiglia o accetta uno stato più basso.</p>' +
        '<button class="btn" type="button" id="vuoto-pulisci" style="margin-top:14px">Azzera i filtri</button>' +
      '</div>';
    var vp = g('vuoto-pulisci');
    if (vp) vp.addEventListener('click', pulisci);

    /* la mappa mostra sempre tutte le sedi quando una è già scelta, così si
       vede dove si potrebbe allargare la ricerca */
    disegnaQuadro(stato.citta ? TUTTI : lista);
    sincronizzaChip();
    inURL();
  }

  /* -------------------------------------------------------------- eventi -- */
  g('modulo-ricerca').addEventListener('submit', function (e) {
    e.preventDefault();
    el.q.blur();
    disegna();
  });
  el.q.addEventListener('input', function () { stato.q = el.q.value; disegna(); });
  el.ordina.addEventListener('change', function () { stato.ordina = el.ordina.value; disegna(); });
  document.addEventListener('fermo:preferiti', function () { if (stato.preferiti) disegna(); });

  daURL();
  disegna();
})();
