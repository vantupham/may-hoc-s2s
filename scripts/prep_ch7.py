"""Chương 8 — Đánh giá mô hình: cross-validation, bias–variance (hồi quy đa thức), ROC/AUC.

Chạy: python3 scripts/prep_ch7.py  (cần housing.json và cancer.json)
"""
import json
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX = ROOT / "src/data", ROOT / "tests/fixtures"
h = json.load(open(OUT / "housing.json"))
test = set(h["testIds"])
tr = [r for r in h["sample"] if r["id"] not in test]
te = [r for r in h["sample"] if r["id"] in test]
x = np.array([r["income"] for r in tr]); y = np.array([r["value"] for r in tr])
xt = np.array([r["income"] for r in te]); yt = np.array([r["value"] for r in te])
mu, sd = x.mean(), x.std()


def feats(v, d, m=mu, s=sd):
    z = (v - m) / s
    return np.vander(z, d + 1, increasing=True)


ref = {"mu": mu, "sd": sd, "deg": {}}
for d in range(1, 11):
    coef, *_ = np.linalg.lstsq(feats(x, d), y, rcond=None)
    # 5-fold liên tiếp theo thứ tự hiện có; chuẩn hoá theo mu/sd của toàn tập huấn luyện
    n = len(x); folds = np.array_split(np.arange(n), 5); cv = []
    for f in folds:
        msk = np.ones(n, bool); msk[f] = False
        c, *_ = np.linalg.lstsq(feats(x[msk], d), y[msk], rcond=None)
        cv.append(float(np.mean((feats(x[f], d) @ c - y[f]) ** 2)))
    ref["deg"][str(d)] = {"coef": coef.tolist(), "train": float(np.mean((feats(x, d) @ coef - y) ** 2)),
                          "cv": cv, "test": float(np.mean((feats(xt, d) @ coef - yt) ** 2))}

c = json.load(open(OUT / "cancer.json"))
ct = set(c["testIds"])
Xc = np.array([[p["x1"], p["x2"]] for p in c["patients"]]); yc = np.array([p["y"] for p in c["patients"]])
m = np.array([p["id"] in ct for p in c["patients"]])
lr = LogisticRegression(C=np.inf).fit(Xc[~m], yc[~m])
prob = lr.predict_proba(Xc[m])[:, 1]
fpr, tpr, _ = roc_curve(yc[m], prob)
ref["roc"] = {"prob": prob.tolist(), "y": yc[m].tolist(), "auc": float(roc_auc_score(yc[m], prob)), "nPoints": len(fpr)}
json.dump(ref, open(FIX / "ch7.json", "w"))
print({d: (round(v["train"], 4), round(float(np.mean(v["cv"])), 4), round(v["test"], 4)) for d, v in ref["deg"].items()})
print("AUC", ref["roc"]["auc"])
