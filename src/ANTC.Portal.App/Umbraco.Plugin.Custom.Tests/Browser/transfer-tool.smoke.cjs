// Public interaction checks only. No CMS changes or saved answers.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const url = `${base}/hay-tu-kiem-tra/truoc-khi-chuyen-tien/`;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], requests = [];
  let interacting = false;
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (interacting) requests.push([r.method(), r.url()]); });
  const choose = label => page.locator('.self-check-options').getByRole('button', { name: label, exact: true }).click();
  const state = code => page.locator(`.self-check-state--${code}`).waitFor();
  const reset = () => page.getByRole('button', { name: 'Làm lại từ đầu', exact: true }).click();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    await page.waitForLoadState('networkidle');
    const storageBefore = await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]);
    assert.equal(await page.locator('.self-check-question__title strong').count(), 2);
    assert.equal(await page.locator('.self-check-position').innerText(), 'Câu 1 / 5');
    interacting = true;
    await choose('Có'); await state('d');
    assert.equal(await page.locator('.self-check-reasons li').count(), 1);
    assert.equal(await page.locator('.self-check-actions li').count(), 3);
    assert.match(await page.locator('.self-check-actions').innerText(), /Dừng liên lạc/);
    await page.getByRole('button', { name: '← Sửa câu trả lời', exact: true }).click();
    assert.equal(await page.locator('[data-answer=co]').getAttribute('aria-pressed'), 'true');
    await choose('Không'); await choose('Không'); await choose('Không'); await choose('Không');
    assert.equal(await page.locator('.self-check-options button').count(), 4);
    await choose('Rồi'); await state('n');
    assert.equal(await page.locator('.self-check-actions li').count(), 2);
    assert.match(await page.locator('.self-check-state').innerText(), /không có nghĩa giao dịch an toàn/);
    await page.locator('.self-check-review summary').click();
    await page.getByRole('button', { name: 'Sửa câu 2', exact: true }).click();
    await choose('Có'); await state('d');
    assert.equal(await page.locator('.self-check-review__row').count(), 2);
    assert.equal(await page.locator('.self-check-reasons li').count(), 1);
    await reset();
    await choose('Tôi chưa biết');
    assert.equal(await page.locator('.self-check-position').innerText(), 'Câu 2 / 5');
    await choose('Không'); await choose('Không'); await choose('Không'); await choose('Rồi'); await state('h');
    assert.equal(await page.locator('.self-check-actions li').count(), 3);
    await reset();
    await choose('Không'); await choose('Không'); await choose('Không'); await choose('Không');
    await choose('Việc này do chính tôi bắt đầu, trên ứng dụng tôi vẫn dùng, thông tin đều khớp'); await state('n');
    assert.deepEqual(await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]), storageBefore);
    assert.deepEqual(requests, [], 'Answers caused network requests');
    interacting = false;
    const guidanceLinks = await page.locator('[data-self-check-more] a').evaluateAll(es => es.map(e => e.getAttribute('href')));
    assert.equal(guidanceLinks.length, 4);
    for (const href of guidanceLinks) { const result = await page.request.get(new URL(href, base).href); assert.equal(result.status(), 200, href); }
    assert.equal(await page.locator('[data-self-check-more] .self-check-card--pending').count(), 0);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.self-check-controls').isVisible(), false);
    assert.equal(await page.locator('.self-check-state--n').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.self-check-position').waitFor();
    assert.equal(await page.locator('.self-check-position').innerText(), 'Câu 1 / 5');
    assert.equal(await page.locator('.self-check-option[aria-pressed=true]').count(), 0);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow at ${width}`);
    }
    await page.locator('[data-font-toggle]').click(); await page.locator('[data-font-toggle]').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    const legacy = await page.request.get(`${base}/quan-ly-trang/trang-chu/hay-tu-kiem-tra/truoc-khi-chuyen-tien/`, { maxRedirects: 0 });
    assert.equal(legacy.status(), 301);
    assert.equal(legacy.headers().location, '/hay-tu-kiem-tra/truoc-khi-chuyen-tien/');
    assert.deepEqual(errors, []);
    console.log('PASS: D/H/N results, early stop, custom option, editing/reset, actions/sources, no storage/network answers, print, responsive text and legacy URL.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
