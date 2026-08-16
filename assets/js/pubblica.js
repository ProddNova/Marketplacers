/* =============================================================================
   FERMO — pubblicazione in quattro passaggi, con anteprima e stima dal vivo
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('pubblica.html');

  var D = FERMO.D;
  var passo = 1, MAX = 4;

  var g = function (id) { return document.getElementById(id); };

  /* --------------------------------------------------- riempimento select */
  g('f-cat').innerHTML = D.CATEGORIE.map(function (c) {
    return '<option value="' + c.id + '">' + FERMO.esc(c.nome) + '</option>';
  }).join('');

  g('f-mod').innerHTML = D.MODALITA.map(function (m, i) {
    return '<label class="scelta"><input type="checkbox" value="' + m.id + '"' +
      (i === 0 ? ' checked' : '') + '><span>' + FERMO.esc(m.nome) + '</span></label>';
  }).join('');

  /* -------------------------------------------------------- lettura form */
  function modalitaScelte() {
    return Array.prototype.filter.call(g('f-mod').querySelectorAll('input'), function (i) { return i.checked; })
      .map(function (i) { return i.value; });
  }

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
  function ridisegna() {
    var b = bozza();
    g('anteprima').innerHTML = FERMO.scheda(b);
    g('anteprima-saturazione').innerHTML = b.oreSettimana
      ? FERMO.misuraSaturazione(b)
      : '<p class="campo__aiuto">Con la vendita in blocco l\'occupazione non si applica.</p>';

    var nm = g('nota-mod');
    var scelte = modalitaScelte();
    nm.textContent = scelte.length
      ? scelte.map(function (m) { return D.modalita(m).nota; }).join(' ')
      : 'Scegline almeno una.';

    /* stima di ricavo: ore ferme × prezzo × 44 settimane, al netto del 9 % */
    var settimane = 44;
    var lordoSett, etichettaBase;
    switch (b.prezzo.unita) {
      case 'ora':        lordoSett = b.oreLibere * b.prezzo.valore; etichettaBase = b.oreLibere + ' h ferme × ' + FERMO.fmt.euro(b.prezzo.valore); break;
      case 'giorno':     lordoSett = (b.oreLibere / 8) * b.prezzo.valore; etichettaBase = (b.oreLibere / 8).toFixed(1) + ' gg × ' + FERMO.fmt.euro(b.prezzo.valore); break;
      case 'settimana':  lordoSett = b.prezzo.valore * (b.oreSettimana ? b.oreLibere / b.oreSettimana : 0); etichettaBase = 'quota settimanale ceduta'; break;
      case 'mese':       lordoSett = b.prezzo.valore / 4.33; etichettaBase = 'canone mensile ripartito'; break;
      case 'corpo':      lordoSett = 0; etichettaBase = 'vendita una tantum'; break;
      default:           lordoSett = b.oreLibere * b.prezzo.valore / 4; etichettaBase = 'stima prudenziale sul volume';
    }
    var commissione = lordoSett * D.COMMISSIONE;
    var netto = lordoSett - commissione;

    g('conto-anteprima').innerHTML = b.prezzo.unita === 'corpo'
      ? riga('Prezzo richiesto', FERMO.fmt.euroTondo(b.prezzo.valore)) +
        riga('Commissione 9 %', '−' + FERMO.fmt.euro(b.prezzo.valore * D.COMMISSIONE)) +
        riga('<strong>Ti resta</strong>', '<strong>' + FERMO.fmt.euroTondo(b.prezzo.valore * (1 - D.COMMISSIONE)) + '</strong>')
      : riga(etichettaBase, FERMO.fmt.euro(lordoSett) + '/sett.') +
        riga('Commissione 9 %', '−' + FERMO.fmt.euro(commissione)) +
        riga('<strong>Netto settimanale</strong>', '<strong>' + FERMO.fmt.euro(netto) + '</strong>') +
        riga('<span class="tenue">Su ' + settimane + ' settimane</span>',
             '<span class="tenue">' + FERMO.fmt.euroTondo(netto * settimane) + '</span>');

    var st = g('stima');
    if (st) {
      st.innerHTML = b.prezzo.unita === 'corpo'
        ? '<strong>Vendita in blocco.</strong> Trattieni ' +
          FERMO.fmt.euroTondo(b.prezzo.valore * (1 - D.COMMISSIONE)) +
          ' sui ' + FERMO.fmt.euroTondo(b.prezzo.valore) + ' richiesti.'
        : '<strong>Se vendi tutte le ore ferme</strong>, questo annuncio vale circa ' +
          '<span class="numerico">' + FERMO.fmt.euroTondo(netto * settimane) + ' netti l\'anno</span> ' +
          '(' + FERMO.fmt.euro(netto) + ' a settimana, su ' + settimane + ' settimane lavorate).';
    }
  }
  function riga(k, v) { return '<tr><td>' + k + '</td><td class="num numerico">' + v + '</td></tr>'; }

  /* ------------------------------------------------------------ validazione */
  var REGOLE = {
    1: [
      ['f-titolo', function (v) { return v.trim().length >= 8; }, 'Serve un titolo di almeno 8 caratteri.'],
      ['f-mod', function () { return modalitaScelte().length > 0; }, 'Scegli almeno una modalità.']
    ],
    2: [
      ['f-citta', function (v) { return v.trim().length >= 2; }, 'Indica la città.'],
      ['f-prov', function (v) { return /^[A-Za-z]{2}$/.test(v.trim()); }, 'Due lettere, es. BS.'],
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
    (REGOLE[n] || []).forEach(function (r) {
      var campo = g(r[0]);
      var valore = campo.value !== undefined ? campo.value : '';
      var buono = r[1](valore);
      var vecchio = campo.parentNode.querySelector('.campo__errore');
      if (vecchio) vecchio.remove();
      if (campo.setAttribute) campo.setAttribute('aria-invalid', buono ? 'false' : 'true');
      if (!buono) {
        ok = false;
        var e = document.createElement('span');
        e.className = 'campo__errore';
        e.textContent = r[2];
        campo.parentNode.appendChild(e);
      }
    });
    return ok;
  }

  /* ---------------------------------------------------------- navigazione */
  function mostra(n) {
    passo = n;
    Array.prototype.forEach.call(document.querySelectorAll('[data-sezione]'), function (s) {
      s.hidden = +s.getAttribute('data-sezione') !== n;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.passo'), function (p) {
      var i = +p.getAttribute('data-passo');
      p.setAttribute('data-stato', i === n ? 'corrente' : i < n ? 'fatto' : 'attesa');
    });
    var titoli = { 1: 'Che cosa cedi', 2: 'Dove e quanto', 3: 'Prezzo', 4: 'Controllo e firma' };
    g('titolo-passo').textContent = 'Passo 0' + n + ' · ' + titoli[n];
    g('contatore').textContent = 'Passo ' + n + ' di ' + MAX;
    g('indietro').disabled = n === 1;
    g('avanti').textContent = n === MAX ? 'Pubblica ✓' : 'Avanti →';
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

  /* ----------------------------------------------------------- pubblica */
  function pubblica() {
    var b = bozza();
    FERMO.store.aggiorna(function (s) { s.annunci.unshift(b); });
    FERMO.brindisi('Annuncio pubblicato · ' + b.id, 'È in catalogo e nella tua console.');
    setTimeout(function () {
      location.href = 'asset.html?id=' + encodeURIComponent(b.id);
    }, 900);
  }

  document.getElementById('modulo').addEventListener('input', ridisegna);
  document.getElementById('modulo').addEventListener('change', ridisegna);
  document.getElementById('modulo').addEventListener('submit', function (e) { e.preventDefault(); });

  mostra(1);
  ridisegna();
})();
