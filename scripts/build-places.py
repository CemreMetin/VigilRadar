"""One-off: places for the map search box -> public/data/places.json.
GeoNames cities with 100,000+ people (CC BY 4.0) plus countries from data/countries.json.
Row: [name, lat, lon, kind, country iso2]; kind is 0 for a country, 1 for a city. Loaded only when the search box is first used."""
import io, json, urllib.request, zipfile

req = urllib.request.Request("https://download.geonames.org/export/dump/cities15000.zip", headers={"User-Agent": "monitoring-dashboard/0.1"})
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req, timeout=120).read()))
rows = []
for c in json.load(open("data/countries.json", encoding="utf-8")):
    rows.append([c["name"], round(c["lat"], 2), round(c["lon"], 2), 0, c["iso2"]])
cities = []
for line in z.read("cities15000.txt").decode("utf-8").splitlines():
    f = line.split("\t")
    pop = int(f[14] or 0)
    if pop >= 100000:
        cities.append((pop, [f[2] or f[1], round(float(f[4]), 2), round(float(f[5]), 2), 1, f[8]]))
rows += [r for _, r in sorted(cities, key=lambda x: -x[0])]  # biggest first, so ties in search favour them
json.dump(rows, open("public/data/places.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(rows), "places")
