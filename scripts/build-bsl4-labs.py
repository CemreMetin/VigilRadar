"""One-off: public/data/bsl4_labs.json, a PARTIAL reference layer of laboratories that operate at biosafety level 4.

Why partial: the Global BioLabs report (King's College London, 2023) counts 69 BSL-4 laboratories (51 operating, 3
under construction, 15 planned) in 27 countries, but publishes totals, not a downloadable list of sites with
coordinates. So this file lists only laboratories whose English Wikipedia article itself says it has BSL-4 (or
"biosafety level 4") containment, with the coordinates Wikipedia gives. Each row links to that article.
It is reference data, not a risk ranking, and it omits most of the labs the report counts.
Run: python scripts/build-bsl4-labs.py"""
import json, re, time, urllib.error, urllib.parse, urllib.request
from datetime import date

UA = {"User-Agent": "monitoring-dashboard/0.1 (personal, non-commercial project)"}
# (Wikipedia article title, country). A candidate is kept only if its article text mentions BSL-4 containment.
CANDIDATES = [
    ("Integrated Research Facility at Fort Detrick", "United States"),
    ("United States Army Medical Research Institute of Infectious Diseases", "United States"),
    ("Rocky Mountain Laboratories", "United States"),
    ("National Bio and Agro-Defense Facility", "United States"),
    ("Galveston National Laboratory", "United States"),
    ("National Emerging Infectious Diseases Laboratories", "United States"),
    ("Wuhan Institute of Virology", "China"),
    ("Vector Institute", "Russia"),
    ("Australian Centre for Disease Preparedness", "Australia"),
    ("National Microbiology Laboratory", "Canada"),
    ("Robert Koch Institute", "Germany"),
    ("Bernhard Nocht Institute for Tropical Medicine", "Germany"),
    ("Philipps University of Marburg", "Germany"),
    ("Laboratoire P4 Jean Mérieux", "France"),
    ("Spiez Laboratory", "Switzerland"),
    ("Lazzaro Spallanzani National Institute for Infectious Diseases", "Italy"),
    ("National Institute for Communicable Diseases", "South Africa"),
    ("National Institute of Virology", "India"),
    ("National Institute of Infectious Diseases", "Japan"),
    ("Porton Down", "United Kingdom"),
    ("Pirbright Institute", "United Kingdom"),
    ("Gamaleya Research Institute of Epidemiology and Microbiology", "Russia"),
]
BSL4 = re.compile(r"BSL[- ]?4|biosafety level[- ]4|biosafety level 4|\bP4 (?:lab|facility|laborator)", re.I)


def api(params):
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    for wait in (1.5, 8, 30, 60):  # the API answers 429 when asked too fast: back off and retry
        time.sleep(wait)
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise RuntimeError("rate limited")


rows = []
for title, country in CANDIDATES:
    r = api({"action": "query", "titles": title, "prop": "extracts|coordinates|info", "explaintext": 1, "redirects": 1, "inprop": "url"})
    page = r["query"]["pages"][0]
    if page.get("missing"):
        print("missing   ", title)
        continue
    text = page.get("extract", "")
    hit = BSL4.search(text)
    coord = (page.get("coordinates") or [None])[0]
    if not hit or not coord:
        print("skipped   ", title, "(no BSL-4 statement)" if not hit else "(no coordinates)")
        continue
    # keep the sentence that states it, so the reader (and a reviewer) can see why the row is here
    start = max(text.rfind(".", 0, hit.start()) + 1, 0)
    end = text.find(".", hit.end())
    claim = " ".join(text[start : end + 1].split())[:220]
    print("kept      ", title, "|", claim[:90])
    rows.append([page["title"], round(coord["lat"], 3), round(coord["lon"], 3), country, page["fullurl"], claim])

doc = {
    "source": {"name": "English Wikipedia (articles stating BSL-4 containment)", "url": "https://en.wikipedia.org/", "license": "CC BY-SA 4.0 (text); coordinates as given in each article"},
    "context": {
        "name": "Global BioLabs Report 2023, King's College London and George Mason University",
        "url": "https://www.kcl.ac.uk/warstudies/assets/global-biolabs-report-2023.pdf",
        "text": "Counts 69 BSL-4 laboratories in 27 countries: 51 operating, 3 under construction, 15 planned. It publishes totals, not a list of sites, so this layer shows only a partial sample.",
    },
    "note": "Reference data, not a risk ranking and not a complete list.",
    "retrieved": date.today().isoformat(),
    "fields": ["name", "lat", "lon", "country", "source", "statement"],
    "labs": rows,
}
json.dump(doc, open("public/data/bsl4_labs.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(rows), "labs kept")
