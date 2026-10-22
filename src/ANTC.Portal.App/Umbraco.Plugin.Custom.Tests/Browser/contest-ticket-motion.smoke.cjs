// FE-34: focus/click khong duoc hoan tac the cuoc thi ve trang thai an.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 744, 1500]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(new URL('/cuoc-thi/', process.env.ANTC_TEST_URL || 'http://localhost:11000').href);
      const ticket = page.locator('[data-contest-overview] .ticket');
      const link = ticket.locator('a.btn-red');
      await ticket.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      // Giu trang de quan sat the sau click; sau do bo chan va kiem tra dieu huong that.
      await link.evaluate(el => { el.__holdNavigation = e => e.preventDefault(); el.addEventListener('click', el.__holdNavigation); });
      await link.focus();
      await link.click();
      await page.waitForTimeout(250);
      const visible = () => ticket.evaluate(el => {
        const css = getComputedStyle(el);
        return Number(css.opacity) > .9 && css.visibility !== 'hidden';
      });
      assert(await visible(), `The bi an sau focus/click o ${width}px`);
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(800);
      assert(await visible(), `Cuon nguoc an the dang focus o ${width}px`);
      await link.evaluate(el => el.removeEventListener('click', el.__holdNavigation));
      await link.click();
      await page.waitForURL('**/cuoc-thi-thang/');
      assert.deepEqual(errors, []);
      console.log(`PASS ticket focus/click, scroll back, navigation: ${width}px`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
