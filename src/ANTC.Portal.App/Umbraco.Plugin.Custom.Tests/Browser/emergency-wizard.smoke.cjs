const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const cases = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/ban-giao/PORTAL-V2/cong-cu/wizard-cases.json'), 'utf8')).cases;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], outgoing = [];
  let auditing = false;
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (auditing) outgoing.push(request.url()); });
  try {
    for (const entry of cases) {
      const response = await page.goto(`${base}/khan-cap/kiem-tra/`);
      assert.equal(response.status(), 200);
      await page.locator('[data-next]').waitFor();
      await page.waitForLoadState('networkidle');
      const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
      outgoing.length = 0; auditing = true;
      await page.locator(`input[value="${entry.input.step1}"]`).check();
      await page.locator('[data-next]').click();
      for (const key of entry.input.step2) await page.locator(`input[value="${key}"]`).check();
      await page.locator('[data-next]').click();
      for (const key of entry.input.step3) await page.locator(`input[value="${key}"]`).check();
      await page.locator('[data-next]').click();
      const result = page.locator('[data-wizard-result]');
      assert.equal(await result.getAttribute('data-level'), entry.expect.cautionLevel, entry.id);
      assert.doesNotMatch(await result.innerText(), /<\/?(?:p|b|strong)>/, 'Rich-text signs must render as readable text');
      assert((await result.locator('section').nth(1).locator('li').count()) <= 4);
      assert.equal(page.url(), `${base}/khan-cap/kiem-tra/`);
      assert.equal(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })), storage);
      assert.deepEqual(outgoing, [], `No answer requests: ${entry.id}`); auditing = false;
      for (const href of new Set(await result.locator('a').evaluateAll(links => links.map(a => a.getAttribute('href'))))) {
        assert(href.startsWith('/') && !href.startsWith('//'));
        assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, href);
      }
      if (entry.id === 'ngan-hang-otp') {
        assert.match(await result.innerText(), /Dừng liên lạc/);
        await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async value => { window.__wizardShare = value; } }));
        await result.locator('[data-share]').click();
        assert.equal(await page.evaluate(() => window.__wizardShare.url), `${base}/khan-cap/kiem-tra/`);
        const href = await result.locator('section').nth(1).locator('a').first().getAttribute('href');
        const article = await browser.newPage();
        await article.goto(new URL(href, base).href);
        assert.equal(await article.locator(new URL(href, base).hash).count(), 1, 'Tactic anchor exists');
        await article.close();
      }
      await result.locator('[data-edit]').click();
      assert.equal(await page.locator(`input[value="${entry.input.step1}"]`).isChecked(), true);
      await page.locator('[data-next]').click();
      await page.locator('[data-back]').click();
      await page.locator('[data-next]').click();
      for (const key of entry.input.step2) assert.equal(await page.locator(`input[value="${key}"]`).isChecked(), true);
    }
    await page.goto(`${base}/khan-cap/kiem-tra/`);
    await page.locator('[data-next]').click();
    assert.match(await page.locator('[role=alert]').innerText(), /Chọn ít nhất/);
    await page.locator('input[value=x]').check(); await page.locator('[data-next]').click();
    const firstOption = page.locator('input[type=checkbox]').first(); await firstOption.check();
    await page.locator('input[value=unk]').check(); assert.equal(await firstOption.isChecked(), false);
    await firstOption.check(); assert.equal(await page.locator('input[value=unk]').isChecked(), false);
    await page.locator('[data-next]').click(); await page.locator('input[value=unk]').check(); await page.locator('[data-next]').click();
    for (const width of [1440, 744, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Result overflow ${width}`);
    }
    await page.locator('[data-reset]').click();
    assert.equal(await page.locator('input:checked').count(), 0);
    assert.equal(await page.locator('[data-wizard-result]').count(), 0);
    await page.reload(); assert.equal(await page.locator('input:checked').count(), 0);
    await page.locator('input[value=x]').check();
    await page.reload(); assert.equal(await page.locator('input:checked').count(), 0, 'Reload must discard in-progress answers');
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `${base}/khan-cap/kiem-tra/`);
    await page.goto(`${base}/khan-cap/`);
    assert.equal(await page.locator('.emergency-wizard a').getAttribute('href'), '/khan-cap/kiem-tra/');
    await page.locator('.emergency-wizard a').click(); assert.equal(new URL(page.url()).pathname, '/khan-cap/kiem-tra/');
    assert.deepEqual(errors, []);
    console.log('PASS: 10 live wizard scenarios, levels, links and tactic anchors; validation/exclusive choices, edit/back/reset/reload, no answer traffic/storage, safe sharing, mobile result and emergency entrance.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
