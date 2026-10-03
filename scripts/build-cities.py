"""One-off: GeoNames cities15000 (CC BY 4.0) -> data/cities.json as [lat, lon, population] triples.
Used by the link engine to estimate residents of cities within a radius of an event (a lower bound).
"""
import io, json, urllib.request, zipfile

req = urllib.request.Request("https://download.geonames.org/export/dump/cities15000.zip", headers={"User-Agent": "monitoring-dashboard/0.1"})
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req, timeout=120).read()))
rows = []
for line in z.read("cities15000.txt").decode("utf-8").splitlines():
    c = line.split("\t")
    pop = int(c[14] or 0)
    if pop >= 15000:
        rows.append([round(float(c[4]), 3), round(float(c[5]), 3), pop])
json.dump(rows, open("data/cities.json", "w"), separators=(",", ":"))
print(len(rows), "cities")
