"""Chương 9 — Mạng nơ-ron. Sinh cách chia train/test cho chữ số 8×8 và kết quả tham chiếu NumPy.

Chạy: python3 scripts/prep_ch8.py  (cần digits.json và cancer.json)
"""
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX = ROOT / "src/data", ROOT / "tests/fixtures"
rng = np.random.default_rng(8)

dg = json.load(open(OUT / "digits.json"))["digits"]
n = len(dg)
perm = rng.permutation(n)
test_ids = sorted(perm[:360].tolist())
json.dump({"testIds": test_ids}, open(OUT / "digits-split.json", "w"), separators=(",", ":"))

X = np.array([d["px"] for d in dg], float) / 16.0
Y = np.array([d["y"] for d in dg])
te = np.zeros(n, bool); te[test_ids] = True
Xtr, Ytr = X[~te], Y[~te]

# ----- Mạng nhỏ 2-3-1 (tanh, sigmoid) trên 1 bệnh nhân
c = json.load(open(OUT / "cancer.json"))
p = c["mini"][0]
x = np.array([p["x1"], p["x2"]]); y = p["y"]
W1 = np.round(rng.normal(0, 0.8, (3, 2)), 2); b1 = np.zeros(3)
w2 = np.round(rng.normal(0, 0.8, 3), 2); b2 = 0.0
z1 = W1 @ x + b1; a1 = np.tanh(z1); z2 = w2 @ a1 + b2; pr = 1 / (1 + np.exp(-z2))
loss = -(y * np.log(pr) + (1 - y) * np.log(1 - pr))
dz2 = pr - y; dw2 = dz2 * a1; db2 = dz2; da1 = dz2 * w2; dz1 = da1 * (1 - a1 ** 2); dW1 = np.outer(dz1, x); db1 = dz1
tiny = {"W1": W1.tolist(), "b1": b1.tolist(), "w2": w2.tolist(), "b2": b2,
        "loss": float(loss), "p": float(pr), "dW1": dW1.tolist(), "db1": db1.tolist(), "dw2": dw2.tolist(), "db2": float(db2)}

# ----- MLP 64-32-10 (ReLU, softmax), 1 epoch SGD theo lô 32
H = 32
W1 = rng.normal(0, np.sqrt(2 / 64), (H, 64)); B1 = np.zeros(H)
W2 = rng.normal(0, np.sqrt(2 / H), (10, H)); B2 = np.zeros(10)
init = {"W1": W1.round(6).tolist(), "W2": W2.round(6).tolist()}
W1 = np.array(init["W1"]); W2 = np.array(init["W2"])
order = rng.permutation(len(Ytr)).tolist()
lr, bs = 0.1, 32
losses = []
for s in range(0, len(order), bs):
    idx = order[s:s + bs]
    xb, yb = Xtr[idx], Ytr[idx]
    z1 = xb @ W1.T + B1; a1 = np.maximum(0, z1)
    z2 = a1 @ W2.T + B2; z2 -= z2.max(1, keepdims=True)
    e = np.exp(z2); pb = e / e.sum(1, keepdims=True)
    losses.append(float(-np.log(pb[np.arange(len(idx)), yb]).mean()))
    g2 = pb.copy(); g2[np.arange(len(idx)), yb] -= 1; g2 /= len(idx)
    gW2 = g2.T @ a1; gB2 = g2.sum(0)
    g1 = (g2 @ W2) * (z1 > 0)
    gW1 = g1.T @ xb; gB1 = g1.sum(0)
    W1 -= lr * gW1; B1 -= lr * gB1; W2 -= lr * gW2; B2 -= lr * gB2
a = np.maximum(0, X[te] @ W1.T + B1) @ W2.T + B2
mlp = {"init": init, "order": order, "lr": lr, "batch": bs, "losses": losses,
       "W1sum": float(W1.sum()), "W2sum": float(W2.sum()), "B2": B2.tolist(), "testAcc": float((a.argmax(1) == Y[te]).mean())}
json.dump({"tiny": tiny, "mlp": mlp}, open(FIX / "ch8.json", "w"))
print("tiny p", tiny["p"], "loss", tiny["loss"]); print("mlp epoch1 test acc", mlp["testAcc"], "last loss", losses[-1])
json.dump({"W1": tiny["W1"], "b1": tiny["b1"], "w2": tiny["w2"], "b2": tiny["b2"]}, open(OUT / "tinynet.json", "w"))
