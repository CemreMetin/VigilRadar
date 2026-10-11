"""Military bases from Wikidata (CC0): instances of 'military base', 'airbase' or 'naval base'
that have coordinates. Writes public/data/military_bases.json as compact arrays.
Run by hand when you want to refresh; the file is committed. Wikidata is a volunteer-edited
source, so coverage is uneven: it is a reference layer, not a complete or current order of battle."""
import json, urllib.parse, urllib.request, re, sys

Q = """
SELECT ?i ?l ?c ?cl ?t WHERE {
  VALUES ?t { wd:Q245016 wd:Q695850 wd:Q1324633 }
  ?i wdt:P31 ?t .
  ?i wdt:P625 ?c .
  OPTIONAL { ?i wdt:P17 ?co . ?co rdfs:label ?cl FILTER(lang(?cl)="en") }
  ?i rdfs:label ?l FILTER(lang(?l)="en")
}
"""
req = urllib.request.Request(
    "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": Q}),
    headers={"Accept": "application/sparql-results+json", "User-Agent": "MonitoringDashboard/0.1 (personal project)"},
)
rows = json.load(urllib.request.urlopen(req, timeout=170))["results"]["bindings"]
out = {}
for r in rows:
    m = re.match(r"Point\(([-\d.]+) ([-\d.]+)\)", r["c"]["value"])
    if not m:
        continue
    qid = r["i"]["value"].rsplit("/", 1)[1]
    kind = {"Q695850": "air", "Q1324633": "naval"}.get(r["t"]["value"].rsplit("/", 1)[1], "base")
    out[qid] = [qid, r["l"]["value"], round(float(m.group(2)), 3), round(float(m.group(1)), 3), r.get("cl", {}).get("value", ""), kind]
stations = sorted(out.values(), key=lambda x: x[1])
doc = {
    "source": {"name": "Wikidata (military base, airbase, naval base)", "url": "https://www.wikidata.org/wiki/Q245016", "license": "CC0 1.0"},
    "retrieved": __import__("datetime").date.today().isoformat(),
    "note": "Volunteer-edited reference data: coverage is uneven and some entries are historical or closed. Not an order of battle. Fleet positions are not public data and are not shown.",
    "fields": ["id", "name", "lat", "lon", "country", "kind"],
    "bases": stations,
}
json.dump(doc, open("public/data/military_bases.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(stations), "bases")
