"""Chương 3 — Dữ liệu: xuất toàn bộ California Housing (dạng cột), Breast Cancer đủ 30 đặc trưng,
và các kết quả tham chiếu (pandas, NumPy, scikit-learn) để kiểm thử ml-core.

Chạy: python3 scripts/prep_du_lieu.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parent.parent
PUB, FIX = ROOT / "public/data", ROOT / "tests/fixtures"
CATS = ["<1H OCEAN", "INLAND", "NEAR OCEAN", "NEAR BAY", "ISLAND"]


# --- Bộ sinh ngẫu nhiên giống hệt mulberry32 trong ml-core/tree.ts ---
def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def imul(x, y):
        return (x * y) & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF
        t &= 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return rnd


def permutation(n, seed):
    rnd, a = mulberry32(seed), list(range(n))
    for i in range(n - 1, 0, -1):
        j = int(rnd() * (i + 1))
        a[i], a[j] = a[j], a[i]
    return a


def r(v, d):
    return None if v is None or (isinstance(v, float) and np.isnan(v)) else round(float(v), d)


# ---------- California đầy đủ ----------
df = pd.read_csv(ROOT / "data/raw/housing.csv")
cols = {
    "lon": ("longitude", 2), "lat": ("latitude", 2), "age": ("housing_median_age", 0), "rooms": ("total_rooms", 0),
    "bedrooms": ("total_bedrooms", 0), "pop": ("population", 0), "hh": ("households", 0), "income": ("median_income", 4),
}
cal = {"source": "California Housing (U.S. Census 1990), bản CSV trong ageron/handson-ml2", "n": len(df), "cats": CATS}
for k, (c, d) in cols.items():
    cal[k] = [r(v, d) if d else (None if np.isnan(v) else int(v)) for v in df[c]]
cal["value"] = [round(v / 1e5, 5) for v in df["median_house_value"]]
cal["ocean"] = [CATS.index(v) for v in df["ocean_proximity"]]
(PUB / "california.json").write_text(json.dumps(cal, separators=(",", ":")))

# ---------- Breast Cancer 30 đặc trưng ----------
bc = load_breast_cancer()
bc_test = sorted(permutation(569, 2026)[:114])
(PUB / "cancer30.json").write_text(json.dumps({
    "source": "Breast Cancer Wisconsin (Diagnostic), UCI; bản có sẵn trong scikit-learn",
    "features": list(bc.feature_names),
    "X": [[float(f"{v:.6g}") for v in row] for row in bc.data],
    "y": [int(1 - t) for t in bc.target],  # 1 = ác tính, như cancer.json
    "testIds": bc_test,
}, separators=(",", ":")))

# ---------- Tham chiếu ----------
ref = {}
num = ["longitude", "latitude", "housing_median_age", "total_rooms", "total_bedrooms", "population", "households", "median_income", "median_house_value"]
d = df[num].copy(); d["median_house_value"] = d["median_house_value"] / 1e5
desc = d.describe()
ref["profile"] = {c: {"count": int(desc[c]["count"]), "missing": int(d[c].isna().sum()), "mean": desc[c]["mean"], "std": desc[c]["std"],
                      "min": desc[c]["min"], "q1": desc[c]["25%"], "median": desc[c]["50%"], "q3": desc[c]["75%"], "max": desc[c]["max"],
                      "skew": float(d[c].skew()), "atMax": int((d[c] == d[c].max()).sum())} for c in num}
ref["corr"] = {"cols": num, "matrix": d.corr().values.tolist()}
inc10 = df["median_income"].values[:10]
ref["quantile10"] = {"x": inc10.tolist(), "q": [float(np.percentile(inc10, q)) for q in (25, 50, 75)]}

bed = df[["total_bedrooms"]].values
ref["impute"] = {
    "mean": float(SimpleImputer(strategy="mean").fit(bed).statistics_[0]),
    "median": float(SimpleImputer(strategy="median").fit(bed).statistics_[0]),
    "groupMedian": {c: float(v) for c, v in df.groupby("ocean_proximity")["total_bedrooms"].median().items()},
}
sub = df.iloc[:3000]
Z = StandardScaler().fit_transform(sub[["total_rooms", "households", "population"]].values)
knn = KNNImputer(n_neighbors=5).fit_transform(np.column_stack([Z, sub["total_bedrooms"].values]))
miss = np.where(sub["total_bedrooms"].isna().values)[0]
ref["impute"]["knn"] = {"rows": miss.tolist(), "values": knn[miss, 3].tolist()}

inc = df[["median_income"]].values
ss, mm = StandardScaler().fit(inc), MinMaxScaler().fit(inc)
ref["transform"] = {"mean": float(ss.mean_[0]), "scale": float(ss.scale_[0]), "min": float(mm.data_min_[0]), "max": float(mm.data_max_[0]),
                    "z5": ss.transform(inc[:5]).ravel().tolist(), "log1p5": np.log1p(df["population"].values[:5]).tolist()}
oh = OneHotEncoder(categories=[CATS]).fit_transform(df[["ocean_proximity"]].values[:10]).toarray()
ref["transform"]["onehot10"] = {"codes": [CATS.index(v) for v in df["ocean_proximity"][:10]], "matrix": oh.tolist()}

# GroupKFold: nhóm = ô 1° theo vĩ độ, kinh độ
blk = (np.floor(df["latitude"]).astype(int) * 1000 + np.floor(df["longitude"]).astype(int)).values
folds = np.zeros(len(df), int)
for k, (_, te) in enumerate(GroupKFold(n_splits=5).split(df, groups=blk)):
    folds[te] = k
ref["groupKFold"] = {"groups": blk.tolist(), "fold": folds.tolist()}
ref["permutation"] = {"n": 10, "seed": 7, "p": permutation(10, 7)}

# Hồi quy logistic L2 (C = 1) trên 455 ca huấn luyện đã chuẩn hoá
Xa = bc.data; ya = 1 - bc.target
trn = [i for i in range(569) if i not in set(bc_test)]
sc = StandardScaler().fit(Xa[trn]); Xs = sc.transform(Xa[trn]); ys = ya[trn]
lr = LogisticRegression(C=1.0, tol=1e-12, max_iter=100000).fit(Xs, ys)
ref["logreg"] = {"coef": [float(lr.intercept_[0])] + lr.coef_[0].tolist()}

# Lật nhãn 20% (cùng bộ sinh với ml-core), xác suất ngoài tập 5 phần liên tiếp, cờ nghi sai
rnd = mulberry32(11); yn = ys.copy(); flipped = []
for i in range(len(ys)):
    if rnd() < 0.2:
        yn[i] = 1 - yn[i]; flipped.append(i)
oof = np.zeros(len(ys))
for f in np.array_split(np.arange(len(ys)), 5):
    m = np.ones(len(ys), bool); m[f] = False
    oof[f] = LogisticRegression(C=1.0, tol=1e-12, max_iter=100000).fit(Xs[m], yn[m]).predict_proba(Xs[f])[:, 1]
pj = lambda i, j: oof[i] if j == 1 else 1 - oof[i]
t = [float(np.mean([pj(i, j) for i in range(len(yn)) if yn[i] == j])) for j in (0, 1)]
flags = sorted([i for i in range(len(yn)) if pj(i, 1 - yn[i]) >= t[1 - yn[i]]])
ref["noise"] = {"p": 0.2, "seed": 11, "flipped": flipped, "oof": oof.tolist(), "t": t, "flags": flags}

json.dump(ref, open(FIX / "dulieu.json", "w"))
print("california", (PUB / "california.json").stat().st_size // 1024, "KB; cancer30", (PUB / "cancer30.json").stat().st_size // 1024, "KB")
print("flipped", len(flipped), "flags", len(flags), "hit", len(set(flags) & set(flipped)))
