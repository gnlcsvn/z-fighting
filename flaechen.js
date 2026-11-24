/* Formeln der Flaechen. Erzeugt von baue_artefakt.py, nicht von Hand aendern. */
(function () {
  var PI = Math.PI, sin = Math.sin, cos = Math.cos, sinh = Math.sinh, cosh = Math.cosh, tanh = Math.tanh, sqrt = Math.sqrt, log = Math.log, tan = Math.tan, pow = Math.pow, atan = Math.atan, exp = Math.exp;
  var WP = "https://en.wikipedia.org/wiki/", MW = "https://mathworld.wolfram.com/", VMM = "https://virtualmathmuseum.org/";
  var ZWEI = "zwei Quellen stimmen überein, nachgerechnet", EINE = "eine Quelle, nachgerechnet", NUR = "eine Quelle, nicht gegengeprüft", EIGEN = "aus zwei Quellen selbst zusammengesetzt";
  function mal(p, q) { return [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]]; }
  function durch(p, q) { var n = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / n, (p[1] * q[0] - p[0] * q[1]) / n]; }
  function lawson(u, v) {
    var W = (sin(u) * cos(v) + sin(2 * u) * sin(v)) / sqrt(2), d = 1 - W;
    return [cos(2 * u) * sin(v) / d, (sin(2 * u) * sin(v) - sin(u) * cos(v)) / (sqrt(2) * d), cos(u) * cos(v) / d];
  }
  function torus(c, a) { return function (u, v) { var r = c + a * cos(v); return [r * cos(u), r * sin(u), a * sin(v)]; }; }
  function torusknoten(p, q) { return function (t) { t *= 2 * PI; var r = cos(q * t) + 2; return [r * cos(p * t), r * sin(p * t), -sin(q * t)]; }; }
  function enneper(k) { return function (r, p) { var n = 2 * k + 1; return [r * cos(p) - pow(r, n) * cos(n * p) / n, -r * sin(p) - pow(r, n) * sin(n * p) / n, 2 * pow(r, k + 1) * cos((k + 1) * p) / (k + 1)]; }; }
  function hopf(aa, bb, ee) { return function (u, v) {
    var al = aa + bb * sin(ee * 2 * v), x1 = cos(al) * cos(u + v), x2 = cos(al) * sin(u + v), x3 = sin(al) * cos(u - v), x4 = sin(al) * sin(u - v), d = 1 - x4;
    return [x1 / d, x2 / d, x3 / d];
  }; }
  function hoch(w, e) { return (w < 0 ? -1 : 1) * pow(Math.abs(w), e); }
  function gielis(t, m, n1, n2, n3) { return pow(pow(Math.abs(cos(m * t / 4)), n2) + pow(Math.abs(sin(m * t / 4)), n3), -1 / n1); }
  function cpot(re, im, e) { var r = pow(Math.hypot(re, im), e), w = Math.atan2(im, re) * e; return [r * cos(w), r * sin(w)]; }
  function calabi() {                                                  
    var teile = [], n = 5, al = PI / 4;
    for (var k1 = 0; k1 < n; k1++) for (var k2 = 0; k2 < n; k2++) (function (k1, k2) {
      teile.push({ typ: "param", u: [0, PI / 2], v: [-1, 1], nu: 10, nv: 10, f: function (a, b) {
        var c = cpot(cos(a) * cosh(b), -sin(a) * sinh(b), 2 / n), s = cpot(sin(a) * cosh(b), cos(a) * sinh(b), 2 / n);
        var z1 = mal([cos(2 * PI * k1 / n), sin(2 * PI * k1 / n)], c), z2 = mal([cos(2 * PI * k2 / n), sin(2 * PI * k2 / n)], s);
        return [z1[0], z2[0], z1[1] * cos(al) + z2[1] * sin(al)];
      } });
    })(k1, k2);
    return teile;
  }
  function lorenz() {                                                  
    var P = [], p = [1, 1, 1], h = 0.005, i;
    function d(q) { return [10 * (q[1] - q[0]), q[0] * (28 - q[2]) - q[1], q[0] * q[1] - 8 / 3 * q[2]]; }
    function plus(q, k, f) { return [q[0] + k[0] * f, q[1] + k[1] * f, q[2] + k[2] * f]; }
    for (i = 0; i < 2000 + 4500; i++) {
      var k1 = d(p), k2 = d(plus(p, k1, h / 2)), k3 = d(plus(p, k2, h / 2)), k4 = d(plus(p, k3, h));
      p = [p[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), p[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), p[2] + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
      if (i >= 2000) P.push(p);
    }
    return function (t) { return P[Math.min(P.length - 1, Math.round(t * (P.length - 1)))]; };
  }
  window.GRUPPEN = [["topologie", "topology"], ["minimal", "minimal"], ["kruemmung", "curvature"], ["algebraisch", "algebraic"], ["natur", "science"]];
  window.KANDIDATEN = [
    { id: "moebius", name: "möbius strip", gruppe: "topologie", serie: true, u: [0, 2 * PI], v: [-0.5, 0.5], nu: 90, nv: 10, az: -60, el: 35,
      f: function (t, s) { var r = 1 + s * cos(t / 2); return [r * cos(t), r * sin(t), s * sin(t / 2)]; } },
    { id: "klein", name: "klein bottle, figure-eight", gruppe: "topologie", serie: true, u: [0, 2 * PI], v: [0, 2 * PI], nu: 96, nv: 22, az: -60, el: 37,
      f: function (u, v) { var r = 3 + cos(u / 2) * sin(v) - sin(u / 2) * sin(2 * v); return [r * cos(u), r * sin(u), sin(u / 2) * sin(v) + cos(u / 2) * sin(2 * v)]; } },
    { id: "boy", name: "boy’s surface", gruppe: "topologie", serie: true, u: [0, 1], v: [0, 2 * PI], nu: 30, nv: 96, az: -60, el: 55,
      f: function (a, b) {
        var w = [a * cos(b), a * sin(b)], w2 = mal(w, w), w3 = mal(w2, w), w4 = mal(w2, w2), w6 = mal(w3, w3), d = [w6[0] + sqrt(5) * w3[0] - 1, w6[1] + sqrt(5) * w3[1]];
        var g1 = -1.5 * durch(mal(w, [1 - w4[0], -w4[1]]), d)[1], g2 = -1.5 * durch(mal(w, [1 + w4[0], w4[1]]), d)[0], g3 = durch([1 + w6[0], w6[1]], d)[1] - 0.5, g = g1 * g1 + g2 * g2 + g3 * g3;
        return [g1 / g, g2 / g, g3 / g];
      } },
    { id: "roman", name: "roman surface", gruppe: "topologie", u: [0, 2 * PI], v: [0, PI / 2], nu: 72, nv: 28, az: -50, el: 25,
      f: function (u, v) { return [sin(2 * u) * sin(v) * sin(v), sin(u) * sin(2 * v), cos(u) * sin(2 * v)]; } },
    { id: "crosscap", name: "cross-cap", gruppe: "topologie", u: [0, 2 * PI], v: [0, PI / 2], nu: 72, nv: 28, az: -55, el: 20,
      f: function (u, v) { return [0.5 * sin(u) * sin(2 * v), sin(2 * u) * sin(v) * sin(v), cos(2 * u) * sin(v) * sin(v)]; } },
    { id: "lawson", name: "lawson’s klein bottle", gruppe: "topologie", u: [0, PI], v: [0, 2 * PI], nu: 80, nv: 80, az: -60, el: 30,
      f: lawson },
    { id: "sudanese", name: "sudanese möbius band", gruppe: "topologie", u: [0, PI], v: [0, PI], nu: 80, nv: 44, az: -60, el: 30,
      f: lawson },
    { id: "bottle", name: "klein bottle, classic", gruppe: "topologie", u: [0, PI], v: [0, 2 * PI], nu: 110, nv: 28, az: -80, el: 12,
      f: function (u, v) {
        var c = cos(u), s = sin(u), cv = cos(v), c2 = c * c, c3 = c2 * c, c4 = c2 * c2, c5 = c4 * c, c6 = c4 * c2, c7 = c6 * c;
        return [-(2 / 15) * c * (3 * cv - 30 * s + 90 * c4 * s - 60 * c6 * s + 5 * c * cv * s),
          -(1 / 15) * s * (3 * cv - 3 * c2 * cv - 48 * c4 * cv + 48 * c6 * cv - 60 * s + 5 * c * cv * s - 5 * c3 * cv * s - 80 * c5 * cv * s + 80 * c7 * cv * s),
          (2 / 15) * (3 + 5 * c * s) * sin(v)];
      } },
    { id: "pinched", name: "klein bottle, pinched torus", gruppe: "topologie", u: [0, 2 * PI], v: [0, 2 * PI], nu: 28, nv: 96, az: -60, el: 32,
      f: function (u, v) { var R = 2.6, r = 1; return [(R + r * cos(u)) * cos(v), (R + r * cos(u)) * sin(v), r * sin(u) * cos(v / 2)]; } },
    { id: "eversion", name: "sphere eversion, halfway (open)", gruppe: "topologie", u: [0, 2 * PI], v: [-2, 2], nu: 96, nv: 40, az: -60, el: 30,
      f: function (u, h) { return [(1 - h) * sin(u), (1 + h) * cos(u), h * sin(2 * u)]; } },
    { id: "whitney", name: "whitney umbrella", gruppe: "topologie", u: [-1.3, 1.3], v: [-1.3, 1.3], nu: 40, nv: 40, az: -60, el: 28,
      f: function (u, v) { return [u * v, u, v * v]; } },
    { id: "pluecker", name: "plücker’s conoid", gruppe: "topologie", u: [0, 2 * PI], v: [-1.6, 1.6], nu: 96, nv: 20, az: -55, el: 28,
      f: function (u, v) { return [v * cos(u), v * sin(u), sin(2 * u)]; } },
    { id: "torus", name: "torus", gruppe: "topologie", u: [0, 2 * PI], v: [0, 2 * PI], nu: 64, nv: 24, az: -60, el: 38,
      f: torus(2, 0.85) },
    { id: "horn", name: "horn torus", gruppe: "topologie", u: [0, 2 * PI], v: [0, 2 * PI], nu: 72, nv: 36, az: -60, el: 38,
      f: torus(1, 1) },
    { id: "spindle", name: "spindle torus", gruppe: "topologie", u: [0, 2 * PI], v: [0, 2 * PI], nu: 72, nv: 40, az: -60, el: 30,
      f: torus(0.6, 1) },
    { id: "cyclide", name: "dupin cyclide", gruppe: "topologie", u: [0, 2 * PI], v: [0, 2 * PI], nu: 80, nv: 40, az: -70, el: 35,
      f: function (u, v) { var a = 1, b = 0.8, c = 0.6, d = 0.75, D = a - c * cos(u) * cos(v); return [(d * (c - a * cos(u) * cos(v)) + b * b * cos(u)) / D, b * sin(u) * (a - d * cos(v)) / D, b * sin(v) * (c * cos(u) - d) / D]; } },
    { id: "umbilic", name: "umbilic torus", gruppe: "topologie", u: [-PI, PI], v: [-PI, PI], nu: 120, nv: 36, az: -60, el: 40,
      f: function (u, v) { var k = 7 + cos(u / 3 - 2 * v) + 2 * cos(u / 3 + v); return [sin(u) * k, cos(u) * k, sin(u / 3 - 2 * v) + 2 * sin(u / 3 + v)]; } },
    { id: "clifford", name: "clifford torus", gruppe: "topologie", u: [0, 2 * PI], v: [0, PI], nu: 64, nv: 64, az: -60, el: 30,
      f: hopf(PI / 4, 0, 3) },
    { id: "pinkall", name: "bianchi–pinkall flat torus", gruppe: "topologie", u: [0, 2 * PI], v: [0, PI], nu: 72, nv: 96, az: -60, el: 35,
      f: hopf(PI / 4, 0.38, 3) },
    { id: "trefoil", name: "trefoil knot", gruppe: "topologie", typ: "rohr", r: 0.42, n: 160, m: 8, az: -70, el: 60,
      kurve: torusknoten(2, 3) },
    { id: "cinquefoil", name: "cinquefoil knot", gruppe: "topologie", typ: "rohr", r: 0.36, n: 220, m: 8, az: -70, el: 62,
      kurve: torusknoten(2, 5) },
    { id: "listing", name: "figure-eight knot", gruppe: "topologie", typ: "rohr", r: 0.3, n: 220, m: 8, az: -60, el: 55, kurve: function (t) { t *= 2 * PI; return [2 * cos(3 * t) + cos(t), 2 * sin(3 * t) + sin(t), sin(4 * t)]; } },
    { id: "enneper", name: "enneper surface", gruppe: "minimal", u: [0, 2.1], v: [0, 2 * PI], nu: 30, nv: 96, az: -55, el: 35,
      f: enneper(1) },
    { id: "enneper2", name: "enneper surface, order 2", gruppe: "minimal", u: [0, 1.35], v: [0, 2 * PI], nu: 28, nv: 120, az: -55, el: 40,
      f: enneper(2) },
    { id: "catenoid", name: "catenoid", gruppe: "minimal", u: [0, 2 * PI], v: [-1.6, 1.6], nu: 56, nv: 30, az: -50, el: 18,
      f: function (u, v) { return [cosh(v) * cos(u), cosh(v) * sin(u), v]; } },
    { id: "helicoid", name: "helicoid", gruppe: "minimal", u: [0, 5 * PI], v: [-1.6, 1.6], nu: 110, nv: 12, az: -50, el: 20,
      f: function (u, v) { return [v * cos(u), v * sin(u), 0.42 * u]; } },
    { id: "henneberg", name: "henneberg surface", gruppe: "minimal", u: [0, 0.85], v: [0, 2 * PI], nu: 26, nv: 120, az: -50, el: 30,
      f: function (u, v) { return [2 * sinh(u) * cos(v) - (2 / 3) * sinh(3 * u) * cos(3 * v), 2 * sinh(u) * sin(v) + (2 / 3) * sinh(3 * u) * sin(3 * v), 2 * cosh(2 * u) * cos(2 * v)]; } },
    { id: "bour", name: "bour’s surface", gruppe: "minimal", u: [0, 1.5], v: [0, 4 * PI], nu: 24, nv: 160, az: -55, el: 35,
      f: function (r, t) { return [r * cos(t) - 0.5 * r * r * cos(2 * t), -r * sin(t) - 0.5 * r * r * sin(2 * t), (4 / 3) * pow(r, 1.5) * cos(1.5 * t)]; } },
    { id: "catalan", name: "catalan’s surface", gruppe: "minimal", u: [0, 4 * PI], v: [-1.5, 1.5], nu: 120, nv: 30, az: -65, el: 25,
      f: function (u, v) { return [u - sin(u) * cosh(v), 1 - cos(u) * cosh(v), 4 * sin(u / 2) * sinh(v / 2)]; } },
    { id: "richmond", name: "richmond surface", gruppe: "minimal", u: [0.35, 1.3], v: [0, 2 * PI], nu: 30, nv: 110, az: -55, el: 35,
      f: function (r, t) { var u = r * cos(t), v = r * sin(t), q = u * u + v * v; return [u * u * u / 3 - u * v * v + u / q, -u * u * v + v * v * v / 3 - v / q, 2 * u]; } },
    { id: "scherk2", name: "scherk’s tower", gruppe: "minimal", typ: "implizit", box: [2.6, 2.6, 7.85], res: 60, az: -62, el: 22,
      F: function (x, y, z) { return sin(z) - sinh(x) * sinh(y); } },
    { id: "scherk1", name: "scherk’s first surface", gruppe: "minimal", typ: "implizit", box: [4.6, 4.6, 3], res: 50, az: -55, el: 35,
      F: function (x, y, z) { return exp(z) * cos(y) - cos(x); } },
    { id: "gyroid", name: "gyroid", gruppe: "minimal", typ: "implizit", box: 2 * PI, kugel: 2 * PI * 0.98, res: 44, az: -55, el: 30,
      F: function (x, y, z) { return sin(x) * cos(y) + sin(y) * cos(z) + sin(z) * cos(x); } },
    { id: "schwarzp", name: "schwarz P surface", gruppe: "minimal", typ: "implizit", box: 2 * PI, kugel: 2 * PI * 0.98, res: 44, az: -55, el: 30,
      F: function (x, y, z) { return cos(x) + cos(y) + cos(z); } },
    { id: "schwarzd", name: "schwarz D surface", gruppe: "minimal", typ: "implizit", box: 2 * PI, kugel: 2 * PI * 0.98, res: 38, az: -55, el: 30,
      F: function (x, y, z) { return sin(x) * sin(y) * sin(z) + sin(x) * cos(y) * cos(z) + cos(x) * sin(y) * cos(z) + cos(x) * cos(y) * sin(z); } },
    { id: "kuen", name: "kuen surface", gruppe: "kruemmung", u: [-4.3, 4.3], v: [0.04, PI - 0.04], nu: 90, nv: 44, az: -65, el: 28,
      f: function (u, v) { var d = 1 + u * u * sin(v) * sin(v); return [2 * (cos(u) + u * sin(u)) * sin(v) / d, 2 * (sin(u) - u * cos(u)) * sin(v) / d, log(tan(v / 2)) + 2 * cos(v) / d]; } },
    { id: "breather", name: "breather surface", gruppe: "kruemmung", u: [-7, 7], v: [0, 10 * PI], nu: 70, nv: 220, az: -65, el: 25,
      f: function (u, v) {
        var a = 0.6, w = 0.8, ch = cosh(a * u), d = a * (pow(w * ch, 2) + pow(a * sin(w * v), 2));
        return [-u + 2 * w * w * ch * sinh(a * u) / d, 2 * w * ch * (-w * cos(v) * cos(w * v) - sin(v) * sin(w * v)) / d, 2 * w * ch * (-w * sin(v) * cos(w * v) + cos(v) * sin(w * v)) / d];
      } },
    { id: "dini", name: "dini’s surface", gruppe: "kruemmung", u: [0, 4 * PI], v: [0.06, 2], nu: 120, nv: 26, az: -50, el: 15,
      f: function (u, v) { return [cos(u) * sin(v), sin(u) * sin(v), cos(v) + log(tan(v / 2)) + 0.2 * u]; } },
    { id: "pseudosphere", name: "pseudosphere", gruppe: "kruemmung", u: [-3.2, 3.2], v: [0, 2 * PI], nu: 60, nv: 56, az: -50, el: 15,
      f: function (u, v) { return [cos(v) / cosh(u), sin(v) / cosh(u), u - tanh(u)]; } },
    { id: "sievert", name: "sievert’s surface", gruppe: "kruemmung", u: [-PI / 2 + 0.002, PI / 2 - 0.002], v: [0.05, PI - 0.05], nu: 80, nv: 60, az: -60, el: 25,
      f: function (u, v) {
        var C = 1, phi = -u / sqrt(C + 1) + atan(tan(u) * sqrt(C + 1)), a = 2 / (C + 1 - C * sin(v) * sin(v) * cos(u) * cos(u)), r = a * sqrt((C + 1) * (1 + C * sin(u) * sin(u))) * sin(v) / sqrt(C);
        return [r * cos(phi), r * sin(phi), (log(tan(v / 2)) + a * (C + 1) * cos(v)) / sqrt(C)];
      } },
    { id: "corkscrew", name: "corkscrew surface", gruppe: "kruemmung", u: [0, 4 * PI], v: [-PI / 2, PI / 2], nu: 120, nv: 24, az: -50, el: 15,
      f: function (u, v) { return [cos(u) * cos(v), sin(u) * cos(v), sin(v) + 0.5 * u]; } },
    { id: "monkey", name: "monkey saddle", gruppe: "kruemmung", u: [0, 1.5], v: [0, 2 * PI], nu: 22, nv: 84, az: -55, el: 35,
      f: function (r, t) { var x = r * cos(t), y = r * sin(t); return [x, y, 0.55 * (x * x * x - 3 * x * y * y)]; } }
    , { id: "barth", name: "barth sextic", gruppe: "algebraisch", typ: "implizit", box: 2.3, res: 64, az: -58, el: 22,
      F: function (x, y, z) { var p = (1 + sqrt(5)) / 2, q = p * p, k = x * x + y * y + z * z - 1; return 4 * (q * x * x - y * y) * (q * y * y - z * z) * (q * z * z - x * x) - (1 + 2 * p) * k * k; } }
    , { id: "clebsch", name: "clebsch diagonal cubic", gruppe: "algebraisch", typ: "implizit", box: 1.5, res: 56, az: -58, el: 28,
      F: function (x, y, z) { return 81 * (x * x * x + y * y * y + z * z * z) - 189 * (x * x * y + x * x * z + y * y * x + y * y * z + z * z * x + z * z * y) + 54 * x * y * z + 126 * (x * y + x * z + y * z) - 9 * (x * x + y * y + z * z) - 9 * (x + y + z) + 1; } }
    , { id: "kummer", name: "kummer surface", gruppe: "algebraisch", typ: "implizit", box: 2.1, res: 60, az: -58, el: 24,
      F: function (x, y, z) { var mu = 1.3, m2 = mu * mu, la = (3 * m2 - 1) / (3 - m2), s = Math.SQRT2, k = x * x + y * y + z * z - m2; return k * k - la * (1 - z - s * x) * (1 - z + s * x) * (1 + z + s * y) * (1 + z - s * y); } }
    , { id: "cayley", name: "cayley’s nodal cubic", gruppe: "algebraisch", typ: "implizit", box: 3, res: 56, az: -58, el: 24,
      F: function (x, y, z) { return x * x + y * y - x * x * z + y * y * z + z * z - 1; } }
    , { id: "togliatti", name: "togliatti quintic", gruppe: "algebraisch", typ: "implizit", box: 6, res: 54, az: -58, el: 30,
      F: function (x, y, z) { var k = sqrt(5 - sqrt(5)), q = 4 * (x * x + y * y - z * z) + (1 + 3 * sqrt(5)), x2 = x * x, y2 = y * y; return 64 * (x - 1) * (x2 * x2 - 4 * x2 * x - 10 * x2 * y2 - 4 * x2 + 16 * x - 20 * x * y2 + 5 * y2 * y2 + 16 - 20 * y2) - 5 * k * (2 * z - k) * q * q; } }
    , { id: "endrass", name: "endraß octic", gruppe: "algebraisch", typ: "implizit", box: 4.2, res: 72, az: -58, el: 32,
      F: function (x, y, z) { var s = Math.SQRT2, r2 = x * x + y * y, z2 = z * z, k = -4 * (1 + s) * r2 * r2 + (8 * (2 + s) * z2 + 2 * (2 + 7 * s)) * r2 - 16 * z2 * z2 + 8 * (1 - 2 * s) * z2 - (1 + 12 * s); return 64 * (x * x - 1) * (y * y - 1) * ((x + y) * (x + y) - 2) * ((x - y) * (x - y) - 2) - k * k; } }
    , { id: "fresnel", name: "fresnel wave surface", gruppe: "algebraisch", typ: "implizit", box: 1.7, kugel: 9, res: 56, az: 40, el: 30,
      F: function (x, y, z) { if (x > 0 && y > 0 && z > 0) return NaN; var a = 1, b = 0.5, c = 1.5, a2 = a * a, b2 = b * b, c2 = c * c, r = x * x + y * y + z * z; return r * (a2 * x * x + b2 * y * y + c2 * z * z) - (a2 * (b2 + c2) * x * x + b2 * (a2 + c2) * y * y + c2 * (a2 + b2) * z * z) + a2 * b2 * c2; } }
    , { id: "tangle", name: "tanglecube", gruppe: "algebraisch", typ: "implizit", box: 2.6, kugel: 9, res: 42, az: -58, el: 28,
      F: function (x, y, z) { return x * x * x * x - 5 * x * x + y * y * y * y - 5 * y * y + z * z * z * z - 5 * z * z + 11.8; } }
    , { id: "chmutov", name: "banchoff–chmutov surface", gruppe: "algebraisch", typ: "implizit", box: 1.25, kugel: 9, res: 42, az: -58, el: 28,
      F: function (x, y, z) { return 3 + 8 * (x * x * x * x + y * y * y * y + z * z * z * z) - 8 * (x * x + y * y + z * z); } }
    , { id: "hyperboloid", name: "hyperboloid of one sheet", gruppe: "algebraisch", u: [0, 2 * PI], v: [-1.8, 1.8], nu: 64, nv: 20, az: -50, el: 20,
      f: function (t, s) { return [cos(t) - s * sin(t), sin(t) + s * cos(t), s]; } }
    , { id: "hypar", name: "hyperbolic paraboloid", gruppe: "algebraisch", u: [-1, 1], v: [-1, 1], nu: 24, nv: 24, az: -60, el: 28,
      f: function (x, y) { return [x, y, x * y]; } }
    , { id: "calabi", name: "calabi–yau cross-section", gruppe: "natur", az: -60, el: 25, teile: calabi(),
      }
    , { id: "lorenz", name: "lorenz attractor", gruppe: "natur", typ: "rohr", offen: true, r: 0.45, n: 1500, m: 5, az: -60, el: 15, kurve: lorenz(),
      }
    , { id: "dz2", name: "orbital d z²", gruppe: "natur", u: [0, PI], v: [0, 2 * PI], nu: 60, nv: 48, az: -60, el: 20,
      f: function (t, p) { var r = Math.abs(3 * cos(t) * cos(t) - 1); return [r * sin(t) * cos(p), r * sin(t) * sin(p), r * cos(t)]; } }
    , { id: "fxyz", name: "orbital f xyz", gruppe: "natur", u: [0, PI], v: [0, 2 * PI], nu: 64, nv: 96, az: -60, el: 25,
      f: function (t, p) { var x = sin(t) * cos(p), y = sin(t) * sin(p), z = cos(t), r = Math.abs(x * y * z) * 5; return [r * x, r * y, r * z]; } }
    , { id: "shell", name: "seashell", gruppe: "natur", u: [0, 6 * PI], v: [0, 2 * PI], nu: 150, nv: 24, az: -40, el: 15, f: function (u, v) { var e = exp(u / (6 * PI)), c = cos(v / 2) * cos(v / 2); return [2 * (1 - e) * cos(u) * c, 2 * (-1 + e) * sin(u) * c, 1 - exp(u / (3 * PI)) - sin(v) + e * sin(v)]; } }
    , { id: "super", name: "supershape", gruppe: "natur", u: [-PI, PI], v: [-PI / 2, PI / 2], nu: 120, nv: 60, az: -60, el: 30, f: function (t, p) { var r1 = gielis(t, 7, 0.2, 1.7, 1.7), r2 = gielis(p, 7, 0.2, 1.7, 1.7); return [r1 * cos(t) * r2 * cos(p), r1 * sin(t) * r2 * cos(p), r2 * sin(p)]; } }
    , { id: "superellipsoid", name: "superellipsoid", gruppe: "natur", u: [-PI / 2, PI / 2], v: [-PI, PI], nu: 48, nv: 96, az: -60, el: 28, f: function (a, b) { var e = 2.6; return [hoch(cos(a), e) * hoch(cos(b), e), hoch(cos(a), e) * hoch(sin(b), e), hoch(sin(a), e)]; } }
  ];
})();
