"""One-off: convert the WRI Global Power Plant Database (v1.3, CC BY 4.0) to a small JSON of nuclear plants.
Usage: python scripts/build-nuclear-plants.py path/to/global_power_plant_database.zip
Output: public/data/nuclear_plants.json  (commit it; the dataset is static)
The database vintage is ~2017-2019 data in a 2021 release: new/closed reactors since are not reflected.
"""
import csv, io, json, sys, zipfile

zf = zipfile.ZipFile(sys.argv[1])
name = [n for n in zf.namelist() if n.endswith(".csv")][0]
rows = csv.DictReader(io.TextIOWrapper(zf.open(name), encoding="utf-8", errors="replace"))
plants = []
for r in rows:
    if r["primary_fuel"] != "Nuclear":
        continue
    try:
        lat, lon, mw = float(r["latitude"]), float(r["longitude"]), float(r["capacity_mw"])
    except ValueError:
        continue
    year = r["commissioning_year"]
    plants.append({
        "id": r["gppd_idnr"],
        "name": r["name"].title(),
        "iso3": r["country"],
        "country": r["country_long"],
        "mw": round(mw),
        "lat": round(lat, 4),
        "lon": round(lon, 4),
        "year": int(float(year)) if year else None,
    })
plants.sort(key=lambda p: (p["country"], p["name"]))
out = {
    "source": {
        "name": "WRI Global Power Plant Database v1.3",
        "url": "https://datasets.wri.org/dataset/globalpowerplantdatabase",
        "license": "CC BY 4.0",
    },
    "vintage": "2021 release (mostly 2017-2019 data); not updated for later openings/closures",
    "plants": plants,
}
with open("public/data/nuclear_plants.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(plants), "plants")
