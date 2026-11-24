/* Auswahl fuer das Website-Artefakt, uebertragen aus dem Kandidaten-Werkzeug (zfighting_kandidaten).
   ids: die Flaechen mit Urteil "in", in der Reihenfolge von flaechen.js. sicht: Standardperspektive in Grad (az, el);
   fehlt sie, gilt az/el aus flaechen.js. Neu uebertragen: Ablage des Kandidaten-Artefakts lesen (auswahl/stand)
   oder "Auswahl als Text" einfuegen, diese Datei neu schreiben, python3 baue_artefakt.py, neu veroeffentlichen. */
window.AUSWAHL = {
  stand: "2026-11-24",
  ids: ["klein", "boy", "bottle", "eversion", "pinkall", "cinquefoil", "listing", "enneper", "enneper2", "helicoid", "henneberg", "richmond",
    "scherk1", "gyroid", "schwarzd", "breather", "dini", "sievert", "cayley", "togliatti", "endrass", "calabi", "lorenz", "shell", "superellipsoid"],
  sicht: {
    klein: [-60, 28], boy: [-102, 35], bottle: [-100, 27], eversion: [179, -42], pinkall: [-123, 27], trefoil: [-80, 55], cinquefoil: [-47, 57],
    listing: [-129, 42], enneper: [-91, 30], enneper2: [-29, 54], henneberg: [-132, -12], richmond: [-141, 5], scherk1: [-105, -59],
    gyroid: [-49, 30], schwarzp: [-102, 4], schwarzd: [-134, -2], kuen: [84, -1], breather: [-41, 69], dini: [55, 44], sievert: [106, -28],
    barth: [-91, 33], cayley: [37, 21], togliatti: [-108, -5], tangle: [-27, 16], calabi: [44, 4], shell: [128, -12], superellipsoid: [-122, 32]
  }
};
