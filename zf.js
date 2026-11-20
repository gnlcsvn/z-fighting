/* z-fighting im Browser.
   Dieselbe Rechnung wie in plot3d_farbe/zfighting_formen.py, nur als Rasterer statt mit Strahlen:
   - Das Bild ist ein grobes Raster aus n x n Bildpunkten.
   - Pro Dreieck: 1/Tiefe ist ueber den Schirm linear. Genau gerechnet wird sie nur am Anker (erste Ecke,
     auf ganze Bildpunkte gerastet), von dort mit gerundeter Steigung fortgeschrieben und abgeschnitten.
   - Pro Bildpunkt treten alle Flaechen an, die fast so nah sind wie die vorderste. Es gewinnt der kleinste
     gerundete Wert, bei Gleichstand das Original.
   - Zwei Ansichten derselben Rechnung:
       3d       flach schattierte Flaechen in groben Bildpunkten, wie auf einem alten Bildschirm
       plotter  Laeufe als Striche: Original blau waagrecht, Kopie rot senkrecht. Keine Konturen.
   Jedes <figure class="werk" data-form="..."> auf der Seite wird ein eigenes Werk. Die Formeln der Flaechen
   stehen in FORMEN und entsprechen den Formeln, die auf der Seite abgedruckt sind. */
(function () {
  "use strict";
  var BLAU = "#2d3c96", ROT = "#d7463c", FARBE = [[45, 60, 150], [215, 70, 60]], PAPIER = [251, 250, 247];
  var NEAR = 6, FAR = 400, GRAD = 1, TOL = 4e-3, DIST = 75.6, RADIUS = 23.5, GROESSE = 22;
  var alle = { bits: 16, kipp: 0.22, n: 140, hub: 0, fein: 1, kopie: true };   // gemeinsame Regler
  var HUB = 12;                                                        // groesster Hub der Kopie (Radius des Koerpers: GROESSE)
  var PI = Math.PI;

  // ---------------------------------------------------------------- Flaechen (u, v in 0..1 -> Punkt)
  var FORMEN = {
    moebius: { nu: 90, nv: 10, az: -60, el: 35, f: function (a, b) {     // Gray 1997, 14.3
      var t = 2 * PI * a, s = b - 0.5, r = 1 + s * Math.cos(t / 2);
      return [r * Math.cos(t), r * Math.sin(t), s * Math.sin(t / 2)];
    } },
    klein: { nu: 96, nv: 22, az: -60, el: 37, f: function (a, b) {       // Gray 1997, 14.5 (Achter-Form), a = 3
      var u = 2 * PI * a, v = 2 * PI * b, r = 3 + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
      return [r * Math.cos(u), r * Math.sin(u), Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v)];
    } },
    boy: { nu: 30, nv: 96, az: -60, el: 55, f: function (a, b) {         // Bryant-Kusner, w = a e^(2 pi i b)
      var w = [a * Math.cos(2 * PI * b), a * Math.sin(2 * PI * b)];
      var w2 = mal(w, w), w3 = mal(w2, w), w4 = mal(w2, w2), w6 = mal(w3, w3);
      var d = [w6[0] + Math.sqrt(5) * w3[0] - 1, w6[1] + Math.sqrt(5) * w3[1]];
      var g1 = -1.5 * durch(mal(w, [1 - w4[0], -w4[1]]), d)[1];
      var g2 = -1.5 * durch(mal(w, [1 + w4[0], w4[1]]), d)[0];
      var g3 = durch([1 + w6[0], w6[1]], d)[1] - 0.5, g = g1 * g1 + g2 * g2 + g3 * g3;
      return [g1 / g, g2 / g, g3 / g];
    } }
  };
  function mal(p, q) { return [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]]; }
  function durch(p, q) { var n = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / n, (p[1] * q[0] - p[0] * q[1]) / n]; }

  function netz(form, wechsel, fein) {                                 // Dreiecke als flache Liste, auf GROESSE normiert
    var nu = form.nu * fein, nv = form.nv * fein, P = [], T = [], i, j, k;
    for (i = 0; i <= nu; i++) for (j = 0; j <= nv; j++) P.push(form.f(i / nu, j / nv));
    var lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (i = 0; i < P.length; i++) for (k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[i][k]); hi[k] = Math.max(hi[k], P[i][k]); }
    var c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], rm = 0;
    for (i = 0; i < P.length; i++) rm = Math.max(rm, Math.hypot(P[i][0] - c[0], P[i][1] - c[1], P[i][2] - c[2]));
    function p(i, j) { return P[i * (nv + 1) + j]; }
    for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
      var a = p(i, j), b = p(i + 1, j), cc = p(i + 1, j + 1), d = p(i, j + 1);
      if (wechsel && (i + j) % 2) T.push(b, cc, d, b, d, a); else T.push(a, b, cc, a, cc, d);
    }
    var out = new Float64Array(T.length * 3), s = GROESSE / rm;
    for (i = 0; i < T.length; i++) for (k = 0; k < 3; k++) out[3 * i + k] = (T[i][k] - c[k]) * s;
    return out;
  }
  function drehe(V, achse, grad) {                                     // Rodrigues
    var a = grad * PI / 180, l = Math.hypot(achse[0], achse[1], achse[2]);
    var x = achse[0] / l, y = achse[1] / l, z = achse[2] / l, c = Math.cos(a), s = Math.sin(a), C = 1 - c;
    var R = [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C];
    var out = new Float64Array(V.length);
    for (var i = 0; i < V.length; i += 3) {
      out[i] = R[0] * V[i] + R[1] * V[i + 1] + R[2] * V[i + 2];
      out[i + 1] = R[3] * V[i] + R[4] * V[i + 1] + R[5] * V[i + 2];
      out[i + 2] = R[6] * V[i] + R[7] * V[i + 1] + R[8] * V[i + 2];
    }
    return out;
  }
  function normalen(V) {                                               // eine Normale je Dreieck
    var N = new Float32Array(V.length / 3);
    for (var t = 0; t < V.length; t += 9) {
      var ux = V[t + 3] - V[t], uy = V[t + 4] - V[t + 1], uz = V[t + 5] - V[t + 2], vx = V[t + 6] - V[t], vy = V[t + 7] - V[t + 1], vz = V[t + 8] - V[t + 2];
      var x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.hypot(x, y, z) || 1;
      N[t / 3] = x / l; N[t / 3 + 1] = y / l; N[t / 3 + 2] = z / l;
    }
    return N;
  }

  // ---------------------------------------------------------------- Regler (je Werk ein Feld, alle zeigen dieselben Werte)
  var START = { bits: 16, kipp: 0.22, n: 140, hub: 0, fein: 1, kopie: true };
  var REGLER = [
    ["bits", "depth buffer", 9, 20, 1, function (v) { return v + " bit"; }],
    ["kipp", "copy rotated", 0, 0.8, 0.01, function (v) { return v.toFixed(2) + "°"; }],
    ["hub", "copy lifted", 0, 100, 1, function (v) { return (HUB * v * v / 1e4 / (2 * GROESSE) * 100).toFixed(1) + " %"; }],
    ["n", "grid", 60, 600, 10, function (v) { return v + " px"; }],
    ["fein", "mesh", 1, 4, 1, function (v) { return v + "×"; }]
  ];
  var felder = [], unten = "", lagen = [];                              // unten: "" Text zum Werk, "regler"
  function neu() { felder.forEach(function (f) { f(); }); werke.forEach(function (w) { w.bild(); }); }
  function el(tag, text, klasse) { var e = document.createElement(tag); if (text) e.textContent = text; if (klasse) e.className = klasse; return e; }
  function feld(fig, nr) {
    var leiste = fig.querySelector(".schalter"), cv = fig.querySelector("canvas"); if (!leiste || !cv) return;
    var buehne = el("div", "", "buehne"); cv.parentNode.insertBefore(buehne, cv); buehne.appendChild(cv);
    var bereich = el("div", "", "unten"), box = el("div", "", "regler"), teile = [];
    var art = fig.closest("article"), text = art && art.querySelector(".quelle");
    if (text) bereich.appendChild(text);
    box.id = "regler" + nr;
    var ansicht = el("span", "", "ansicht"), modi = leiste.querySelectorAll("[data-modus]");      // 3d | plotter als ein Umschalter
    ansicht.setAttribute("role", "group"); ansicht.setAttribute("aria-label", "view");
    for (var m = 0; m < modi.length; m++) ansicht.appendChild(modi[m]);
    leiste.appendChild(ansicht);
    var auf = el("button", "controls", "auf"); auf.type = "button"; auf.setAttribute("aria-controls", box.id);
    auf.addEventListener("click", function () { unten = unten === "regler" ? "" : "regler"; lagen.forEach(function (l) { l(); }); });
    leiste.appendChild(auf);
    REGLER.forEach(function (r) {
      var lab = el("label"), kopf = el("span", "", "kopf"), wert = el("output"), inp = el("input");
      kopf.appendChild(el("span", r[1])); kopf.appendChild(wert);
      inp.type = "range"; inp.min = r[2]; inp.max = r[3]; inp.step = r[4];
      inp.addEventListener("input", function () { alle[r[0]] = parseFloat(inp.value); neu(); });
      lab.appendChild(kopf); lab.appendChild(inp); box.appendChild(lab);
      teile.push(function () { var t = r[5](alle[r[0]]); inp.value = alle[r[0]]; wert.textContent = t; inp.setAttribute("aria-valuetext", t); });
    });
    var zeile = el("div", "", "zeile"), kop = el("button"), zur = el("button", "reset");
    kop.type = "button"; zur.type = "button";
    kop.addEventListener("click", function () { alle.kopie = !alle.kopie; neu(); });
    zur.addEventListener("click", function () { for (var k in START) alle[k] = START[k]; neu(); });
    teile.push(function () { kop.textContent = alle.kopie ? "copy on" : "copy off"; kop.setAttribute("aria-pressed", alle.kopie ? "true" : "false"); });
    zeile.appendChild(kop); zeile.appendChild(zur); box.appendChild(zeile);
    bereich.appendChild(box); fig.appendChild(bereich);
    var lage = function () {
      if (text) text.hidden = unten !== "";
      box.hidden = unten !== "regler";
      auf.setAttribute("aria-expanded", unten === "regler" ? "true" : "false");
    };
    lagen.push(lage); lage();
    var gleich = function () { teile.forEach(function (t) { t(); }); };
    felder.push(gleich); gleich();
  }

  // ---------------------------------------------------------------- ein Werk
  var werke = [];
  function Werk(fig) {
    var form = FORMEN[fig.getAttribute("data-form")], cv = fig.querySelector("canvas");
    if (!form || !cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var AZ0 = form.az * PI / 180, EL0 = form.el * PI / 180;
    var st = { az: AZ0, el: EL0, auto: true, modus: "3d", sichtbar: true };
    var ORIGINAL = null, KOPIE0 = null, KOPIE = null, kippAlt = null, hubAlt = null, feinAlt = null, NORM = [null, null];
    var wmax, best, team, drei, licht = [0, 0, 1];

    function projiziere(V, n) {                                        // -> x, y in Bildpunkten, w = 1/Tiefe
      var ca = Math.cos(st.az), sa = Math.sin(st.az), ce = Math.cos(st.el), se = Math.sin(st.el);
      var ex = DIST * ce * ca, ey = DIST * ce * sa, ez = DIST * se;
      var fx = -ce * ca, fy = -ce * sa, fz = -se;
      var rx = fy, ry = -fx, rl = Math.hypot(rx, ry); rx /= rl; ry /= rl;               // rechts = f x (0,0,1)
      var ux = ry * fz, uy = -rx * fz, uz = rx * fy - ry * fx;                          // oben = r x f
      var F = (n / 2 - 1.5) * Math.sqrt(DIST * DIST - RADIUS * RADIUS) / RADIUS;
      var lx = -fx + 0.55 * ux - 0.45 * rx, ly = -fy + 0.55 * uy - 0.45 * ry, lz = -fz + 0.55 * uz, ll = Math.hypot(lx, ly, lz);
      licht = [lx / ll, ly / ll, lz / ll];                             // Licht von links oben hinter der Kamera
      var out = new Float64Array(V.length);
      for (var i = 0; i < V.length; i += 3) {
        var qx = V[i] - ex, qy = V[i + 1] - ey, qz = V[i + 2] - ez, z = qx * fx + qy * fy + qz * fz;
        out[i] = n / 2 + F * (qx * rx + qy * ry) / z;
        out[i + 1] = n / 2 - F * (qx * ux + qy * uy + qz * uz) / z;
        out[i + 2] = 1 / z;
      }
      return out;
    }
    function raster(S, n, wer, pass) {
      var C = (Math.pow(2, alle.bits) - 1) / (1 / NEAR - 1 / FAR), q = Math.pow(2, GRAD), grenze = 1 / (1 + TOL);
      for (var t = 0; t < S.length; t += 9) {
        var ax = S[t], ay = S[t + 1], aw = S[t + 2], bx = S[t + 3], by = S[t + 4], bw = S[t + 5], cx = S[t + 6], cy = S[t + 7], cw = S[t + 8];
        var fl = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
        if (Math.abs(fl) < 1e-9) continue;
        var gx = ((bw - aw) * (cy - ay) - (cw - aw) * (by - ay)) / fl, gy = ((cw - aw) * (bx - ax) - (bw - aw) * (cx - ax)) / fl;
        var x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(n - 1, Math.floor(Math.max(ax, bx, cx)));
        var y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(n - 1, Math.floor(Math.max(ay, by, cy)));
        if (x1 < x0 || y1 < y0) continue;
        var GX = 0, GY = 0, WA = 0, apx = 0, apy = 0;
        if (pass === 2) {                                              // was die Karte in den Puffer schreibt
          GX = -gx * C; GY = -gy * C; apx = Math.round(ax); apy = Math.round(ay);
          WA = Math.round(((1 / NEAR - aw) * C + GX * (apx - ax) + GY * (apy - ay)) * q) / q;
          GX = Math.round(GX * q) / q; GY = Math.round(GY * q) / q;
        }
        var inv = 1 / fl;
        for (var j = y0; j <= y1; j++) {
          var py = j + 0.5;
          for (var i = x0; i <= x1; i++) {
            var px = i + 0.5;
            var e1 = ((bx - ax) * (py - ay) - (px - ax) * (by - ay)) * inv, e2 = ((px - ax) * (cy - ay) - (cx - ax) * (py - ay)) * inv;
            if (e1 < 0 || e2 < 0 || e1 + e2 > 1) continue;
            var w = aw + gx * (px - ax) + gy * (py - ay), k = j * n + i;
            if (pass === 1) { if (w > wmax[k]) wmax[k] = w; }
            else if (w > wmax[k] * grenze) {
              var val = Math.floor(WA + GX * (px - apx) + GY * (py - apy));
              if (val < best[k]) { best[k] = val; team[k] = wer; drei[k] = t / 9; }
            }
          }
        }
      }
    }
    function rechne() {
      var n = alle.n;
      if (!wmax || wmax.length !== n * n) { wmax = new Float64Array(n * n); best = new Float64Array(n * n); team = new Uint8Array(n * n); drei = new Int32Array(n * n); }
      if (feinAlt !== alle.fein) {                                     // feineres Netz: mehr und kleinere Dreiecke
        ORIGINAL = netz(form, false, alle.fein); KOPIE0 = netz(form, true, alle.fein);
        NORM[0] = normalen(ORIGINAL); feinAlt = alle.fein; kippAlt = null;
      }
      if (kippAlt !== alle.kipp || hubAlt !== alle.hub) {              // Kopie: verdreht und entlang der Drehachse (z) angehoben
        KOPIE = drehe(KOPIE0, [0.3, 1, 0.6], alle.kipp);
        var h = HUB * alle.hub * alle.hub / 1e4;
        if (h) for (var q = 2; q < KOPIE.length; q += 3) KOPIE[q] += h;
        NORM[1] = normalen(KOPIE); kippAlt = alle.kipp; hubAlt = alle.hub;
      }
      wmax.fill(0); best.fill(Infinity); team.fill(0);
      var p0 = projiziere(ORIGINAL, n), p1 = alle.kopie ? projiziere(KOPIE, n) : null;
      raster(p0, n, 1, 1); if (p1) raster(p1, n, 2, 1);
      raster(p0, n, 1, 2); if (p1) raster(p1, n, 2, 2);                // Original zuerst: es gewinnt den Gleichstand
    }

    var klein = document.createElement("canvas"), kctx = klein.getContext("2d"), pix = null;
    function zeichne3d() {                                             // grobe Bildpunkte, flach schattiert
      var n = alle.n, k, o;
      if (klein.width !== n) { klein.width = n; klein.height = n; pix = kctx.createImageData(n, n); }
      var d = pix.data;
      for (k = 0, o = 0; k < n * n; k++, o += 4) {
        var w = team[k];
        if (!w) { d[o + 3] = 0; continue; }
        var N = NORM[w - 1], q = drei[k] * 3, f = FARBE[w - 1];
        var h = Math.abs(N[q] * licht[0] + N[q + 1] * licht[1] + N[q + 2] * licht[2]);
        h = Math.round(h * 5) / 5;                                     // sechs Helligkeitsstufen
        var m = 0.28 + 0.72 * h;
        d[o] = f[0] * m + PAPIER[0] * (1 - m) * 0.55; d[o + 1] = f[1] * m + PAPIER[1] * (1 - m) * 0.55; d[o + 2] = f[2] * m + PAPIER[2] * (1 - m) * 0.55;
        d[o + 3] = 255;
      }
      kctx.putImageData(pix, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(klein, 0, 0, cv.width, cv.height);
    }
    function zeichne() {
      if (st.modus === "3d") return zeichne3d();
      var n = alle.n, B = cv.width, c = B / n, i, j, a, an;
      ctx.clearRect(0, 0, B, B);
      ctx.lineWidth = Math.max(1, c * 0.3); ctx.lineCap = "butt";
      ctx.strokeStyle = BLAU; ctx.beginPath();
      for (j = 0; j < n; j++) {
        a = -1;
        for (i = 0; i <= n; i++) {
          an = i < n && team[j * n + i] === 1;
          if (an && a < 0) a = i;
          if (!an && a >= 0) { ctx.moveTo(a * c + c * 0.14, (j + 0.5) * c); ctx.lineTo(i * c - c * 0.14, (j + 0.5) * c); a = -1; }
        }
      }
      ctx.stroke();
      ctx.strokeStyle = ROT; ctx.beginPath();
      for (i = 0; i < n; i++) {
        a = -1;
        for (j = 0; j <= n; j++) {
          an = j < n && team[j * n + i] === 2;
          if (an && a < 0) a = j;
          if (!an && a >= 0) { ctx.moveTo((i + 0.5) * c, a * c + c * 0.14); ctx.lineTo((i + 0.5) * c, j * c - c * 0.14); a = -1; }
        }
      }
      ctx.stroke();
    }
    var offen = false;
    function bild() { if (offen || !cv.clientWidth) return; offen = true; requestAnimationFrame(function () { offen = false; rechne(); zeichne(); }); }
    function groesse() {
      var b = Math.round(cv.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
      if (b <= 0) return;                                              // verstecktes Werk
      if (cv.width !== b) { cv.width = b; cv.height = b; }
      bild();
    }

    // Bedienung
    var zieh = null;
    cv.addEventListener("pointerdown", function (e) {
      zieh = { x: e.clientX, y: e.clientY, az: st.az, el: st.el }; st.auto = false;
      cv.setPointerCapture(e.pointerId); cv.classList.add("zieht");
    });
    cv.addEventListener("pointermove", function (e) {
      if (!zieh) return;
      var k = 3.2 / cv.clientWidth;
      st.az = zieh.az - (e.clientX - zieh.x) * k;
      st.el = Math.max(-1.45, Math.min(1.45, zieh.el + (e.clientY - zieh.y) * k));
      bild();
    });
    function los() { if (zieh) st.auto = true; zieh = null; cv.classList.remove("zieht"); }      // nach dem Loslassen dreht es weiter
    cv.addEventListener("pointerup", los); cv.addEventListener("pointercancel", los);
    cv.tabIndex = 0;
    cv.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [0.05, 0], ArrowRight: [-0.05, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
      if (!d) return;
      e.preventDefault(); st.az += d[0]; st.el = Math.max(-1.45, Math.min(1.45, st.el + d[1])); bild();
    });
    var knoepfe = fig.querySelectorAll("[data-modus]");
    function modus(m) {
      st.modus = m;
      for (var i = 0; i < knoepfe.length; i++) knoepfe[i].setAttribute("aria-pressed", knoepfe[i].getAttribute("data-modus") === m ? "true" : "false");
      bild();
    }
    for (var b = 0; b < knoepfe.length; b++) knoepfe[b].addEventListener("click", function () { modus(this.getAttribute("data-modus")); });
    feld(fig, werke.length);
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { st.sichtbar = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(cv);

    if (window.ResizeObserver) new ResizeObserver(groesse).observe(cv);          // die Buehne passt sich dem Fenster an
    werke.push({ bild: bild, groesse: groesse, schritt: function () { if (st.auto && st.sichtbar) { st.az += 0.006; bild(); } } });
    groesse();
  }

  var figs = document.querySelectorAll("figure.werk[data-form]");
  for (var i = 0; i < figs.length; i++) Werk(figs[i]);
  window.addEventListener("resize", function () { werke.forEach(function (w) { w.groesse(); }); });

  // ---------------------------------------------------------------- ein Werk zur Zeit, Wechsel mit Pfeilen, Adresse #name
  var blaetter = [];
  for (i = 0; i < figs.length; i++) {
    var art = figs[i].closest("article"), kopf = figs[i].querySelector("figcaption > span");
    if (art && kopf) blaetter.push({ art: art, name: figs[i].getAttribute("data-form"), titel: kopf.textContent, kopf: kopf });
  }
  function zeige(k, fokus) {
    k = (k + blaetter.length) % blaetter.length;
    blaetter.forEach(function (b, j) { b.art.hidden = j !== k; });
    werke.forEach(function (w) { w.groesse(); });
    if (fokus) { var kn = blaetter[k].art.querySelectorAll(".wahl button")[fokus > 0 ? 1 : 0]; if (kn) kn.focus(); }
    try { if (location.hash !== "#" + blaetter[k].name) history.replaceState(null, "", "#" + blaetter[k].name); } catch (e) {}
  }
  function ausAdresse() {
    var k = 0; blaetter.forEach(function (b, j) { if ("#" + b.name === location.hash) k = j; });
    zeige(k, 0);
  }
  if (blaetter.length > 1) {
    blaetter.forEach(function (b, k) {
      var wahl = el("span", "", "wahl"), n = blaetter.length;
      [[-1, "←"], [1, "→"]].forEach(function (r) {
        var kn = el("button", r[1]); kn.type = "button";
        kn.setAttribute("aria-label", "show " + blaetter[(k + r[0] + n) % n].titel);
        kn.addEventListener("click", function () { zeige(k + r[0], r[0]); });
        wahl.appendChild(kn);
      });
      b.kopf.parentNode.insertBefore(wahl, b.kopf); wahl.appendChild(b.kopf);
    });
    window.addEventListener("hashchange", ausAdresse);
    ausAdresse();
  }

  // Langsame Drehung in einzelnen Schritten (rund acht Bilder pro Sekunde). Pausiert beim Ziehen und ausserhalb des Sichtfelds.
  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!ruhig) setInterval(function () { if (!document.hidden) werke.forEach(function (w) { w.schritt(); }); }, 125);
})();
