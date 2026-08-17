/* =============================================================================
   FERMO — messa in vendita in quattro passaggi
   Un passaggio per schermata, l'anteprima sotto, i comandi fissi in basso:
   sul telefono si compila con una mano sola.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('pubblica.html');

  var D = FERMO.D;
  var passo = 1, MAX = 4;
  var g = function (id) { return document.getElementById(id); };

  var TITOLI = { 1: 'Che cosa vendi', 2: 'Stato e provenienza', 3: 'Prezzo e condizioni', 4: 'Dettagli e pubblicazione' };

  /* --------------------------------------------------- riempimento campi */
  g('f-cat').innerHTML = D.CATEGORIE.map(function (c) {
    return '<option value="' + c.id + '">' + FERMO.esc(c.nome) + '</option>';
  }).join('');

  g('f-condizione').innerHTML = D.CONDIZIONI.map(function (c, i) {
    return '<option value="' + c.id + '"' + (i === 1 ? ' selected' : '') + '>' +
      FERMO.esc(c.nome) + '</option>';
  }).join('');

  var MOTIVI = ['sostituzione', 'cambio-tecnologia', 'cambio-produzione', 'fine-commessa',
                'accorpamento', 'trasloco', 'calo-ordini', 'liquidazione', 'pensionamento',
                'rinnovo-flotta', 'sovradimensionamento'];
  g('f-motivo').innerHTML = MOTIVI.map(function (m) {
    return '<option value="' + m + '">' + FERMO.esc(D.motivo(m)) + '</option>';
  }).join('');

  g('f-mod').innerHTML = D.FORMULE.map(function (m, i) {
    return '<button class="chip" type="button" data-mod="' + m.id + '" aria-pressed="' +
      (i === 0 ? 'true' : 'false') + '">' + FERMO.esc(m.nome) + '</button>';
  }).join('');

  g('f-mod').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mod]');
    if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    ridisegna();
  });

  function formuleScelte() {
    return Array.prototype.filter.call(g('f-mod').querySelectorAll('[data-mod]'), function (b) {
      return b.getAttribute('aria-pressed') === 'true';
    }).map(function (b) { return b.getAttribute('data-mod'); });
  }

  /* -------------------------------------------------------- lettura form */
  function bozza() {
    var mod = formuleScelte();
    var conta = parseInt(g('f-contatore').value, 10) || 0;
    return {
      id: 'FRM-TUO-' + String(Date.now()).slice(-4),
      origine: 'utente',
      cat: g('f-cat').value,
      mod: mod,
      titolo: g('f-titolo').value.trim() || 'Annuncio senza titolo',
      citta: g('f-citta').value.trim() || 'Città',
      prov: g('f-prov').value.trim().toUpperCase() || '--',
      regione: '—',
      venditore: g('f-venditore').value.trim() || 'La tua azienda',
      dal: new Date().getFullYear(),
      rating: 0, recensioni: 0, verificato: false,
      prezzo: parseFloat(g('f-prezzo').value) || 0,
      nuovo: parseFloat(g('f-nuovo').value) || 0,
      anno: parseInt(g('f-anno').value, 10) || new Date().getFullYear(),
      contatore: conta ? { valore: conta, unita: g('f-contatore-unita').value } : null,
      condizione: g('f-condizione').value,
      pezzi: parseInt(g('f-pezzi').value, 10) || 1,
      ritiroFra: parseInt(g('f-ritiro').value, 10) || 0,
      garanzia: parseInt(g('f-garanzia').value, 10) || 0,
      consegna: g('f-consegna').value,
      smontaggio: g('f-smontaggio').value,
      asta: mod.indexOf('asta') !== -1 ? {
        base: parseFloat(g('f-base').value) || 0,
        rilancio: parseFloat(g('f-rilancio').value) || 100,
        scadeFra: parseInt(g('f-scadenza').value, 10) || 7,
        offerte: 0
      } : null,
      sintesi: g('f-sintesi').value.trim() ||
        'Macchina disponibile, contattaci per i dettagli e per una visione in sede.',
      specifiche: g('f-specifiche').value.split('\n').map(function (r) {
        var i = r.indexOf(':');
        return i === -1 ? null : [r.slice(0, i).trim(), r.slice(i + 1).trim()];
      }).filter(function (r) { return r && r[0] && r[1]; }),
      certificazioni: lista(g('f-certificazioni').value),
      incluso: lista(g('f-incluso').value),
      escluso: lista(g('f-escluso').value),
      motivo: g('f-motivo').value
    };
  }
  function lista(s) {
    return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* ------------------------------------------------------------ anteprima */
  function riga(k, v) { return '<tr><td>' + k + '</td><td class="num">' + v + '</td></tr>'; }

  function ridisegna() {
    var b = bozza();
    var scelte = formuleScelte();

    /* i campi dell'asta compaiono solo se l'asta è tra le formule scelte */
    g('blocco-asta').hidden = scelte.indexOf('asta') === -1;

    g('anteprima').innerHTML = FERMO.scheda(b);
    g('anteprima-condizione').innerHTML = FERMO.misuraCondizione(b);

    g('nota-mod').textContent = scelte.length
      ? scelte.map(function (m) { return D.formula(m).nota; }).join(' ')
      : 'Scegline almeno una.';

    /* Il conto del venditore: quanto entra davvero, e quanto del valore da
       nuovo stai recuperando. In asta il riferimento è la base. */
    var inAsta = scelte.indexOf('asta') !== -1;
    var riferimento = inAsta && b.asta ? b.asta.base : b.prezzo;
    var commissione = riferimento * D.COMMISSIONE;
    var netto = FERMO.nettoVenditore(riferimento);
    var recupero = b.nuovo ? riferimento / b.nuovo : null;

    g('conto-anteprima').innerHTML =
      riga(inAsta ? 'Base d\'asta' : 'Prezzo richiesto', FERMO.fmt.euroTondo(riferimento)) +
      riga('Commissione 6 %', '−' + FERMO.fmt.euro(commissione)) +
      (recupero != null ? riga('Recupero sul valore da nuovo', FERMO.fmt.pct(recupero)) : '') +
      riga('Ti resta', FERMO.fmt.euroTondo(netto));

    var st = g('stima');
    if (st) {
      st.innerHTML = inAsta
        ? '<span><strong>Asta a tempo.</strong> Sotto ' + FERMO.fmt.euroTondo(b.asta.base) +
          ' non si vende. Se chiude alla base ti restano ' + FERMO.fmt.euroTondo(netto) +
          ', ogni rilancio da ' + FERMO.fmt.euroTondo(b.asta.rilancio) + ' te ne lascia ' +
          FERMO.fmt.euro(b.asta.rilancio * (1 - D.COMMISSIONE)) + '.</span>'
        : '<span><strong>A ' + FERMO.fmt.euroTondo(b.prezzo) + '</strong> ti restano ' +
          '<span class="num">' + FERMO.fmt.euroTondo(netto) + ' netti</span>' +
          (recupero != null
            ? ', cioè il ' + FERMO.fmt.pct(recupero) + ' di quanto costa oggi la stessa macchina nuova.'
            : '.') + '</span>';
    }
  }

  /* ---------------------------------------------------------- validazione */
  var ANNO = new Date().getFullYear();
  var REGOLE = {
    1: [
      ['f-titolo', function (v) { return v.trim().length >= 8; }, 'Serve un titolo di almeno 8 caratteri.'],
      ['f-mod', function () { return formuleScelte().length > 0; }, 'Scegli almeno un modo di venderla.']
    ],
    2: [
      ['f-anno', function (v) { return +v >= 1960 && +v <= ANNO; }, 'Un anno tra il 1960 e oggi.'],
      ['f-citta', function (v) { return v.trim().length >= 2; }, 'Indica la città dove sta la macchina.'],
      ['f-prov', function (v) { return /^[A-Za-z]{2}$/.test(v.trim()); }, 'Due lettere, per esempio BS.'],
      ['f-venditore', function (v) { return v.trim().length >= 3; }, 'Indica la ragione sociale.'],
      ['f-pezzi', function (v) { return +v >= 1 && +v <= 99; }, 'Tra 1 e 99 pezzi.']
    ],
    3: [
      ['f-prezzo', function (v) { return +v > 0; }, 'Il prezzo deve essere maggiore di zero.'],
      ['f-nuovo', function (v) {
        return +v === 0 || +v >= (parseFloat(g('f-prezzo').value) || 0);
      }, 'Il valore da nuovo non può essere sotto il prezzo richiesto.'],
      ['f-base', function (v) {
        if (formuleScelte().indexOf('asta') === -1) return true;
        return +v > 0 && +v <= (parseFloat(g('f-prezzo').value) || 0);
      }, 'La base d\'asta va sopra lo zero e non oltre il prezzo richiesto.']
    ],
    4: []
  };

  function valida(n) {
    var ok = true;
    var primo = null;
    (REGOLE[n] || []).forEach(function (r) {
      var campo = g(r[0]);
      /* i campi dell'asta esistono sempre, ma si validano solo se sono in scena */
      if (campo.closest('[hidden]')) return;
      var valore = campo.value !== undefined ? campo.value : '';
      var buono = r[1](valore);
      var vecchio = campo.parentNode.querySelector('.campo__errore');
      if (vecchio) vecchio.remove();
      if (campo.setAttribute) campo.setAttribute('aria-invalid', buono ? 'false' : 'true');
      if (!buono) {
        ok = false;
        if (!primo) primo = campo;
        var e = document.createElement('span');
        e.className = 'campo__errore';
        e.textContent = r[2];
        campo.parentNode.appendChild(e);
      }
    });
    if (primo && primo.scrollIntoView) primo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return ok;
  }

  /* ---------------------------------------------------------- navigazione */
  function mostra(n) {
    passo = n;
    Array.prototype.forEach.call(document.querySelectorAll('[data-sezione]'), function (s) {
      s.hidden = +s.getAttribute('data-sezione') !== n;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.passi__tratto'), function (t) {
      var i = +t.getAttribute('data-passo');
      t.setAttribute('data-stato', i === n ? 'corrente' : i < n ? 'fatto' : 'attesa');
    });
    g('titolo-passo').textContent = TITOLI[n];
    g('contatore').textContent = 'Passo ' + n + ' di ' + MAX;
    g('indietro').disabled = n === 1;
    g('avanti').textContent = n === MAX ? 'Pubblica' : 'Avanti';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  g('avanti').addEventListener('click', function () {
    if (!valida(passo)) {
      FERMO.brindisi('Manca qualcosa', 'Controlla i campi segnati in rosso.');
      return;
    }
    if (passo < MAX) { mostra(passo + 1); return; }
    pubblica();
  });
  g('indietro').addEventListener('click', function () { if (passo > 1) mostra(passo - 1); });

  /* ------------------------------------------------------------- pubblica */
  function pubblica() {
    var b = bozza();
    FERMO.store.aggiorna(function (s) { s.annunci.unshift(b); });
    FERMO.brindisi('Annuncio pubblicato · ' + b.id, 'È nel listino e nella tua console.');
    setTimeout(function () {
      location.href = 'asset.html?id=' + encodeURIComponent(b.id);
    }, 900);
  }

  g('modulo').addEventListener('input', ridisegna);
  g('modulo').addEventListener('change', ridisegna);
  g('modulo').addEventListener('submit', function (e) { e.preventDefault(); });

  mostra(1);
  ridisegna();
})();
