/* z-fighting, das Spiel (Prototyp).
   Zwei gleiche Koerper am selben Ort. Rot gehoert dir, Blau der Maschine. Jeder dreht seinen Koerper frei im Raum.
   Pro Bildpunkt gewinnt, wer vorne liegt; liegen beide fast gleich, entscheidet der gerundete Tiefenpuffer wie auf
   der Website (Gleichstand: Blau, das Original). Es zaehlt der Anteil am Bild in dem Augenblick, in dem das Spiel
   anhaelt, und niemand weiss, wann das ist. */
(function () {
  "use strict";
  var PI = Math.PI, GROESSE = 22, DIST = 75.6, RADIUS = 23.5, NEAR = 6, FAR = 400, TOL = 4e-3, GRAD = 1, BITS = 16;
  var FARBE = [[45, 60, 150], [215, 70, 60]], PAPIER = [251, 250, 247], BLAU = "#2d3c96", ROT = "#d7463c";
  var N = 110, N_DENK = 34;                                            // Raster des Bilds und des Vorausdenkens der Maschine
  var DAUER = [9, 32];                                                 // das Spiel haelt irgendwann in dieser Spanne an (Sekunden)
  var TEMPO = 1.25, DENKEN = 0.22, PROBEN = 6;                         // Maschine: hoechste Drehgeschwindigkeit (rad/s), Abstand der Entscheidungen, Versuche

  // Die Flaechen sind die Auswahl der Website (flaechen.js, auswahl.js), die Netze baut netze.js. Fuers Spiel werden sie
  // in zwei Feinheiten gerechnet: hoechstens rund DREIECKE Dreiecke fuers Bild, rund GROB fuer das Vorausdenken der
  // Maschine, die jede Entscheidung mehrfach durchrechnet und nur die Flaechenanteile braucht.
  var DREIECKE = 24000, GROB = 3000, FORMEN = [], netze = {};          // Bild; Vorausdenken der Maschine
  (function () {
    var nach = {}; (window.KANDIDATEN || []).forEach(function (k) { nach[k.id] = k; });
    ((window.AUSWAHL || {}).ids || []).forEach(function (id) { if (nach[id]) FORMEN.push(nach[id]); });
  })();
  function netzFuer(k) {                                               // -> { A0, B0 }, einmal gerechnet
    if (netze[k]) return netze[k];
    var f = FORMEN[k], fein = 1, A = window.ZFNETZ(f, false, 1), n = A.length / 9, g = Math.sqrt(GROB / n);
    if (n > DREIECKE) { fein = Math.sqrt(DREIECKE / n); A = window.ZFNETZ(f, false, fein); }
    var nz = { A0: A, B0: window.ZFNETZ(f, true, fein) };
    if (g < fein) { nz.Ag = window.ZFNETZ(f, false, g); nz.Bg = window.ZFNETZ(f, true, g); } else { nz.Ag = nz.A0; nz.Bg = nz.B0; }
    return (netze[k] = nz);
  }

  // ---------------------------------------------------------------- Drehungen (3 x 3, zeilenweise)
  function achse(x, y, z, a) {
    var l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l; var c = Math.cos(a), s = Math.sin(a), C = 1 - c;
    return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C];
  }
  function mm(A, B) { var R = []; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) R.push(A[3 * i] * B[j] + A[3 * i + 1] * B[3 + j] + A[3 * i + 2] * B[6 + j]); return R; }
  function wende(R, V, out) {
    for (var i = 0; i < V.length; i += 3) {
      var x = V[i], y = V[i + 1], z = V[i + 2];
      out[i] = R[0] * x + R[1] * y + R[2] * z; out[i + 1] = R[3] * x + R[4] * y + R[5] * z; out[i + 2] = R[6] * x + R[7] * y + R[8] * z;
    }
    return out;
  }
  function zufall() { return achse(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() * 2 * PI); }

  // ---------------------------------------------------------------- Kamera (fest) und Rasterer wie zf.js
  var AZ = -60 * PI / 180, EL = 25 * PI / 180, ca = Math.cos(AZ), sa = Math.sin(AZ), ce = Math.cos(EL), se = Math.sin(EL);
  var EX = DIST * ce * ca, EY = DIST * ce * sa, EZ = DIST * se, FX = -ce * ca, FY = -ce * sa, FZ = -se;
  var RX = FY, RY = -FX, rl = Math.hypot(RX, RY); RX /= rl; RY /= rl;
  var UX = RY * FZ, UY = -RX * FZ, UZ = RX * FY - RY * FX;
  var LICHT = (function () { var x = -FX + 0.55 * UX - 0.45 * RX, y = -FY + 0.55 * UY - 0.45 * RY, z = -FZ + 0.55 * UZ, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();
  function projiziere(V, n, out) {
    var F = (n / 2 - 1.5) * Math.sqrt(DIST * DIST - RADIUS * RADIUS) / RADIUS;
    for (var i = 0; i < V.length; i += 3) {
      var qx = V[i] - EX, qy = V[i + 1] - EY, qz = V[i + 2] - EZ, z = qx * FX + qy * FY + qz * FZ;
      out[i] = n / 2 + F * (qx * RX + qy * RY) / z; out[i + 1] = n / 2 - F * (qx * UX + qy * UY + qz * UZ) / z; out[i + 2] = 1 / z;
    }
    return out;
  }
  var puffer = {};
  function felder(n) { return puffer[n] || (puffer[n] = { wmax: new Float64Array(n * n), best: new Float64Array(n * n), team: new Uint8Array(n * n), drei: new Int32Array(n * n) }); }
  function raster(S, n, wer, pass, f) {
    var C = (Math.pow(2, BITS) - 1) / (1 / NEAR - 1 / FAR), q = Math.pow(2, GRAD), grenze = 1 / (1 + TOL), wmax = f.wmax, best = f.best, team = f.team, drei = f.drei;
    for (var t = 0; t < S.length; t += 9) {
      var ax = S[t], ay = S[t + 1], aw = S[t + 2], bx = S[t + 3], by = S[t + 4], bw = S[t + 5], cx = S[t + 6], cy = S[t + 7], cw = S[t + 8];
      var fl = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
      if (Math.abs(fl) < 1e-9) continue;
      var gx = ((bw - aw) * (cy - ay) - (cw - aw) * (by - ay)) / fl, gy = ((cw - aw) * (bx - ax) - (bw - aw) * (cx - ax)) / fl;
      var x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(n - 1, Math.floor(Math.max(ax, bx, cx)));
      var y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(n - 1, Math.floor(Math.max(ay, by, cy)));
      if (x1 < x0 || y1 < y0) continue;
      var GX = 0, GY = 0, WA = 0, apx = 0, apy = 0;
      if (pass === 2) {
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

  // ---------------------------------------------------------------- die beiden Koerper
  var form, formNr = 0, A0, B0, WA, WB, PA, PB, NA, NB, Ag, Bg, WAg, WBg, PAg, PBg;                // A blau (Maschine), B rot (du)
  var Rm = zufall(), Rd = zufall();
  function lade(k) {
    formNr = k % FORMEN.length; form = FORMEN[formNr]; var nz = netzFuer(formNr); A0 = nz.A0; B0 = nz.B0; Ag = nz.Ag; Bg = nz.Bg;
    WAg = new Float64Array(Ag.length); WBg = new Float64Array(Bg.length); PAg = new Float64Array(Ag.length); PBg = new Float64Array(Bg.length);
    WA = new Float64Array(A0.length); WB = new Float64Array(B0.length); PA = new Float64Array(A0.length); PB = new Float64Array(B0.length);
    NA = new Float32Array(A0.length / 3); NB = new Float32Array(B0.length / 3);
  }
  function normalen(V, N) {
    for (var t = 0; t < V.length; t += 9) {
      var ux = V[t + 3] - V[t], uy = V[t + 4] - V[t + 1], uz = V[t + 5] - V[t + 2], vx = V[t + 6] - V[t], vy = V[t + 7] - V[t + 1], vz = V[t + 8] - V[t + 2];
      var x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.hypot(x, y, z) || 1;
      N[t / 3] = x / l; N[t / 3 + 1] = y / l; N[t / 3 + 2] = z / l;
    }
  }
  function rechne(RA, RB, n, grob) {                                   // -> [Bildpunkte blau, Bildpunkte rot]
    var f = felder(n); f.wmax.fill(0); f.best.fill(Infinity); f.team.fill(0);
    var a = grob ? PAg : PA, b = grob ? PBg : PB;
    if (grob) { wende(RA, Ag, WAg); wende(RB, Bg, WBg); projiziere(WAg, n, a); projiziere(WBg, n, b); }
    else { wende(RA, A0, WA); wende(RB, B0, WB); projiziere(WA, n, a); projiziere(WB, n, b); }
    raster(a, n, 1, 1, f); raster(b, n, 2, 1, f); raster(a, n, 1, 2, f); raster(b, n, 2, 2, f);
    var b = 0, r = 0, t = f.team;
    for (var k = 0; k < t.length; k++) { if (t[k] === 1) b++; else if (t[k] === 2) r++; }
    return [b, r];
  }

  // ---------------------------------------------------------------- Bild
  var cv = document.getElementById("feld"), ctx = cv.getContext("2d");
  var klein = document.createElement("canvas"), kctx = klein.getContext("2d"); klein.width = N; klein.height = N;
  var pix = kctx.createImageData(N, N);
  function male(striche) {
    var f = felder(N), team = f.team, B = cv.width, i, j, k, o, a, an;
    ctx.clearRect(0, 0, B, B);
    if (!striche) {
      normalen(WA, NA); normalen(WB, NB);
      var d = pix.data;
      for (k = 0, o = 0; k < N * N; k++, o += 4) {
        var w = team[k];
        if (!w) { d[o + 3] = 0; continue; }
        var Nn = w === 1 ? NA : NB, q = f.drei[k] * 3, fa = FARBE[w - 1];
        var h = Math.round(Math.abs(Nn[q] * LICHT[0] + Nn[q + 1] * LICHT[1] + Nn[q + 2] * LICHT[2]) * 5) / 5, m = 0.28 + 0.72 * h;
        d[o] = fa[0] * m + PAPIER[0] * (1 - m) * 0.55; d[o + 1] = fa[1] * m + PAPIER[1] * (1 - m) * 0.55; d[o + 2] = fa[2] * m + PAPIER[2] * (1 - m) * 0.55; d[o + 3] = 255;
      }
      kctx.putImageData(pix, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(klein, 0, 0, B, B);
      return;
    }
    var c = B / N; ctx.lineWidth = Math.max(1, c * 0.3); ctx.lineCap = "butt";         // das Standbild am Ende: als Blatt
    ctx.strokeStyle = BLAU; ctx.beginPath();
    for (j = 0; j < N; j++) for (a = -1, i = 0; i <= N; i++) {
      an = i < N && team[j * N + i] === 1; if (an && a < 0) a = i;
      if (!an && a >= 0) { ctx.moveTo(a * c + c * 0.14, (j + 0.5) * c); ctx.lineTo(i * c - c * 0.14, (j + 0.5) * c); a = -1; }
    }
    ctx.stroke(); ctx.strokeStyle = ROT; ctx.beginPath();
    for (i = 0; i < N; i++) for (a = -1, j = 0; j <= N; j++) {
      an = j < N && team[j * N + i] === 2; if (an && a < 0) a = j;
      if (!an && a >= 0) { ctx.moveTo((i + 0.5) * c, a * c + c * 0.14); ctx.lineTo((i + 0.5) * c, j * c - c * 0.14); a = -1; }
    }
    ctx.stroke();
  }
  function groesse() { var b = Math.round(cv.clientWidth * Math.min(window.devicePixelRatio || 1, 2)); if (b > 0 && cv.width !== b) { cv.width = b; cv.height = b; neuMalen = true; } }
  var neuMalen = true;

  // ---------------------------------------------------------------- Maschine: probiert kleine Drehungen voraus und nimmt die beste
  var wm = [0.6, 0.3, 0.2], denkZeit = 0;
  function denke() {
    var beste = null, wert = -1;
    for (var k = 0; k < PROBEN; k++) {
      var w = k === 0 ? wm : [wm[0] + (Math.random() - 0.5) * 2.2, wm[1] + (Math.random() - 0.5) * 2.2, wm[2] + (Math.random() - 0.5) * 2.2];
      var l = Math.hypot(w[0], w[1], w[2]); if (l > TEMPO) w = [w[0] * TEMPO / l, w[1] * TEMPO / l, w[2] * TEMPO / l];
      var l2 = Math.hypot(w[0], w[1], w[2]), R = l2 > 1e-6 ? mm(achse(w[0], w[1], w[2], l2 * DENKEN * 1.6), Rm) : Rm;
      var z = rechne(R, Rd, N_DENK, true), anteil = z[0] / (z[0] + z[1] + 1e-9);
      if (anteil > wert) { wert = anteil; beste = w; }
    }
    wm = beste;
  }

  // ---------------------------------------------------------------- Ablauf
  var zustand = "start", ende = 0, uhr = 0, letzte = 0, stand = [0, 0];
  var SCHL = "zf-spiel-1", serie = 0, rekord = 0;
  try { var g = JSON.parse(localStorage.getItem(SCHL) || "{}"); serie = g.serie || 0; rekord = g.rekord || 0; } catch (e) {}
  function merke() { try { localStorage.setItem(SCHL, JSON.stringify({ serie: serie, rekord: rekord })); } catch (e) {} }
  function $(id) { return document.getElementById(id); }
  function balken(b, r) {
    var s = b + r || 1, du = Math.round(r / s * 100);
    $("du").style.flexGrow = r / s; $("sie").style.flexGrow = b / s;
    $("duZahl").textContent = du; $("sieZahl").textContent = 100 - du;
  }
  function zeigeText() {
    $("serie").textContent = serie > 0 ? "streak " + serie + (rekord > serie ? " · best " + rekord : "") : (rekord ? "best " + rekord : "");
    $("form").textContent = form.name;
    $("wechsel").hidden = zustand !== "aus"; $("wahl").hidden = zustand !== "wahl";
    if (zustand === "start" || zustand === "wahl") { $("zeile").textContent = "Turn your body. Hold more of the picture than the machine. Nobody knows when it stops."; $("knopf").textContent = "start"; $("knopf").hidden = zustand === "wahl"; }
    else if (zustand === "lauf") { $("zeile").textContent = "Drag to turn."; $("knopf").hidden = true; }
    else {
      var s = stand[0] + stand[1] || 1, du = Math.round(stand[1] / s * 100);
      $("zeile").textContent = (du > 50 ? "You win, " : du === 50 ? "Dead heat, " : "The machine wins, ") + du + " to " + (100 - du) + " after " + Math.round(uhr) + " seconds.";
      $("knopf").textContent = "again"; $("knopf").hidden = false;
    }
    document.body.setAttribute("data-zustand", zustand);
  }
  function starte() {
    Rm = zufall(); Rd = zufall(); wm = [0.6, 0.3, 0.2]; uhr = 0; denkZeit = 0;
    ende = DAUER[0] + Math.random() * (DAUER[1] - DAUER[0]);
    zustand = "lauf"; zeigeText();
  }
  function halt() {
    zustand = "aus"; stand = rechne(Rm, Rd, N); male(true); balken(stand[0], stand[1]);
    if (stand[1] > stand[0]) { serie++; if (serie > rekord) rekord = serie; } else serie = 0;
    merke(); zeigeText();
  }
  $("knopf").addEventListener("click", function () { if (zustand === "start") oeffneWahl(); else starte(); });
  $("wechsel").addEventListener("click", oeffneWahl);

  // ---------------------------------------------------------------- choose your fighter: alle Flaechen als kleine Bilder
  var gewaehlt = 0, kacheln = [], gemalt = 0, malt = false, D = 44;
  function daumen(k, c) {                                              // die Flaeche allein, rot, in der festen Ansicht des Spiels
    var V = netzFuer(k).B0, P = projiziere(V, D, new Float64Array(V.length)), Nn = new Float32Array(V.length / 3), f = felder(D);
    f.wmax.fill(0); f.best.fill(Infinity); f.team.fill(0); raster(P, D, 2, 1, f); raster(P, D, 2, 2, f); normalen(V, Nn);
    var x = c.getContext("2d"), bild = x.createImageData(D, D), d = bild.data, fa = FARBE[1];
    for (var i = 0, o = 0; i < D * D; i++, o += 4) {
      if (!f.team[i]) { d[o + 3] = 0; continue; }
      var q = f.drei[i] * 3, h = Math.round(Math.abs(Nn[q] * LICHT[0] + Nn[q + 1] * LICHT[1] + Nn[q + 2] * LICHT[2]) * 5) / 5, m = 0.28 + 0.72 * h;
      d[o] = fa[0] * m + PAPIER[0] * (1 - m) * 0.55; d[o + 1] = fa[1] * m + PAPIER[1] * (1 - m) * 0.55; d[o + 2] = fa[2] * m + PAPIER[2] * (1 - m) * 0.55; d[o + 3] = 255;
    }
    x.putImageData(bild, 0, 0);
  }
  function maleDaumen() {                                              // nach und nach, damit die Seite nicht stockt
    if (gemalt >= FORMEN.length) { malt = false; return; }
    malt = true; daumen(gemalt, kacheln[gemalt].firstChild); gemalt++; setTimeout(maleDaumen, 0);
  }
  function waehle(k, fokus) {
    gewaehlt = (k + FORMEN.length) % FORMEN.length;
    kacheln.forEach(function (b, i) { b.setAttribute("aria-pressed", i === gewaehlt ? "true" : "false"); });
    $("kaempfer").textContent = FORMEN[gewaehlt].name;
    if (fokus) kacheln[gewaehlt].focus();
  }
  function oeffneWahl() {
    if (!kacheln.length) FORMEN.forEach(function (f, k) {
      var b = document.createElement("button"), c = document.createElement("canvas");
      b.type = "button"; b.className = "kachel"; b.setAttribute("aria-label", f.name); c.width = D; c.height = D; b.appendChild(c);
      b.addEventListener("click", function () { if (gewaehlt === k && b.getAttribute("aria-pressed") === "true" && b.dataset.bereit) kaempfe(); else { waehle(k); b.dataset.bereit = "1"; } });
      $("gitter").appendChild(b); kacheln.push(b);
    });
    kacheln.forEach(function (b) { delete b.dataset.bereit; });
    zustand = "wahl"; zeigeText(); waehle(formNr, true); if (!malt) maleDaumen();
  }
  function kaempfe() { lade(gewaehlt); starte(); }
  $("kampf").addEventListener("click", kaempfe);
  $("gitter").addEventListener("keydown", function (e) {
    var d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -5, ArrowDown: 5 }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); waehle(gewaehlt + d, true); }
  });

  // Steuerung: Ziehen dreht den roten Koerper um die Achsen des Bilds
  var zieh = null;
  cv.addEventListener("pointerdown", function (e) { zieh = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  cv.addEventListener("pointermove", function (e) {
    if (!zieh || zustand !== "lauf") return;
    var k = 3.4 / cv.clientWidth, dx = (e.clientX - zieh.x) * k, dy = (e.clientY - zieh.y) * k; zieh.x = e.clientX; zieh.y = e.clientY;
    if (dx) Rd = mm(achse(UX, UY, UZ, dx), Rd);
    if (dy) Rd = mm(achse(RX, RY, 0, dy), Rd);
  });
  function los() { zieh = null; }
  cv.addEventListener("pointerup", los); cv.addEventListener("pointercancel", los);
  var tasten = {};
  window.addEventListener("keydown", function (e) { if (e.key.indexOf("Arrow") === 0) { tasten[e.key] = true; e.preventDefault(); } else if ((e.key === " " || e.key === "Enter") && zustand !== "lauf" && (!document.activeElement || document.activeElement.tagName !== "BUTTON")) { if (zustand === "start") oeffneWahl(); else if (zustand === "wahl") kaempfe(); else starte(); } });
  window.addEventListener("keyup", function (e) { delete tasten[e.key]; });

  function bild(jetzt) {
    requestAnimationFrame(bild);
    var dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0); letzte = jetzt;
    groesse();
    if (zustand === "wahl") return;
    if (zustand === "aus") { if (neuMalen) { rechne(Rm, Rd, N); male(true); neuMalen = false; } return; }
    if (document.hidden) return;
    if (zustand === "lauf") {
      var t = 1.9 * dt;
      if (tasten.ArrowLeft) Rd = mm(achse(UX, UY, UZ, -t), Rd); if (tasten.ArrowRight) Rd = mm(achse(UX, UY, UZ, t), Rd);
      if (tasten.ArrowUp) Rd = mm(achse(RX, RY, 0, -t), Rd); if (tasten.ArrowDown) Rd = mm(achse(RX, RY, 0, t), Rd);
      denkZeit -= dt; if (denkZeit <= 0) { denke(); denkZeit = DENKEN; }
      var l = Math.hypot(wm[0], wm[1], wm[2]); if (l > 1e-6) Rm = mm(achse(wm[0], wm[1], wm[2], l * dt), Rm);
      uhr += dt;
      if (uhr >= ende) { halt(); return; }
    } else {                                                           // Startbild: beide drehen ruhig
      Rm = mm(achse(0.3, 1, 0.6, 0.25 * dt), Rm); Rd = mm(achse(1, 0.2, -0.5, 0.21 * dt), Rd);
    }
    stand = rechne(Rm, Rd, N); male(false); balken(stand[0], stand[1]); neuMalen = false;
  }
  lade(0); zeigeText(); requestAnimationFrame(bild);
  window.ZFS = { zeit: function () { var t = performance.now(), i; for (i = 0; i < 20; i++) rechne(Rm, Rd, N); var a = (performance.now() - t) / 20; t = performance.now(); for (i = 0; i < 20; i++) rechne(Rm, Rd, N_DENK, true); return [a, (performance.now() - t) / 20]; }, halt: function () { if (zustand === "lauf") halt(); }, zustand: function () { return zustand; }, stand: function () { return stand; } };
})();
