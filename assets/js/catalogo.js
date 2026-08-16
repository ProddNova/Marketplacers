/* =============================================================================
   FERMO — catalogo
   Sul telefono comandano tre cose sole: la ricerca, le categorie e un pannello
   di filtri che si apre quando serve. Tutto il resto sta dentro il pannello,
   così l'elenco dei risultati parte subito invece che dopo due schermate.
   Lo stato resta nella barra dell'indirizzo: una ricerca si può condividere.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('catalogo.html');

  var D = FERMO.D;
  var TUTTI = FERMO.catalogo();
  var g = function (id) { return document.getElementById(id); };

  var stato = {
    q: '', cat: [], mod: [], unita: '', prezzo: null,
    citta: '', preavviso: '', verificato: false, preferiti: false, ordina: 'rilevanza'
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
    chipCat: g('chip-categorie')
  };

  /* icone dei comandi */
  g('icona-lente').innerHTML = FERMO.icona('lente');
  g('icona-filtro').innerHTML = FERMO.icona('filtro');
  g('icona-mappa').innerHTML = FERMO.icona('mappa');

  /* ------------------------------------------------- chip delle categorie */
  el.chipCat.innerHTML = D.CATEGORIE.map(function (c) {
    var n = TUTTI.filter(function (a) { return a.cat === c.id; }).length;
    return '<button class="chip" type="button" data-cat="' + c.id + '" aria-pressed="false">' +
      FERMO.esc(c.breve) + '<span class="chip__n">' + n + '</span></button>';
  }).join('');

  el.chipCat.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    var id = b.getAttribute('data-cat');
    var i = stato.cat.indexOf(id);
    if (i === -1) stato.cat.push(id); else stato.cat.splice(i, 1);
    disegna();
  });

  function sincronizzaChip() {
    Array.prototype.forEach.call(el.chipCat.querySelectorAll('[data-cat]'), function (b) {
      b.setAttribute('aria-pressed', stato.cat.indexOf(b.getAttribute('data-cat')) !== -1 ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------ lettura dall'URL */
  function daURL() {
    var p = new URLSearchParams(location.search);
    stato.q = p.get('q') || '';
    stato.cat = (p.get('cat') || '').split(',').filter(Boolean);
    stato.mod = (p.get('mod') || '').split(',').filter(Boolean);
    stato.unita = p.get('unita') || '';
    stato.citta = p.get('citta') || '';
    stato.preavviso = p.get('pronta') || '';
    stato.verificato = p.get('verificato') === '1';
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
    if (stato.cat.length) p.set('cat', stato.cat.join(','));
    if (stato.mod.length) p.set('mod', stato.mod.join(','));
    if (stato.unita) p.set('unita', stato.unita);
    if (stato.prezzo != null) p.set('prezzo', String(stato.prezzo));
    if (stato.citta) p.set('citta', stato.citta);
    if (stato.preavviso) p.set('pronta', stato.preavviso);
    if (stato.verificato) p.set('verificato', '1');
    if (stato.preferiti) p.set('preferiti', '1');
    if (stato.ordina !== 'rilevanza') p.set('ordina', stato.ordina);
    var s = p.toString();
    history.replaceState(null, '', s ? '?' + s : location.pathname);
  }

  /* ---------------------------------------------------------- filtraggio */
  function testo(a) {
    return [a.titolo, a.fornitore, a.citta, a.prov, a.regione, a.sintesi,
            D.categoria(a.cat).nome, a.id,
            (a.specifiche || []).map(function (s) { return s.join(' '); }).join(' ')]
      .join(' ').toLowerCase();
  }

  function filtra() {
    var q = stato.q.trim().toLowerCase();
    var parole = q ? q.split(/\s+/) : [];
    var salvati = FERMO.store.tutto().preferiti;

    return TUTTI.filter(function (a) {
      if (parole.length) {
        var t = testo(a);
        for (var i = 0; i < parole.length; i++) if (t.indexOf(parole[i]) === -1) return false;
      }
      if (stato.cat.length && stato.cat.indexOf(a.cat) === -1) return false;
      if (stato.mod.length && !stato.mod.some(function (m) { return a.mod.indexOf(m) !== -1; })) return false;
      if (stato.unita && a.prezzo.unita !== stato.unita) return false;
      if (stato.unita && stato.prezzo != null && a.prezzo.valore > stato.prezzo) return false;
      if (stato.citta && a.citta !== stato.citta) return false;
      if (stato.preavviso && a.preavviso > parseInt(stato.preavviso, 10)) return false;
      if (stato.verificato && !a.verificato) return false;
      if (stato.preferiti && salvati.indexOf(a.id) === -1) return false;
      return true;
    });
  }

  function ordina(lista) {
    var c = lista.slice();
    switch (stato.ordina) {
      case 'ore':        return c.sort(function (a, b) { return b.oreLibere - a.oreLibere; });
      case 'prezzo-su':  return c.sort(function (a, b) { return a.prezzo.valore - b.prezzo.valore; });
      case 'prezzo-giu': return c.sort(function (a, b) { return b.prezzo.valore - a.prezzo.valore; });
      case 'voto':       return c.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
      case 'pronto':     return c.sort(function (a, b) { return a.preavviso - b.preavviso; });
      default:
        /* rilevanza: prima i verificati con più capacità libera */
        return c.sort(function (a, b) {
          var pa = (a.verificato ? 2 : 0) + (a.origine === 'utente' ? 5 : 0) + a.oreLibere / 100;
          var pb = (b.verificato ? 2 : 0) + (b.origine === 'utente' ? 5 : 0) + b.oreLibere / 100;
          return pb - pa;
        });
    }
  }

  /* --------------------------------------------------------- filtri attivi */
  function attivi() {
    var voci = [];
    if (stato.q) voci.push({ k: 'q', t: '“' + stato.q + '”' });
    stato.cat.forEach(function (c) { voci.push({ k: 'cat:' + c, t: D.categoria(c).breve }); });
    stato.mod.forEach(function (m) { voci.push({ k: 'mod:' + m, t: D.modalita(m).nome }); });
    if (stato.unita) voci.push({ k: 'unita', t: 'unità ' + FERMO.fmt.unita(stato.unita).suffisso.replace('/', '') });
    if (stato.citta) voci.push({ k: 'citta', t: stato.citta });
    if (stato.preavviso) voci.push({ k: 'pronta', t: 'entro ' + stato.preavviso + ' gg' });
    if (stato.verificato) voci.push({ k: 'verificato', t: 'verificati' });
    if (stato.preferiti) voci.push({ k: 'preferiti', t: 'preferiti' });
    return voci;
  }

  function togli(k) {
    if (k === 'q') { stato.q = ''; el.q.value = ''; }
    else if (k.indexOf('cat:') === 0) stato.cat = stato.cat.filter(function (x) { return x !== k.slice(4); });
    else if (k.indexOf('mod:') === 0) stato.mod = stato.mod.filter(function (x) { return x !== k.slice(4); });
    else if (k === 'unita') { stato.unita = ''; stato.prezzo = null; }
    else if (k === 'citta') stato.citta = '';
    else if (k === 'pronta') stato.preavviso = '';
    else if (k === 'verificato') stato.verificato = false;
    else if (k === 'preferiti') stato.preferiti = false;
  }

  el.gettoni.addEventListener('click', function (e) {
    var b = e.target.closest('[data-togli]');
    if (!b) return;
    togli(b.getAttribute('data-togli'));
    disegna();
  });

  function pulisci() {
    stato.q = ''; stato.cat = []; stato.mod = []; stato.unita = ''; stato.prezzo = null;
    stato.citta = ''; stato.preavviso = ''; stato.verificato = false; stato.preferiti = false;
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

  function estremiPrezzo(u) {
    var v = TUTTI.filter(function (a) { return a.prezzo.unita === u; })
                 .map(function (a) { return a.prezzo.valore; });
    if (!v.length) return null;
    return { min: Math.min.apply(null, v), max: Math.max.apply(null, v) };
  }

  var UNITA_ELENCO = [
    ['ora', 'a ora'], ['giorno', 'a giorno'], ['settimana', 'a settimana'], ['mese', 'a mese'],
    ['pezzo', 'a pezzo'], ['m3mese', 'a metro cubo / mese'], ['palletmese', 'a pallet / mese'],
    ['km', 'a chilometro'], ['corpo', 'in blocco (vendita)']
  ];

  function corpoFiltri() {
    var e = stato.unita ? estremiPrezzo(stato.unita) : null;
    var passo = e ? (e.max > 1000 ? 100 : e.max > 100 ? 5 : e.max > 10 ? 1 : 0.05) : 1;
    var valore = stato.prezzo != null && e ? Math.min(stato.prezzo, e.max) : (e ? e.max : 0);

    return '' +
      '<div class="campo">' +
        '<span class="campo__nome">Come la vuoi</span>' +
        '<div class="riga" style="gap:8px">' + D.MODALITA.map(function (m) {
          return '<button class="chip" type="button" data-mod="' + m.id + '" aria-pressed="' +
            (stato.mod.indexOf(m.id) !== -1 ? 'true' : 'false') + '">' + FERMO.esc(m.nome) + '</button>';
        }).join('') + '</div>' +
      '</div>' +

      '<label class="campo">' +
        '<span class="campo__nome">Unità di prezzo</span>' +
        '<select id="f-unita">' +
          '<option value="">Tutte le unità</option>' +
          UNITA_ELENCO.map(function (u) {
            return '<option value="' + u[0] + '"' + (stato.unita === u[0] ? ' selected' : '') + '>' +
              FERMO.esc(u[1]) + '</option>';
          }).join('') +
        '</select>' +
        '<span class="campo__aiuto">I prezzi si confrontano solo a parità di unità.</span>' +
      '</label>' +

      '<div class="campo">' +
        '<span class="campo__nome">Prezzo massimo ' +
          '<span class="num accento" id="f-prezzo-valore">' +
            (e ? FERMO.fmt.euro(valore) + FERMO.fmt.unita(stato.unita).suffisso : '') + '</span></span>' +
        '<input type="range" id="f-prezzo" ' +
          'min="' + (e ? 0 : 0) + '" max="' + (e ? e.max : 100) + '" step="' + passo + '" ' +
          'value="' + valore + '"' + (e ? '' : ' disabled') + '>' +
        '<span class="campo__aiuto">' + (e
          ? 'Da ' + FERMO.fmt.euro(e.min) + ' a ' + FERMO.fmt.euro(e.max) + ' su questa unità.'
          : 'Scegli prima un\'unità di prezzo.') + '</span>' +
      '</div>' +

      '<label class="campo">' +
        '<span class="campo__nome">Dove</span>' +
        '<select id="f-citta"><option value="">Tutta Italia</option>' +
          Object.keys(citta).sort().map(function (c) {
            return '<option value="' + FERMO.esc(c) + '"' + (stato.citta === c ? ' selected' : '') + '>' +
              FERMO.esc(c) + ' (' + citta[c] + ')</option>';
          }).join('') +
        '</select>' +
      '</label>' +

      '<label class="campo">' +
        '<span class="campo__nome">Pronta entro</span>' +
        '<select id="f-preavviso">' +
          ['', '2', '5', '10'].map(function (v) {
            var nome = v ? v + ' giorni' : 'Qualsiasi preavviso';
            return '<option value="' + v + '"' + (stato.preavviso === v ? ' selected' : '') + '>' + nome + '</option>';
          }).join('') +
        '</select>' +
      '</label>' +

      '<div class="campo">' +
        '<label class="spunta"><input type="checkbox" id="f-verificato"' +
          (stato.verificato ? ' checked' : '') + '> Solo fornitori verificati</label>' +
        '<label class="spunta"><input type="checkbox" id="f-preferiti"' +
          (stato.preferiti ? ' checked' : '') + '> Solo quelli che ho salvato</label>' +
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
      var u = d.querySelector('#f-unita').value;
      var cambiataUnita = u !== stato.unita;
      stato.unita = u;
      stato.citta = d.querySelector('#f-citta').value;
      stato.preavviso = d.querySelector('#f-preavviso').value;
      stato.verificato = d.querySelector('#f-verificato').checked;
      stato.preferiti = d.querySelector('#f-preferiti').checked;
      var pr = d.querySelector('#f-prezzo');
      if (cambiataUnita) {
        /* cambiando unità il cursore riparte dal massimo di quella nuova */
        var e = u ? estremiPrezzo(u) : null;
        stato.prezzo = e ? e.max : null;
        rifai(d);
        return;
      }
      stato.prezzo = pr.disabled ? null : parseFloat(pr.value);
      var et = d.querySelector('#f-prezzo-valore');
      if (et && stato.prezzo != null) {
        et.textContent = FERMO.fmt.euro(stato.prezzo) + FERMO.fmt.unita(stato.unita).suffisso;
      }
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
    b.textContent = n ? 'Vedi ' + n + (n === 1 ? ' scheda' : ' schede') : 'Nessun risultato';
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
      descrizione: 'Sedi con capacità a catalogo, per città'
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
      ? TUTTI.length + ' schede a catalogo'
      : lista.length + (lista.length === 1 ? ' scheda' : ' schede') + ' su ' + TUTTI.length;

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
        '<h3>Nessuna capacità con questi filtri</h3>' +
        '<p class="piccolo">Allarga il raggio: togli la città, o prova tutte le modalità.</p>' +
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
