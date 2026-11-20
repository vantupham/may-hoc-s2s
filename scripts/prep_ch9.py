"""Chương 10 — CNN trên Fashion-MNIST. Huấn luyện một CNN nhỏ bằng NumPy (không cần thư viện học sâu).

Kiến trúc: ảnh 28×28 → tích chập 6 bộ lọc 3×3 (valid) → ReLU → max-pool 2×2 → 6×13×13 → dense 10 → softmax.
Chạy: python3 scripts/prep_ch9.py
"""
import base64
import gzip
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT, FIX = ROOT / "src/data", ROOT / "tests/fixtures"
rng = np.random.default_rng(9)
raw = ROOT / "data/raw"
imgs = np.frombuffer(gzip.open(raw / "t10k-images-idx3-ubyte.gz").read(), np.uint8, offset=16).reshape(-1, 28, 28)
labs = np.frombuffer(gzip.open(raw / "t10k-labels-idx1-ubyte.gz").read(), np.uint8, offset=8).astype(int)
perm = rng.permutation(len(labs))
tr, te = perm[:8000], perm[8000:]
X = imgs.astype(np.float64) / 255.0
F, K = 6, 3


def im2col(xb):  # (B,28,28) -> (B,26*26,9)
    B = xb.shape[0]
    cols = np.empty((B, 26, 26, 9))
    for di in range(3):
        for dj in range(3):
            cols[:, :, :, di * 3 + dj] = xb[:, di:di + 26, dj:dj + 26]
    return cols.reshape(B, 676, 9)


def forward(xb, P):
    cols = im2col(xb)                                   # B,676,9
    z = cols @ P["Wc"].reshape(F, 9).T + P["bc"]        # B,676,F
    a = np.maximum(0, z).reshape(-1, 26, 26, F)
    pooled = a.reshape(-1, 13, 2, 13, 2, F).max(axis=(2, 4))   # B,13,13,F
    flat = pooled.transpose(0, 3, 1, 2).reshape(len(xb), -1)  # B, F*13*13 (thứ tự: bộ lọc, hàng, cột)
    logits = flat @ P["Wd"].T + P["bd"]
    return cols, z, a, pooled, flat, logits


P = {"Wc": rng.normal(0, np.sqrt(2 / 9), (F, 3, 3)), "bc": np.zeros(F),
     "Wd": rng.normal(0, np.sqrt(2 / (F * 169)), (10, F * 169)), "bd": np.zeros(10)}
lr, bs = 0.05, 32
for ep in range(12):
    order = rng.permutation(tr)
    tot = 0
    for s in range(0, len(order), bs):
        idx = order[s:s + bs]; xb = X[idx]; yb = labs[idx]; B = len(idx)
        cols, z, a, pooled, flat, logits = forward(xb, P)
        logits -= logits.max(1, keepdims=True)
        p = np.exp(logits); p /= p.sum(1, keepdims=True)
        tot += -np.log(p[np.arange(B), yb]).sum()
        g = p.copy(); g[np.arange(B), yb] -= 1; g /= B
        gWd = g.T @ flat; gbd = g.sum(0)
        gflat = g @ P["Wd"]
        gpool = gflat.reshape(B, F, 13, 13).transpose(0, 2, 3, 1)     # B,13,13,F
        # max-pool: gradient chỉ chảy về ô lớn nhất trong mỗi cửa sổ 2×2
        a6 = a.reshape(B, 13, 2, 13, 2, F)
        mask = (a6 == pooled[:, :, None, :, None, :])
        mask = mask / np.maximum(1, mask.sum(axis=(2, 4), keepdims=True))
        ga = (mask * gpool[:, :, None, :, None, :]).reshape(B, 26, 26, F)
        gz = (ga * (a > 0)).reshape(B, 676, F)
        gWc = np.einsum("bpf,bpk->fk", gz, cols).reshape(F, 3, 3); gbc = gz.sum((0, 1))
        P["Wd"] -= lr * gWd; P["bd"] -= lr * gbd; P["Wc"] -= lr * gWc; P["bc"] -= lr * gbc
    acc = (forward(X[te], P)[-1].argmax(1) == labs[te]).mean()
    print(f"epoch {ep + 1}: loss {tot / len(tr):.4f}, test acc {acc:.4f}")

for k in P:
    P[k] = np.round(P[k], 6)
logits_te = forward(X[te], P)[-1]
pred = logits_te.argmax(1)
cm = np.zeros((10, 10), int)
for t, q in zip(labs[te], pred):
    cm[t, q] += 1
show = te[:120]
names = ["Áo phông", "Quần dài", "Áo len chui đầu", "Váy liền", "Áo khoác", "Dép xăng-đan", "Áo sơ mi", "Giày thể thao", "Túi xách", "Bốt cổ ngắn"]
json.dump({
    "source": "Fashion-MNIST (Xiao, Rasul & Vollgraf, 2017), Zalando Research, giấy phép MIT; 10.000 ảnh của tập t10k",
    "names": names, "nTrain": len(tr), "nTest": len(te), "testAcc": float((pred == labs[te]).mean()), "confusion": cm.tolist(),
    "Wc": P["Wc"].tolist(), "bc": P["bc"].tolist(), "Wd": P["Wd"].tolist(), "bd": P["bd"].tolist(),
    "images": [{"y": int(labs[i]), "b64": base64.b64encode(imgs[i].tobytes()).decode()} for i in show],
}, open(OUT / "fashion-cnn.json", "w"), separators=(",", ":"), ensure_ascii=False)
json.dump({"logits": forward(X[show[:20]], P)[-1].tolist()}, open(FIX / "ch9.json", "w"))
print("size KB", (OUT / "fashion-cnn.json").stat().st_size / 1024)
