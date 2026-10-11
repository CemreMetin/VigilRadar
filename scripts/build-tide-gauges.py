"""One-off: relative sea-level trends at tide gauges, from PSMSL annual RLR data.

For every station with enough recent data, fit an ordinary least-squares line to the annual mean sea
level over the last 30 years of its record and keep the slope in mm per year.

Important: this is RELATIVE sea level, as a tide gauge on land sees it. It includes land that is sinking
(groundwater pumping, sediment compaction) or rising (post-glacial rebound), so it is not the global
average and should not be read as one. Global mean sea level comes from satellite altimetry (NOAA).

Data: Permanent Service for Mean Sea Level (PSMSL), https://psmsl.org/data/obtaining/ .
PSMSL asks users to acknowledge it and the data suppliers; see its data policy.

Usage: python scripts/build-tide-gauges.py   (downloads about 15 MB)
Output: public/data/tide_gauges.json
"""
import io, json, urllib.request, zipfile

URL = "https://psmsl.org/data/obtaining/rlr.annual.data/rlr_annual.zip"
WINDOW = 30  # years
MIN_POINTS = 20
MIN_LAST_YEAR = 2015

req = urllib.request.Request(URL, headers={"User-Agent": "monitoring-dashboard/0.1"})
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(req, timeout=180).read()))

stations = []
for line in z.read("rlr_annual/filelist.txt").decode("latin-1").splitlines():
    parts = [p.strip() for p in line.split(";")]
    if len(parts) < 4:
        continue
    try:
        stations.append((int(parts[0]), float(parts[1]), float(parts[2]), parts[3].title()))
    except ValueError:
        continue

out = []
for sid, lat, lon, name in stations:
    try:
        raw = z.read(f"rlr_annual/data/{sid}.rlrdata").decode("latin-1").splitlines()
    except KeyError:
        continue
    pts = []
    for row in raw:
        f = [x.strip() for x in row.split(";")]
        if len(f) < 2:
            continue
        try:
            year, mm = int(float(f[0])), float(f[1])
        except ValueError:
            continue
        if mm > -90000:
            pts.append((year, mm))
    if not pts:
        continue
    last = max(y for y, _ in pts)
    if last < MIN_LAST_YEAR:
        continue
    win = [(y, v) for y, v in pts if y > last - WINDOW]
    if len(win) < MIN_POINTS:
        continue
    n = len(win)
    mx = sum(y for y, _ in win) / n
    my = sum(v for _, v in win) / n
    sxx = sum((y - mx) ** 2 for y, _ in win)
    slope = sum((y - mx) * (v - my) for y, v in win) / sxx
    out.append([sid, name, round(lat, 3), round(lon, 3), round(slope, 2), n, last])

out.sort(key=lambda r: r[0])
doc = {
    "source": {"name": "PSMSL (Permanent Service for Mean Sea Level), RLR annual", "url": "https://psmsl.org/", "license": "Free to use with acknowledgement of PSMSL and the data suppliers"},
    "note": "Relative sea level at each gauge: includes land motion. Slope over the last 30 years of each record, mm per year.",
    "fields": ["id", "name", "lat", "lon", "trend_mm_per_yr", "years_used", "last_year"],
    "stations": out,
}
with open("public/data/tide_gauges.json", "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))
rising = sum(1 for r in out if r[4] > 0)
print(len(out), "stations;", rising, "rising;", "median trend", sorted(r[4] for r in out)[len(out) // 2])
