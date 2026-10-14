"""One-off: country outlines for the shaded map layers -> public/data/countries.geo.json.
Natural Earth 1:110m admin-0 (public domain), coordinates rounded to 0.1 degree and small islands dropped so the
file stays light. Properties: iso3 (ISO 3166-1 alpha-3, ADM0_A3 where ISO_A3 is missing) and name.
Run: python scripts/build-countries-geo.py"""
import json, urllib.request

URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
src = json.load(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "monitoring-dashboard/0.1"}), timeout=120))


def ring(r):
    out = []
    for lon, lat in r:
        p = [round(lon, 1), round(lat, 1)]
        if not out or p != out[-1]:
            out.append(p)
    return out if len(out) >= 4 else None


feats = []
for f in src["features"]:
    p = f["properties"]
    iso = p.get("ISO_A3_EH") if p.get("ISO_A3_EH", "-99") != "-99" else p.get("ADM0_A3")
    if not iso or iso == "ATA":  # Antarctica: no data and it would only shade the pole
        continue
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    polys = [[r for r in (ring(x) for x in poly) if r] for poly in polys]
    polys = [pl for pl in polys if pl]
    if not polys:
        continue
    feats.append({"type": "Feature", "properties": {"iso3": iso, "name": p.get("NAME")}, "geometry": {"type": "MultiPolygon", "coordinates": polys}})
json.dump({"type": "FeatureCollection", "features": feats}, open("public/data/countries.geo.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(feats), "countries")
