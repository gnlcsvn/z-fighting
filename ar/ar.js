/* AR-Test: Das geplottete Blatt ist die Marke (ziel.mind, aus der Plotdatei erzeugt). Darueber stehen die Kleinsche
   Flasche und ihre um 0.22 Grad verdrehte Kopie am selben Ort. Welche vorn liegt, entscheidet der Tiefenpuffer des
   Telefons: das Z-Fighting ist hier echt und sieht auf jedem Geraet anders aus.
   Form, Kopie und Blickrichtung wie in zfighting/plot3d_farbe/zfighting_bild.py (motiv), damit das Modell von vorn gesehen
   auf der Zeichnung liegt. */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const BLAU = 0x3454aa, ROT = 0xd6483a;
const ZIEL_BREITE_MM = 176, MOTIV_BREITE_MM = 168, ZIELE = 2;                 // Ausschnitt ziel.png und Breite der Zeichnung darin

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
// Jeder Schritt wird sichtbar mitgeschrieben, damit man am Telefon sieht, wo es haengt.
const schritt = t => { meldung.textContent += (meldung.textContent ? "\n" : "") + t; };
window.addEventListener("error", e => schritt("error: " + e.message));
window.addEventListener("unhandledrejection", e => schritt("error: " + (e.reason && e.reason.message || e.reason)));
schritt("v4 ready, secure " + window.isSecureContext + ", camera api " + !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
document.getElementById("los").addEventListener("click", async () => {
  try {
    schritt("1 asking for camera");
    const probe = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } });
    const spur = probe.getVideoTracks()[0], e = spur.getSettings();
    schritt("2 camera ok: " + (spur.label || "?") + " " + e.width + "x" + e.height);
    probe.getTracks().forEach(t => t.stop());
    schritt("3 loading target");
    const ar = new MindARThree({ container: document.getElementById("buehne"), imageTargetSrc: (new URLSearchParams(location.search).get("ziel") || "ziel") + ".mind", uiScanning: "no", uiLoading: "no", filterMinCF: 0.0005, filterBeta: 0.01 });
    const { renderer, scene, camera } = ar;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8985, 1.6)); const licht = new THREE.DirectionalLight(0xffffff, 1.4); licht.position.set(-0.6, 0.8, 1); scene.add(licht);
    const koerper = [];                                             // je Ziel (0 = Foto des Plots, 1 = Rendering) dasselbe Modell
    for (let i = 0; i < ZIELE; i++) {
      const anker = ar.addAnchor(i), m = modell(); anker.group.add(m.aussen); koerper.push(m.koerper);
      anker.onTargetFound = () => { zeile.textContent = "tap to turn"; window.zfGefunden = i; };
      anker.onTargetLost = () => { zeile.textContent = "looking for the print"; };
    }
    let dreht = false; document.getElementById("buehne").addEventListener("click", () => { dreht = !dreht; });
    schritt("4 starting tracker");
    const warte = setTimeout(() => schritt("still starting after 20 s"), 20000);
    await ar.start(); clearTimeout(warte);
    schritt("5 running");
    document.getElementById("start").hidden = true; zeile.hidden = false;
    renderer.setAnimationLoop(() => { if (dreht) koerper.forEach(k => { k.rotation.z += 0.01; }); renderer.render(scene, camera); });
  } catch (e) { schritt("failed: " + (e.name || "") + " " + (e.message || e)); }
});
// Ohne Kamera und ohne Marke: das Modell frei im Raum, mit dem Finger drehbar.
document.getElementById("ohne").addEventListener("click", async () => {
  try {
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    const buehne = document.getElementById("buehne"), renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); buehne.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xfbfaf7);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8985, 1.6)); const licht = new THREE.DirectionalLight(0xffffff, 1.4); licht.position.set(-0.6, 0.8, 1); scene.add(licht);
    const m = modell(); m.aussen.position.z -= 0.46; scene.add(m.aussen);                    // um die Mitte des Koerpers drehen
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 20); camera.position.set(0, 0, 2.6);
    const steuer = new OrbitControls(camera, renderer.domElement); steuer.enableDamping = true; steuer.autoRotate = true; steuer.autoRotateSpeed = 1.2;
    const mass = () => { renderer.setSize(buehne.clientWidth, buehne.clientHeight); camera.aspect = buehne.clientWidth / buehne.clientHeight; camera.position.setLength(camera.aspect < 1 ? 2.3 : 1.6); camera.updateProjectionMatrix(); };
    mass(); window.addEventListener("resize", mass);
    document.getElementById("start").hidden = true; zeile.hidden = false; zeile.textContent = "drag to turn";
    renderer.setAnimationLoop(() => { steuer.update(); renderer.render(scene, camera); });
  } catch (e) { schritt("failed: " + (e.message || e)); }
});
window.zfModell = modell;                                            // zum Pruefen ohne Kamera
