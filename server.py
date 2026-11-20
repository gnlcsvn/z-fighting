#!/usr/bin/env python3
"""Lokaler Server fuer die AR-Testseite. Liefert den Ordner aus und nimmt von kompilieren.html die fertige
Bildmarke entgegen (POST /ziel.mind). Nur fuer die Arbeit am Rechner; veroeffentlicht wird der Ordner statisch.
  python3 server.py [port]
"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ORDNER = os.path.dirname(os.path.abspath(__file__))


class H(SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ORDNER, **k)

    def do_POST(s):
        name = os.path.basename(s.path)
        if not name.endswith(".mind"): s.send_error(404); return
        n = int(s.headers.get("Content-Length", 0)); daten = s.rfile.read(n)
        with open(os.path.join(ORDNER, name), "wb") as f: f.write(daten)
        s.send_response(200); s.end_headers(); s.wfile.write(str(len(daten)).encode())


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8767
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
