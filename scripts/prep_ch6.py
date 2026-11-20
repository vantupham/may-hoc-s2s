"""Chương 7 — Học không giám sát: K-means và DBSCAN (chim cánh cụt Palmer), PCA (chữ số viết tay 8×8).

Chạy: python3 scripts/prep_ch6.py
"""
import csv
import json
from pathlib import Path

import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX, PUB = ROOT / "src/data", ROOT / "tests/fixtures", ROOT / "public/data"
rng = np.random.default_rng(6)


def dump(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    print("wrote", path.relative_to(ROOT), f"{path.stat().st_size / 1024:.1f} KB")


rows = [r for r in csv.DictReader(open(ROOT / "data/raw/penguins.csv")) if r["bill_length_mm"] and r["bill_depth_mm"]]
SP = ["Adelie", "Chinstrap", "Gentoo"]
L = np.array([float(r["bill_length_mm"]) for r in rows]); D = np.array([float(r["bill_depth_mm"]) for r in rows])
mu = [L.mean(), D.mean()]; sd = [L.std(), D.std()]
Z = np.c_[(L - mu[0]) / sd[0], (D - mu[1]) / sd[1]]
birds = [{"id": i, "len": float(L[i]), "dep": float(D[i]), "a": round(float(Z[i, 0]), 5), "b": round(float(Z[i, 1]), 5),
          "species": SP.index(r["species"]), "island": r["island"]} for i, r in enumerate(rows)]
Zr = np.array([[b["a"], b["b"]] for b in birds])
init_idx = sorted(rng.choice(len(birds), 3, replace=False).tolist())
km = KMeans(n_clusters=3, init=Zr[init_idx], n_init=1, algorithm="lloyd", tol=0, max_iter=100).fit(Zr)
db = DBSCAN(eps=0.28, min_samples=5).fit(Zr)
inertia = [float(KMeans(n_clusters=k, n_init=10, random_state=0).fit(Zr).inertia_) for k in range(1, 9)]
dump(OUT / "penguins.json", {
    "source": "Palmer Penguins (Gorman, Williams & Fraser, 2014), Trạm nghiên cứu Palmer, Nam Cực; CSV trong mwaskom/seaborn-data",
    "species": SP, "mean": mu, "std": sd, "birds": birds, "initIdx": init_idx, "inertia": inertia,
})

dg = load_digits()
digits = [{"y": int(t), "px": [int(v) for v in img]} for img, t in zip(dg.data, dg.target)]
Xd = dg.data.astype(float)
pca = PCA(n_components=10).fit(Xd)
dump(OUT / "digits.json", {"source": "Optical Recognition of Handwritten Digits (Alpaydin & Kaynak, 1998), UCI; bản 8×8 trong scikit-learn", "digits": digits})
dump(FIX / "ch6.json", {
    "kmLabels": km.labels_.tolist(), "kmCenters": km.cluster_centers_.tolist(), "kmIter": int(km.n_iter_),
    "dbLabels": db.labels_.tolist(),
    "pcaRatio": pca.explained_variance_ratio_.tolist(), "pcaVar": pca.explained_variance_.tolist(),
    "pcaComp": pca.components_[:3].tolist(), "pcaProj": pca.transform(Xd[:5])[:, :3].tolist(),
})
for n in ("penguins.json", "digits.json"):
    (PUB / n).write_bytes((OUT / n).read_bytes())
print("kmeans iters", km.n_iter_, "dbscan clusters", set(db.labels_), "noise", (db.labels_ == -1).sum())
from collections import Counter
print(Counter(zip(km.labels_, [b["species"] for b in birds])))
