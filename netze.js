/* Netze fuer die Flaechen aus flaechen.js (param, rohr, implizit).
   Erzeugt von baue_artefakt.py aus zfighting_kandidaten/kandidaten.js, ergaenzt um den Regler mesh (fein). */
(function () {
  "use strict";
  var PI = Math.PI, GROESSE = 22, FEIN = 1;
  function ausGitter(P, nu, nv, wechsel, T) {
    function p(i, j) { return P[i * (nv + 1) + j]; }
    for (var i = 0; i < nu; i++) for (var j = 0; j < nv; j++) {
      var a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1);
      if (wechsel && (i + j) % 2) T.push(b, c, d, b, d, a); else T.push(a, b, c, a, c, d);
    }
  }
  function param(t, wechsel, T) {
    var nu = Math.max(3, Math.round(t.nu * FEIN)), nv = Math.max(3, Math.round(t.nv * FEIN)), P = [];
    for (var i = 0; i <= nu; i++) for (var j = 0; j <= nv; j++) P.push(t.f(t.u[0] + (t.u[1] - t.u[0]) * i / nu, t.v[0] + (t.v[1] - t.v[0]) * j / nv));
    ausGitter(P, nu, nv, wechsel, T);
  }
  function rohr(t, wechsel, T) {                                       // Rahmen ohne Verdrehung, Naht bei geschlossener Kurve ausgeglichen
    var n = Math.max(8, Math.round((t.n || 160) * FEIN)), m = Math.max(3, Math.round((t.m || 8) * FEIN)), zu = t.offen ? 0 : 1, C = [], G = [], N = [], i, j;
    for (i = 0; i <= n; i++) C.push(t.kurve(i / n));
    function minus(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function kreuz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    for (i = 0; i <= n; i++) {
      var v = zu ? C[(i + 1) % n] : C[Math.min(n, i + 1)], w = zu ? C[(i - 1 + n) % n] : C[Math.max(0, i - 1)];
      G.push(norm(minus(v, w)));
    }
    var s = Math.abs(G[0][2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], d0 = dot(s, G[0]);
    N.push(norm([s[0] - d0 * G[0][0], s[1] - d0 * G[0][1], s[2] - d0 * G[0][2]]));
    for (i = 1; i <= n; i++) { var q = N[i - 1], d = dot(q, G[i]); N.push(norm([q[0] - d * G[i][0], q[1] - d * G[i][1], q[2] - d * G[i][2]])); }
    var dreh = 0;
    if (zu) { var B0 = kreuz(G[0], N[0]); dreh = Math.atan2(dot(N[n], B0), dot(N[n], N[0])); }
    var P = [];
    for (i = 0; i <= n; i++) {
      var B = kreuz(G[i], N[i]), r = typeof t.r === "function" ? t.r(i / n) : t.r;
      for (j = 0; j <= m; j++) {
        var a = 2 * PI * j / m - dreh * i / n, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        P.push([C[i][0] + ca * N[i][0] + sa * B[0], C[i][1] + ca * N[i][1] + sa * B[1], C[i][2] + ca * N[i][2] + sa * B[2]]);
      }
    }
    ausGitter(P, n, m, wechsel, T);
  }
  var TETRA = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
  var ECKE = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  function implizit(t, wechsel, T) {
    var bb = typeof t.box === "number" ? [t.box, t.box, t.box] : t.box, bm = Math.max(bb[0], bb[1], bb[2]), h = 2 * bm / Math.max(8, Math.round((t.res || 40) * Math.min(FEIN, 2)));
    var nx = Math.max(2, Math.round(2 * bb[0] / h)), ny = Math.max(2, Math.round(2 * bb[1] / h)), nz = Math.max(2, Math.round(2 * bb[2] / h));
    var hx = 2 * bb[0] / nx, hy = 2 * bb[1] / ny, hz = 2 * bb[2] / nz, my = ny + 1, mz = nz + 1, W = new Float64Array((nx + 1) * my * mz), i, j, k, e;
    var kugel = t.kugel || (typeof t.box === "number" ? t.box : Infinity), k2 = kugel * kugel;
    for (i = 0; i <= nx; i++) for (j = 0; j <= ny; j++) for (k = 0; k <= nz; k++) W[(i * my + j) * mz + k] = t.F(-bb[0] + i * hx, -bb[1] + j * hy, -bb[2] + k * hz);
    var p = [], w = [];
    function schnitt(a, c) { var s = w[a] / (w[a] - w[c]); return [p[a][0] + s * (p[c][0] - p[a][0]), p[a][1] + s * (p[c][1] - p[a][1]), p[a][2] + s * (p[c][2] - p[a][2])]; }
    function drei(A, B, C) { if ((A[0] + B[0] + C[0]) * (A[0] + B[0] + C[0]) + (A[1] + B[1] + C[1]) * (A[1] + B[1] + C[1]) + (A[2] + B[2] + C[2]) * (A[2] + B[2] + C[2]) <= 9 * k2) T.push(A, B, C); }
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) for (k = 0; k < nz; k++) {
      var gut = true;
      for (e = 0; e < 8; e++) {
        var x = i + ECKE[e][0], y = j + ECKE[e][1], z = k + ECKE[e][2];
        p[e] = [-bb[0] + x * hx, -bb[1] + y * hy, -bb[2] + z * hz]; w[e] = W[(x * my + y) * mz + z];
        if (!isFinite(w[e])) gut = false;
      }
      if (!gut) continue;
      var um = wechsel && (i + j + k) % 2;                               // die Kopie teilt die Wuerfel anders
      for (var q = 0; q < 6; q++) {
        var tt = TETRA[q], innen = [], aussen = [];
        for (e = 0; e < 4; e++) { var ix = um ? 7 - tt[e] : tt[e]; (w[ix] < 0 ? innen : aussen).push(ix); }
        if (innen.length === 0 || innen.length === 4) continue;
        if (innen.length === 1) drei(schnitt(innen[0], aussen[0]), schnitt(innen[0], aussen[1]), schnitt(innen[0], aussen[2]));
        else if (innen.length === 3) drei(schnitt(aussen[0], innen[0]), schnitt(aussen[0], innen[1]), schnitt(aussen[0], innen[2]));
        else { var A = schnitt(innen[0], aussen[0]), B = schnitt(innen[0], aussen[1]), C = schnitt(innen[1], aussen[1]), D = schnitt(innen[1], aussen[0]); drei(A, B, C); drei(A, C, D); }
      }
    }
  }
  function netz(k, wechsel, fein) { FEIN = fein || 1;                                          // -> Float64Array, mittig, auf GROESSE normiert
    var T = [], teile = k.teile || [k], i, j;
    teile.forEach(function (t) { var art = t.typ || k.typ; (art === "rohr" ? rohr : art === "implizit" ? implizit : param)(t, wechsel, T); });
    var g = k.grenze ? k.grenze * k.grenze : Infinity, R = [];
    for (i = 0; i < T.length; i += 3) {
      var ok = true;
      for (j = 0; j < 3; j++) { var p = T[i + j], d = p[0] * p[0] + p[1] * p[1] + p[2] * p[2]; if (!(d <= g)) ok = false; }
      if (ok) R.push(T[i], T[i + 1], T[i + 2]);
    }
    var lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], c, rm = 0;
    for (i = 0; i < R.length; i++) for (j = 0; j < 3; j++) { lo[j] = Math.min(lo[j], R[i][j]); hi[j] = Math.max(hi[j], R[i][j]); }
    c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    for (i = 0; i < R.length; i++) rm = Math.max(rm, Math.hypot(R[i][0] - c[0], R[i][1] - c[1], R[i][2] - c[2]));
    var out = new Float64Array(R.length * 3), s = GROESSE / (rm || 1);
    for (i = 0; i < R.length; i++) for (j = 0; j < 3; j++) out[3 * i + j] = (R[i][j] - c[j]) * s;
    return out;
  }
  window.ZFNETZ = netz;
})();
