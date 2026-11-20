/**
 * Kiểm thử khói: mở từng trang trên bản build, cuộn hết trang để mọi island client:visible
 * được kích hoạt, rồi kiểm tra không có lỗi JavaScript, không có tệp nào tải hỏng,
 * và mọi phòng thí nghiệm <Lazy> đã tải xong dữ liệu.
 */
import { test, expect, type Page } from '@playwright/test';
import { lessons } from '../src/lib/lessons';

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

const lazy = (page: Page) => page.locator('astro-island[component-url*="Lazy"]');

for (const path of ['', 've-du-an']) {
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
    await page.goto(`bai-hoc/${l.slug}`);
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
  await page.goto('bai-hoc/hoi-quy-logistic');
  await scrollThrough(page);
  await expect(lazy(page).locator('.ph')).toHaveCount(0);
  const cancer = [...count].filter(([k]) => k.startsWith('cancer.'));
  expect(cancer).toHaveLength(1);
  expect(cancer[0][1]).toBe(1);
});

test('phòng thí nghiệm tải trễ vẫn tương tác được', async ({ page }) => {
  await page.goto('bai-hoc/hoi-quy-logistic');
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
  await page.goto('bai-hoc/svm');
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
