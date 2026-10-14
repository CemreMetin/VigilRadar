"""One-off: public/data/nuclear_targets.json, the sites behind the "Possible target areas" layer.

This is an ILLUSTRATIVE reference list, not a target list or a forecast: sites that open sources associate with
nuclear forces, so the map can show what a nuclear explosion of a fixed example size would affect. It is partial
(coverage differs a lot by country) and says nothing about intentions or likelihood.

Sources, per row:
  - FAS: Federation of American Scientists Nuclear Notebook (Kristensen, Korda et al., Bulletin of the Atomic
    Scientists). Base names from the US 2025, UK 2024, French 2023 and Indian 2024 editions. Coordinates printed in the
    Russian 2023 and Chinese 2025 editions (ICBM garrisons and missile brigades) are used as published.
  - Wikidata (CC0) supplies coordinates for the named bases.
  - GeoNames (CC BY 4.0) supplies capitals (feature code PPLC).
Needs `pdftotext` (poppler) and network access. Run: python scripts/build-nuclear-targets.py
"""
import io, json, re, subprocess, tempfile, time, urllib.error, urllib.parse, urllib.request, zipfile
from pathlib import Path

UA = {"User-Agent": "monitoring-dashboard/0.1 (personal, non-commercial project)"}
FAS = "https://fas.org/wp-content/uploads"
DOCS = {
    "ru": ("Russian nuclear weapons, 2023", f"{FAS}/2023/05/Russian-nuclear-weapons-2023.pdf"),
    "cn": ("Chinese nuclear weapons, 2025", f"{FAS}/2025/03/Chinese-nuclear-weapons-2025.pdf"),
    "us": ("United States nuclear weapons, 2025", f"{FAS}/2025/01/United-States-nuclear-weapons-2025.pdf"),
}

# (name, Wikidata search text, country iso2, category, role in the FAS edition that names it)
NAMED = [
    ("F.E. Warren Air Force Base", "F. E. Warren Air Force Base", "US", "strategic-forces", "ICBM wing", "us"),
    ("Malmstrom Air Force Base", "Malmstrom Air Force Base", "US", "strategic-forces", "ICBM wing", "us"),
    ("Minot Air Force Base", "Minot Air Force Base", "US", "strategic-forces", "ICBM wing and bomber base", "us"),
    ("Whiteman Air Force Base", "Whiteman Air Force Base", "US", "strategic-forces", "bomber base", "us"),
    ("Barksdale Air Force Base", "Barksdale Air Force Base", "US", "strategic-forces", "bomber base", "us"),
    ("Naval Submarine Base Kings Bay", "Naval Submarine Base Kings Bay", "US", "strategic-forces", "ballistic-missile submarine base (Atlantic)", "us"),
    ("Naval Base Kitsap (Bangor)", "Naval Base Kitsap", "US", "strategic-forces", "ballistic-missile submarine base (Pacific)", "us"),
    ("Kirtland Air Force Base", "Kirtland Air Force Base", "US", "weapons-storage", "Kirtland Underground Munitions Maintenance and Storage Complex", "us"),
    ("Pantex Plant", "Pantex Plant", "US", "weapons-storage", "warhead assembly and storage", "us"),
    ("Aviano Air Base", "Aviano Air Base", "IT", "weapons-storage", "B61 bombs stored (NATO nuclear sharing)", "us"),
    ("Ghedi Air Base", "Ghedi Air Base", "IT", "weapons-storage", "B61 bombs stored (NATO nuclear sharing)", "us"),
    ("Büchel Air Base", "Büchel Air Base", "DE", "weapons-storage", "B61 bombs stored (NATO nuclear sharing)", "us"),
    ("Incirlik Air Base", "Incirlik Air Base", "TR", "weapons-storage", "B61 bombs stored (NATO nuclear sharing)", "us"),
    ("Kleine Brogel Air Base", "Kleine Brogel Air Base", "BE", "weapons-storage", "B61 bombs stored (NATO nuclear sharing)", "us"),
    ("Volkel Air Base", "Volkel Air Base", "NL", "weapons-storage", "B61 bombs stored (NATO nuclear sharing)", "us"),
    ("RAF Lakenheath", "RAF Lakenheath", "GB", "weapons-storage", "storage facilities being reinstated", "us"),
    ("HMNB Clyde (Faslane)", "HMNB Clyde", "GB", "strategic-forces", "ballistic-missile submarine base", "uk"),
    ("RNAD Coulport", "Royal Naval Armaments Depot Coulport", "GB", "weapons-storage", "warhead storage for the submarines", "uk"),
    ("AWE Aldermaston", "Q757609", "GB", "weapons-storage", "warhead design and production", "uk"),
    ("AWE Burghfield", "AWE Burghfield", "GB", "weapons-storage", "warhead assembly and storage", "uk"),
    ("Île Longue", "Q292099", "FR", "strategic-forces", "ballistic-missile submarine base", "fr"),
    ("Saint-Dizier Air Base", "Q1618726", "FR", "strategic-forces", "nuclear-armed Rafale squadrons", "fr"),
    ("Istres Air Base", "Istres-Le Tubé Air Base", "FR", "strategic-forces", "dispersal and storage site", "fr"),
    ("Avord Air Base", "Avord Air Base", "FR", "strategic-forces", "dispersal and storage site", "fr"),
    ("Q1934993", "Q1934993", "FR", "strategic-forces", "carrier-based nuclear aircraft", "fr"),
    ("Karwar naval base (INS Kadamba)", "INS Kadamba", "IN", "strategic-forces", "naval base named for the SSBN fleet", "in"),
]
CAPITAL_COUNTRIES = ["US", "RU", "GB", "FR", "CN", "IN", "PK", "KP", "IL", "BE", "DE", "IT", "NL", "TR"]  # nine nuclear-armed states and NATO nuclear-sharing hosts


def fetch(url, binary=False):
    for wait in (0, 5, 15, 40):  # Wikidata answers 429 when asked too fast: back off and retry
        time.sleep(wait or 0.8)
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read()
            return data if binary else data.decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise RuntimeError("rate limited: " + url)


def pdf_lines(key):
    title, url = DOCS[key]
    with tempfile.TemporaryDirectory() as d:
        pdf = Path(d) / "x.pdf"
        pdf.write_bytes(fetch(url, True))
        txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    return txt.split("\n")


def wikidata_point(search):
    if re.fullmatch(r"Q\d+", search):  # a fixed Wikidata id: the name search is ambiguous for some places
        hits = [{"id": search, "label": search}]
    else:
        hits = None
    q = urllib.parse.urlencode({"action": "wbsearchentities", "search": search, "language": "en", "type": "item", "limit": 5, "format": "json"})
    for hit in hits or json.loads(fetch("https://www.wikidata.org/w/api.php?" + q))["search"]:
        e = json.loads(fetch(f"https://www.wikidata.org/wiki/Special:EntityData/{hit['id']}.json"))["entities"][hit["id"]]
        claim = e.get("claims", {}).get("P625")
        if claim:
            v = claim[0]["mainsnak"]["datavalue"]["value"]
            return hit["id"], e.get("labels", {}).get("en", {}).get("value", hit.get("label")), v["latitude"], v["longitude"]
    return None


rows = []

# 1. Named bases: coordinates from Wikidata
for name, search, iso2, category, role, doc in NAMED:
    hit = wikidata_point(search)
    if not hit:
        print("NOT FOUND:", name)
        continue
    qid, label, lat, lon = hit
    print(f"{name:38} -> {label} ({qid}) {lat:.3f}, {lon:.3f}")
    title = {"us": "United States nuclear weapons, 2025", "uk": "United Kingdom nuclear weapons, 2024", "fr": "French nuclear weapons, 2023", "in": "Indian nuclear weapons, 2024"}[doc]
    rows.append([name, round(lat, 3), round(lon, 3), category, iso2, role, f"FAS Nuclear Notebook: {title}; coordinates Wikidata {qid}"])

# 2. Russia: ICBM garrisons, coordinates as printed in the FAS table
ru = pdf_lines("ru")
start = next(i for i, l in enumerate(ru) if "Estimated status of Russian ICBM forces" in l)
for l in ru[start : start + 60]:
    if l.startswith("Abbreviations"):
        break
    m = re.search(r"(?:(\d+(?:st|nd|rd|th) G?MR)\s+)?\((\d+\.\d+),\s*(\d+\.\d+)\)", l)
    if m:
        unit = m.group(1)
        rows.append([f"ICBM garrison ({unit})" if unit else "ICBM garrison", float(m.group(2)), float(m.group(3)), "strategic-forces", "RU", "missile regiment site, Strategic Rocket Forces", "FAS Nuclear Notebook: Russian nuclear weapons, 2023, Table 2 (coordinates as published)"])

# 3. China: missile brigades with a nuclear role or an ICBM type, coordinates as printed in the FAS table
cn = pdf_lines("cn")
start = next(i for i, l in enumerate(cn) if "Chinese missile brigades" in l)
for l in cn[start : start + 140]:
    m = re.search(r"(?:(\d{3}) Brigade\*?|HQ)\s+([A-Z][A-Za-z' ]+?(?: \([A-Za-z]+\))?) \((\d+\.\d+),\s*(\d+\.\d+)\)", l)
    if m and m.group(1) and (re.search(r"\bYes", l) or re.search(r"DF-(5|31|41)", l)):
        rows.append([f"PLARF {m.group(1)} Brigade ({m.group(2).strip()})", float(m.group(3)), float(m.group(4)), "strategic-forces", "CN", "missile brigade with a nuclear role or an ICBM type", "FAS Nuclear Notebook: Chinese nuclear weapons, 2025, Table 2 (coordinates as published)"])
    elif "PLARF HQ" in l and (h := re.search(r"\((\d+\.\d+),\s*(\d+\.\d+)\)", l)):
        rows.append(["PLARF headquarters (Beijing)", float(h.group(1)), float(h.group(2)), "command", "CN", "headquarters of the PLA Rocket Force", "FAS Nuclear Notebook: Chinese nuclear weapons, 2025, Table 2 (coordinates as published)"])
    elif "Yulin (Ordos)" in l and (h := re.search(r"\((\d+\.\d+),\s*(\d+\.\d+)\)", l)):
        rows.append(["Yulin silo field", float(h.group(1)), float(h.group(2)), "strategic-forces", "CN", "ICBM silo field (about 90 silos)", "FAS Nuclear Notebook: Chinese nuclear weapons, 2025, Table 2 (coordinates as published)"])

# 4. Capitals (GeoNames, feature code PPLC)
z = zipfile.ZipFile(io.BytesIO(fetch("https://download.geonames.org/export/dump/cities15000.zip", True)))
for line in z.read("cities15000.txt").decode("utf-8").splitlines():
    f = line.split("\t")
    if f[7] == "PPLC" and f[8] in CAPITAL_COUNTRIES:
        rows.append([f[2] or f[1], round(float(f[4]), 3), round(float(f[5]), 3), "capital", f[8], "national capital", "GeoNames (CC BY 4.0), feature code PPLC"])

doc = {
    "model": "illustrative",
    "note": "Reference list of sites that open sources associate with nuclear forces, plus national capitals. Illustrative, not a forecast or a target list: coverage is partial and uneven by country, and listing says nothing about intentions or likelihood.",
    "fields": ["name", "lat", "lon", "category", "country", "role", "source"],
    "categories": ["strategic-forces", "weapons-storage", "command", "capital"],
    "retrieved": __import__("datetime").date.today().isoformat(),
    "sites": rows,
}
Path("public/data/nuclear_targets.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
by = {}
for r in rows:
    by[r[3]] = by.get(r[3], 0) + 1
print(len(rows), "sites", by)
