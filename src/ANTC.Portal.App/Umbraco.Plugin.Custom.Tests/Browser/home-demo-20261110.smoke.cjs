// Public checks; no CMS writes. ANTC_PLAYWRIGHT_MODULE and ANTC_TEST_URL are optional.
const { test: unused, ...playwright } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const engine = process.env.ANTC_BROWSER || 'chromium';
const artifacts = process.env.ANTC_HOME_ARTIFACTS;
(async () => {
  const browser = await playwright[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], broken = [], transmitted = [];
  let answering = false;
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) broken.push(r.url() + ': ' + r.status()); });
  page.on('request', r => { if (answering) transmitted.push(r.url()); });
  const overflow = async label => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label);
  const storage = () => page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  try {
    assert.equal((await page.goto(base + '/')).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('[data-home-emergency]').count(), 1);
    assert.equal(await page.locator('.home-emergency__levels').count(), 0);
    assert.equal(await page.locator('[data-home-wizard]').getAttribute('href'), '/khan-cap/chon-tinh-huong/');
    assert.equal(await page.locator('[data-home-tools] .self-check-card').count(), 3);
    assert.equal(await page.locator('[data-home-tools] .self-check-card__cover').count(), 3);
    assert.equal(await page.locator('[data-home-risk-card]').count(), 5);
    assert.equal(await page.locator('[data-home-library] .home-library-card').count(), 3);
    for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode()); }
    const hrefs = new Set(await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href'))));
    await page.goto(base + '/thu-vien/');
    assert.equal(await page.locator('#co-chi-kim .foundation-list li').count(), 10);
    assert.equal(await page.locator('#chuyen-de .foundation-list').first().locator('li').count(), 8);
    assert((await page.locator('#thu-doan .foundation-list li').count()) > 0);
    for (const href of await page.locator('a[href^="/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))) hrefs.add(href);
    for (const href of hrefs) {
      const response = await page.request.get(new URL(href, base).href);
      assert.equal(response.status(), 200, href);
    }
    await page.locator('#foundation-query').fill('gia mao'); await page.locator('#foundation-query').press('Enter');
    assert((await page.locator('#thu-doan .foundation-list li:visible').count()) > 0, 'Unaccented library search');
    await page.goto(base + '/khan-cap/');
    assert.equal(await page.locator('.emergency-wizard .emergency-button--primary').getAttribute('href'), '/khan-cap/chon-tinh-huong/');
    assert.equal(await page.locator('.emergency-wizard__alternative').getAttribute('href'), '/khan-cap/kiem-tra/');
    await page.goto(base + '/khan-cap/chon-tinh-huong/');
    await page.locator('.situation-groups details').first().waitFor();
    assert.equal(await page.locator('.situation-groups details').count(), 12);
    const data = await page.locator('[data-situation-data]').evaluate(x => JSON.parse(x.textContent));
    assert.equal(data.situations.length, 82);
    await page.evaluate(() => document.fonts.ready);
    const before = await storage();
    answering = true;
    await page.locator('#situation-query').fill('cong an goi');
    await page.locator('[data-search-results] [data-value="cong-an-goi"]').waitFor();
    await page.locator('[data-search-results] [data-value="cong-an-goi"]').click();
    await page.locator('[data-action="result"]').click();
    assert.equal(await page.locator('[data-choice-error]').isVisible(), true);
    for (const code of ['threat', 'app', 'money']) await page.locator(`[data-choice="${code}"]`).check();
    await page.locator('[data-action="result"]').click();
    assert.match(await page.locator('.situation-first').innerText(), /113/);
    assert.match(await page.locator('.situation-level h2').innerText(), /DỪNG/);
    assert.match(await page.locator('.situation-steps>li').first().innerText(), /tắt|ngắt/i);
    assert.equal(await page.locator('.situation-result').evaluate(el => /<\/?(?:b|small)>/.test(el.innerText)), false, 'No literal HTML tags in content');
    assert.equal(await storage(), before, 'No answers persisted to browser storage');
    assert.equal(await page.evaluate(() => location.search + location.hash), '', 'Choices do not alter the URL');
    assert.deepEqual(transmitted, [], 'No answers sent to the network');
    answering = false;
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__testShared = text; } } }));
    await page.locator('[data-action="share"]').click();
    const shared = await page.evaluate(() => window.__testShared);
    assert.match(shared, /1\).*113/); assert.match(shared, /#s=cong-an-goi&done=/);
    const sharedUrl = shared.split('\n').at(-1);
    await page.goto(sharedUrl);
    await page.locator('.situation-first').waitFor();
    assert.match(await page.locator('.situation-first').innerText(), /113/);
    await page.evaluate(() => { window.print = () => { window.__testPrinted = true; }; });
    await page.locator('[data-action="print"]').click();
    assert.equal(await page.evaluate(() => window.__testPrinted), true);
    assert.equal(await page.locator('.situation-explanation:not([open])').count(), 0, 'Print includes explanations');
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    if (artifacts) { fs.mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: path.join(artifacts, engine + '-result.png'), fullPage: true }); }
    for (const url of ['/', '/thu-vien/', '/khan-cap/chon-tinh-huong/']) {
      await page.goto(base + url);
      for (const width of [320, 390, 768, 1024, 1440]) for (const scale of ['0', '1', '2']) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(value => { document.documentElement.dataset.fontScale = value; }, scale);
        await overflow(`${url} ${width}px font ${scale}`);
      }
    }
    await page.goto(base + '/'); await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.home-emergency__image').isVisible(), false);
    assert.equal(await page.locator('.self-check-card__cover').first().isVisible(), false);
    if (artifacts) await page.screenshot({ path: path.join(artifacts, engine + '-mobile.png'), fullPage: true });
    assert.deepEqual(errors, [], 'No JavaScript errors'); assert.deepEqual(broken, [], 'No missing resources');
    console.log(`PASS ${engine}: ${hrefs.size} public links; 5 homepage blocks; 82 situations; ordered result/share/print; no answer storage or network; 45 responsive/font cases.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
