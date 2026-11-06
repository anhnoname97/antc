const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await page.goto(base + '/lien-he/?source=test#nguon');
    assert.equal(response.status(), 200);
    const root = page.locator('[data-contact-v2]');
    assert.equal(await root.locator('h1').innerText(), 'Liên hệ đúng nơi');
    assert.equal(await root.locator('.contact-situations a').count(), 4);
    assert.equal(await root.locator('[data-contact-group]').count(), 3);
    assert.equal(await root.locator('[data-verification-source]').count(), 5);
    assert.equal(await root.locator('[data-verification-source] a').count(), 0, 'No invented official source URLs');
    assert.equal(await root.locator('[data-bank-empty]').count(), 1, 'Unverified bank numbers must not be advertised');
    assert.equal(await root.locator('[data-hotline="5656"] a[href^="tel:"]').count(), 0);
    assert.equal(await root.locator('[data-hotline="5656"] a[href="sms:5656"]').count(), 1);
    assert.equal(await root.locator('[data-hotline="156"] a').count(), 2);
    assert.doesNotMatch(await root.innerText(), /<\/?b>|\[địa chỉ|\[Tên tổ chức\]/);
    for (const selector of ['title', 'meta[name=description]', 'link[rel=canonical]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]', 'meta[property="og:image"]', 'meta[name="twitter:title"]']) {
      assert.equal(await page.locator('head').locator(selector).count(), 1, selector);
    }
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), base + '/lien-he/');
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), base + '/lien-he/');
    for (const href of await root.locator('.contact-jumps a').evaluateAll(links => links.map(a => a.getAttribute('href')))) {
      assert.equal(await root.locator(href).count(), 1);
    }
    const firstJump = root.locator('.contact-jumps a').first();
    await firstJump.focus(); await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#tinh-huong');
    const localUrls = new Set(await root.locator('a[href^="/"]').evaluateAll(links => links.map(a => a.getAttribute('href'))));
    for (const href of localUrls) assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, href);
    for (const width of [1440, 744, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow ${width}`);
    }
    await page.evaluate(() => document.documentElement.dataset.fontScale = '2');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Large text on mobile');
    await page.emulateMedia({ media: 'print' });
    assert.equal(await root.locator('.contact-print').isVisible(), false);
    assert.equal(await root.locator('#nguon').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await page.goto(base + '/khan-cap/');
    const contactLink = page.locator('.emergency-footer-buttons a[href="/lien-he/"]');
    assert.equal(await contactLink.count(), 1);
    await contactLink.click();
    assert.equal(new URL(page.url()).pathname, '/lien-he/');
    assert.equal(await page.locator('.site-footer a[href="/lien-he/"]').count(), 1);
    for (const path of ['/quan-ly-trang/trang-chu/lien-he-dung-noi/', '/quan-ly-trang/trang-chu/lien-he/']) {
      const redirect = await page.request.get(base + path + '?source=legacy', { maxRedirects: 0 });
      assert.equal(redirect.status(), 301);
      assert.equal(redirect.headers().location, '/lien-he/?source=legacy');
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJs.newPage(); await staticPage.goto(base + '/lien-he/');
    assert.equal(await staticPage.locator('.contact-situations a').count(), 4);
    assert.equal(await staticPage.locator('[data-hotline="113"] a[href="tel:113"]').isVisible(), true);
    await noJs.close();
    assert.deepEqual(errors, []);
    console.log('PASS: contact v2 sections, guidance links, shared hotlines, verification gaps, SEO, mobile/large text, keyboard, print/no-JS, emergency/footer entrances and legacy redirects.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
