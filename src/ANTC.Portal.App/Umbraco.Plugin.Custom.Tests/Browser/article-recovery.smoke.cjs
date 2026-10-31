// Uses the isolated fixture, but keeps all document edits in browser memory.
const h = require('./article-acceptance.helpers.cjs');
const path = require('node:path');

(async () => {
  const browser = await h.launch();
  try {
    await h.isolated(browser);
    const session = await h.login(browser);
    const { page } = session;
    const writes = [];
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      if (/\/document(?:\/|$)/.test(new URL(request.url()).pathname) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        writes.push(request.method());
        return route.abort();
      }
      return route.continue();
    });
    const editor = await h.openArticle(page);
    h.assert(await h.footer(page).getByRole('button', { name: 'Lưu và xuất bản', exact: true }).isEnabled());
    const summary = editor.locator('#summary textarea');
    const persisted = await summary.inputValue();
    const typed = 'Bản đang gõ phải còn nguyên khi chọn ở lại.';
    await summary.fill(typed);
    await editor.locator('antc-article-publication-info').getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();
    await page.evaluate(() => history.pushState({}, '', '/umbraco/section/content'));
    const discard = page.locator('umb-discard-changes-modal');
    await discard.waitFor();
    await discard.locator('#cancel').click();
    h.assert.equal(await summary.inputValue(), typed);
    h.assert.equal((await h.readDocument(page)).values.find(value => value.alias === 'summary').value, persisted);
    console.log('Canceling native leave warning retains unsaved text');
    if (process.env.ANTC_SCREENSHOT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'recovery-unsaved.png') });
    }
    await page.evaluate(() => history.pushState({}, '', '/umbraco/section/content'));
    await discard.waitFor();
    await discard.locator('#confirm').click();
    await editor.waitFor({ state: 'detached' });
    h.assert.equal((await h.readDocument(page)).values.find(value => value.alias === 'summary').value, persisted);
    h.assert.deepEqual(writes, []);
    h.assert.deepEqual(session.errors, []);
    console.log('Confirmed discard leaves without saving; no document writes or JavaScript errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
