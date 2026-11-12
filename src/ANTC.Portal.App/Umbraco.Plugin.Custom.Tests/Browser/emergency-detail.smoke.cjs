// Public acceptance only; CMS content is never changed by this check.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const url = base + '/hay-tu-kiem-tra/huong-dan/co-nguoi-dang-de-doa-ep-buoc-ban/';
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [], writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
  try {
    assert.equal((await page.goto(url)).status(), 200);
    const guide = page.locator('[data-action-guide]');
    await page.waitForFunction(() => document.querySelector('[data-guide-status]').textContent.includes('0/7'));
    assert.deepEqual(await guide.locator('.action-guide-step-number').allTextContents(), ['1', '2', '3', '4', '5', '6', '7']);
    assert.equal(await guide.locator('h2 input').count(), 0);
    assert.equal(await guide.locator('[data-guide-check]').count(), 7);
    assert.equal(await guide.locator('a[href="tel:113"]').count(), 1);
    assert.equal(await guide.locator('.action-guide-step').nth(4).locator('.action-guide-details p').count(), 1);
    assert(!(await guide.innerText()).includes('Chặn rồi thì phần lớn bằng chứng'));
    assert.match(await guide.locator('.action-guide-review').innerText(), /20\/10\/2026.*Chuyên đề 1 và Chuyên đề 8/);
    assert(await guide.locator('.action-guide-review').evaluate(el => el.compareDocumentPosition(document.querySelector('.action-guide-tools')) & Node.DOCUMENT_POSITION_PRECEDING));
    assert.match(await guide.evaluate(el => getComputedStyle(el).fontFamily), /Roboto/);
    const first = guide.locator('[data-guide-check]').first();
    await first.focus(); await page.keyboard.press('Space');
    assert(await first.isChecked());
    assert.match(await guide.locator('[data-guide-status]').innerText(), /1\/7/);
    const key = await guide.getAttribute('data-action-guide');
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem('at_action_guide_ticks:' + key)).length, key), 1);
    await page.reload();
    await page.waitForFunction(() => document.querySelector('[data-guide-check]').checked);
    await page.evaluate(() => localStorage.setItem('at_action_guide_ticks:another-guide', '["keep"]'));
    await guide.locator('[data-guide-reset]').click();
    assert.equal(await guide.locator('[data-guide-check]:checked').count(), 0);
    assert.equal(await page.evaluate(key => localStorage.getItem('at_action_guide_ticks:' + key), key), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('at_action_guide_ticks:another-guide')), '["keep"]');
    await page.evaluate(() => {
      window.copiedGuideUrl = null;
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async url => { window.copiedGuideUrl = url; } } });
      history.replaceState(null, '', '?test=private#buoc-2');
    });
    await guide.locator('[data-guide-share]').click();
    assert.equal(await page.evaluate(() => window.copiedGuideUrl), url);
    await page.evaluate(() => {
      window.printedGuide = false;
      window.print = () => { window.printedGuide = true; };
    });
    assert.equal(await guide.getByRole('button', { name: /Nghe bài viết|Dừng đọc/ }).count(), 0);
    await guide.locator('[data-guide-print]').click();
    assert(await page.evaluate(() => window.printedGuide));
    await guide.locator('[data-font-toggle]').click();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow at ${width}`);
    }
    await page.emulateMedia({ media: 'print' });
    assert.equal(await guide.locator('.action-guide-page-tools').isVisible(), false);
    assert.equal(await guide.locator('.action-guide-step').first().isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(url);
    await blockedPage.locator('[data-guide-check]').first().check();
    assert.match(await blockedPage.locator('[data-guide-status]').innerText(), /1\/7.*không cho lưu/);
    await blocked.close();
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await staticPage.goto(url);
    assert.equal(await staticPage.locator('.action-guide-step').count(), 7);
    assert.equal(await staticPage.locator('a[href="tel:113"]').isVisible(), true);
    assert.equal(await staticPage.getByRole('button', { name: /Nghe bài viết|Dừng đọc/ }).count(), 0);
    await noJs.close();
    assert.deepEqual(writes, [], 'No submissions from local ticks or document tools');
    assert.deepEqual(errors, []);
    console.log('PASS: seven steps, native icons/actions, preserved source, keyboard ticks, reload/reset isolation, blocked storage, share URL, print controls and no speech controls, four widths, enlarged font and no-JS content.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
