"""Chương 12 — Dự án bụi mịn PM2.5 Hà Nội. Đọc dữ liệu đóng băng trong data/raw/hanoi/ (tải bằng fetch_ch12.py),
kiểm soát chất lượng từng trạm, dựng chỉ số PM2.5 Hà Nội theo ngày và theo giờ, tạo đặc trưng, huấn luyện mọi
mô hình của bảng xếp hạng bằng scikit-learn, và huấn luyện CNN 1D cùng attention bằng NumPy + SciPy.

Chạy: python3 scripts/prep_ch12.py
"""
import glob
import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import mean_absolute_error, roc_auc_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeRegressor

warnings.filterwarnings("ignore")  # cảnh báo tràn số giả của phép nhân ma trận NumPy 2 trên macOS
np.seterr(all="ignore")
ROOT = Path(__file__).resolve().parent.parent
RAW, OUT, FIX = ROOT / "data/raw/hanoi", ROOT / "src/data", ROOT / "tests/fixtures"
START, END = "2023-01-01", "2026-11-15"
TEST0, TEST1 = "2025-11-01", "2026-04-01"  # tập kiểm tra cố định: mùa đông 2025–2026 (ngày dự báo)
THR = 50.0  # ngưỡng cảnh báo trung bình 24 giờ, µg/m³
STUCK, MINH, STARTUP, RMIN = 6, 18, 60, 0.7
r1 = lambda v: None if v is None or not np.isfinite(v) else round(float(v), 1)
r3 = lambda v: None if v is None or not np.isfinite(v) else round(float(v), 3)

# ---------------------------------------------------------------- 1. Trạm đo và kiểm soát chất lượng
LOWCOST = {6123215}
# Tên hiển thị: tên trong OpenAQ đổi theo thời gian (6123215 hiện mang tên "Dragon"), nên ghi rõ ở đây
NAMES = {7441: "Hà Nội (trạm 7441, OpenAQ)", 2161292: "46 Lưu Quang Vũ", 2161306: "Minh Khai, Bắc Từ Liêm", 4946811: "556 Nguyễn Văn Cừ",
         4946812: "Công viên Nhân Chính", 4946813: "ĐH Bách khoa, Giải Phóng", 6123215: "Vinhomes Ocean Park"}  # đo cả pm1 và số hạt 0,3 µm: cảm biến quang học giá rẻ
stations, hourly, qa = [], {}, {"neg": 0, "stuck": 0, "stuckRuns": 0, "short": 0, "startup": 0, "cross": 0}
for f in sorted(glob.glob(str(RAW / "openaq-*.csv.gz"))):
    d = pd.read_csv(f, usecols=["location_id", "location", "datetime", "lat", "lon", "parameter", "value"])
    d = d[d.parameter == "pm25"]
    sid = int(d.location_id.iloc[0])
    name = NAMES.get(sid, d.location.iloc[-1].rsplit("-", 1)[0])
    t = pd.to_datetime(d.datetime.str[:19])
    raw = d.value.groupby(t.dt.floor("h")).mean()  # trạm 5 phút → trung bình giờ
    neg = int((d.value < 0).sum())
    h = raw.where(raw >= 0)
    # kẹt số: ≥ STUCK giờ liên tiếp cùng một giá trị
    grp = (h != h.shift()).cumsum()
    size = h.groupby(grp).transform("size")
    stuck = h.notna() & (size >= STUCK)
    runs = int(h[stuck].groupby(grp[stuck]).ngroups)
    h = h.where(~stuck)
    first = h.first_valid_index()
    startup = h.index < first + pd.Timedelta(days=STARTUP)
    stations.append({"id": sid, "name": name, "lat": round(float(d.lat.iloc[0]), 4), "lon": round(float(d.lon.iloc[0]), 4),
                     "first": str(first.date()), "last": str(h.last_valid_index().date()), "neg": neg, "stuckRuns": runs,
                     "stuckHours": int(stuck.sum()), "fiveMin": bool(len(d) > 2 * len(raw))})
    qa["neg"] += neg; qa["stuck"] += int(stuck.sum()); qa["stuckRuns"] += runs
    hourly[sid] = (h, startup)

idx_h = pd.date_range(START, pd.Timestamp(END) + pd.Timedelta(hours=23), freq="h")
H = pd.DataFrame({s: h.reindex(idx_h) for s, (h, _) in hourly.items()})
SU = pd.DataFrame({s: pd.Series(su, index=h.index).reindex(idx_h).fillna(False) for s, (h, su) in hourly.items()}).astype(bool)
cnt = H.resample("D").count()
Dm = H.resample("D").mean().where(cnt >= MINH)  # trung bình ngày của từng trạm, cần ≥ 18 giờ
qa["short"] = int(((cnt > 0) & (cnt < MINH)).sum().sum())
su_day = SU.resample("D").max().astype(bool)
qa["startup"] = int((Dm.notna() & su_day).sum().sum())
Dm = Dm.where(~su_day)

# Trạm không nhất quán: tương quan với trung vị các trạm khác < RMIN (một lựa chọn chủ quan, nói rõ trên trang)
for s in stations:
    others = Dm.drop(columns=[s["id"]] + list(LOWCOST)).median(1)
    s["r"] = r3(Dm[s["id"]].corr(others))
    s["bias"] = r1((Dm[s["id"]] - others).median())
for s in stations:
    s["kind"] = "lowcost" if s["id"] in LOWCOST else "gov"
    s["used"] = s["kind"] == "gov" and s["r"] >= RMIN
    s["why"] = "cảm biến giá rẻ" if s["kind"] == "lowcost" else ("không nhất quán với các trạm khác" if not s["used"] else "")
used = [s["id"] for s in stations if s["used"]]

# Lệch quá xa trung vị của ít nhất 2 trạm khác: bỏ ngày-trạm đó
G = Dm[used].copy()
drop = pd.DataFrame(False, index=G.index, columns=used)
for s in used:
    o = G.drop(columns=[s])
    m, k = o.median(1), o.notna().sum(1)
    drop[s] = (k >= 2) & ((G[s] - m).abs() > np.maximum(20, 0.5 * m))
qa["cross"] = int(drop.sum().sum())
G = G.where(~drop)
pm = G.median(1)  # chỉ số PM2.5 Hà Nội theo ngày
nst = G.notna().sum(1)
pm = pm.where(nst > 0)

# Chỉ số theo giờ (cho CNN và attention): trung vị các trạm đã qua kiểm soát trong ngày đó
okday = G.notna().reindex(idx_h, method="ffill")
Hh = H[used].where(okday.values).median(1)

# ---------------------------------------------------------------- 2. Thời tiết ERA5 và CAMS
wx = []
for f in sorted(glob.glob(str(RAW / "weather-*.json"))):
    j = json.load(open(f))["hourly"]
    wx.append(pd.DataFrame(j).assign(time=lambda x: pd.to_datetime(x.time)).set_index("time"))
W = pd.concat(wx).sort_index()
W = W[~W.index.duplicated()].reindex(idx_h)
rad = np.deg2rad(W.wind_direction_10m)
W["north"] = -W.wind_speed_10m * np.cos(rad)  # thành phần gió thổi từ phía bắc (m/s), dương = gió bắc
Wd = pd.DataFrame({
    "ws": W.wind_speed_10m.resample("D").mean(), "rh": W.relative_humidity_2m.resample("D").mean(),
    "t": W.temperature_2m.resample("D").mean(), "rain": W.precipitation.resample("D").sum(),
    "blh": W.boundary_layer_height.resample("D").mean(), "p": W.surface_pressure.resample("D").mean(),
    "north": W.north.resample("D").mean(),
})
cams = pd.concat([pd.Series(json.load(open(f))["hourly"]["pm2_5"], index=pd.to_datetime(json.load(open(f))["hourly"]["time"]))
                  for f in sorted(glob.glob(str(RAW / "cams-*.json")))])
cams = cams[~cams.index.duplicated()].reindex(idx_h).resample("D").mean()

days = pd.DataFrame({"pm": pm, "n": nst}).join(Wd).join(cams.rename("cams"))
days.index.name = "d"
# Làm tròn đúng như số xuất ra trang, để trình duyệt tái tạo đặc trưng và kết quả đến từng chữ số
days = days.round({"pm": 1, "ws": 3, "rh": 1, "t": 1, "rain": 1, "blh": 0, "p": 1, "north": 3, "cams": 1})

# ---------------------------------------------------------------- 3. Đặc trưng (khớp src/lib/khongkhi.ts)
FEATS = ["pm0", "pm1", "pm7", "ws", "rh", "t", "rain", "blh", "north", "dp", "sin", "cos"]


def features(days):
    pmv = days.pm
    f = pd.DataFrame(index=days.index)
    f["pm0"] = pmv
    f["pm1"] = pmv.shift(1)
    f["pm7"] = pmv.rolling(7, min_periods=1).mean()
    nxt = days.shift(-1)  # thời tiết NGÀY MAI: thay cho bản tin dự báo thời tiết (giả định dự báo hoàn hảo)
    for c in ["ws", "rh", "t", "rain", "blh", "north"]:
        f[c] = nxt[c]
    f["dp"] = nxt.p - days.p
    doy = (days.index + pd.Timedelta(days=1)).dayofyear
    f["sin"] = np.sin(2 * np.pi * doy / 365.25)
    f["cos"] = np.cos(2 * np.pi * doy / 365.25)
    f["y"] = pmv.shift(-1)
    f["target"] = (days.index + pd.Timedelta(days=1)).strftime("%Y-%m-%d")
    return f


F = features(days)
F = F[F[FEATS[:2] + ["y"]].notna().all(1) & F[FEATS[3:]].notna().all(1)]
tdate = F.target
split = np.where(tdate < TEST0, "train", np.where(tdate < TEST1, "test", "live"))
F["split"] = split
tr, te, lv = F[split == "train"], F[split == "test"], F[split == "live"]
Xtr, ytr, Xte, yte = tr[FEATS].values, tr.y.values, te[FEATS].values, te.y.values
mu, sd = Xtr.mean(0), Xtr.std(0)
Z = lambda X: (X - mu) / sd
print(f"dòng: train {len(tr)}, test {len(te)}, sau triển khai {len(lv)}; ngày cảnh báo test {int((yte > THR).sum())}")

# ---------------------------------------------------------------- 4. Bảng xếp hạng (test = mùa đông 2025–2026)
board = []


def add(id_, name, ch, pred=None, prob=None, note=""):
    row = {"id": id_, "name": name, "ch": ch, "note": note}
    if pred is not None:
        row["mae"] = round(mean_absolute_error(yte, pred), 2)
        row["alertAcc"] = round(float(((pred > THR) == (yte > THR)).mean()) * 100, 1)
        if prob is None:
            prob = pred
    if prob is not None:
        row["auc"] = round(roc_auc_score(yte > THR, prob), 3)
    board.append(row)
    return row


add("persist", "Ngày mai = hôm nay", "8", te.pm0.values, note="mốc so sánh")
clim = tr.groupby(pd.to_datetime(tr.target).dt.month).y.mean()
add("clim", "Trung bình cùng tháng", "8", pd.to_datetime(te.target).dt.month.map(clim).values, note="mốc so sánh")
ols1 = LinearRegression().fit(tr[["pm0"]], ytr)
add("ols1", "Hồi quy tuyến tính, chỉ PM2.5 hôm nay", "0–1", ols1.predict(te[["pm0"]]))
ols = LinearRegression().fit(Z(Xtr), ytr)
add("ols", "Hồi quy tuyến tính, 12 đặc trưng", "1, 3B", ols.predict(Z(Xte)))
lr = LogisticRegression(max_iter=2000).fit(Z(Xtr), ytr > THR)
add("logreg", "Hồi quy logistic (chỉ cảnh báo)", "2", prob=lr.predict_proba(Z(Xte))[:, 1])
knn = KNeighborsRegressor(10).fit(Z(Xtr), ytr)
add("knn", "KNN: 10 ngày tương tự nhất", "4", knn.predict(Z(Xte)))
nb = GaussianNB().fit(Z(Xtr), ytr > THR)
add("nb", "Naive Bayes Gauss (chỉ cảnh báo)", "4", prob=nb.predict_proba(Z(Xte))[:, 1])
dt = DecisionTreeRegressor(max_depth=3, random_state=0).fit(Xtr, ytr)
add("tree", "Cây quyết định, sâu 3", "5", dt.predict(Xte))
rf = RandomForestRegressor(300, min_samples_leaf=5, random_state=0, n_jobs=-1).fit(Xtr, ytr)
add("rf", "Rừng ngẫu nhiên, 300 cây", "5", rf.predict(Xte))
gb = GradientBoostingRegressor(n_estimators=300, learning_rate=0.03, max_depth=3, subsample=0.8, random_state=0).fit(Xtr, ytr)
add("gb", "Gradient boosting, 300 cây", "5", gb.predict(Xte))
SV2 = ["pm0", "ws"]  # PM2.5 hôm nay và gió ngày mai: hai đặc trưng cho lab SVM 2 chiều
s2mu, s2sd = tr[SV2].values.mean(0), tr[SV2].values.std(0)
Z2 = lambda X: (X - s2mu) / s2sd
svm = SVC(C=1, gamma=0.05).fit(Z(Xtr), ytr > THR)
add("svm", "SVM nhân RBF (chỉ cảnh báo)", "6", prob=svm.decision_function(Z(Xte)))

# Kiểu ngày (chương 7): K-means trên 2 thành phần chính của hồ sơ 24 giờ (chuẩn hoá theo mức trung bình ngày)
prof = Hh.groupby(Hh.index.normalize()).apply(lambda s: s.values if s.notna().sum() == 24 else None).dropna()
P = np.stack(prof.values)
Pn = P / P.mean(1, keepdims=True)
pdays = prof.index.strftime("%Y-%m-%d")
ptrain = pdays < TEST0
pca = PCA(2).fit(Pn[ptrain])
C2 = pca.transform(Pn)
km = KMeans(3, n_init=10, random_state=0).fit(C2[ptrain])
lab = km.predict(C2)
kind = pd.Series(lab, index=pd.to_datetime(pdays))

# MLP (chương 9)
mlp = MLPRegressor((16,), alpha=1.0, learning_rate_init=0.01, max_iter=3000, early_stopping=True, random_state=0).fit(Z(Xtr), ytr)
add("mlp", "Mạng nơ-ron MLP, 16 nơ-ron ẩn", "9", mlp.predict(Z(Xte)))

# ---------------------------------------------------------------- 5. CNN 1D và attention trên 72 giờ (chương 10, 11)
L, CH = 72, ["pm", "ws", "rh", "blh"]
hp = Hh.ffill(limit=6)  # chỉ điền bằng quá khứ, tối đa 6 giờ
Hx = pd.DataFrame({"pm": hp / 100, "ws": W.wind_speed_10m, "rh": W.relative_humidity_2m, "blh": W.boundary_layer_height})
hm, hs = Hx[Hx.index < TEST0].mean(), Hx[Hx.index < TEST0].std()
hm["pm"], hs["pm"] = 0, 1  # PM2.5 chỉ chia 100 để đọc được trực tiếp
Hz = ((Hx - hm) / hs).values
pos = {t: i for i, t in enumerate(idx_h)}


def window(day):
    e = pos[pd.Timestamp(day) + pd.Timedelta(hours=23)]
    w = Hz[e - L + 1:e + 1]
    return w if e - L + 1 >= 0 and np.isfinite(w).all() else None


tom = ["ws", "rh", "blh", "north", "dp", "sin", "cos"]  # thời tiết ngày mai và mùa, như mô hình bảng
ti = [FEATS.index(c) for c in tom]
Wn = {k: [] for k in ["train", "test", "live"]}
for (d, row), sp in zip(F.iterrows(), F.split):
    w = window(d)
    if w is not None:
        Wn[sp].append((d, w, Z(row[FEATS].values.astype(float)[None])[0][ti], row.y))
print("cửa sổ 72 giờ:", {k: len(v) for k, v in Wn.items()})


def stack(rows):
    return np.stack([r[1] for r in rows]), np.stack([r[2] for r in rows]), np.array([r[3] for r in rows]) / 100


K, NF, DA = 6, 3, 4
rng = np.random.default_rng(12)


def cnn_unpack(th):
    i = 0
    w = th[i:i + NF * K * 4].reshape(NF, K, 4); i += NF * K * 4
    b = th[i:i + NF]; i += NF
    u = th[i:i + 2 * NF]; i += 2 * NF  # đặc trưng: [trung bình, giá trị cuối] mỗi bộ lọc
    v = th[i:i + len(tom)]; i += len(tom)
    return w, b, u, v, th[i]


def cnn_fwd(th, X, T):
    w, b, u, v, c = cnn_unpack(th)
    n = X.shape[0]
    Zc = np.zeros((n, L - K + 1, NF))
    for j in range(K):
        Zc += np.einsum("ntc,fc->ntf", X[:, j:j + L - K + 1], w[:, j])
    A = np.maximum(0, Zc + b)
    feat = np.concatenate([A.mean(1), A[:, -1]], 1)
    return feat @ u + T @ v + c, A


def attn_unpack(th):
    i = 0
    d_in = 4 + 2
    q = th[i:i + DA * d_in].reshape(DA, d_in); i += DA * d_in
    k = th[i:i + DA * d_in].reshape(DA, d_in); i += DA * d_in
    vv = th[i:i + DA * d_in].reshape(DA, d_in); i += DA * d_in
    u = th[i:i + DA]; i += DA
    v = th[i:i + len(tom)]; i += len(tom)
    return q, k, vv, u, v, th[i]


hod = np.arange(L) % 24
PEh = np.stack([np.sin(2 * np.pi * hod / 24), np.cos(2 * np.pi * hod / 24)], 1)  # giờ trong ngày


def attn_fwd(th, X, T):
    Wq, Wk, Wv, u, v, c = attn_unpack(th)
    Xp = np.concatenate([X, np.broadcast_to(PEh, (X.shape[0], L, 2))], 2)
    q = Xp[:, -1] @ Wq.T
    Kk = Xp @ Wk.T
    V = Xp @ Wv.T
    s = np.einsum("nd,ntd->nt", q, Kk) / np.sqrt(DA)
    s = s - s.max(1, keepdims=True)
    a = np.exp(s); a /= a.sum(1, keepdims=True)
    ctx = np.einsum("nt,ntd->nd", a, V)
    return ctx @ u + T @ v + c, a


def fit(fwd, n, data, l2=1e-3, iters=400, seed=0):
    X, T, y = data
    th0 = np.random.default_rng(seed).normal(0, 0.3, n)

    def loss(th):
        return np.mean(np.abs(fwd(th, X, T)[0] - y)) + l2 * np.sum(th ** 2)  # MAE trực tiếp, cùng thước đo bảng xếp hạng

    best = None
    for s in range(3):
        th0 = np.random.default_rng(seed + s).normal(0, 0.3, n)
        r = minimize(lambda th: np.mean((fwd(th, X, T)[0] - y) ** 2) + l2 * np.sum(th ** 2), th0, method="L-BFGS-B", options={"maxiter": iters})
        if best is None or loss(r.x) < loss(best):
            best = r.x
    return best


tr72, te72, lv72 = stack(Wn["train"]), stack(Wn["test"]), stack(Wn["live"])
n_cnn = NF * K * 4 + NF + 2 * NF + len(tom) + 1
n_att = 3 * DA * 6 + DA + len(tom) + 1
th_cnn = fit(cnn_fwd, n_cnn, tr72)
th_att = fit(attn_fwd, n_att, tr72)

# Các mô hình bảng trên đúng những ngày có cửa sổ 72 giờ, để so cùng một tập
te_days = [r[0] for r in Wn["test"]]
mask72 = te.index.isin(te_days)
print(f"ngày test có đủ 72 giờ: {mask72.sum()} / {len(te)}")
y72 = te72[2] * 100
p_cnn = cnn_fwd(th_cnn, te72[0], te72[1])[0] * 100
p_att = attn_fwd(th_att, te72[0], te72[1])[0] * 100
for nm, p in [("cnn", p_cnn), ("attn", p_att)]:
    print(nm, "MAE", round(mean_absolute_error(y72, p), 2), "| gb trên cùng ngày", round(mean_absolute_error(y72, gb.predict(Xte[mask72])), 2))
row = {"id": "cnn", "name": "CNN 1D trên 72 giờ", "ch": "10", "note": f"{mask72.sum()} ngày có đủ 72 giờ",
       "mae": round(mean_absolute_error(y72, p_cnn), 2), "alertAcc": round(float(((p_cnn > THR) == (y72 > THR)).mean()) * 100, 1), "auc": round(roc_auc_score(y72 > THR, p_cnn), 3)}
board.append(row)
row = {"id": "attn", "name": "Attention trên 72 giờ", "ch": "11", "note": f"{mask72.sum()} ngày có đủ 72 giờ",
       "mae": round(mean_absolute_error(y72, p_att), 2), "alertAcc": round(float(((p_att > THR) == (y72 > THR)).mean()) * 100, 1), "auc": round(roc_auc_score(y72 > THR, p_att), 3)}
board.append(row)
same = {"persist": te.pm0.values[mask72], "gb": gb.predict(Xte[mask72])}
for k, v in same.items():
    next(b for b in board if b["id"] == k)["mae72"] = round(mean_absolute_error(y72, v), 2)

for b in board:
    print(f"  {b['id']:8s} MAE {b.get('mae', '-'):>6}  AUC {b.get('auc', '-')}")

# ---------------------------------------------------------------- 6. Những thí nghiệm của các lab
# 6a. Rò rỉ: chia ngẫu nhiên 80/20 trên toàn bộ dữ liệu, rồi chấm CẢ HAI cách chia trên cùng những ngày mùa đông
#     2025–2026 lọt vào phần test ngẫu nhiên. Mô hình chia ngẫu nhiên đã được học những ngày kề bên của chính mùa đông đó.
rs = np.random.default_rng(0).permutation(len(F))
AllX, Ally = F[FEATS].values, F.y.values
cut = int(len(F) * 0.8)
a, b_ = rs[:cut], rs[cut:]
inwin = b_[F.split.values[b_] == "test"]
pos_te = {d: i for i, d in enumerate(te.index)}
leak = {"n": int(len(inwin))}
for nm, mk, zs in [("knn", lambda: KNeighborsRegressor(10), True), ("gb", lambda: GradientBoostingRegressor(n_estimators=300, learning_rate=0.03, max_depth=3, subsample=0.8, random_state=0), False)]:
    T_ = (lambda X: (X - mu) / sd) if zs else (lambda X: X)
    m_ = mk().fit(T_(AllX[a]), Ally[a])
    timem = knn if nm == "knn" else gb
    leak[nm] = {"random": round(mean_absolute_error(Ally[inwin], m_.predict(T_(AllX[inwin]))), 2),
                "time": round(mean_absolute_error(Ally[inwin], timem.predict(T_(AllX[inwin]))), 2)}
print("rò rỉ:", leak)

# 6b. Nội suy hai phía làm lộ ngày mai: những ngày thiếu PM2.5 hôm nay nhưng có PM2.5 ngày mai
pmi = days.pm.interpolate(limit_area="inside")
pmf = days.pm.ffill()
gapdays = days.index[days.pm.isna() & days.pm.shift(-1).notna() & pmf.notna() & pmi.notna()]
yy = days.pm.shift(-1).loc[gapdays]
fill = {"n": int(len(gapdays)), "interp": round(mean_absolute_error(yy, pmi.loc[gapdays]), 2), "ffill": round(mean_absolute_error(yy, pmf.loc[gapdays]), 2)}
print("điền thiếu, dự báo = giá trị điền:", fill)

# 6c. Cross-validation trượt gốc (TimeSeriesSplit 5 phần) và k-fold xáo trộn trên tập train, cho GB
tss = TimeSeriesSplit(5)
cv_time = []
for a, b_ in tss.split(Xtr):
    m_ = GradientBoostingRegressor(n_estimators=300, learning_rate=0.03, max_depth=3, subsample=0.8, random_state=0).fit(Xtr[a], ytr[a])
    cv_time.append({"train": [int(a[0]), int(a[-1])], "test": [int(b_[0]), int(b_[-1])], "from": tr.target.iloc[b_[0]], "to": tr.target.iloc[b_[-1]],
                    "mae": round(mean_absolute_error(ytr[b_], m_.predict(Xtr[b_])), 2),
                    "persist": round(mean_absolute_error(ytr[b_], tr.pm0.values[b_]), 2)})
kf = np.array_split(np.random.default_rng(1).permutation(len(Xtr)), 5)
cv_rand = []
for k in range(5):
    b_ = kf[k]; a = np.setdiff1d(np.arange(len(Xtr)), b_)
    m_ = GradientBoostingRegressor(n_estimators=300, learning_rate=0.03, max_depth=3, subsample=0.8, random_state=0).fit(Xtr[a], ytr[a])
    cv_rand.append(round(mean_absolute_error(ytr[b_], m_.predict(Xtr[b_])), 2))
rand_fold = np.zeros(len(Xtr), int)
for k in range(5):
    rand_fold[kf[k]] = k
print("CV theo thời gian:", [c["mae"] for c in cv_time], " k-fold xáo trộn:", cv_rand)

# 6d. Lệch phân phối theo mùa: học chỉ trên các tháng 5–9, thử trên mùa đông
summer = pd.to_datetime(tr.target).dt.month.isin([5, 6, 7, 8, 9]).values
gbs = GradientBoostingRegressor(n_estimators=300, learning_rate=0.03, max_depth=3, subsample=0.8, random_state=0).fit(Xtr[summer], ytr[summer])
drift = {"summerOnly": round(mean_absolute_error(yte, gbs.predict(Xte)), 2), "all": next(x for x in board if x["id"] == "gb")["mae"],
         "nSummer": int(summer.sum()), "maxSummerY": r1(ytr[summer].max()), "maxTestY": r1(yte.max())}
print("lệch mùa:", drift)
# 6e. Sau triển khai: sai số theo tháng của GB và mốc persistence trên dữ liệu 4–11/2026 (mô hình không học lại)
live = []
lvm = pd.to_datetime(lv.target).dt.to_period("M")
for per in sorted(lvm.unique()):
    k = (lvm == per).values
    live.append({"m": str(per), "n": int(k.sum()), "gb": round(mean_absolute_error(lv.y.values[k], gb.predict(lv[FEATS].values[k])), 2),
                 "persist": round(mean_absolute_error(lv.y.values[k], lv.pm0.values[k]), 2),
                 "bias": round(float(np.mean(gb.predict(lv[FEATS].values[k]) - lv.y.values[k])), 2), "mean": r1(lv.y.values[k].mean())})
print("sau triển khai:", live)

# 6f. Độ quan trọng đặc trưng (GB, giảm tạp chất) và hoán vị trên test
imp = dict(zip(FEATS, [round(float(x), 4) for x in gb.feature_importances_]))

# 6g. Lưới quyết định SVM 2 đặc trưng cho lab, ba giá trị γ
gx = np.linspace(-1.8, 5.2, 50); gy = np.linspace(-2.2, 4.2, 50)
GX, GY = np.meshgrid(gx, gy)
svm_models = []
for g in [0.1, 1, 10]:
    m_ = SVC(C=1, gamma=g).fit(Z2(tr[SV2].values), ytr > THR)
    svm_models.append({"gamma": g, "f": np.round(m_.decision_function(np.c_[GX.ravel(), GY.ravel()]).reshape(GY.shape), 2).tolist(),
                       "trainAcc": round(m_.score(Z2(tr[SV2].values), ytr > THR) * 100, 1), "testAcc": round(m_.score(Z2(te[SV2].values), yte > THR) * 100, 1),
                       "nSV": int(m_.n_support_.sum())})
lr2 = LogisticRegression().fit(Z2(tr[SV2].values), ytr > THR)
svm_grid = {"feats": SV2, "mu": s2mu.round(4).tolist(), "sd": s2sd.round(4).tolist(), "x": gx.round(3).tolist(), "y": gy.round(3).tolist(),
            "models": svm_models, "logregTest": round(lr2.score(Z2(te[SV2].values), yte > THR) * 100, 1)}
print("SVM 2D:", [(m["gamma"], m["trainAcc"], m["testAcc"], m["nSV"]) for m in svm_models], "logreg", svm_grid["logregTest"])

# ---------------------------------------------------------------- 7. Xuất dữ liệu cho trang
dd = days.loc[START:END]
st_ids = [s["id"] for s in stations]
out_days = []
for d, r in dd.iterrows():
    out_days.append({"d": d.strftime("%Y-%m-%d"), "pm": r1(r.pm), "n": int(r.n), "ws": r3(r.ws), "rh": r1(r.rh), "t": r1(r.t), "rain": r1(r.rain),
                     "blh": None if pd.isna(r.blh) else int(round(r.blh)), "p": r1(r.p), "north": r3(r.north), "cams": r1(r.cams),
                     "st": [r1(Dm.loc[d, s]) if s in Dm.columns else None for s in st_ids],
                     "kind": int(kind.get(d, -1))})
meta = {"start": START, "end": END, "test0": TEST0, "test1": TEST1, "thr": THR, "rules": {"stuck": STUCK, "minHours": MINH, "startupDays": STARTUP, "rmin": RMIN},
        "stations": stations, "qa": qa, "feats": FEATS}
json.dump({"meta": meta, "days": out_days}, open(OUT / "hanoi-air.json", "w"), separators=(",", ":"), ensure_ascii=False)

# Theo giờ: chỉ số Hà Nội (số nguyên) cho bản đồ nhiệt và hồ sơ ngày
hh = Hh.loc[START:]
json.dump({"start": str(hh.index[0]), "v": [None if not np.isfinite(x) else int(round(x)) for x in hh.values]},
          open(OUT / "hanoi-hourly.json", "w"), separators=(",", ":"))

# Mô hình mạng: trọng số, cửa sổ mẫu và dự đoán trên test
def pack_cnn(th):
    w, b, u, v, c = cnn_unpack(th)
    return {"w": np.round(w, 5).tolist(), "b": np.round(b, 5).tolist(), "u": np.round(u, 5).tolist(), "v": np.round(v, 5).tolist(), "c": round(float(c), 5)}


def pack_att(th):
    q, k, vv, u, v, c = attn_unpack(th)
    return {"Wq": np.round(q, 5).tolist(), "Wk": np.round(k, 5).tolist(), "Wv": np.round(vv, 5).tolist(), "u": np.round(u, 5).tolist(), "v": np.round(v, 5).tolist(), "c": round(float(c), 5)}


# Làm tròn trọng số rồi tính lại dự đoán, để trình duyệt khớp đúng với số đã lưu
cnnP, attP = pack_cnn(th_cnn), pack_att(th_att)
th_cnn_r = np.concatenate([np.ravel(cnnP[k]) for k in ["w", "b", "u", "v"]] + [[cnnP["c"]]])
th_att_r = np.concatenate([np.ravel(attP[k]) for k in ["Wq", "Wk", "Wv", "u", "v"]] + [[attP["c"]]])
te72r = (np.round(te72[0], 4), np.round(te72[1], 4))  # đúng những số trang nhận được
p_cnn = cnn_fwd(th_cnn_r, *te72r)[0] * 100
p_att, A_att = attn_fwd(th_att_r, *te72r)
p_att = p_att * 100
next(b for b in board if b["id"] == "cnn")["mae"] = round(mean_absolute_error(y72, p_cnn), 2)
next(b for b in board if b["id"] == "attn")["mae"] = round(mean_absolute_error(y72, p_att), 2)
wins = [{"d": str(d.date()), "x": np.round(w, 4).tolist(), "tom": np.round(t, 4).tolist(), "y": round(float(y), 1)} for d, w, t, y in Wn["test"]]
json.dump({"L": L, "K": K, "ch": CH, "tom": tom, "hm": hm.round(4).tolist(), "hs": hs.round(4).tolist(), "cnn": cnnP, "attn": attP,
           "wins": wins, "pCnn": np.round(p_cnn, 2).tolist(), "pAtt": np.round(p_att, 2).tolist()},
          open(OUT / "hanoi-nets.json", "w"), separators=(",", ":"))

kd = {"pca": {"mean": pca.mean_.round(5).tolist(), "comp": pca.components_.round(5).tolist(), "var": pca.explained_variance_ratio_.round(4).tolist()},
      "centers": km.cluster_centers_.round(4).tolist(),
      "profiles": [{"d": d, "k": int(l), "c": c.round(3).tolist()} for d, l, c in zip(pdays, lab, C2)],
      "mean24": [np.round(P[lab == k].mean(0), 1).tolist() for k in range(3)], "count": [int((lab[ptrain] == k).sum()) for k in range(3)]}
json.dump({"board": board, "leak": leak, "fill": fill, "cvTime": cv_time, "cvRand": cv_rand, "cvRandFold": rand_fold.tolist(), "drift": drift, "live": live, "imp": imp,
           "svm": svm_grid, "kinds": kd, "ols1": {"w": round(float(ols1.coef_[0]), 4), "b": round(float(ols1.intercept_), 3)},
           "olsCoef": dict(zip(FEATS, np.round(ols.coef_, 3).tolist())), "olsB": round(float(ols.intercept_), 3), "mu": mu.round(5).tolist(), "sd": sd.round(5).tolist(),
           "nTrain": len(tr), "nTest": len(te), "nLive": len(lv), "alertsTest": int((yte > THR).sum()), "alertsTrain": int((ytr > THR).sum())},
          open(OUT / "hanoi-results.json", "w"), separators=(",", ":"), ensure_ascii=False)

# ---------------------------------------------------------------- 8. Fixtures cho kiểm thử ml-core
v = days.pm.loc["2023-03-01":"2023-04-30"]
FIX.mkdir(exist_ok=True)
fx = {
    "series": [None if pd.isna(x) else float(x) for x in v.values],
    "ffill": [None if pd.isna(x) else float(x) for x in v.ffill().values],
    "interp": [None if pd.isna(x) else float(x) for x in v.interpolate(limit_area="inside").values],
    "shift2": [None if pd.isna(x) else float(x) for x in v.shift(2).values],
    "roll7": [None if pd.isna(x) else float(x) for x in v.rolling(7, min_periods=1).mean().values],
    "tss": [{"train": a.tolist(), "test": b_.tolist()} for a, b_ in TimeSeriesSplit(5).split(np.zeros(47))],
    "tssGap": [{"train": a.tolist(), "test": b_.tolist()} for a, b_ in TimeSeriesSplit(4, gap=2).split(np.zeros(30))],
    "featRows": {r.target: [None if pd.isna(x) else float(x) for x in r[FEATS].values] + [float(r.y)] for _, r in F.iloc[[0, 100, 500, len(F) - 1]].iterrows()},
    "nRows": {"train": len(tr), "test": len(te), "live": len(lv)},
    "persistMae": next(b for b in board if b["id"] == "persist")["mae"],
    "climMae": next(b for b in board if b["id"] == "clim")["mae"],
    "ols1": [float(ols1.coef_[0]), float(ols1.intercept_)],
    "olsMae": next(b for b in board if b["id"] == "ols")["mae"],
    "knnMae": next(b for b in board if b["id"] == "knn")["mae"],
    "cnnMae": next(b for b in board if b["id"] == "cnn")["mae"],
    "attnMae": next(b for b in board if b["id"] == "attn")["mae"],
    "attnFirst": A_att[0].round(6).tolist(),
}
json.dump(fx, open(FIX / "ch12.json", "w"))
for f in ["hanoi-air.json", "hanoi-hourly.json", "hanoi-nets.json", "hanoi-results.json"]:
    print(f, (OUT / f).stat().st_size // 1024, "KB")
