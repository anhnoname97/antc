// Public library checks. Requires the published local CMS content; makes no CMS writes.
const playwright = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const engine = process.env.ANTC_BROWSER || 'chromium';
(async () => {
  const browser = await playwright[engine].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    assert.equal((await page.goto(base + '/thu-vien/')).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.self-check-heading__title .site-icon').count(), 1);
    assert.equal(await page.locator('.foundation-tabs small').count(), 3);
    assert.equal(await page.locator('.foundation-history small').count(), 0, 'Story cards contain compact titles');
    assert.deepEqual(await page.locator('.foundation-history .foundation-number').allTextContents(), ['1','2','3·1','3·2','3·3','4','5','6','7','8']);
    assert.equal(await page.locator('.foundation-topics li').count(), 8);
    assert.match(await page.locator('.foundation-topics small').first().innerText(), /19 câu · đọc khoảng \d+ phút/);
    assert.equal(await page.locator('.foundation-guide-tiles li').count(), 6);
    assert.equal(await page.locator('.foundation-guide-tiles').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length), 3);
    const total = await page.locator('[data-library-item]').count();
    assert.equal(await page.locator('[data-library-item]:visible').count(), Math.min(20, total));
    if (total > 20) {
      await page.locator('[data-library-more]').click();
      assert.equal(await page.locator('[data-library-item]:visible').count(), Math.min(40, total));
    }
    const input = page.locator('#foundation-query');
    await input.fill('gia mao');
    const visible = page.locator('[data-library-item]:visible');
    assert((await visible.count()) > 0, 'Unaccented live search');
    await input.fill('zzzzzz-no-such-article');
    assert.equal(await visible.count(), 0);
    assert.equal(await page.locator('[data-library-empty]').isVisible(), true);
    await input.fill('');
    const group = page.locator('[data-library-group]').nth(1);
    const value = await group.getAttribute('data-library-group');
    await group.click();
    assert.equal(await group.getAttribute('aria-pressed'), 'true');
    assert((await visible.count()) > 0);
    for (const candidate of await visible.all()) assert.equal(await candidate.getAttribute('data-group'), value);
    await page.locator('[data-library-group=""]').click();
    assert.equal(await visible.count(), Math.min(20, total));
    await page.locator('.foundation-tabs a').nth(1).click();
    assert.equal(new URL(page.url()).hash, '#chuyen-de');
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1050 });
      for (const size of ['100%', '125%', '150%']) {
        await page.evaluate(size => document.documentElement.style.fontSize = size, size);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}/${size} overflow`);
      }
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await noJs.newPage();
    assert.equal((await fallback.goto(base + '/thu-vien/')).status(), 200);
    assert.equal(await fallback.locator('[data-library-item]:visible').count(), Math.min(20, total));
    if (total > 20) {
      await fallback.locator('[data-library-more]').click();
      assert.equal(await fallback.locator('[data-library-item]:visible').count(), Math.min(40, total));
    }
    await fallback.locator('#foundation-query').fill('gia mao');
    await fallback.locator('.foundation-search__submit').click();
    assert((await fallback.locator('[data-library-item]:visible').count()) > 0);
    await fallback.locator('#foundation-query').fill('zzzzzz-no-such-article');
    await fallback.locator('.foundation-search__submit').click();
    assert.equal(await fallback.locator('[data-library-item]:visible').count(), 0);
    assert.equal(await fallback.locator('[data-library-empty]').isVisible(), true);
    await noJs.close();
    assert.deepEqual(errors, []);
    console.log(`${engine}: library structure, live search, group filters, pagination, no-JS fallback and 15 responsive/font cases passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
