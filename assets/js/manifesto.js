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

  var NUMERI = [
    { nome: 'Macchine a listino', valore: FERMO.fmt.num(tutti.length), nota: 'schede pubblicate' },
    { nome: 'Valore a listino', valore: FERMO.fmt.euroTondo(valore), nota: 'IVA esclusa' },
    { nome: 'Province', valore: Object.keys(province).length, nota: 'dove sta il ferro' },
    { nome: 'Scarto medio dal nuovo', valore: FERMO.fmt.pct(scontoMedio), nota: 'a parità di macchina' }
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

  /* ---------------------------------------------------------- categorie -- */
  document.getElementById('categorie').innerHTML = D.CATEGORIE.map(function (c) {
    var suoi = tutti.filter(function (a) { return a.cat === c.id; });
    var da = suoi.length
      ? Math.min.apply(null, suoi.map(FERMO.prezzoCorrente))
      : 0;
    return '<a class="carta" href="catalogo.html?cat=' + c.id + '" style="text-decoration:none">' +
      '<div class="carta__corpo carta__corpo--fitto">' +
        '<div class="figurina">' + FERMO.glifo(c.glifo) + '</div>' +
        '<div class="grassetto" style="margin-top:8px;font-size:15px">' + FERMO.esc(c.nome) + '</div>' +
        '<div class="piccolo fioco num">' + suoi.length + ' schede' +
          (suoi.length ? ' · da ' + FERMO.fmt.euroTondo(da) : '') + '</div>' +
      '</div>' +
    '</a>';
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
  /* Lo scarto più alto rispetto al nuovo, una macchina per categoria, così la
     vetrina non si riempie di tre torni. Le aste restano alla sezione loro. */
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
