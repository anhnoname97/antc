// Optional real-browser smoke test against the disposable Umbraco host created by xUnit.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.ANTC_BROWSER_EXECUTABLE || undefined });
    let page;
    const errors = [];
    try {
        page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, reducedMotion: 'reduce' });
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`); });
        const base = process.env.ANTC_TEST_URL;
        const root = base + 'umbraco/section/contest-management/';
        const screenshot = async name => {
            if (!process.env.ANTC_SCREENSHOT_DIR) return;
            fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
            await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, name + '.png') });
        };
        const verifyLayout = async view => {
            const layout = await view.locator('.page').evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, title: getComputedStyle(node.querySelector('h1')).fontSize }));
            assert.ok(layout.scroll <= layout.width + 1, 'Only table containers should scroll horizontally');
            assert.ok(parseInt(layout.title) >= 24, 'Shared theme must be loaded');
        };
        await page.goto(root + 'dashboard');
        await page.locator('input[name="username"]').fill('admin-test@example.invalid', { timeout: 30000 });
        await page.locator('input[name="password"]').fill(process.env.ANTC_TEST_PASSWORD);
        await page.locator('#umb-login-button').click();
        await page.waitForURL(url => url.pathname.startsWith('/umbraco/section/'), { timeout: 30000 });
        await page.goto(root + 'dashboard');
        await page.locator('antc-contest-dashboard-view').waitFor({ state: 'visible', timeout: 45000 });
        const dashboard = page.locator('antc-contest-dashboard-view');
        await dashboard.locator('.metrics').waitFor({ timeout: 30000 });
        assert.equal(await dashboard.locator('.metrics article').count(), 5);
        await verifyLayout(dashboard);
        await screenshot('dashboard');
        await page.goto(root + 'entries-report');
        const entries = page.locator('antc-contest-entries-report-view');
        const code = process.env.ANTC_TEST_ENTRY_CODE;
        await entries.getByRole('button', { name: code, exact: true }).click({ timeout: 30000 });
        const dialog = entries.locator('dialog'); await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.locator('[data-question-code]').count(), 200);
        await screenshot('entry-detail');
        await dialog.getByRole('button', { name: 'Đóng', exact: true }).last().click();
        await dialog.waitFor({ state: 'detached' });
        await entries.getByRole('button', { name: code, exact: true }).click();
        await entries.locator('dialog').waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await entries.locator('dialog').waitFor({ state: 'detached' });
        const [downloaded] = await Promise.all([
            page.waitForEvent('download'),
            entries.getByRole('button', { name: 'Xuất danh sách CSV', exact: true }).click(),
        ]);
        assert.match(downloaded.suggestedFilename(), /entries\.csv$/);
        await page.goto(root + 'question-report');
        await page.locator('antc-contest-question-report-view table tbody tr').first().waitFor({ timeout: 30000 });
        await page.goto(root + 'publication');
        const publication = page.locator('antc-contest-publication-view');
        await publication.locator('select[name="contestId"]').selectOption(process.env.ANTC_TEST_CONTEST_ID, { timeout: 30000 });
        await publication.getByRole('button', { name: 'Mở cuộc thi', exact: true }).click();
        await publication.getByRole('button', { name: 'Công bố kết quả', exact: true }).waitFor({ timeout: 30000 });
        await screenshot('publication');
        for (const [route, tag, trigger, name] of [
            ['topics', 'antc-contest-topics-table', '#create', 'topics'],
            ['view/questions', 'antc-contest-questions-table', '#create', 'questions'],
            ['contest', 'antc-contest-table', '#create-campaign', 'contest'],
        ]) {
            await page.goto(root + route);
            const view = page.locator(tag);
            await view.locator(trigger).waitFor({ timeout: 30000 });
            await page.waitForFunction(tag => { const host = (function find(root) { for (const node of root.querySelectorAll('*')) { if (node.localName === tag) return node; if (node.shadowRoot) { const found = find(node.shadowRoot); if (found) return found; } } })(document); return host && !host.loading; }, tag);
            await verifyLayout(view);
            await screenshot(name + '-list');
            await view.locator(trigger).click();
            const editor = view.locator('dialog#editor');
            await editor.waitFor({ state: 'visible' });
            if (name === 'questions') {
                assert.equal(await editor.locator('input[name="correct"]').count(), 4);
                await editor.locator('input[name="correct"][value="C"]').check();
                assert.equal(await editor.locator('input[name="correct"]:checked').count(), 1);
                assert.equal(await editor.locator('.answer-row').filter({ has: page.locator('input[value="C"]:checked') }).count(), 1);
            }
            if (name === 'contest') {
                const topic = editor.locator('.tree-topic').first();
                assert.equal(await topic.evaluate(node => node.open), false);
                await topic.locator('.tree-caret').click();
                assert.equal(await topic.evaluate(node => node.open), true);
            }
            await screenshot(name + '-form');
            await editor.getByRole('button', { name: 'Hủy', exact: true }).click();
            await editor.waitFor({ state: 'hidden' });
            await view.locator(trigger).click();
            await editor.waitFor({ state: 'visible' });
            await editor.getByRole('button', { name: 'Đóng', exact: true }).click();
            await editor.waitFor({ state: 'hidden' });
            if (name === 'contest') {
                await view.locator('[data-tab="draws"]').click();
                await view.locator('.summary').filter({ hasText: 'bản ghi' }).waitFor();
                await view.locator('#create-draw').click();
                await editor.waitFor({ state: 'visible' });
                await screenshot('draw-form');
                await editor.getByRole('button', { name: 'Hủy', exact: true }).click();
                await editor.waitFor({ state: 'hidden' });
            }
        }
        await page.setViewportSize({ width: 900, height: 900 });
        await page.goto(root + 'entries-report');
        const compactEntries = page.locator('antc-contest-entries-report-view');
        await compactEntries.locator('table').waitFor({ timeout: 30000 });
        await verifyLayout(compactEntries);
        await screenshot('entries-compact');
        assert.equal(errors.filter(e => /contest-reports|ContestReports/.test(e)).length, 0);
        console.log('Browser PASS: 7 routes, shared theme, responsive tables, 4-option radio selection, collapsible tree, create dialogs Close/Cancel, detail Escape, CSV and publication.');
    } catch (error) {
        const view = page ? await page.locator('antc-contest-entries-report-view').evaluateAll(nodes => nodes.map(n => ({ busy: n._busy, error: n._error, detail: !!n._detail, dialogOpen: n.shadowRoot.querySelector('dialog')?.open, buttons: [...n.shadowRoot.querySelectorAll('button')].map(b => ({ text: b.textContent, disabled: b.disabled })) }))) : [];
        console.error('Browser diagnostics:', page ? new URL(page.url()).pathname : 'no page', errors.slice(0, 10), view);
        throw error;
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
