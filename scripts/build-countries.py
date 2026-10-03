"""One-off: build data/countries.json from GeoNames countryInfo (CC BY 4.0) + country centroids
(gavinr/world-countries-centroids). Joined on ISO-2. Re-run rarely; commit the output.
"""
import csv, io, json, urllib.request

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "monitoring-dashboard/0.1"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8")

info = {}
for line in get("https://download.geonames.org/export/dump/countryInfo.txt").splitlines():
    if not line or line.startswith("#"):
        continue
    c = line.split("\t")
    info[c[0]] = {"iso2": c[0], "iso3": c[1], "fips": c[3], "name": c[4], "continent": c[8], "population": int(c[7] or 0)}

out = []
for r in csv.DictReader(io.StringIO(get("https://raw.githubusercontent.com/gavinr/world-countries-centroids/master/dist/countries.csv"))):
    i = info.get(r["ISO"])
    if not i:
        continue
    out.append({**i, "lat": round(float(r["latitude"]), 3), "lon": round(float(r["longitude"]), 3)})
out.sort(key=lambda x: x["name"])
json.dump(out, open("data/countries.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "countries;", len(info) - len(out), "without centroid")
