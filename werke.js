/* Baut je ausgewaehlter Flaeche einen <article>. Laeuft vor zf.js.
   Braucht window.KANDIDATEN (flaechen.js, fuer die Seite ohne Notizen) und window.AUSWAHL (auswahl.js).
   Text je Werk:
     TEXTE     die geprueften englischen Saetze (bisher nur die Werke, die schon auf der Seite standen)
     NOTIZEN   nur im Artefakt (notizen.js): die deutschen Notizen aus der Recherche, nicht geprueft
   Auf der oeffentlichen Seite steht ohne geprueften Text nichts unter dem Werk. */
(function () {
  "use strict";
  var K = window.KANDIDATEN || [], A = window.AUSWAHL || { ids: [], sicht: {} }, N = window.NOTIZEN || null, nach = {}, main = document.querySelector("main");
  var TEXTE = {
    klein: ["A closed surface with no inside and no outside, shown in its figure-eight form.",
      "See A. Gray, <i>Modern Differential Geometry of Curves and Surfaces with Mathematica</i>, and D. Hilbert and S. Cohn-Vossen, <i>Geometry and the Imagination</i>."],
    boy: ["A closed one-sided surface without edges, described by Werner Boy in 1903.",
      "W. Boy, “Über die Curvatura integra und die Topologie geschlossener Flächen”, <i>Mathematische Annalen</i> 57 (1903), pp. 151–184."]
  };
  K.forEach(function (k) { nach[k.id] = k; });
  window.ZFFORMEN = {};
  function el(tag, text, klasse) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (klasse) e.className = klasse; return e; }
  function zwei(n) { return (n < 10 ? "0" : "") + n; }
  var nr = 0;
  A.ids.forEach(function (id) {
    var k = nach[id]; if (!k) return;
    var s = (A.sicht && A.sicht[id]) || [k.az == null ? -60 : k.az, k.el == null ? 30 : k.el];
    window.ZFFORMEN[id] = { az: s[0], el: s[1], kandidat: k };
    var titel = zwei(++nr) + " " + k.name;
    var art = el("article"), fig = el("figure", null, "werk"), cv = el("canvas"), cap = el("figcaption"), sch = el("span", null, "schalter");
    fig.setAttribute("data-form", id); cv.width = 600; cv.height = 600;
    cv.setAttribute("aria-label", k.name + " fighting its own copy. Drag to rotate.");
    [["3d", true], ["plotter", false]].forEach(function (m) {
      var b = el("button", m[0]); b.type = "button"; b.setAttribute("data-modus", m[0]); b.setAttribute("aria-pressed", m[1] ? "true" : "false"); sch.appendChild(b);
    });
    var name = el("span", titel); name.title = titel;
    cap.appendChild(name); cap.appendChild(sch); fig.appendChild(cv); fig.appendChild(cap); art.appendChild(fig);
    var q = el("div", null, "quelle"), t = TEXTE[id], n = N && N[id];
    if (t) { q.appendChild(el("p")).innerHTML = t[0]; q.appendChild(el("p", null, "leise")).innerHTML = t[1]; }
    if (n) {
      if (n.satz) q.appendChild(el("p", n.satz, t ? "leise" : null));
      if (n.wer) q.appendChild(el("p", n.wer, "leise"));
      q.appendChild(el("p", "Formel: " + (n.formel || "offen") + (n.quelle ? ". Quelle: " + n.quelle : ""), "leise"));
      if (n.links && n.links.length) {
        var p = el("p");
        n.links.forEach(function (u, i) {
          var a = el("a", u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]); a.href = u; a.target = "_blank"; a.rel = "noopener";
          if (i) p.appendChild(document.createTextNode("  ")); p.appendChild(a);
        });
        q.appendChild(p);
      }
    }
    art.appendChild(q); main.appendChild(art);
  });
})();
