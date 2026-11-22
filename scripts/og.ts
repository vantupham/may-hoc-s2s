/**
 * Sinh ảnh chia sẻ 1200×630 (og:image) cho trang chủ và từng bài vào public/og/.
 * Vẽ bằng HTML với đúng font và màu của trang ("trang vở": lề đỏ, mực tím), chụp bằng Chromium của Playwright.
 *
 *   npm run og        # chạy lại khi thêm bài hoặc đổi tên bài trong src/lib/lessons.ts
 *
 * Ảnh được commit vào kho, nên CI không cần chạy script này.
 */
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lessons } from '../src/lib/lessons.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}public/og`;
mkdirSync(out, { recursive: true });

const font = (p: string) => `url(data:font/woff2;base64,${readFileSync(`${root}node_modules/${p}`).toString('base64')}) format('woff2')`;
const lit = '@fontsource-variable/literata/files/literata';
const css = `
@font-face { font-family: L; font-weight: 200 900; src: ${font(`${lit}-latin-opsz-normal.woff2`)}; }
@font-face { font-family: L; font-weight: 200 900; src: ${font(`${lit}-vietnamese-opsz-normal.woff2`)};
  unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB; }
@font-face { font-family: L; font-style: italic; font-weight: 200 900; src: ${font(`${lit}-latin-opsz-italic.woff2`)}; }
@font-face { font-family: L; font-style: italic; font-weight: 200 900; src: ${font(`${lit}-vietnamese-opsz-italic.woff2`)};
  unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB; }
@font-face { font-family: H; src: ${font('@fontsource/patrick-hand/files/patrick-hand-latin-400-normal.woff2')}; }
@font-face { font-family: H; src: ${font('@fontsource/patrick-hand/files/patrick-hand-vietnamese-400-normal.woff2')};
  unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #fbfcff; color: #1d1f2c; font-family: L, Georgia, serif; position: relative; overflow: hidden; }
.le { position: absolute; left: 118px; top: 0; bottom: 0; width: 3px; background: #e3394d; }
.page { position: absolute; left: 170px; right: 80px; top: 58px; bottom: 52px; display: flex; flex-direction: column; }
.note { font-family: H; color: #4b2fbf; font-size: 46px; transform: rotate(-3deg); transform-origin: left; margin-bottom: 18px; }
h1 { padding-right: 150px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; font-variation-settings: 'opsz' 72; }
.sum { margin: 22px 0 18px; font-size: 27px; line-height: 1.45; color: #5c6076; max-width: 860px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.foot { margin-top: auto; display: flex; align-items: baseline; justify-content: space-between; gap: 40px; border-top: 2px solid #1d1f2c; padding-top: 20px; }
.brand { font-size: 34px; font-weight: 800; white-space: nowrap; }
.brand span { font-family: H; font-weight: 400; font-size: 40px; display: inline-block; transform: rotate(-4deg); }
.ds { text-wrap: balance; font-style: italic; font-size: 22px; color: #5c6076; text-align: right; }
svg { position: absolute; right: 70px; top: 64px; }
`;

const curve = `<svg width="150" height="110" viewBox="0 0 150 110" aria-hidden="true">
  <path d="M8 10c14 58 34 84 62 82s30-36 72-80" fill="none" stroke="#4b2fbf" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
  <circle cx="66" cy="92" r="11" fill="#4b2fbf"/></svg>`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const titleSize = (t: string) => (t.length <= 24 ? 84 : t.length <= 40 ? 66 : t.length <= 56 ? 54 : 50);

const card = (note: string, title: string, sum: string, foot: string) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="le"></div>${curve}<div class="page">
  <p class="note">${esc(note)}</p>
  <h1 style="font-size:${titleSize(title)}px">${esc(title)}</h1>
  <p class="sum">${esc(sum)}</p>
  <div class="foot"><div class="brand">Máy học <span>S2S</span></div><div class="ds">${esc(foot).replace(/(\S+-\S+)/g, '<span style="white-space:nowrap">$1</span>')}</div></div>
</div></body></html>`;

const cards = [
  { name: 'trang-chu', html: card('tính tay từng bước', 'Thấy từng con số bên trong một mô hình học máy', 'Các bài học tương tác bằng tiếng Việt, mỗi bài một dự án nhỏ với dữ liệu thật. Python chạy ngay trên trình duyệt.', `${lessons.filter((l) => l.ready).length} bài, từ Gradient Descent đến Attention`) },
  ...lessons.filter((l) => l.ready).map((l) => ({ name: l.slug, html: card(`Chương ${l.no}`, l.title, l.summary, `Dữ liệu thật: ${l.dataset}`) })),
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const c of cards) {
  await page.setContent(c.html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${c.name}.png` });
  console.log(`public/og/${c.name}.png`);
}
await browser.close();
