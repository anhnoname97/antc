// Read-only acceptance for source citations; no CMS writes.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    assert.equal((await page.goto(base + '/khan-cap/')).status(), 200);
    const source = page.locator('.emergency-note').filter({ hasText: 'Rút từ' });
    const reading = source.getByRole('link', { name: 'Bài đọc Chuyên đề 1', exact: true });
    assert.equal(await reading.getAttribute('href'), '/hay-tu-kiem-tra/bai-doc/chuyen-de-1/');
    assert.equal(await source.locator('a').count(), 2);
    const guide = source.getByRole('link', { name: 'Có người đang thúc bạn làm ngay', exact: true });
    const guideUrl = await guide.getAttribute('href');
    assert(guideUrl.endsWith('#buoc-1'));
    const style = await reading.evaluate(a => ({ weight: getComputedStyle(a).fontWeight, decoration: getComputedStyle(a).textDecorationLine }));
    assert(Number(style.weight) >= 700);
    assert(style.decoration.includes('underline'));
    await reading.hover();
    assert.equal(await reading.evaluate(a => getComputedStyle(a).backgroundColor), 'rgb(233, 242, 252)');
    await reading.focus();
    assert(await reading.evaluate(a => parseFloat(getComputedStyle(a).outlineWidth) >= 2));
    const readingTitle = await reading.getAttribute('title');
    const readingUrl = await reading.getAttribute('href');
    const guideUrls = await page.locator('a[href^="/hay-tu-kiem-tra/huong-dan/"]').evaluateAll(as => [...new Set(as.map(a => a.getAttribute('href').split('#')[0]))]);
    await Promise.all([page.waitForURL(base + readingUrl), page.keyboard.press('Enter')]);
    assert.equal(await page.locator('h1').innerText(), readingTitle);
    await page.goto(base + guideUrl);
    assert.equal(await page.locator('#buoc-1').count(), 1);
    assert.equal(new URL(page.url()).hash, '#buoc-1');
    assert.equal(guideUrls.length, 10);
    for (const url of guideUrls) {
      assert.equal((await page.goto(base + url)).status(), 200);
      assert.deepEqual(await page.locator('.action-guide-review .content-source-link').evaluateAll(as => as.map(a => a.getAttribute('href'))), ['/hay-tu-kiem-tra/bai-doc/chuyen-de-1/', '/hay-tu-kiem-tra/bai-doc/chuyen-de-8/']);
    }
    await page.goto(base + '/hay-tu-kiem-tra/');
    const checklists = await page.locator('.self-check-lists a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    assert.equal(checklists.length, 8);
    for (const url of checklists) {
      await page.goto(base + url);
      const actual = page.locator('.self-check-heading .content-source-link');
      assert.equal(await actual.count(), 1);
      assert.equal(await actual.getAttribute('href'), await page.locator('.self-check-source-link').getAttribute('href'));
    }
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Source link overflow ${width}`);
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await staticPage.goto(base + '/khan-cap/');
    const staticLink = staticPage.getByRole('link', { name: 'Bài đọc Chuyên đề 1', exact: true });
    assert.equal(await staticLink.count(), 1);
    await Promise.all([staticPage.waitForURL(base + readingUrl), staticLink.click()]);
    assert.equal(await staticPage.locator('h1').innerText(), readingTitle);
    await noJs.close();
    assert.deepEqual(errors, []);
    console.log('PASS: highlighted source links, reading and exact step navigation, all 10 guides and 8 checklists, keyboard/hover, four widths and no-JS.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
