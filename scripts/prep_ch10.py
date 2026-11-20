"""Chương 11 — Self-attention một đầu, huấn luyện bằng NumPy trên SMS Spam Collection (cùng cách chia như chương 4).

Mô hình: token → embedding (d = 8) + mã hoá vị trí → Q, K, V → softmax(QKᵀ/√d) V → trung bình → logistic.
Lan truyền ngược viết tay, có kiểm tra gradient bằng sai phân hữu hạn trước khi huấn luyện.
Chạy: python3 scripts/prep_ch10.py  (cần src/data/sms.json)
"""
import json
import re
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX = ROOT / "src/data", ROOT / "tests/fixtures"
rng = np.random.default_rng(10)
sms = json.load(open(OUT / "sms.json"))
TOKEN = sms["token"]
MAXLEN, D, VSIZE = 24, 8, 1500


def tok(s):
    return re.findall(TOKEN, s.lower())[:MAXLEN]


# Tập huấn luyện của chương 4 không được lưu dạng văn bản, nên dựng lại đúng cách chia từ file gốc
rows = [line.rstrip("\n").split("\t", 1) for line in open(ROOT / "data/raw/sms.tsv", encoding="utf-8")]
rows = [(1 if lab == "spam" else 0, txt) for lab, txt in rows]
r3 = np.random.default_rng(3)
_ = r3.permutation(150)  # chương 4 dùng permutation cho 150 bông Iris trước
perm = r3.permutation(len(rows))
n_test = len(rows) // 5
test = [rows[i] for i in sorted(perm[:n_test])]
train = [rows[i] for i in sorted(perm[n_test:])]
assert [t["text"] for t in sms["test"]] == [t for _, t in test], "cách chia phải trùng chương 4"

cnt = Counter(t for _, s in train for t in tok(s))
vocab = ["<unk>"] + [w for w, _ in cnt.most_common(VSIZE)]
vid = {w: i for i, w in enumerate(vocab)}
ids = lambda s: [vid.get(t, 0) for t in tok(s)] or [0]
pos = np.arange(MAXLEN)[:, None]; dim = np.arange(D)[None, :]
PE = np.where(dim % 2 == 0, np.sin(pos / 10000 ** (dim / D)), np.cos(pos / 10000 ** ((dim - 1) / D)))


def init():
    s = 1 / np.sqrt(D)
    return {"E": rng.normal(0, 0.3, (len(vocab), D)), "Wq": rng.normal(0, s, (D, D)), "Wk": rng.normal(0, s, (D, D)),
            "Wv": rng.normal(0, s, (D, D)), "u": rng.normal(0, s, D), "c": np.zeros(1)}


def forward(P, t):
    X = P["E"][t] + PE[: len(t)]
    Q, K, V = X @ P["Wq"], X @ P["Wk"], X @ P["Wv"]
    S = Q @ K.T / np.sqrt(D)
    S = S - S.max(1, keepdims=True)
    A = np.exp(S); A /= A.sum(1, keepdims=True)
    H = A @ V
    h = H.mean(0)
    z = h @ P["u"] + P["c"][0]
    p = 1 / (1 + np.exp(-z))
    return dict(X=X, Q=Q, K=K, V=V, A=A, H=H, h=h, z=z, p=p)


def loss_grad(P, t, y):
    f = forward(P, t)
    p = np.clip(f["p"], 1e-12, 1 - 1e-12)
    L = -(y * np.log(p) + (1 - y) * np.log(1 - p))
    dz = f["p"] - y
    g = {"u": dz * f["h"], "c": np.array([dz])}
    dh = dz * P["u"]
    dH = np.tile(dh / len(t), (len(t), 1))
    dA = dH @ f["V"].T; dV = f["A"].T @ dH
    dS = f["A"] * (dA - (dA * f["A"]).sum(1, keepdims=True))
    dQ = dS @ f["K"] / np.sqrt(D); dK = dS.T @ f["Q"] / np.sqrt(D)
    X = f["X"]
    g["Wq"], g["Wk"], g["Wv"] = X.T @ dQ, X.T @ dK, X.T @ dV
    dX = dQ @ P["Wq"].T + dK @ P["Wk"].T + dV @ P["Wv"].T
    gE = np.zeros_like(P["E"]); np.add.at(gE, t, dX)
    g["E"] = gE
    return L, g


# --- Kiểm tra gradient
P = init()
t0 = ids(train[0][1]); y0 = train[0][0]
_, g = loss_grad(P, t0, y0)
for k in ("Wq", "Wk", "Wv", "u"):
    i = (0, 1) if P[k].ndim == 2 else (2,)
    old = P[k][i]; h = 1e-6
    P[k][i] = old + h; lp, _ = loss_grad(P, t0, y0)
    P[k][i] = old - h; lm, _ = loss_grad(P, t0, y0)
    P[k][i] = old
    assert abs((lp - lm) / (2 * h) - g[k][i]) < 1e-7, k
print("kiểm tra gradient: đạt")

# --- Huấn luyện bằng Adam, từng tin một
m = {k: np.zeros_like(v) for k, v in P.items()}; v2 = {k: np.zeros_like(v) for k, v in P.items()}
step, lr = 0, 0.01
tr_ids = [(ids(s), y) for y, s in train]
te_ids = [(ids(s), y) for y, s in test]
for ep in range(3):
    tot = 0
    for i in rng.permutation(len(tr_ids)):
        t, y = tr_ids[i]
        L, g = loss_grad(P, t, y); tot += L; step += 1
        for k in P:
            m[k] = 0.9 * m[k] + 0.1 * g[k]; v2[k] = 0.999 * v2[k] + 0.001 * g[k] ** 2
            P[k] -= lr * (m[k] / (1 - 0.9 ** step)) / (np.sqrt(v2[k] / (1 - 0.999 ** step)) + 1e-8)
    acc = np.mean([(forward(P, t)["p"] >= 0.5) == y for t, y in te_ids])
    print(f"epoch {ep + 1}: loss {tot / len(tr_ids):.4f}, test acc {acc:.4f}")

for k in P:
    P[k] = np.round(P[k], 5)
probs = [float(forward(P, t)["p"]) for t, _ in te_ids]
json.dump({"vocab": vocab, "maxLen": MAXLEN, "d": D, "PE": PE.round(6).tolist(),
           **{k: P[k].tolist() for k in ("E", "Wq", "Wk", "Wv", "u")}, "c": float(P["c"][0]),
           "testAcc": float(np.mean([(p >= 0.5) == y for p, (_, y) in zip(probs, te_ids)]))},
          open(OUT / "attention.json", "w"), separators=(",", ":"))
f0 = forward(P, te_ids[0][0])
json.dump({"probs": probs[:60], "A0": f0["A"].tolist()}, open(FIX / "ch10.json", "w"))
print("size KB", (OUT / "attention.json").stat().st_size / 1024)
