/* =============================================================================
   FERMO — home: numeri, formule, categorie e vetrine sono calcolati dal
   listino vero, non scritti a mano nella pagina.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('index.html');
  var D = FERMO.D, tutti = FERMO.catalogo();

  /* ------------------------------------------------------------- numeri -- */
  var valore = tutti.reduce(function (t, a) { return t + FERMO.prezzoCorrente(a); }, 0);
  var conSconto = tutti.filter(function (a) { return FERMO.sconto(a) != null; });
  var scontoMedio = conSconto.reduce(function (t, a) { return t + FERMO.sconto(a); }, 0) / conSconto.length;
  var province = {};
  tutti.forEach(function (a) { province[a.prov] = 1; });

  /* Il prezzo più basso e quello più alto dicono in una riga sola l'ampiezza
     del listino meglio di qualsiasi frase: sei euro una tastiera, centosessanta-
     ottomila un laser, stesso mercato. */
  var prezzi = tutti.map(FERMO.prezzoCorrente);
  var minimo = Math.min.apply(null, prezzi);
  var massimo = Math.max.apply(null, prezzi);

  var NUMERI = [
    { nome: 'Annunci a listino', valore: FERMO.fmt.num(tutti.length), nota: 'in 17 categorie' },
    { nome: 'Valore a listino', valore: FERMO.fmt.euroTondo(valore), nota: 'IVA esclusa' },
    { nome: 'Si va da', valore: FERMO.fmt.euroTondo(minimo),
      nota: 'fino a ' + FERMO.fmt.euroTondo(massimo) },
    { nome: 'Province', valore: Object.keys(province).length, nota: 'dove sta la roba' }
  ];
  document.getElementById('numeri').innerHTML = NUMERI.map(function (m) {
    return '<div class="metrica">' +
      '<div class="metrica__nome">' + FERMO.esc(m.nome) + '</div>' +
      '<div class="metrica__valore">' + FERMO.esc(m.valore) + '</div>' +
      '<div class="metrica__nota">' + FERMO.esc(m.nota) + '</div>' +
    '</div>';
  }).join('');

  /* ------------------------------------------------------------ formule -- */
  document.getElementById('formule').innerHTML = D.FORMULE.map(function (m) {
    var n = tutti.filter(function (a) { return a.mod.indexOf(m.id) !== -1; }).length;
    return '<div class="carta">' +
      '<div class="carta__corpo">' +
        '<div class="riga riga--fra">' +
          '<h3>' + FERMO.esc(m.nome) + '</h3>' +
          '<span class="pillola">' + FERMO.esc(m.sigla) + '</span>' +
        '</div>' +
        '<p class="tenue piccolo" style="margin:8px 0 14px">' + FERMO.esc(m.nota) + '</p>' +
        '<a class="piccolo" href="catalogo.html?mod=' + m.id + '"><strong class="num">' + n +
          '</strong> macchine così →</a>' +
      '</div>' +
    '</div>';
  }).join('');

  /* ---------------------------------------------------------- categorie --
     Diciassette tessere di fila non si guardano: si raggruppano per famiglia,
     con la famiglia stessa cliccabile per chi vuole solo restringere il campo. */
  function tessera(c) {
    var suoi = tutti.filter(function (a) { return a.cat === c.id; });
    var da = suoi.length ? Math.min.apply(null, suoi.map(FERMO.prezzoCorrente)) : 0;
    return '<a class="carta" href="catalogo.html?cat=' + c.id + '" style="text-decoration:none">' +
      '<div class="carta__corpo carta__corpo--fitto">' +
        '<div class="figurina">' + FERMO.glifo(c.glifo) + '</div>' +
        '<div class="grassetto" style="margin-top:8px;font-size:15px">' + FERMO.esc(c.nome) + '</div>' +
        '<div class="piccolo fioco num">' + suoi.length + (suoi.length === 1 ? ' scheda' : ' schede') +
          (suoi.length ? ' · da ' + FERMO.fmt.euroTondo(da) : '') + '</div>' +
      '</div>' +
    '</a>';
  }

  document.getElementById('categorie').innerHTML = D.FAMIGLIE.map(function (f) {
    var suoi = tutti.filter(function (a) { return D.famigliaDi(a) === f.id; });
    return '<div>' +
      '<div class="capo" style="margin-bottom:10px">' +
        '<h3><a href="catalogo.html?fam=' + f.id + '" class="tocco">' + FERMO.esc(f.nome) + '</a></h3>' +
        '<span class="capo__nota">' + suoi.length + (suoi.length === 1 ? ' annuncio' : ' annunci') + '</span>' +
      '</div>' +
      '<p class="piccolo fioco" style="margin:-6px 0 12px">' + FERMO.esc(f.nota) + '</p>' +
      '<div class="griglia griglia--2 griglia--4">' +
        D.categorieDi(f.id).map(tessera).join('') +
      '</div>' +
    '</div>';
  }).join('');

  /* --------------------------------------------------------------- aste -- */
  /* Prima quelle che chiudono per prime: è l'unica vetrina con una scadenza. */
  var aste = tutti.filter(FERMO.inAsta)
    .sort(function (a, b) { return a.asta.scadeFra - b.asta.scadeFra; })
    .slice(0, 4);
  document.getElementById('aste').innerHTML = aste.length
    ? aste.map(FERMO.scheda).join('')
    : '<p class="tenue">Nessuna asta aperta in questo momento.</p>';
  document.getElementById('nota-aste').textContent = aste.length
    ? 'la prima chiude fra ' + FERMO.fmt.giorni(aste[0].asta.scadeFra)
    : 'nessuna aperta';

  /* --------------------------------------------------------- in evidenza -- */
  /* Lo scarto più alto rispetto al nuovo, un annuncio per categoria, così la
     vetrina non si riempie di tre torni. Le aste restano alla sezione loro. */
  var notaEvidenza = document.getElementById('nota-evidenza');
  if (notaEvidenza) {
    notaEvidenza.textContent = 'in media −' + Math.round(scontoMedio * 100) + ' % dal nuovo';
  }

  var viste = {};
  var top = tutti.slice()
    .filter(function (a) { return !FERMO.inAsta(a) && FERMO.sconto(a) != null; })
    .sort(function (a, b) { return FERMO.sconto(b) - FERMO.sconto(a); })
    .filter(function (a) {
      if (viste[a.cat]) return false;
      viste[a.cat] = 1;
      return true;
    })
    .slice(0, 4);
  document.getElementById('evidenza').innerHTML = top.map(FERMO.scheda).join('');
})();
