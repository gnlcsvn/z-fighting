# z-fighting

Work in progress. Pen plotter drawings made from a rendering error of 3D graphics.

- `index.html`, `stil.css`, `zf.js`: the site. Each surface fights its own copy, computed live in the browser.
- `ar/`: AR test. The plotted sheet is the image target, the Klein bottle and its copy stand above it.
  Open on a phone, allow the camera, point it at the print. To rebuild the target, run `python3 ar/server.py`
  and open `kompilieren.html`.
