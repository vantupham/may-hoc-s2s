/**
 * Kiểm thử khói: mở từng trang trên bản build, cuộn hết trang để mọi island client:visible
 * được kích hoạt, rồi kiểm tra không có lỗi JavaScript, không có tệp nào tải hỏng,
 * và mọi phòng thí nghiệm <Lazy> đã tải xong dữ liệu.
 */
import { test, expect, type Page } from '@playwright/test';
import { lessons } from '../src/lib/lessons';
import { terms, termId } from '../src/lib/thuat-ngu';
import { datasets } from '../src/lib/bo-du-lieu';

/** Ghi lại lỗi trang, lỗi console và yêu cầu mạng thất bại (bỏ qua CDN của Pyodide). */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`lỗi JS: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r) => errors.push(`tải hỏng: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  return errors;
}

/** Cuộn tới đáy trang. Trang dài thêm khi các phòng thí nghiệm tải xong, nên đọc lại chiều cao mỗi bước. */
async function scrollThrough(page: Page) {
  for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(40);
  }
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
}

// Không gọi GoatCounter khi kiểm thử: không tạo lượt xem giả, không phụ thuộc mạng ngoài
test.beforeEach(async ({ page }) => {
  await page.route('https://gc.zgo.at/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
});

const lazy = (page: Page) => page.locator('astro-island[component-url*="Lazy"]');

for (const path of ['', 've-du-an/', 'thuat-ngu/', 'du-lieu/']) {
  test(`trang ${path || 'chủ'} mở được, không lỗi`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await scrollThrough(page);
    expect(errors).toEqual([]);
  });
}

for (const l of lessons.filter((l) => l.ready)) {
  test(`bài ${l.no}: ${l.short}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`bai-hoc/${l.slug}/`);
    await expect(page.locator('h1')).toHaveText(l.title);
    await scrollThrough(page);

    // Mọi <Lazy> đã gắn được phòng thí nghiệm thật: không còn khung "Đang tải" hay thông báo lỗi
    const isl = lazy(page);
    const n = await isl.count();
    for (let i = 0; i < n; i++) await expect(isl.nth(i).locator('.ph')).toHaveCount(0, { timeout: 15_000 });

    // Mọi island đã chạy xong (Astro bỏ thuộc tính ssr sau khi hydrate)
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0);

    expect(errors).toEqual([]);
  });
}

test('mỗi tệp dữ liệu chỉ tải một lần dù nhiều phòng thí nghiệm cùng dùng', async ({ page }) => {
  const count = new Map<string, number>();
  page.on('request', (r) => {
    if (r.url().endsWith('.json')) { const k = r.url().split('/').pop()!; count.set(k, (count.get(k) ?? 0) + 1); }
  });
  await page.goto('bai-hoc/hoi-quy-logistic/');
  await scrollThrough(page);
  await expect(lazy(page).locator('.ph')).toHaveCount(0);
  const cancer = [...count].filter(([k]) => k.startsWith('cancer.'));
  expect(cancer).toHaveLength(1);
  expect(cancer[0][1]).toBe(1);
});

test('phòng thí nghiệm tải trễ vẫn tương tác được', async ({ page }) => {
  await page.goto('bai-hoc/hoi-quy-logistic/');
  await scrollThrough(page);
  // FullLogReg: 569 bệnh nhân được vẽ, kéo ngưỡng thì hình thay đổi
  const lab = lazy(page).nth(2);
  await expect(lab.locator('circle')).toHaveCount(569);
  const slider = lab.locator('input[type=range]').first();
  const before = await lab.innerHTML();
  await slider.evaluate((r: HTMLInputElement) => {
    r.value = r.min;
    r.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(() => lab.innerHTML()).not.toBe(before);
});

test('bài 6: khung trải nghiệm ghi nhớ dự đoán, nhiệm vụ, số liệu và tự đánh giá', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('bai-hoc/svm/');
  await expect(page.locator('.secnav a[data-sec="tong-ket"]')).toHaveText(/Tổng kết/);
  await expect(page.locator('#truoc-khi-hoc')).toContainText('Sau bài này, bạn có thể');

  // Dự đoán ở lab Trực giác, khoá lại sau khi chọn
  const mission = page.locator('[data-mission="le"]');
  await mission.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[ssr]').filter({ has: mission })).toHaveCount(0);
  await mission.getByRole('radio', { name: '2–3 người, từ cả hai nhóm' }).click();
  await expect(mission.getByRole('radio', { name: 'Chỉ 1 người' })).toBeDisabled();
  await mission.getByRole('checkbox').first().check();
  await expect(mission).toContainText('1/3 đã làm');

  // Bấm "Đặt đường có lề lớn nhất" trên lab rồi ghi số liệu
  await page.getByRole('button', { name: 'Đặt đường có lề lớn nhất' }).click();
  await expect(page.locator('.lab').filter({ hasText: 'Đường nào tách tốt nhất?' })).toContainText('bạn đã tìm ra!');
  const deb = page.locator('[data-debrief="le"]');
  await deb.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[ssr]').filter({ has: deb })).toHaveCount(0);
  await deb.getByLabel('Lề lớn nhất có thể, Giá trị').fill('0,798');
  await deb.getByLabel('Số người chạm mép dải lề, Giá trị').fill('2');
  await deb.getByRole('button', { name: 'Đối chiếu số liệu' }).click();
  await expect(deb).toContainText('Khớp 1/2 ô');
  await expect(deb).toContainText('đúng là 3');
  await deb.getByRole('button', { name: 'Xem kết quả' }).click();
  await expect(deb.locator('.verdict')).toContainText('đúng.');

  // Tải lại trang: mọi thứ vẫn còn
  await page.reload();
  const self = page.locator('[data-selfcheck]');
  await self.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[ssr]').filter({ has: self })).toHaveCount(0);
  await expect(self).toContainText('1/4');
  const again = page.locator('[data-mission="le"]');
  await again.scrollIntoViewIfNeeded();
  await expect(again.getByRole('radio', { name: '2–3 người, từ cả hai nhóm' })).toHaveAttribute('aria-checked', 'true');
  await expect(again).toContainText('1/3 đã làm');

  // Tự đánh giá thấp một mục tiêu → được chỉ đường ôn lại
  await self.scrollIntoViewIfNeeded();
  await self.getByRole('radiogroup').nth(1).getByRole('radio', { name: /Mơ hồ/ }).click();
  await expect(self.locator('.review a[href="#tinh-tay"]')).toHaveText('Bước 4. Tính tay');

  expect(errors).toEqual([]);
});

for (const l of lessons.filter((l) => l.lecture)) {
  test(`bài giảng ${l.no}: phát, phụ đề, nhảy chương, tệp âm thanh`, async ({ page, request }) => {
    const errors = watchErrors(page);
    const dir = `giang/${l.slug}`;
    for (const f of ['loi-giang.mp3', 'phu-de.vtt', 'thoi-gian.json', 'kich-ban.json']) expect((await request.get(`${dir}/${f}`)).status(), f).toBe(200);
    const lec = await (await request.get(`${dir}/kich-ban.json`)).json();

    await page.goto(`bai-hoc/${l.slug}/`);
    await expect(page.locator('.secnav a[data-sec="bai-giang"]')).toBeVisible();
    const player = page.locator('#bai-giang .player');
    await page.locator('#bai-giang').scrollIntoViewIfNeeded();
    await expect(player.locator('.big')).toBeVisible({ timeout: 15_000 });
    await expect(player.locator('.note')).toHaveCount(0); // âm thanh khớp kịch bản

    // Phát: phụ đề câu đầu hiện ra, đồng hồ chạy
    await player.locator('.big').click();
    await expect(player.locator('.cap')).toHaveText(lec.chapters[0].scenes[0].lines[0].cap);
    await expect.poll(() => player.locator('.time').textContent(), { timeout: 10_000 }).not.toMatch(/^0:00 /);

    // Nhảy tới chương 4: tiêu đề cảnh và phụ đề đổi theo
    await player.locator('.chapters li').nth(3).locator('button').click();
    await expect(player.locator('.chap')).toHaveText(`4. ${lec.chapters[3].title}`);
    await expect(player.locator('.cap')).toHaveText(lec.chapters[3].scenes[0].lines[0].cap);
    await expect(player.locator('.canvas .scene')).toHaveCount(1);

    // Bản chép lời có đủ mọi câu
    await player.getByRole('button', { name: 'Chép lời' }).click();
    const n = lec.chapters.flatMap((c: any) => c.scenes.flatMap((s: any) => s.lines)).length;
    await expect(player.locator('.transcript button')).toHaveCount(n);
    await player.locator('.bar .play').click();

    // Tua làm trình duyệt huỷ yêu cầu Range đang dở của tệp âm thanh: bình thường, không phải lỗi
    expect(errors.filter((e) => !/\.mp3 \(net::ERR_ABORTED\)/.test(e))).toEqual([]);
  });
}

// ——— SEO: thẻ meta, ảnh chia sẻ, sitemap, 404, liên kết nội bộ ———

const SITE = 'https://vantupham.github.io/may-hoc-s2s/';
const pages = [
  { path: '', image: 'trang-chu', title: /^Máy học S2S – / },
  { path: 've-du-an/', image: 'trang-chu', title: 'Về dự án – Máy học S2S' },
  { path: 'thuat-ngu/', image: 'thuat-ngu', title: 'Thuật ngữ học máy Anh–Việt – Máy học S2S' },
  { path: 'du-lieu/', image: 'du-lieu', title: 'Bộ dữ liệu thật để học máy học – Máy học S2S' },
  ...lessons.filter((l) => l.ready).map((l) => ({ path: `bai-hoc/${l.slug}/`, image: l.slug, title: `${l.seoTitle} – Máy học S2S`, l })),
];

for (const p of pages) {
  test(`SEO ${p.path || 'trang chủ'}: canonical, mô tả, ảnh chia sẻ, liên kết nội bộ`, async ({ page, request }) => {
    await page.goto(p.path);
    await expect(page).toHaveTitle(p.title);
    const meta = (sel: string, attr = 'content') => page.locator(sel).getAttribute(attr);
    expect(await meta('link[rel=canonical]', 'href')).toBe(SITE + p.path);
    expect(await meta('meta[property="og:url"]')).toBe(SITE + p.path);
    const desc = (await meta('meta[name=description]'))!;
    expect(desc.length).toBeGreaterThanOrEqual(110);
    expect(desc.length).toBeLessThanOrEqual(170);
    if ('l' in p) expect(desc).toBe(p.l!.seoDescription);
    expect(await meta('meta[property="og:type"]')).toBe('l' in p ? 'article' : 'website');
    const img = (await meta('meta[property="og:image"]'))!;
    expect(img).toBe(`${SITE}og/${p.image}.png`);
    const res = await request.get(`og/${p.image}.png`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');

    // Liên kết tới trang trong site phải có / ở cuối, để không bị chuyển hướng 301 trên GitHub Pages
    const hrefs = await page.locator('a[href^="/may-hoc-s2s"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    const bad = hrefs.filter((h) => { const path = h.split('#')[0]; return !path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path); });
    expect(bad).toEqual([]);
  });
}

test('sitemap liệt kê mọi trang, đúng URL chuẩn', async ({ request }) => {
  const res = await request.get('sitemap.xml');
  expect(res.status()).toBe(200);
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.sort()).toEqual(pages.map((p) => SITE + p.path).sort());
});

test('trang không tồn tại hiện trang 404 có mục lục và không cho lập chỉ mục', async ({ page }) => {
  const res = await page.goto('khong-co-trang-nay/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Không tìm thấy trang này');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('main ol a')).toHaveCount(lessons.filter((l) => l.ready).length);
});

const jsonLd = async (page: Page) => {
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const d = JSON.parse(raw!);
  expect(d['@context']).toBe('https://schema.org');
  return d['@graph'] as Record<string, any>[];
};

test('trang chủ có JSON-LD: WebSite, Organization và Course gồm mọi bài', async ({ page }) => {
  await page.goto('');
  const g = await jsonLd(page);
  expect(g.map((x) => x['@type'])).toEqual(['WebSite', 'Organization', 'Course']);
  const course = g[2];
  expect(course.hasPart.map((p: any) => p.url)).toEqual(lessons.filter((l) => l.ready).map((l) => `${SITE}bai-hoc/${l.slug}/`));
});

for (const l of lessons.filter((l) => l.ready)) {
  test(`SEO nội dung ${l.no}: JSON-LD, định nghĩa, tiêu đề bước, bản chép lời`, async ({ page }) => {
    await page.goto(`bai-hoc/${l.slug}/`);
    const g = await jsonLd(page);
    const res = g.find((x) => x['@type'] === 'LearningResource')!;
    expect(res.url).toBe(`${SITE}bai-hoc/${l.slug}/`);
    expect(res.description).toBe(l.seoDescription);
    const crumbs = g.find((x) => x['@type'] === 'BreadcrumbList')!.itemListElement;
    expect(crumbs.map((c: any) => c.item)).toEqual([SITE, `${SITE}bai-hoc/${l.slug}/`]);

    // Khối "X là gì?" ngay dưới tiêu đề
    await expect(page.locator('.def h2')).toHaveText(l.question);
    await expect(page.locator('.def p')).toHaveText(l.answer);

    // Bước 3–6 mang tên chủ đề của bài
    for (const n of [3, 4, 5, 6]) await expect(page.locator(`h2:has(.step-no:text-is("${n}"))`)).toContainText(l.topic);

    // Lời giảng có sẵn trong HTML (không cần JavaScript), đủ mọi chương
    if (l.lecture) {
      const lec = await (await page.request.get(`giang/${l.slug}/kich-ban.json`)).json();
      await expect(page.locator('.chep-loi h3')).toHaveCount(lec.chapters.length);
      await expect(page.locator('.chep-loi p').first()).toContainText(lec.chapters[0].scenes[0].lines[0].cap);
    }
  });
}

test('HTML mỗi trang dưới 300 KB (chưa nén): dữ liệu lớn phải tải qua <Lazy>, hình trang trí vẽ trên trình duyệt', async ({ request }) => {
  const sizes = await Promise.all(pages.map(async (p) => [p.path, (await (await request.get(p.path)).body()).length] as const));
  expect(sizes.filter(([, n]) => n > 300_000)).toEqual([]);
});

test('lưới xác suất của bài 2 vẽ trên trình duyệt, không dựng sẵn trong HTML', async ({ page, request }) => {
  const html = await (await request.get('bai-hoc/hoi-quy-logistic/')).text();
  expect((html.match(/shape-rendering="crispEdges"/g) ?? []).length).toBe(0);
  await page.goto('bai-hoc/hoi-quy-logistic/');
  const lab = page.locator('astro-island[component-url*="LogRegLab"]');
  await lab.locator('svg.chart').first().scrollIntoViewIfNeeded(); // astro-island là display: contents, không cuộn tới được
  await expect(lab.locator('rect[shape-rendering="crispEdges"]')).toHaveCount(36 * 36);
});

// ——— Giai đoạn 4: thuật ngữ, bộ dữ liệu, liên kết cuối bài ———

const pageText = async (request: import('@playwright/test').APIRequestContext, path: string) =>
  (await (await request.get(path)).text()).replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();

test('mỗi thuật ngữ có neo riêng và thật sự xuất hiện trong bài nó trỏ tới', async ({ request }) => {
  const ids = terms.map(termId);
  expect(new Set(ids).size).toBe(ids.length);
  const texts = new Map<string, string>();
  const missing: string[] = [];
  for (const t of terms) {
    if (!texts.has(t.slug)) texts.set(t.slug, await pageText(request, `bai-hoc/${t.slug}/`));
    const m = (t.match ?? t.vi).toLowerCase();
    if (!texts.get(t.slug)!.includes(m)) missing.push(`${t.vi} → ${t.slug} (tìm "${m}")`);
  }
  expect(missing).toEqual([]);
});

test('trang thuật ngữ: đủ thuật ngữ, JSON-LD DefinedTermSet, ô lọc chạy được', async ({ page }) => {
  await page.goto('thuat-ngu/');
  await expect(page.locator('.term')).toHaveCount(terms.length);
  const g = await jsonLd(page);
  const set = g.find((x) => x['@type'] === 'DefinedTermSet')!;
  expect(set.hasDefinedTerm).toHaveLength(terms.length);
  // Gõ không dấu vẫn tìm được "Lề"; gõ tiếng Anh tìm được "Quá khớp"
  await page.locator('#loc').fill('overfitting');
  await expect(page.locator('.term:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.term:not([hidden]) dfn')).toHaveText('Quá khớp');
  await page.locator('#loc').fill('vector ho tro');
  await expect(page.locator('.term:not([hidden]) dfn').getByText('Vector hỗ trợ', { exact: true })).toHaveCount(1);
  await page.locator('#loc').fill('zzzz');
  await expect(page.locator('.none')).toBeVisible();
});

test('trang bộ dữ liệu: mỗi bộ có nguồn và ít nhất một bài dùng nó', async ({ page }) => {
  await page.goto('du-lieu/');
  for (const d of datasets) {
    const sec = page.locator(`#${d.id}`);
    await expect(sec.locator('h2')).toHaveText(d.name);
    await expect(sec.locator('.src')).toContainText('Nguồn:');
    expect(await sec.locator('.used a').count(), d.name).toBeGreaterThan(0);
  }
});

for (const l of lessons.filter((l) => l.ready)) {
  test(`cuối bài ${l.no}: học tiếp và thuật ngữ trong bài`, async ({ page }) => {
    await page.goto(`bai-hoc/${l.slug}/`);
    const after = lessons.filter((x) => x.ready && x.requires.includes(l.slug));
    await expect(page.locator('.after li')).toHaveCount(after.length);
    const mine = terms.filter((t) => t.slug === l.slug);
    expect(mine.length, 'mỗi bài nên có thuật ngữ').toBeGreaterThan(0);
    await expect(page.locator('.terms a')).toHaveCount(mine.length);
  });
}

test('tệp xác minh Google Search Console và Bing Webmaster Tools nằm đúng chỗ', async ({ request }) => {
  expect(await (await request.get('google77c80e46c4a5350a.html')).text()).toContain('google-site-verification: google77c80e46c4a5350a.html');
  expect(await (await request.get('BingSiteAuth.xml')).text()).toContain('6715EEB8CA3633252AB11C953E26AACD');
});

test('mọi trang có thẻ đếm GoatCounter', async ({ request }) => {
  for (const p of pages) {
    expect(await (await request.get(p.path)).text(), p.path).toContain('data-goatcounter="https://pvtu.goatcounter.com/count"');
  }
});
