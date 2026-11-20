"""Chương 12 — tải dữ liệu gốc MỘT LẦN vào data/raw/hanoi/ (dữ liệu được đóng băng, prep_ch12.py chỉ đọc từ đây).

- Thời tiết theo giờ ERA5 tại trung tâm Hà Nội: Open-Meteo Historical Weather API (CC BY 4.0).
- PM2.5 mô hình CAMS: Open-Meteo Air Quality API (CC BY 4.0) — chỉ để so sánh, không làm nhãn.
- PM2.5 đo thật theo giờ: kho lưu trữ mở của OpenAQ trên AWS (openaq-data-archive), theo mã trạm.

Chạy: python3 scripts/fetch_ch12.py   (bỏ qua tệp đã có; xoá tệp để tải lại)
"""
import hashlib
import json
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "data/raw/hanoi"
RAW.mkdir(parents=True, exist_ok=True)
LAT, LON = 21.0285, 105.8542
END = "2026-11-15"  # ngày chốt dữ liệu
STATIONS = [int(s) for s in sys.argv[1:]]
if not STATIONS and (RAW / "stations.json").exists():
    STATIONS = json.load(open(RAW / "stations.json"))["ids"]


def get(url, tries=4):
    for k in range(tries):
        try:
            return urllib.request.urlopen(url, timeout=180).read()
        except Exception as e:  # mạng chập chờn: thử lại
            if k == tries - 1:
                raise
            print("  thử lại", url[:80], e)


def save(name, url):
    p = RAW / name
    if p.exists():
        return
    b = get(url)
    json.loads(b)  # phải là JSON hợp lệ, không bị cắt cụt
    p.write_bytes(b)
    print("đã tải", name, len(b) // 1024, "KB")


W = "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure,boundary_layer_height"
for y0, y1 in [("2022-01-01", "2022-12-31"), ("2023-01-01", "2023-12-31"), ("2024-01-01", "2024-12-31"), ("2025-01-01", "2025-12-31"), ("2026-01-01", END)]:
    q = dict(latitude=LAT, longitude=LON, start_date=y0, end_date=y1, hourly=W, wind_speed_unit="ms", timezone="Asia/Bangkok")
    save(f"weather-{y0[:4]}.json", "https://archive-api.open-meteo.com/v1/archive?" + urllib.parse.urlencode(q))
for y0, y1 in [("2022-08-01", "2023-12-31"), ("2024-01-01", "2025-06-30"), ("2025-07-01", END)]:
    q = dict(latitude=LAT, longitude=LON, start_date=y0, end_date=y1, hourly="pm2_5", timezone="Asia/Bangkok")
    save(f"cams-{y0[:7]}.json", "https://air-quality-api.open-meteo.com/v1/air-quality?" + urllib.parse.urlencode(q))

# ----- OpenAQ: mỗi trạm, mỗi ngày một tệp csv.gz; gộp lại thành một CSV theo trạm
B = "https://openaq-data-archive.s3.amazonaws.com/"


def keys(prefix):
    out, tok = [], None
    while True:
        q = {"list-type": "2", "prefix": prefix, "max-keys": "1000"}
        if tok:
            q["continuation-token"] = tok
        x = get(B + "?" + urllib.parse.urlencode(q)).decode()
        out += [k.split("</Key>")[0] for k in x.split("<Key>")[1:]]
        if "<NextContinuationToken>" not in x:
            return out
        tok = x.split("<NextContinuationToken>")[1].split("<")[0]


import csv  # noqa: E402
import gzip  # noqa: E402

for sid in STATIONS:
    p = RAW / f"openaq-{sid}.csv.gz"
    if p.exists():
        continue
    ks = [k for y in range(2022, 2027) for k in keys(f"records/csv.gz/locationid={sid}/year={y}/")]
    with ThreadPoolExecutor(32) as ex:
        parts = list(ex.map(lambda k: gzip.decompress(get(B + k)).decode(), ks))
    lines = []
    for i, t in enumerate(parts):
        rows = t.strip().split("\n")
        lines += (rows[:1] if i == 0 else []) + [r for r in rows[1:] if next(csv.reader([r]))[6] == "pm25"]  # chỉ giữ PM2.5
    with gzip.open(p, "wt", encoding="utf-8", compresslevel=9) as g:
        g.write("\n".join(lines) + "\n")
    print(f"trạm {sid}: {len(ks)} ngày, {len(lines) - 1} dòng")

# Mã băm của dữ liệu đóng băng, để biết dữ liệu không bị thay đổi giữa các lần chạy
h = {f.name: hashlib.sha256(f.read_bytes()).hexdigest()[:16] for f in sorted(RAW.glob("*")) if f.name != "SHA256.json"}
json.dump(h, open(RAW / "SHA256.json", "w"), indent=1)
