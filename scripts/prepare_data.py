"""Chuẩn bị dữ liệu thật cho các bài học và sinh kết quả tham chiếu để kiểm thử ml-core.

Chạy:  python3 scripts/prepare_data.py
Đầu vào: data/raw/housing.csv (California Housing, điều tra dân số Mỹ 1990)
         Breast Cancer Wisconsin (Diagnostic) có sẵn trong scikit-learn
Đầu ra:  src/data/*.json  (dữ liệu cho trang)
         tests/fixtures/*.json (kết quả NumPy/scikit-learn để đối chiếu)
"""
import csv
import json
import math
from pathlib import Path

import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LinearRegression, LogisticRegression

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data"
FIX = ROOT / "tests" / "fixtures"
OUT.mkdir(parents=True, exist_ok=True)
FIX.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(42)


def r(v, d=4):
    return None if v is None or (isinstance(v, float) and math.isnan(v)) else round(float(v), d)


def dump(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    print("wrote", path.relative_to(ROOT), f"{path.stat().st_size/1024:.1f} KB")


# ---------------------------------------------------------------- California Housing
rows = list(csv.DictReader(open(ROOT / "data" / "raw" / "housing.csv")))
n_total = len(rows)
missing_bedrooms = sum(1 for x in rows if x["total_bedrooms"] == "")
capped = sum(1 for x in rows if float(x["median_house_value"]) >= 500001)
inc_all = np.array([float(x["median_income"]) for x in rows])          # đơn vị: 10.000 USD
val_all = np.array([float(x["median_house_value"]) for x in rows]) / 1e5  # đơn vị: 100.000 USD

idx = rng.choice(n_total, size=400, replace=False)
sample = []
for i in idx:
    x = rows[i]
    sample.append({
        "id": int(i),
        "income": r(float(x["median_income"])),
        "value": r(float(x["median_house_value"]) / 1e5),
        "age": int(float(x["housing_median_age"])),
        "rooms": int(float(x["total_rooms"])),
        "bedrooms": None if x["total_bedrooms"] == "" else int(float(x["total_bedrooms"])),
        "population": int(float(x["population"])),
        "ocean": x["ocean_proximity"],
        "lat": r(float(x["latitude"]), 2),
        "lon": r(float(x["longitude"]), 2),
    })

# 5 căn cho phần tính tay: chọn trải đều theo thu nhập, bỏ căn bị chặn trần
pool = sorted([s for s in sample if s["value"] < 5.0], key=lambda s: s["income"])
mini = [pool[int(q * (len(pool) - 1))] for q in (0.1, 0.3, 0.5, 0.7, 0.9)]

# 80/20 train/test cố định trên mẫu 400
perm = rng.permutation(len(sample))
test_ids = sorted(int(sample[i]["id"]) for i in perm[:80])

hist_inc, edges_inc = np.histogram(inc_all, bins=30)
hist_val, edges_val = np.histogram(val_all, bins=30)

dump(OUT / "housing.json", {
    "source": "California Housing (U.S. Census 1990), bản CSV trong ageron/handson-ml2",
    "nTotal": n_total,
    "missingBedrooms": missing_bedrooms,
    "capped": capped,
    "sample": sample,
    "mini": mini,
    "testIds": test_ids,
    "hist": {
        "income": {"counts": hist_inc.tolist(), "edges": [r(e) for e in edges_inc]},
        "value": {"counts": hist_val.tolist(), "edges": [r(e) for e in edges_val]},
    },
    "stats": {
        "incomeMean": r(inc_all.mean()), "incomeStd": r(inc_all.std()),
        "valueMean": r(val_all.mean()), "valueStd": r(val_all.std()),
        "corr": r(np.corrcoef(inc_all, val_all)[0, 1]),
    },
})

# ---------------------------------------------------------------- Breast Cancer Wisconsin
bc = load_breast_cancer()
names = list(bc.feature_names)
f1, f2 = names.index("mean radius"), names.index("mean texture")
X_raw = bc.data[:, [f1, f2]]
y = (bc.target == 0).astype(int)  # 1 = ác tính (malignant), 0 = lành tính
mu, sd = X_raw.mean(axis=0), X_raw.std(axis=0)
Xs = (X_raw - mu) / sd
patients = [{"id": i, "radius": r(X_raw[i, 0], 3), "texture": r(X_raw[i, 1], 3),
             "x1": r(Xs[i, 0]), "x2": r(Xs[i, 1]), "y": int(y[i])} for i in range(len(y))]
# 6 bệnh nhân cho phần tính tay: 3 ác tính, 3 lành tính, đa dạng
mal = [p for p in patients if p["y"] == 1]
ben = [p for p in patients if p["y"] == 0]
mal.sort(key=lambda p: p["x1"]); ben.sort(key=lambda p: p["x1"])
mini_bc = [mal[len(mal) // 6], mal[len(mal) // 2], mal[5 * len(mal) // 6],
           ben[len(ben) // 6], ben[len(ben) // 2], ben[5 * len(ben) // 6]]
perm = rng.permutation(len(patients))
test_bc = sorted(int(i) for i in perm[:114])
dump(OUT / "cancer.json", {
    "source": "Breast Cancer Wisconsin (Diagnostic), UCI; bản có sẵn trong scikit-learn",
    "features": ["mean radius", "mean texture"],
    "mean": [r(m) for m in mu], "std": [r(s) for s in sd],
    "nMalignant": int(y.sum()), "nBenign": int((1 - y).sum()),
    "patients": patients, "mini": mini_bc, "testIds": test_bc,
})

# ---------------------------------------------------------------- Kết quả tham chiếu


def gd_linreg(x, t, w, b, lr, epochs, fit_b=True):
    hist = []
    n = len(x)
    for _ in range(epochs):
        p = w * x + b
        e = p - t
        loss = np.mean(e ** 2)
        dw = 2 / n * np.sum(e * x)
        db = 2 / n * np.sum(e) if fit_b else 0.0
        hist.append({"w": w, "b": b, "loss": loss, "dw": dw, "db": db})
        w, b = w - lr * dw, b - lr * db
    return {"history": hist, "w": w, "b": b}


def gd_logreg(X, t, lr, epochs):
    w = np.zeros(2); b = 0.0; n = len(t); hist = []
    for _ in range(epochs):
        z = X @ w + b
        p = 1 / (1 + np.exp(-z))
        pc = np.clip(p, 1e-12, 1 - 1e-12)
        loss = -np.mean(t * np.log(pc) + (1 - t) * np.log(1 - pc))
        gw = X.T @ (p - t) / n
        gb = np.mean(p - t)
        hist.append({"w": w.tolist(), "b": b, "loss": loss})
        w, b = w - lr * gw, b - lr * gb
    return {"history": hist, "w": w.tolist(), "b": b}


mx = np.array([m["income"] for m in mini]); my = np.array([m["value"] for m in mini])
sx = np.array([s["income"] for s in sample]); sy = np.array([s["value"] for s in sample])
ols = LinearRegression().fit(sx.reshape(-1, 1), sy)
Xb = np.array([[p["x1"], p["x2"]] for p in patients]); yb = np.array([p["y"] for p in patients])
sk_log = LogisticRegression(C=np.inf, max_iter=10000, tol=1e-12).fit(Xb, yb)
dump(FIX / "reference.json", {
    "gd1d": gd_linreg(mx, my, 0.0, 0.0, 0.01, 30, fit_b=False),
    "linregMini": gd_linreg(mx, my, 0.0, 0.0, 0.02, 50),
    "linregSample": gd_linreg(sx, sy, 0.0, 0.0, 0.02, 200),
    "olsSample": {"w": float(ols.coef_[0]), "b": float(ols.intercept_)},
    "logreg": gd_logreg(Xb, yb, 0.5, 300),
    "sklearnLogreg": {"w": sk_log.coef_[0].tolist(), "b": float(sk_log.intercept_[0])},
})
