"""Chương 6 — SVM trên Breast Cancer Wisconsin (2 đặc trưng đã chuẩn hoá).

Chạy: python3 scripts/prep_ch5.py  (cần src/data/cancer.json từ prepare_data.py)
"""
import json
from pathlib import Path

import numpy as np
from sklearn.svm import SVC

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX = ROOT / "src/data", ROOT / "tests/fixtures"
c = json.load(open(OUT / "cancer.json"))
test = set(c["testIds"])
P = c["patients"]
X = np.array([[p["x1"], p["x2"]] for p in P]); y = np.array([1 if p["y"] else -1 for p in P])
te = np.array([p["id"] in test for p in P])
Xtr, ytr = X[~te], y[~te]

ref = {}
for C in (0.01, 1.0, 100.0):
    m = SVC(kernel="linear", C=C, tol=1e-10).fit(Xtr, ytr)
    w = m.coef_[0]; b = float(m.intercept_[0])
    obj = 0.5 * float(w @ w) + C * float(np.maximum(0, 1 - ytr * (Xtr @ w + b)).sum())
    ref[str(C)] = {"w": w.tolist(), "b": b, "obj": obj, "nSV": int(m.n_support_.sum())}

# Lưới quyết định của SVM nhân RBF (tính sẵn bằng scikit-learn)
N = 48
gx = np.linspace(-2.4, 4.2, N); gy = np.linspace(-2.6, 4.8, N)
G = np.array([[a, b] for b in gy for a in gx])
rbf = []
for gamma in (0.1, 1.0, 10.0, 50.0):
    m = SVC(kernel="rbf", C=1.0, gamma=gamma).fit(Xtr, ytr)
    rbf.append({
        "gamma": gamma, "decision": np.round(m.decision_function(G), 3).tolist(),
        "trainAcc": float(m.score(Xtr, ytr)), "testAcc": float(m.score(X[te], y[te])),
        "nSV": int(m.n_support_.sum()), "sv": m.support_.tolist(),
    })
json.dump({"n": N, "x": gx.round(4).tolist(), "y": gy.round(4).tolist(), "models": rbf},
          open(OUT / "svm-rbf.json", "w"), separators=(",", ":"))
json.dump(ref, open(FIX / "ch5.json", "w"), indent=1)
print(json.dumps(ref, indent=1)); print([(r["gamma"], r["trainAcc"], r["testAcc"], r["nSV"]) for r in rbf])
