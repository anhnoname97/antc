// Public checks: no CMS login, content writes or publication.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await page.goto(`${base}/hay-tu-kiem-tra/`, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    const root = page.locator('[data-self-check-landing]');
    assert.equal(await root.locator('h1').innerText(), 'Hãy tự kiểm tra');
    assert.deepEqual(await root.locator('.self-check-tools .self-check-card__body > b').allTextContents(),
      ['Trước khi chuyển tiền', 'Trước khi đầu tư, vay', 'Khi nghi ngờ bị lừa']);
    const knowledge = root.locator('.self-check-knowledge');
    assert.deepEqual(await knowledge.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href'))),
      ['/thu-suc/', '/ngan-hang/']);
    assert.equal(await knowledge.locator('.self-check-card--pending').count(), 0);
    assert.equal(await root.locator('.self-check-lists a').count(), 8);
    assert.deepEqual(await root.locator('.self-check-lists .self-check-card__body > b').allTextContents(), [
      'Trước mọi quyết định có dính đến tiền', 'Trước khi ký hợp đồng, bấm đồng ý', 'Trước khi đầu tư, góp vốn',
      'Trước khi vay, bảo lãnh, đứng tên', 'Trước khi nhận việc, nộp hồ sơ', 'Trước khi mua, chuyển khoản, đặt cọc',
      'Khi người lạ liên hệ, gửi đường link', 'Khi đã lỡ đưa tiền, mã hoặc giấy tờ']);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow at ${width}px`);
    }
    await page.locator('[data-font-toggle]').click();
    await page.locator('[data-font-toggle]').click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.fontScale), '2');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Large-text overflow');
    assert.equal(await page.locator('.site-header__nav [aria-current="page"]').getAttribute('href'), '/hay-tu-kiem-tra/');
    for (const alias of ['/cong-cu-checklist/', '/quan-ly-trang/trang-chu/hay-tu-kiem-tra/']) {
      const redirect = await page.request.get(`${base}${alias}?source=audit`, { maxRedirects: 0 });
      assert.equal(redirect.status(), 301);
      assert.equal(redirect.headers().location, '/hay-tu-kiem-tra/?source=audit');
    }
    for (const href of new Set(await root.locator('a').evaluateAll(links => links.map(a => a.getAttribute('href'))))) {
      const result = await page.request.get(new URL(href, base).href);
      assert.equal(result.status(), 200, href);
    }
    await knowledge.locator('a[href="/ngan-hang/"]').click();
    await page.locator('#examview a[href="#chuyen-de-1"]').waitFor();
    assert.equal(new URL(page.url()).pathname, '/ngan-hang/');
    assert.deepEqual(await page.evaluate(async () => {
      const { state } = await import('/assets/js/contest/contest-store.js');
      return { practice: state.practice, contestId: state.contestId, entry: state.entry,
        registrationHidden: document.getElementById('regview').hidden };
    }), { practice: true, contestId: null, entry: null, registrationHidden: true });
    await page.reload();
    await page.locator('#examview a[href="#chuyen-de-1"]').waitFor();
    assert.equal(await page.evaluate(async () =>
      (await import('/assets/js/contest/contest-store.js')).state.practice), true);
    assert.deepEqual(errors, []);
    console.log('PASS: landing, 8 published checklist links in order, both knowledge links, mobile/large text, active menu, redirects, public link destinations and practice mode after click/reload.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
