/* =============================================================================
   FERMO — manifesto: i numeri di copertina, le modalita e la vetrina
   sono calcolati dal catalogo vero, non scritti a mano nella pagina.
   ========================================================================== */
(function () {
  'use strict';
  FERMO.avvia('index.html');
  var D = FERMO.D, tutti = FERMO.catalogo();

  document.getElementById('data-oggi').textContent =
    new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* --- numeri di copertina, calcolati dal catalogo vero --- */
  var noleggiabili = tutti.filter(function (a) { return a.oreSettimana > 0; });
  var oreLibere = noleggiabili.reduce(function (t, a) { return t + a.oreLibere; }, 0);
  var satMedia = noleggiabili.reduce(function (t, a) { return t + FERMO.saturazione(a); }, 0) / noleggiabili.length;
  var province = {};
  tutti.forEach(function (a) { province[a.prov] = 1; });

  document.getElementById('kpi-asset').textContent = tutti.length;
  document.getElementById('kpi-ore').textContent = FERMO.fmt.num(oreLibere);
  document.getElementById('kpi-cat').textContent = D.CATEGORIE.length;
  document.getElementById('kpi-citta').textContent = Object.keys(province).length;
  document.getElementById('kpi-sat').textContent = FERMO.fmt.pct(satMedia);

  /* --- modalità --- */
  document.getElementById('modalita-lista').innerHTML = D.MODALITA.map(function (m, i) {
    var n = tutti.filter(function (a) { return a.mod.indexOf(m.id) !== -1; }).length;
    return '<div class="blocco">' +
      '<div class="blocco__testa"><span style="color:var(--accento)">' + m.sigla + '</span> ' + FERMO.esc(m.nome) + '</div>' +
      '<div class="blocco__corpo">' +
        '<p>' + FERMO.esc(m.nota) + '</p>' +
        '<div class="riga riga--fra" style="border-top:1px solid var(--filo);padding-top:10px;margin-top:12px">' +
          '<span class="etichetta">A listino</span>' +
          '<a href="catalogo.html?mod=' + m.id + '" class="numerico"><strong>' + n + '</strong> schede →</a>' +
        '</div>' +
      '</div></div>';
  }).join('');

  /* --- categorie --- */
  document.getElementById('categorie-lista').innerHTML = D.CATEGORIE.map(function (c) {
    var n = tutti.filter(function (a) { return a.cat === c.id; }).length;
    var ore = tutti.filter(function (a) { return a.cat === c.id; })
                   .reduce(function (t, a) { return t + a.oreLibere; }, 0);
    return '<a class="scheda" href="catalogo.html?cat=' + c.id + '">' +
      '<span class="scheda__figura">' + FERMO.glifo(c.glifo) + '</span>' +
      '<span class="scheda__corpo" style="gap:4px">' +
        '<span class="scheda__titolo">' + FERMO.esc(c.nome) + '</span>' +
        '<span class="scheda__dove numerico">' + n + ' schede · ' + ore + ' h libere/sett.</span>' +
      '</span></a>';
  }).join('');

  /* --- in evidenza: la scheda con più ore ferme, una per categoria, così
         la vetrina non si riempie di tre magazzini --- */
  var viste = {};
  var top = tutti.slice()
    .sort(function (a, b) { return b.oreLibere - a.oreLibere; })
    .filter(function (a) {
      if (viste[a.cat]) return false;
      viste[a.cat] = 1;
      return true;
    })
    .slice(0, 3);
  document.getElementById('evidenza').innerHTML = top.map(FERMO.scheda).join('');
})();
