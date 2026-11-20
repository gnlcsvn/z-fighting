/* AR-Test: Das geplottete Blatt ist die Marke (ziel.mind, aus der Plotdatei erzeugt). Darueber stehen die Kleinsche
   Flasche und ihre um 0.22 Grad verdrehte Kopie am selben Ort. Welche vorn liegt, entscheidet der Tiefenpuffer des
   Telefons: das Z-Fighting ist hier echt und sieht auf jedem Geraet anders aus.
   Form, Kopie und Blickrichtung wie in plot3d_farbe/zfighting_bild.py (motiv), damit das Modell von vorn gesehen
   auf der Zeichnung liegt. */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const BLAU = 0x3454aa, ROT = 0xd6483a;
const ZIEL_BREITE_MM = 176, MOTIV_BREITE_MM = 168;                 // Ausschnitt ziel.png und Breite der Zeichnung darin

function flasche(u, v, a = 3.2) {
  const r = a + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
  return new THREE.Vector3(r * Math.cos(u), r * Math.sin(u), 1.5 * (Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v))).multiplyScalar(5);
}

function netz(farbe, wechsel) {
  const n = 96, m = 22, P = [], idx = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) { const p = flasche(2 * Math.PI * i / n, 2 * Math.PI * j / m); P.push(p.x, p.y, p.z); }
  const k = (i, j) => i * (m + 1) + j;
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const a = k(i, j), b = k(i + 1, j), c = k(i + 1, j + 1), d = k(i, j + 1);
    if (wechsel && (i + j) % 2) idx.push(b, c, d, b, d, a); else idx.push(a, b, c, a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: farbe, side: THREE.DoubleSide, flatShading: true }));
}

function modell() {
  const koerper = new THREE.Group(), original = netz(BLAU, false), kopie = netz(ROT, true);
  kopie.setRotationFromAxisAngle(new THREE.Vector3(0.3, 1, 0.6).normalize(), THREE.MathUtils.degToRad(0.22));
  koerper.add(original, kopie);
  // Blick des Plots: Auge (30, -52, 46), Ziel Ursprung, oben = z. In das System der Marke drehen (x rechts, y oben, z zum Betrachter).
  const f = new THREE.Vector3(-30, 52, -46).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 0, 1)).normalize(), o = new THREE.Vector3().crossVectors(r, f);
  const dreh = new THREE.Group(); dreh.add(koerper);
  dreh.applyMatrix4(new THREE.Matrix4().set(r.x, r.y, r.z, 0, o.x, o.y, o.z, 0, -f.x, -f.y, -f.z, 0, 0, 0, 0, 1));
  const aussen = new THREE.Group(); aussen.add(dreh);
  const kasten = new THREE.Box3().setFromObject(aussen), mass = new THREE.Vector3(), mitte = new THREE.Vector3(); kasten.getSize(mass); kasten.getCenter(mitte);
  const s = 0.92 * (MOTIV_BREITE_MM / ZIEL_BREITE_MM) / mass.x;     // Breite der Marke = 1
  aussen.scale.setScalar(s); aussen.position.set(-mitte.x * s, -mitte.y * s, -kasten.min.z * s + 0.02);   // steht knapp ueber dem Blatt
  return { aussen, koerper };
}

const meldung = document.getElementById("meldung"), zeile = document.getElementById("zeile");
window.addEventListener("error", e => { meldung.textContent = "error: " + e.message; });
window.addEventListener("unhandledrejection", e => { meldung.textContent = "error: " + (e.reason && e.reason.message || e.reason); });
document.getElementById("los").addEventListener("click", async () => {
  try {
    meldung.textContent = "starting camera ...";
    const ar = new MindARThree({ container: document.getElementById("buehne"), imageTargetSrc: (new URLSearchParams(location.search).get("ziel") || "ziel") + ".mind", uiScanning: "no", uiLoading: "no", filterMinCF: 0.0005, filterBeta: 0.01 });
    const { renderer, scene, camera } = ar;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8985, 1.6)); const licht = new THREE.DirectionalLight(0xffffff, 1.4); licht.position.set(-0.6, 0.8, 1); scene.add(licht);
    const anker = ar.addAnchor(0), { aussen, koerper } = modell(); anker.group.add(aussen);
    anker.onTargetFound = () => { zeile.textContent = "tap to turn"; };
    anker.onTargetLost = () => { zeile.textContent = "looking for the print"; };
    let dreht = false; document.getElementById("buehne").addEventListener("click", () => { dreht = !dreht; });
    await ar.start();
    meldung.textContent = "";
    document.getElementById("start").hidden = true; zeile.hidden = false;
    renderer.setAnimationLoop(() => { if (dreht) koerper.rotation.z += 0.01; renderer.render(scene, camera); });
  } catch (e) { meldung.textContent = "camera not available: " + e.message; }
});
window.zfModell = modell;                                            // zum Pruefen ohne Kamera
