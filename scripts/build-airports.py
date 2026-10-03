"""One-off: build public/data/airports.json for the Pandemic X explorer.

Method (Brockmann & Helbing 2013, Science 342:1337, "The hidden geometry of complex,
network-driven contagion phenomena"): on a directed air-travel network, let F[n->m] be the flux from n
to m and P[n->m] = F[n->m] / sum_k F[n->k]. The effective distance is d[n->m] = 1 - ln P[n->m].
Shortest effective-distance paths predict the order and relative timing in which an epidemic seeded
at n reaches other airports far better than geographic distance does.

Flux proxy: number of airline-route records between two airports (OpenFlights has no passenger counts).
OpenFlights data are ODbL 1.0 and mostly date from about 2017, so new routes and the COVID-era changes
are missing. The output is illustrative.

Usage: python scripts/build-airports.py   (downloads ~3.5 MB)
"""
import csv, heapq, io, json, math, urllib.request
from collections import defaultdict

BASE = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/"
ORIGINS = ["IST", "LHR", "JFK", "GRU", "JNB", "LOS", "CAI", "DXB", "DEL", "PEK", "SIN", "SYD"]
TOP_N = 700


def get(name):
    req = urllib.request.Request(BASE + name, headers={"User-Agent": "monitoring-dashboard/0.1"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")


airports = {}
for r in csv.reader(io.StringIO(get("airports.dat"))):
    iata = r[4]
    if len(iata) == 3 and iata != "\\N":
        airports[iata] = {"name": r[1], "city": r[2], "country": r[3], "lat": float(r[6]), "lon": float(r[7])}

flux = defaultdict(lambda: defaultdict(int))
for r in csv.reader(io.StringIO(get("routes.dat"))):
    s, d = r[2], r[4]
    if s in airports and d in airports and s != d:
        flux[s][d] += 1

degree = defaultdict(int)
for s, ds in flux.items():
    for d, w in ds.items():
        degree[s] += w
        degree[d] += w
kept = sorted(degree, key=lambda a: -degree[a])[:TOP_N]
index = {a: i for i, a in enumerate(kept)}

# P normalised over ALL destinations of n (full network), edges kept only between kept airports
edges = defaultdict(list)
for s in kept:
    total = sum(flux[s].values())
    for d, w in flux[s].items():
        if d in index:
            edges[index[s]].append((index[d], 1 - math.log(w / total)))


def dijkstra(src):
    dist = [-1.0] * len(kept)
    parent = [-1] * len(kept)
    dist[src] = 0.0
    heap = [(0.0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in edges[u]:
            nd = d + w
            if dist[v] < 0 or nd < dist[v]:
                dist[v] = nd
                parent[v] = u
                heapq.heappush(heap, (nd, v))
    return dist, parent


out_origins = {}
for o in ORIGINS:
    if o not in index:
        print("origin missing:", o)
        continue
    dist, parent = dijkstra(index[o])
    out_origins[o] = {"d": [round(x, 2) for x in dist], "p": parent}
    reach = sum(1 for x in dist if x >= 0)
    far = max(dist)
    print(o, "reaches", reach, "of", len(kept), "max d_eff", round(far, 1))

out = {
    "source": {
        "name": "OpenFlights airports and routes",
        "url": "https://openflights.org/data.html",
        "license": "ODbL 1.0",
    },
    "method": "Effective distance (Brockmann & Helbing, Science 2013); flux proxy = airline-route records",
    "vintage": "Mostly 2017 route data; later changes are not included",
    "airports": [
        [a, airports[a]["name"], airports[a]["city"], airports[a]["country"], round(airports[a]["lat"], 3), round(airports[a]["lon"], 3), degree[a]]
        for a in kept
    ],
    "origins": out_origins,
}
with open("public/data/airports.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print("airports.json written:", len(kept), "airports")
