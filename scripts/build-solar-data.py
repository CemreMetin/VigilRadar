"""One-off: data for the solar-superstorm scenario.

1. public/data/solar_exposure.json: installed power capacity by country and the share of it at high
   geomagnetic latitude, from the WRI Global Power Plant Database v1.3 (CC BY 4.0).
2. public/data/cables.json: submarine cable routes (TeleGeography Submarine Cable Map, CC BY-NC-SA 3.0,
   personal non-commercial use), coordinates thinned to keep the file small.

Geomagnetic latitude uses a centred-dipole approximation with the north geomagnetic pole at
80.7 N, 72.7 W. This is a rough proxy: real grid risk also depends on ground conductivity, line
length and orientation, and transformer design.

Usage: python scripts/build-solar-data.py path/to/global_power_plant_database.zip
"""
import csv, io, json, math, sys, urllib.request, zipfile
from collections import defaultdict

POLE_LAT, POLE_LON = 80.7, -72.7
THRESHOLD = 50.0


def geomag_lat(lat, lon):
    p, l = math.radians(lat), math.radians(lon)
    pp, pl = math.radians(POLE_LAT), math.radians(POLE_LON)
    s = math.sin(p) * math.sin(pp) + math.cos(p) * math.cos(pp) * math.cos(l - pl)
    return math.degrees(math.asin(max(-1.0, min(1.0, s))))


# ---- power capacity
zf = zipfile.ZipFile(sys.argv[1])
name = [n for n in zf.namelist() if n.endswith(".csv")][0]
rows = csv.DictReader(io.TextIOWrapper(zf.open(name), encoding="utf-8", errors="replace"))
total = defaultdict(float)
high = defaultdict(float)
names = {}
for r in rows:
    try:
        lat, lon, mw = float(r["latitude"]), float(r["longitude"]), float(r["capacity_mw"])
    except ValueError:
        continue
    iso = r["country"]
    names[iso] = r["country_long"]
    total[iso] += mw
    if abs(geomag_lat(lat, lon)) >= THRESHOLD:
        high[iso] += mw

world_total = sum(total.values())
world_high = sum(high.values())
countries = [
    {
        "iso3": iso,
        "name": names[iso],
        "totalGW": round(total[iso] / 1000, 1),
        "highGW": round(high[iso] / 1000, 1),
        "share": round(high[iso] / total[iso], 3),
    }
    for iso in total
    if total[iso] >= 5000
]
countries.sort(key=lambda c: -c["highGW"])
out = {
    "source": {"name": "WRI Global Power Plant Database v1.3", "url": "https://datasets.wri.org/dataset/globalpowerplantdatabase", "license": "CC BY 4.0"},
    "method": f"Share of installed capacity at |geomagnetic latitude| >= {THRESHOLD:.0f} degrees (centred dipole, pole {POLE_LAT} N {POLE_LON} E)",
    "vintage": "2021 release, mostly 2017-2019 data",
    "world": {"totalGW": round(world_total / 1000), "highGW": round(world_high / 1000), "share": round(world_high / world_total, 3)},
    "countries": countries[:25],
}
with open("public/data/solar_exposure.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print("exposure:", out["world"], "top:", [(c["name"], c["highGW"], c["share"]) for c in countries[:5]])

# ---- submarine cables
req = urllib.request.Request("https://www.submarinecablemap.com/api/v3/cable/cable-geo.json", headers={"User-Agent": "monitoring-dashboard/0.1"})
geo = json.load(urllib.request.urlopen(req, timeout=60))
features = []
for ft in geo["features"]:
    g = ft["geometry"]
    lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
    thin = []
    for line in lines:
        pts = [[round(x[0], 2), round(x[1], 2)] for x in line[::3]]
        if len(pts) < 2:
            pts = [[round(x[0], 2), round(x[1], 2)] for x in line]
        if len(pts) >= 2:
            thin.append(pts)
    if thin:
        features.append({"type": "Feature", "properties": {"name": ft["properties"].get("name", "")}, "geometry": {"type": "MultiLineString", "coordinates": thin}})
with open("public/data/cables.json", "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": features, "source": {"name": "TeleGeography Submarine Cable Map", "url": "https://www.submarinecablemap.com/", "license": "CC BY-NC-SA 3.0"}}, f, separators=(",", ":"))
print("cables:", len(features))
