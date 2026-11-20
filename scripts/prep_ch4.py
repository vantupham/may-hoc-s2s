"""Chương 5 — Cây quyết định, Random Forest, Gradient Boosting trên dữ liệu Titanic.

Chạy: python3 scripts/prep_ch4.py
"""
import csv
import json
from pathlib import Path

import numpy as np
from sklearn.tree import DecisionTreeClassifier

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX, PUB = ROOT / "src/data", ROOT / "tests/fixtures", ROOT / "public/data"
rng = np.random.default_rng(4)


def dump(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    print("wrote", path.relative_to(ROOT), f"{path.stat().st_size / 1024:.1f} KB")


rows = list(csv.DictReader(open(ROOT / "data/raw/titanic.csv", encoding="utf-8")))
ages = [float(r["Age"]) for r in rows if r["Age"]]
median_age = float(np.median(ages))
people = []
for r in rows:
    people.append({
        "id": int(r["PassengerId"]),
        "name": r["Name"],
        "survived": int(r["Survived"]),
        "sex": 1 if r["Sex"] == "female" else 0,
        "pclass": int(r["Pclass"]),
        "age": float(r["Age"]) if r["Age"] else median_age,
        "ageMissing": r["Age"] == "",
        "fare": round(float(r["Fare"]), 2),
        "family": int(r["SibSp"]) + int(r["Parch"]),
    })
perm = rng.permutation(len(people))
test_ids = sorted(people[i]["id"] for i in perm[: len(people) // 5])

FEATS = ["sex", "pclass", "age", "fare", "family"]
X = np.array([[p[f] for f in FEATS] for p in people], dtype=float)
y = np.array([p["survived"] for p in people])
is_test = np.array([p["id"] in set(test_ids) for p in people])

ref = {}
for depth in (1, 2, 3, 4):
    t = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X[~is_test], y[~is_test])
    ref[f"depth{depth}"] = {
        "pred": t.predict(X[is_test]).tolist(),
        "rootFeature": FEATS[t.tree_.feature[0]],
        "rootThreshold": float(t.tree_.threshold[0]),
        "trainAcc": float(t.score(X[~is_test], y[~is_test])),
        "testAcc": float(t.score(X[is_test], y[is_test])),
    }

dump(OUT / "titanic.json", {
    "source": "Titanic (Encyclopedia Titanica; bản 891 hành khách phổ biến trong giảng dạy), CSV trong datasciencedojo/datasets",
    "features": FEATS, "medianAge": median_age,
    "people": people, "testIds": test_ids,
})
dump(FIX / "ch4.json", ref)
(PUB / "titanic.json").write_bytes((OUT / "titanic.json").read_bytes())
