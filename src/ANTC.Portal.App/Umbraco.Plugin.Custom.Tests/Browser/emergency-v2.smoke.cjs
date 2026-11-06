const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await page.goto(`${base}/khan-cap/`);
    assert.equal(response.status(), 200);
    for (const [oldPath, newPath] of [['/ung-pho/', '/khan-cap/'], ['/ung-pho', '/khan-cap/'], ['/ung-pho/kiem-tra/', '/khan-cap/kiem-tra/']]) {
      const redirect = await page.request.get(`${base}${oldPath}?source=legacy`, { maxRedirects: 0 });
      assert.equal(redirect.status(), 301, oldPath);
      assert.equal(redirect.headers().location, `${newPath}?source=legacy`);
    }
    assert.equal(await page.locator('a[href^="/ung-pho"]').count(), 0, 'Rendered links must use the new public path');
    const root = page.locator('[data-emergency-v2]');
    assert.equal(await root.locator('h1').innerText(), 'Khẩn cấp');
    assert.equal(await root.locator('.emergency-principles h3').count(), 4);
    assert.equal(await root.locator('[data-emergency-door]').count(), 3);
    const cardTops = await root.locator('.emergency-door').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top));
    assert(cardTops.every(top => Math.abs(top - cardTops[0]) < 1), 'All three desktop cards must share one row');
    assert.equal(await root.locator('.emergency-doors > div > a').count(), 1);
    const doors = root.locator('.emergency-door-details');
    await doors.nth(0).locator('summary').click();
    assert.equal(await doors.nth(0).locator('li').count(), 6);
    assert.equal(await doors.nth(0).locator('li a').count(), 6);
    const panel = await doors.nth(0).locator('.emergency-options').boundingBox();
    const grid = await root.locator('.emergency-doors').boundingBox();
    assert(Math.abs(panel.width - grid.width) < 2, 'Desktop options must span all three columns');
    assert(panel.y >= (await root.locator('.emergency-door').last().boundingBox()).y + 250, 'Options must appear below all cards');
    await doors.nth(1).locator('summary').click();
    await page.waitForFunction(() => !document.querySelector('.emergency-door-details').open);
    assert.equal(await doors.nth(1).locator('li').count(), 4);
    assert.equal(await doors.nth(1).locator('li a').count(), 4);
    assert.equal(await doors.nth(1).locator('.emergency-unavailable').count(), 0);
    await doors.nth(1).locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await doors.nth(1).evaluate(el => el.open), false);
    const situations = root.locator('.emergency-situations');
    assert.equal(await situations.locator('li a').count(), 8);
    assert.equal(await root.locator('[data-hotline="5656"] a[href^="tel:"]').count(), 0);
    assert.equal(await root.locator('[data-hotline="5656"] a[href="sms:5656"]').count(), 1);
    assert.equal(await root.locator('[data-hotline="156"] a').count(), 2);
    assert.equal(await root.locator('.emergency-verification').count(), 1);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `${base}/khan-cap/`);
    assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), 'Khẩn cấp');
    for (const width of [1440, 744, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await doors.nth(0).locator('summary').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow ${width}`);
      await doors.nth(0).locator('summary').click();
    }
    const urls = new Set(await root.locator('a[href^="/"]').evaluateAll(links => links.map(a => a.getAttribute('href'))));
    for (const href of urls) assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, href);
    await root.locator('.emergency-no-match').click();
    assert.equal(await page.locator('[data-emergency-screening] section').count(), 6);
    assert.equal(await page.locator('[data-emergency-screening] a').count(), 6);
    const moneyLink = page.locator('[data-emergency-screening] a[href$="/tien-la-chuyen-vao/"]');
    await moneyLink.click();
    assert.match(await page.locator('h1').innerText(), /Tự nhiên có tiền lạ/);
    assert.equal(await page.locator('.self-check-guidance > section[id^="buoc-"]').count(), 5);
    assert.equal(await page.locator('[data-emergency-screening] a').count(), 1);
    assert.deepEqual(errors, []);
    await page.goto(`${base}/ung-pho/?source=legacy#viec-can-lam`);
    assert.equal(page.url(), `${base}/khan-cap/?source=legacy#viec-can-lam`, 'Redirect must retain query and fragment');
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage();
    await staticPage.goto(`${base}/khan-cap/`);
    const fallback = staticPage.locator('.emergency-door-details').first();
    await fallback.locator('summary').click();
    assert.equal(await fallback.locator('li a').first().isVisible(), true);
    await noJs.close();
    console.log('PASS: emergency v2, door modes, keyboard/no-JS choices, 8 published situations, phone modes, SEO, all public destinations, mobile layout and both new guidance pages.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
