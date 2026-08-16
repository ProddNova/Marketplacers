/* =============================================================================
   FERMO — home: numeri, modalita, categorie e vetrina sono calcolati
   dal catalogo vero, non scritti a mano nella pagina.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('index.html');
  var D = FERMO.D, tutti = FERMO.catalogo();

  /* ------------------------------------------------------------- numeri -- */
  var noleggiabili = tutti.filter(function (a) { return a.oreSettimana > 0; });
  var oreLibere = noleggiabili.reduce(function (t, a) { return t + a.oreLibere; }, 0);
  var satMedia = noleggiabili.reduce(function (t, a) { return t + FERMO.saturazione(a); }, 0) / noleggiabili.length;
  var province = {};
  tutti.forEach(function (a) { province[a.prov] = 1; });

  var NUMERI = [
    { nome: 'Capacità a listino', valore: FERMO.fmt.num(tutti.length), nota: 'schede pubblicate' },
    { nome: 'Ore libere', valore: FERMO.fmt.num(oreLibere), nota: 'ogni settimana' },
    { nome: 'Province', valore: Object.keys(province).length, nota: 'coperte oggi' },
    { nome: 'Occupazione media', valore: FERMO.fmt.pct(satMedia), nota: 'il resto è fermo' }
  ];
  document.getElementById('numeri').innerHTML = NUMERI.map(function (m) {
    return '<div class="metrica">' +
      '<div class="metrica__nome">' + FERMO.esc(m.nome) + '</div>' +
      '<div class="metrica__valore">' + FERMO.esc(m.valore) + '</div>' +
      '<div class="metrica__nota">' + FERMO.esc(m.nota) + '</div>' +
    '</div>';
  }).join('');

  /* ----------------------------------------------------------- modalità -- */
  document.getElementById('modalita').innerHTML = D.MODALITA.map(function (m) {
    var n = tutti.filter(function (a) { return a.mod.indexOf(m.id) !== -1; }).length;
    return '<div class="carta">' +
      '<div class="carta__corpo">' +
        '<div class="riga riga--fra">' +
          '<h3>' + FERMO.esc(m.nome) + '</h3>' +
          '<span class="pillola">' + FERMO.esc(m.sigla) + '</span>' +
        '</div>' +
        '<p class="tenue piccolo" style="margin:8px 0 14px">' + FERMO.esc(m.nota) + '</p>' +
        '<a class="piccolo" href="catalogo.html?mod=' + m.id + '"><strong class="num">' + n +
          '</strong> schede a listino →</a>' +
      '</div>' +
    '</div>';
  }).join('');

  /* ---------------------------------------------------------- categorie -- */
  document.getElementById('categorie').innerHTML = D.CATEGORIE.map(function (c) {
    var suoi = tutti.filter(function (a) { return a.cat === c.id; });
    var ore = suoi.reduce(function (t, a) { return t + a.oreLibere; }, 0);
    return '<a class="carta" href="catalogo.html?cat=' + c.id + '" style="text-decoration:none">' +
      '<div class="carta__corpo carta__corpo--fitto">' +
        '<div class="figurina">' + FERMO.glifo(c.glifo) + '</div>' +
        '<div class="grassetto" style="margin-top:8px;font-size:15px">' + FERMO.esc(c.nome) + '</div>' +
        '<div class="piccolo fioco num">' + suoi.length + ' schede · ' + ore + ' h libere</div>' +
      '</div>' +
    '</a>';
  }).join('');

  /* --------------------------------------------------------- in evidenza -- */
  /* la scheda con più ore ferme, una per categoria, così la vetrina non si
     riempie di tre magazzini */
  var viste = {};
  var top = tutti.slice()
    .sort(function (a, b) { return b.oreLibere - a.oreLibere; })
    .filter(function (a) {
      if (viste[a.cat]) return false;
      viste[a.cat] = 1;
      return true;
    })
    .slice(0, 4);
  document.getElementById('evidenza').innerHTML = top.map(FERMO.scheda).join('');
})();
