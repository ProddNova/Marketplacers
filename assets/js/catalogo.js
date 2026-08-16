/* =============================================================================
   FERMO — catalogo: ricerca, filtri, ordinamento, sincronia con la barra URL
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('catalogo.html');

  var D = FERMO.D;
  var TUTTI = FERMO.catalogo();

  var stato = {
    q: '', cat: [], mod: [], unita: '', prezzo: null,
    citta: '', preavviso: '', verificato: false, preferiti: false, ordina: 'rilevanza'
  };

  var el = {
    q: document.getElementById('q'),
    ordina: document.getElementById('ordina'),
    categoria: document.getElementById('filtro-categoria'),
    modalita: document.getElementById('filtro-modalita'),
    unita: document.getElementById('filtro-unita'),
    prezzo: document.getElementById('filtro-prezzo'),
    prezzoValore: document.getElementById('prezzo-valore'),
    prezzoNota: document.getElementById('prezzo-nota'),
    citta: document.getElementById('filtro-citta'),
    preavviso: document.getElementById('filtro-preavviso'),
    verificato: document.getElementById('filtro-verificato'),
    preferiti: document.getElementById('filtro-preferiti'),
    risultati: document.getElementById('risultati'),
    niente: document.getElementById('niente'),
    gettoni: document.getElementById('gettoni'),
    conteggio: document.getElementById('stato-conteggio')
  };

  /* ------------------------------------------------ costruzione dei filtri */
  el.categoria.innerHTML = D.CATEGORIE.map(function (c) {
    var n = TUTTI.filter(function (a) { return a.cat === c.id; }).length;
    return '<label class="riga" style="gap:9px;flex-wrap:nowrap;cursor:pointer;font-size:12.5px">' +
      '<input type="checkbox" value="' + c.id + '" data-filtro="cat" style="width:auto">' +
      '<span style="flex:1">' + FERMO.esc(c.breve) + '</span>' +
      '<span class="tenue numerico">' + n + '</span></label>';
  }).join('');

  el.modalita.innerHTML = D.MODALITA.map(function (m) {
    return '<label class="scelta"><input type="checkbox" value="' + m.id + '" data-filtro="mod">' +
      '<span>' + FERMO.esc(m.nome) + '</span></label>';
  }).join('');

  var citta = {};
  TUTTI.forEach(function (a) { citta[a.citta] = (citta[a.citta] || 0) + 1; });
  el.citta.innerHTML += Object.keys(citta).sort().map(function (c) {
    return '<option value="' + FERMO.esc(c) + '">' + FERMO.esc(c) + ' (' + citta[c] + ')</option>';
  }).join('');

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
    el.unita.value = stato.unita;
    el.citta.value = stato.citta;
    el.preavviso.value = stato.preavviso;
    el.verificato.checked = stato.verificato;
    el.preferiti.checked = stato.preferiti;
    Array.prototype.forEach.call(document.querySelectorAll('[data-filtro="cat"]'), function (i) {
      i.checked = stato.cat.indexOf(i.value) !== -1;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-filtro="mod"]'), function (i) {
      i.checked = stato.mod.indexOf(i.value) !== -1;
    });
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

  /* --------------------------------------------- cursore del prezzo (unità) */
  /* Ha senso confrontare i prezzi solo a parità di unità: finché non se ne
     sceglie una il cursore resta spento, con la spiegazione accanto.          */
  function aggiornaCursorePrezzo(resetta) {
    var u = stato.unita;
    if (!u) {
      el.prezzo.disabled = true;
      el.prezzo.value = el.prezzo.max;
      el.prezzoValore.textContent = '';
      el.prezzoNota.textContent = 'Scegli un\'unità: i prezzi diventano confrontabili.';
      stato.prezzo = null;
      return;
    }
    var valori = TUTTI.filter(function (a) { return a.prezzo.unita === u; })
                      .map(function (a) { return a.prezzo.valore; });
    if (!valori.length) { el.prezzo.disabled = true; el.prezzoNota.textContent = 'Nessuna scheda con questa unità.'; return; }
    var max = Math.max.apply(null, valori);
    var min = Math.min.apply(null, valori);
    el.prezzo.disabled = false;
    el.prezzo.min = 0;
    el.prezzo.max = max;
    el.prezzo.step = max > 1000 ? 100 : max > 100 ? 5 : max > 10 ? 1 : 0.05;
    if (resetta || stato.prezzo == null || stato.prezzo > max) stato.prezzo = max;
    el.prezzo.value = stato.prezzo;
    el.prezzoValore.textContent = FERMO.fmt.euro(stato.prezzo) + FERMO.fmt.unita(u).suffisso;
    el.prezzoNota.textContent = 'Da ' + FERMO.fmt.euro(min) + ' a ' + FERMO.fmt.euro(max) + ' su questa unità.';
  }

  /* --------------------------------------------------------------- filtro */
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

  /* -------------------------------------------------------- filtri attivi */
  function gettoni() {
    var voci = [];
    if (stato.q) voci.push({ k: 'q', t: '“' + stato.q + '”' });
    stato.cat.forEach(function (c) { voci.push({ k: 'cat:' + c, t: D.categoria(c).breve }); });
    stato.mod.forEach(function (m) { voci.push({ k: 'mod:' + m, t: D.modalita(m).nome }); });
    if (stato.unita) voci.push({ k: 'unita', t: 'unità ' + FERMO.fmt.unita(stato.unita).suffisso.replace('/', '') });
    if (stato.citta) voci.push({ k: 'citta', t: stato.citta });
    if (stato.preavviso) voci.push({ k: 'pronta', t: 'entro ' + stato.preavviso + ' gg' });
    if (stato.verificato) voci.push({ k: 'verificato', t: 'verificati' });
    if (stato.preferiti) voci.push({ k: 'preferiti', t: 'preferiti' });

    el.gettoni.innerHTML = voci.length
      ? voci.map(function (v) {
          return '<span class="gettone">' + FERMO.esc(v.t) +
            '<button type="button" data-togli="' + FERMO.esc(v.k) + '" aria-label="Togli filtro ' +
            FERMO.esc(v.t) + '">×</button></span>';
        }).join('')
      : '';
  }

  /* -------------------------------------------------------------- disegno */
  function disegna() {
    var lista = ordina(filtra());
    el.conteggio.textContent = lista.length + (lista.length === 1 ? ' scheda' : ' schede') +
      ' su ' + TUTTI.length;
    el.risultati.innerHTML = lista.map(FERMO.scheda).join('');
    el.niente.innerHTML = lista.length ? '' :
      '<div class="vuoto">' +
        '<div class="cifra" style="color:var(--filo)">∅</div>' +
        '<p style="margin-top:12px"><strong>Nessuna capacità corrisponde a questi filtri.</strong></p>' +
        '<p class="piccolo">Allarga il raggio: togli la città, o cerca in tutte le modalità.</p>' +
        '<button class="bottone" type="button" id="vuoto-pulisci">Azzera i filtri</button>' +
      '</div>';
    var vp = document.getElementById('vuoto-pulisci');
    if (vp) vp.addEventListener('click', pulisci);
    gettoni();
    inURL();
  }

  /* ---------------------------------------------------------------- eventi */
  function raccogli() {
    stato.q = el.q.value;
    stato.ordina = el.ordina.value;
    stato.citta = el.citta.value;
    stato.preavviso = el.preavviso.value;
    stato.verificato = el.verificato.checked;
    stato.preferiti = el.preferiti.checked;
    stato.cat = Array.prototype.filter.call(document.querySelectorAll('[data-filtro="cat"]'), function (i) { return i.checked; })
      .map(function (i) { return i.value; });
    stato.mod = Array.prototype.filter.call(document.querySelectorAll('[data-filtro="mod"]'), function (i) { return i.checked; })
      .map(function (i) { return i.value; });
  }

  document.getElementById('modulo-ricerca').addEventListener('submit', function (e) {
    e.preventDefault(); raccogli(); disegna();
  });

  ['input', 'change'].forEach(function (ev) {
    document.querySelector('.catalogo').addEventListener(ev, function (e) {
      if (!e.target.matches('input,select')) return;
      if (e.target === el.prezzo) {
        stato.prezzo = parseFloat(el.prezzo.value);
        el.prezzoValore.textContent = FERMO.fmt.euro(stato.prezzo) + FERMO.fmt.unita(stato.unita).suffisso;
        disegna();
        return;
      }
      raccogli();
      if (e.target === el.unita) { stato.unita = el.unita.value; aggiornaCursorePrezzo(true); }
      disegna();
    });
  });

  el.q.addEventListener('input', function () { stato.q = el.q.value; disegna(); });
  el.ordina.addEventListener('change', function () { stato.ordina = el.ordina.value; disegna(); });

  el.gettoni.addEventListener('click', function (e) {
    var b = e.target.closest('[data-togli]');
    if (!b) return;
    var k = b.getAttribute('data-togli');
    if (k === 'q') { stato.q = ''; el.q.value = ''; }
    else if (k.indexOf('cat:') === 0) {
      stato.cat = stato.cat.filter(function (x) { return x !== k.slice(4); });
      var i1 = document.querySelector('[data-filtro="cat"][value="' + k.slice(4) + '"]'); if (i1) i1.checked = false;
    } else if (k.indexOf('mod:') === 0) {
      stato.mod = stato.mod.filter(function (x) { return x !== k.slice(4); });
      var i2 = document.querySelector('[data-filtro="mod"][value="' + k.slice(4) + '"]'); if (i2) i2.checked = false;
    } else if (k === 'unita') { stato.unita = ''; el.unita.value = ''; aggiornaCursorePrezzo(true); }
    else if (k === 'citta') { stato.citta = ''; el.citta.value = ''; }
    else if (k === 'pronta') { stato.preavviso = ''; el.preavviso.value = ''; }
    else if (k === 'verificato') { stato.verificato = false; el.verificato.checked = false; }
    else if (k === 'preferiti') { stato.preferiti = false; el.preferiti.checked = false; }
    disegna();
  });

  function pulisci() {
    stato = { q: '', cat: [], mod: [], unita: '', prezzo: null, citta: '', preavviso: '',
              verificato: false, preferiti: false, ordina: 'rilevanza' };
    el.q.value = ''; el.ordina.value = 'rilevanza'; el.unita.value = '';
    el.citta.value = ''; el.preavviso.value = '';
    el.verificato.checked = false; el.preferiti.checked = false;
    Array.prototype.forEach.call(document.querySelectorAll('[data-filtro]'), function (i) { i.checked = false; });
    aggiornaCursorePrezzo(true);
    disegna();
  }
  document.getElementById('pulisci').addEventListener('click', pulisci);

  /* se cambio i preferiti mentre il filtro "solo preferiti" è attivo, ridisegno */
  document.addEventListener('fermo:preferiti', function () { if (stato.preferiti) disegna(); });

  daURL();
  aggiornaCursorePrezzo(false);
  disegna();
})();
