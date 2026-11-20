/** Dữ liệu lớn của chương 3: chỉ tải khi một phòng thí nghiệm cần, và chỉ tải một lần. */
import { imputeMedian, standardize } from './ml-core';

export interface Cal {
  n: number; cats: string[];
  lon: number[]; lat: number[]; age: number[]; rooms: number[]; bedrooms: (number | null)[];
  pop: number[]; hh: number[]; income: number[]; value: number[]; ocean: number[];
}
export interface Cancer30 { features: string[]; X: number[][]; y: number[]; testIds: number[] }

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const cache = new Map<string, Promise<unknown>>();
function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) cache.set(file, fetch(`${base}/data/${file}`).then((r) => { if (!r.ok) throw new Error(`Không tải được ${file} (${r.status})`); return r.json(); }));
  return cache.get(file) as Promise<T>;
}
export const loadCalifornia = () => load<Cal>('california.json');
export const loadCancer30 = () => load<Cancer30>('cancer30.json');

export const oceanVi: Record<string, string> = {
  '<1H OCEAN': 'cách biển dưới 1 giờ', INLAND: 'nội địa', 'NEAR OCEAN': 'gần biển', 'NEAR BAY': 'gần vịnh', ISLAND: 'trên đảo',
};

/** Tên các đặc trưng của mô hình hồi quy giá nhà dùng chung trong chương. */
export const featNames = ['thu nhập', 'tuổi nhà', 'log phòng/hộ', 'phòng ngủ/phòng', 'log người/hộ', 'vĩ độ', 'kinh độ'];

/**
 * Ma trận đặc trưng cho hồi quy giá nhà. `bed` là cột phòng ngủ đã điền. Hai tỷ lệ phòng/hộ và người/hộ
 * lấy log để vài khu vực cực đoan (ký túc xá, khu nghỉ dưỡng) không làm hỏng mô hình tuyến tính.
 * ocean: 'onehot' thêm 4 cột 0/1 (bỏ loại đầu), 'ordinal' thêm một cột số thứ tự 0–4, 'none' không thêm.
 */
export function houseFeatures(c: Cal, bed: number[], ocean: 'onehot' | 'ordinal' | 'none' = 'onehot', geo = true): number[][] {
  const X: number[][] = new Array(c.n);
  for (let i = 0; i < c.n; i++) {
    const r = [c.income[i], c.age[i], Math.log(c.rooms[i] / c.hh[i]), bed[i] / c.rooms[i], Math.log(c.pop[i] / c.hh[i])];
    if (geo) r.push(c.lat[i], c.lon[i]);
    if (ocean === 'onehot') for (let k = 1; k < c.cats.length; k++) r.push(c.ocean[i] === k ? 1 : 0);
    else if (ocean === 'ordinal') r.push(c.ocean[i]);
    X[i] = r;
  }
  return X;
}

export const bedMedian = (c: Cal) => imputeMedian(c.bedrooms);

/** Chuẩn hoá các cột của ma trận theo thống kê của các dòng `fitRows`. */
export function scaleCols(X: number[][], fitRows: number[]) {
  const d = X[0].length, st = Array.from({ length: d }, (_, j) => standardize([0], fitRows.map((i) => X[i][j])));
  return X.map((r) => r.map((v, j) => (st[j].sd > 0 ? (v - st[j].mu) / st[j].sd : 0)));
}

/** Ô lưới 1° theo vĩ độ và kinh độ, dùng làm nhóm khi chia theo địa lý. */
export const block1 = (c: Cal) => c.lat.map((la, i) => Math.floor(la) * 1000 + Math.floor(c.lon[i]));

export const pick = <T,>(a: T[], idx: number[]) => idx.map((i) => a[i]);
