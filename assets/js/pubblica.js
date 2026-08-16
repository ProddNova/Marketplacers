/* =============================================================================
   FERMO — pubblicazione in quattro passaggi
   Un passaggio per schermata, l'anteprima sotto, i comandi fissi in basso:
   sul telefono si compila con una mano sola.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('pubblica.html');

  var D = FERMO.D;
  var passo = 1, MAX = 4;
  var g = function (id) { return document.getElementById(id); };

  var TITOLI = { 1: 'Che cosa cedi', 2: 'Dove e quanto', 3: 'Prezzo', 4: 'Dettagli e pubblicazione' };

  /* --------------------------------------------------- riempimento campi */
  g('f-cat').innerHTML = D.CATEGORIE.map(function (c) {
    return '<option value="' + c.id + '">' + FERMO.esc(c.nome) + '</option>';
  }).join('');

  g('f-mod').innerHTML = D.MODALITA.map(function (m, i) {
    return '<button class="chip" type="button" data-mod="' + m.id + '" aria-pressed="' +
      (i === 0 ? 'true' : 'false') + '">' + FERMO.esc(m.nome) + '</button>';
  }).join('');

  g('f-mod').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mod]');
    if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    ridisegna();
  });

  function modalitaScelte() {
    return Array.prototype.filter.call(g('f-mod').querySelectorAll('[data-mod]'), function (b) {
      return b.getAttribute('aria-pressed') === 'true';
    }).map(function (b) { return b.getAttribute('data-mod'); });
  }

  /* -------------------------------------------------------- lettura form */
  function bozza() {
    var oreTot = parseInt(g('f-ore-tot').value, 10) || 0;
    var oreLib = Math.min(parseInt(g('f-ore-libere').value, 10) || 0, oreTot);
    var unita = g('f-unita').value;
    return {
      id: 'FRM-TUO-' + String(Date.now()).slice(-4),
      origine: 'utente',
      cat: g('f-cat').value,
      mod: modalitaScelte(),
      titolo: g('f-titolo').value.trim() || 'Annuncio senza titolo',
      citta: g('f-citta').value.trim() || 'Città',
      prov: g('f-prov').value.trim().toUpperCase() || '--',
      regione: '—',
      fornitore: g('f-fornitore').value.trim() || 'La tua azienda',
      dal: new Date().getFullYear(),
      rating: 0, recensioni: 0, verificato: false,
      prezzo: { valore: parseFloat(g('f-prezzo').value) || 0, unita: unita },
      minimo: g('f-minimo').value.trim() || '—',
      preavviso: parseInt(g('f-preavviso').value, 10) || 2,
      oreSettimana: unita === 'corpo' ? 0 : oreTot,
      oreLibere: unita === 'corpo' ? 0 : oreLib,
      sintesi: g('f-sintesi').value.trim() || 'Capacità disponibile, contattaci per i dettagli.',
      specifiche: g('f-specifiche').value.split('\n').map(function (r) {
        var i = r.indexOf(':');
        return i === -1 ? null : [r.slice(0, i).trim(), r.slice(i + 1).trim()];
      }).filter(function (r) { return r && r[0] && r[1]; }),
      certificazioni: lista(g('f-certificazioni').value),
      incluso: lista(g('f-incluso').value),
      escluso: lista(g('f-escluso').value),
      logistica: g('f-logistica').value
    };
  }
  function lista(s) {
    return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* ------------------------------------------------------------ anteprima */
  function riga(k, v) { return '<tr><td>' + k + '</td><td class="num">' + v + '</td></tr>'; }

  function ridisegna() {
    var b = bozza();
    g('anteprima').innerHTML = FERMO.scheda(b);
    g('anteprima-saturazione').innerHTML = b.oreSettimana
      ? FERMO.misuraSaturazione(b)
      : '<p class="campo__aiuto" style="margin-top:0">Con la vendita in blocco l\'occupazione non si applica.</p>';

    var scelte = modalitaScelte();
    g('nota-mod').textContent = scelte.length
      ? scelte.map(function (m) { return D.modalita(m).nota; }).join(' ')
      : 'Scegline almeno una.';

    /* stima di ricavo: ore ferme × prezzo × 44 settimane, al netto del 9 % */
    var settimane = 44;
    var lordoSett, base;
    switch (b.prezzo.unita) {
      case 'ora':
        lordoSett = b.oreLibere * b.prezzo.valore;
        base = b.oreLibere + ' h ferme × ' + FERMO.fmt.euro(b.prezzo.valore); break;
      case 'giorno':
        lordoSett = (b.oreLibere / 8) * b.prezzo.valore;
        base = (b.oreLibere / 8).toFixed(1) + ' gg × ' + FERMO.fmt.euro(b.prezzo.valore); break;
      case 'settimana':
        lordoSett = b.prezzo.valore * (b.oreSettimana ? b.oreLibere / b.oreSettimana : 0);
        base = 'quota settimanale ceduta'; break;
      case 'mese':
        lordoSett = b.prezzo.valore / 4.33;
        base = 'canone mensile ripartito'; break;
      case 'corpo':
        lordoSett = 0; base = 'vendita una tantum'; break;
      default:
        lordoSett = b.oreLibere * b.prezzo.valore / 4;
        base = 'stima prudenziale sul volume';
    }
    var commissione = lordoSett * D.COMMISSIONE;
    var netto = lordoSett - commissione;

    g('conto-anteprima').innerHTML = b.prezzo.unita === 'corpo'
      ? riga('Prezzo richiesto', FERMO.fmt.euroTondo(b.prezzo.valore)) +
        riga('Commissione 9 %', '−' + FERMO.fmt.euro(b.prezzo.valore * D.COMMISSIONE)) +
        riga('Ti resta', FERMO.fmt.euroTondo(b.prezzo.valore * (1 - D.COMMISSIONE)))
      : riga(base, FERMO.fmt.euro(lordoSett) + '/sett.') +
        riga('Commissione 9 %', '−' + FERMO.fmt.euro(commissione)) +
        riga('Su ' + settimane + ' settimane', FERMO.fmt.euroTondo(netto * settimane)) +
        riga('Netto a settimana', FERMO.fmt.euro(netto));

    var st = g('stima');
    if (st) {
      st.innerHTML = b.prezzo.unita === 'corpo'
        ? '<span><strong>Vendita in blocco.</strong> Trattieni ' +
          FERMO.fmt.euroTondo(b.prezzo.valore * (1 - D.COMMISSIONE)) +
          ' sui ' + FERMO.fmt.euroTondo(b.prezzo.valore) + ' richiesti.</span>'
        : '<span><strong>Se vendi tutte le ore ferme</strong> questo annuncio vale circa ' +
          '<span class="num">' + FERMO.fmt.euroTondo(netto * settimane) + ' netti l\'anno</span> — ' +
          FERMO.fmt.euro(netto) + ' a settimana, su ' + settimane + ' settimane lavorate.</span>';
    }
  }

  /* ---------------------------------------------------------- validazione */
  var REGOLE = {
    1: [
      ['f-titolo', function (v) { return v.trim().length >= 8; }, 'Serve un titolo di almeno 8 caratteri.'],
      ['f-mod', function () { return modalitaScelte().length > 0; }, 'Scegli almeno una modalità.']
    ],
    2: [
      ['f-citta', function (v) { return v.trim().length >= 2; }, 'Indica la città.'],
      ['f-prov', function (v) { return /^[A-Za-z]{2}$/.test(v.trim()); }, 'Due lettere, per esempio BS.'],
      ['f-fornitore', function (v) { return v.trim().length >= 3; }, 'Indica la ragione sociale.'],
      ['f-ore-tot', function (v) { return +v > 0 && +v <= 168; }, 'Tra 1 e 168 ore.'],
      ['f-ore-libere', function (v) { return +v >= 0 && +v <= (+g('f-ore-tot').value || 0); },
        'Le ore ferme non possono superare quelle disponibili.']
    ],
    3: [
      ['f-prezzo', function (v) { return +v > 0; }, 'Il prezzo deve essere maggiore di zero.']
    ],
    4: []
  };

  function valida(n) {
    var ok = true;
    var primo = null;
    (REGOLE[n] || []).forEach(function (r) {
      var campo = g(r[0]);
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
    FERMO.brindisi('Annuncio pubblicato · ' + b.id, 'È nel catalogo e nella tua console.');
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
