"""Chương 4 — KNN (Iris) và Naive Bayes (SMS Spam Collection).

Chạy: python3 scripts/prep_ch3.py
"""
import json
import re
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.datasets import load_iris
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.neighbors import KNeighborsClassifier

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX = ROOT / "src/data", ROOT / "tests/fixtures"
for d in (OUT, FIX):
    d.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(3)


def dump(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    print("wrote", path.relative_to(ROOT), f"{path.stat().st_size / 1024:.1f} KB")


# ------------------------------------------------------------------ Iris
iris = load_iris()
X = iris.data[:, 2:4]  # chiều dài, chiều rộng cánh hoa (cm)
y = iris.target
perm = rng.permutation(len(y))
test_idx = sorted(perm[:30].tolist())
train_idx = sorted(perm[30:].tolist())
flowers = [{"id": i, "len": float(X[i, 0]), "wid": float(X[i, 1]), "y": int(y[i])} for i in range(len(y))]
knn = KNeighborsClassifier(n_neighbors=5).fit(X[train_idx], y[train_idx])
dump(OUT / "iris.json", {
    "source": "Iris (Fisher, 1936), UCI Machine Learning Repository; bản trong scikit-learn",
    "species": ["Iris setosa", "Iris versicolor", "Iris virginica"],
    "flowers": flowers, "testIds": test_idx,
})

# ------------------------------------------------------------------ SMS Spam
TOKEN = r"[a-z0-9']+"


def tokenize(s):
    return re.findall(TOKEN, s.lower())


rows = [line.rstrip("\n").split("\t", 1) for line in open(ROOT / "data/raw/sms.tsv", encoding="utf-8")]
rows = [(1 if lab == "spam" else 0, txt) for lab, txt in rows]
perm = rng.permutation(len(rows))
n_test = len(rows) // 5
test = [rows[i] for i in sorted(perm[:n_test])]
train = [rows[i] for i in sorted(perm[n_test:])]

cnt = Counter(t for _, txt in train for t in tokenize(txt))
vocab = sorted(w for w, c in cnt.items() if c >= 2)
vidx = {w: i for i, w in enumerate(vocab)}
counts = [[0] * len(vocab), [0] * len(vocab)]
docs = [0, 0]
for lab, txt in train:
    docs[lab] += 1
    for t in tokenize(txt):
        if t in vidx:
            counts[lab][vidx[t]] += 1

# 6 tin nhắn ngắn cho phần tính tay: 3 spam, 3 ham, mỗi tin 4–9 từ
BAD = {"sex", "sexy", "filthy", "girls", "dating", "xxx", "naughty", "horny", "babe", "adult"}
short_spam = [r for r in train if r[0] == 1 and 5 <= len(tokenize(r[1])) <= 10
              and {"free", "prize", "won", "win", "claim", "call"} & set(tokenize(r[1])) and not BAD & set(tokenize(r[1]))]
short_ham = [r for r in train if r[0] == 0 and 5 <= len(tokenize(r[1])) <= 8 and not BAD & set(tokenize(r[1]))
             and {"call", "free", "now", "you", "home"} & set(tokenize(r[1]))]
def distinct(rs, k):
    out, seen = [], set()
    for r in rs:
        key = r[1][:14].lower()
        if key not in seen:
            seen.add(key); out.append(r)
        if len(out) == k:
            break
    return out


mini = distinct(short_spam, 3) + distinct(short_ham, 3)

dump(OUT / "sms.json", {
    "source": "SMS Spam Collection (Almeida & Hidalgo, 2011), UCI; bản TSV trong justmarkham/pycon-2016-tutorial",
    "token": TOKEN,
    "nTotal": len(rows), "nSpam": sum(l for l, _ in rows),
    "vocab": vocab, "counts": counts, "docs": docs,
    "test": [{"y": l, "text": t} for l, t in test],
    "mini": [{"y": l, "text": t} for l, t in mini],
})

cv = CountVectorizer(vocabulary=vocab, token_pattern=TOKEN, lowercase=True)
Xtr = cv.transform([t for _, t in train]); ytr = [l for l, _ in train]
Xte = cv.transform([t for _, t in test]); yte = [l for l, _ in test]
nb = MultinomialNB(alpha=1.0).fit(Xtr, ytr)
jl = nb.predict_joint_log_proba(Xte)

dump(FIX / "ch3.json", {
    "knnPred": knn.predict(X[test_idx]).tolist(),
    "nbPred": nb.predict(Xte).tolist(),
    "nbJointLog": jl[:50].tolist(),
    "nbAccuracy": float((nb.predict(Xte) == np.array(yte)).mean()),
})
