#!/usr/bin/env python3
"""Opcional: genera una copia local comprobada de las fuentes de PERIODIC3D.

Requiere Python 3, Internet y permisos para escribir science-cache.json.
Ejecutar desde esta misma carpeta: python actualizar_fuentes.py
No modifica los datos externos ni inventa valores faltantes.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

DATA = {
    "pubchem": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON",
    "photos": "https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json",
}


def retrieve(url):
    req = Request(url, headers={"User-Agent": "Periodic3D-educational-snapshot/2.0", "Accept": "application/json"})
    with urlopen(req, timeout=35) as response:
        return json.load(response)


def validate(pubchem, photos):
    rows = pubchem.get("Table", {}).get("Row", [])
    fields = pubchem.get("Table", {}).get("Columns", {}).get("Column", [])
    items = photos.get("elements", [])
    if len(rows) != 118 or len(items) != 118:
        raise ValueError("Las fuentes no contienen exactamente 118 elementos")
    ni = fields.index("AtomicNumber")
    si = fields.index("Symbol")
    pc = {int(x["Cell"][ni]): x["Cell"][si] for x in rows}
    im = {int(x["number"]): x["symbol"] for x in items}
    if len(pc) != 118 or pc != im:
        raise ValueError("No coinciden los elementos y sus símbolos entre las dos fuentes")


def main():
    print("Consultando PubChem / NIH…")
    pubchem = retrieve(DATA["pubchem"])
    print("Consultando catálogo fotográfico con atribución…")
    photos = retrieve(DATA["photos"])
    validate(pubchem, photos)
    snapshot = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_sources": DATA,
        "pubchem": pubchem,
        "photos": photos,
    }
    output = Path(__file__).with_name("science-cache.json")
    output.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Caché local generada y validada: {output} ({output.stat().st_size:,} bytes)")
    print("Sube science-cache.json junto con index.html para uso sin APIs en tiempo real.")


if __name__ == "__main__":
    main()