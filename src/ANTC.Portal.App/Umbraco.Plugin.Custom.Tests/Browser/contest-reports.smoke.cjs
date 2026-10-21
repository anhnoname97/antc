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
            const layout = await view.locator('.page,.embedded-page').first().evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, title: node.querySelector('h1') ? getComputedStyle(node.querySelector('h1')).fontSize : null }));
            assert.ok(layout.scroll <= layout.width + 1, 'Only table containers should scroll horizontally');
            if (layout.title) assert.ok(parseInt(layout.title) >= 24, 'Shared theme must be loaded');
        };
        const verifyPageSizes = async view => {
            for (const select of await view.locator('.pager select,.local-pager select').all()) {
                if (await select.isVisible()) assert.deepEqual(await select.locator('option').evaluateAll(options => options.map(o => o.value)), ['10', '50', '100']);
            }
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
        await verifyPageSizes(dashboard);
        await screenshot('dashboard');
        await page.goto(root + 'entries-report');
        const entries = page.locator('antc-contest-entries-report-view');
        const code = process.env.ANTC_TEST_ENTRY_CODE;
        await entries.getByRole('button', { name: code, exact: true }).click({ timeout: 30000 });
        const dialog = entries.locator('dialog'); await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.locator('[data-question-code]').count(), 200);
        const topicDetails = dialog.locator('.entry-content details').first();
        const topicPager = topicDetails.locator('[data-pagination]');
        await topicPager.locator('select').selectOption('10');
        assert.ok(await topicDetails.locator('tbody tr').count() <= 10);
        await screenshot('entry-detail');
        await dialog.getByRole('button', { name: 'Đóng', exact: true }).last().click();
        await dialog.waitFor({ state: 'detached' });
        await entries.getByRole('button', { name: code, exact: true }).click();
        await entries.locator('dialog').waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await entries.locator('dialog').waitFor({ state: 'detached' });
        await verifyPageSizes(entries);
        for (const size of ['10', '100', '50']) {
            await entries.getByRole('combobox', { name: 'Số dòng lượt thi', exact: true }).selectOption(size);
            await page.waitForFunction(({ view, size }) => !view._busy && view._data?.pageSize === Number(size), { view: await entries.elementHandle(), size });
        }
        const [downloaded] = await Promise.all([
            page.waitForEvent('download'),
            entries.getByRole('button', { name: 'Xuất danh sách CSV', exact: true }).click(),
        ]);
        assert.match(downloaded.suggestedFilename(), /entries\.csv$/);
        await page.goto(root + 'question-report');
        await page.locator('antc-contest-question-report-view table tbody tr').first().waitFor({ timeout: 30000 });
        const questionReport = page.locator('antc-contest-question-report-view');
        const questionPager = questionReport.locator('[data-pagination="questions"]');
        assert.equal(await questionReport.locator('tbody tr').count(), 50);
        assert.equal(await questionPager.locator('select').inputValue(), '50');
        const firstQuestion = await questionReport.locator('tbody tr').first().innerText();
        await questionPager.getByRole('button', { name: 'Sau →', exact: true }).click();
        assert.notEqual(await questionReport.locator('tbody tr').first().innerText(), firstQuestion);
        await questionPager.locator('select').selectOption('100');
        assert.equal(await questionReport.locator('tbody tr').count(), 100);
        await verifyPageSizes(questionReport);
        assert.match(await questionPager.innerText(), /Trang 1/);
        await questionPager.getByRole('button', { name: 'Trang cuối thống kê câu hỏi', exact: true }).click();
        assert.equal(await questionPager.getByRole('button', { name: 'Sau →', exact: true }).isDisabled(), true);
        // Filtering resets pagination; exports remain independent of the presentation page size.
        assert.equal(await questionReport.locator('.advanced-search').evaluate(el => el.open), false);
        await questionReport.locator('.advanced-search > summary').click();
        await questionReport.getByRole('button', { name: 'Lọc dữ liệu', exact: true }).click();
        await questionPager.locator('.page-range').filter({ hasText: /^1–100 / }).waitFor();
        assert.equal(await questionPager.getByRole('button', { name: '← Trước', exact: true }).isDisabled(), true);
        assert.equal(await questionReport.locator('tbody tr').count(), 100);
        const [questionCsv] = await Promise.all([page.waitForEvent('download'), questionReport.getByRole('button', { name: 'Xuất thống kê CSV', exact: true }).click()]);
        const stream = await questionCsv.createReadStream(); const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        assert.ok(Buffer.concat(chunks).toString('utf8').trim().split(/\r?\n/).length > 51, 'CSV must contain all filtered questions, not one page');
        await page.goto(root + 'publication');
        const publication = page.locator('antc-contest-publication-view');
        await publication.locator('select[name="contestId"]').selectOption(process.env.ANTC_TEST_CONTEST_ID, { timeout: 30000 });
        await publication.getByRole('button', { name: 'Mở cuộc thi', exact: true }).click();
        await publication.getByRole('button', { name: 'Công bố kết quả', exact: true }).waitFor({ timeout: 30000 });
        // UI-only fixture: selections on hidden pages must remain selected for publication.
        const originalDraws = await publication.evaluate(view => view._draws);
        await publication.evaluate(async view => {
            view._draws = Array.from({ length: 13 }, (_, i) => ({ ...view._draws[0], id: 10000 + i }));
            view._selected = []; await view.updateComplete;
        });
        const drawPager = publication.locator('[data-pagination="draws"]');
        assert.equal(await publication.locator('.publication-draw').count(), 10);
        await publication.locator('.publication-draw input').first().check();
        await drawPager.getByRole('button', { name: 'Sau →', exact: true }).click();
        assert.equal(await publication.locator('.publication-draw').count(), 3);
        await publication.locator('.publication-draw input').first().check();
        await drawPager.getByRole('button', { name: '← Trước', exact: true }).click();
        assert.equal(await publication.locator('.publication-draw input').first().isChecked(), true);
        assert.equal(await publication.evaluate(view => view._selected.length), 2);
        await publication.evaluate(async (view, draws) => { view._draws = draws; view._selected = [...view._state.drawIds]; view._pagination = {}; await view.updateComplete; }, originalDraws);
        await screenshot('publication');
        for (const [route, tag, trigger, name] of [
            ['topics', 'antc-contest-topics-table', '#create', 'topics'],
            ['view/questions', 'antc-contest-questions-table', '#create', 'questions'],
            ['contest', 'antc-contest-table', '#create-campaign', 'contest'],
        ]) {
            await page.goto(root + route);
            const view = page.locator(tag);
            await view.locator(trigger).waitFor({ timeout: 30000 });
            await verifyPageSizes(view);
            for (const size of ['10', '100', '50']) {
                await view.locator('[data-page-size]').selectOption(size);
                await page.waitForFunction(({ view, size }) => !view.loading && view.result?.pageSize === Number(size), { view: await view.elementHandle(), size });
            }
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
                const contest = page.locator('antc-contest-view');
                assert.equal(await contest.getByRole('tab').count(), 0);
                await page.goto(root + 'entries-report');
                const inlineEntries = page.locator('antc-contest-entries-report-view');
                await inlineEntries.getByRole('button', { name: code, exact: true }).waitFor({ timeout: 30000 });
                assert.equal(await inlineEntries.locator('.advanced-search').evaluate(el => el.open), false);
                await inlineEntries.locator('.advanced-search > summary').click();
                await inlineEntries.locator('input[name="search"]').fill('Giữ bộ lọc');
                await inlineEntries.locator('.advanced-search > summary').click();
                assert.equal(await inlineEntries.locator('input[name="search"]').isVisible(), false);
                await inlineEntries.locator('.advanced-search > summary').click();
                assert.equal(await inlineEntries.locator('input[name="search"]').inputValue(), 'Giữ bộ lọc');
                await page.goto(root + 'draws');
                const draws = page.locator('antc-contest-draws-view');
                await draws.locator('select[name="contestId"]').selectOption(process.env.ANTC_TEST_CONTEST_ID, { timeout: 30000 });
                const initialDraws = await draws.evaluate(view => view._history.totalItems);
                await draws.locator('input[name="exclude"]').uncheck();
                await draws.locator('input[name="note"]').fill('Giải trình chiếu thử');
                await screenshot('contest-draws-screen');
                await draws.getByRole('button', { name: 'Xem trước', exact: true }).click();
                await draws.locator('.draw-preview').waitFor();
                assert.equal(await draws.locator('input[name="minScore"]').inputValue(), '1');
                assert.match(await draws.locator('.draw-preview').innerText(), /1 người đủ điều kiện/);
                assert.equal(await draws.locator('.draw-candidates tbody tr').count(), 1);
                await verifyPageSizes(draws);
                await draws.getByRole('combobox', { name: 'Số dòng người đủ điều kiện', exact: true }).selectOption('10');
                await page.waitForFunction(view => !view._busy && view._previewData?.candidates?.pageSize === 10, await draws.elementHandle());
                assert.ok((await draws.locator('.draw-candidates').innerText()).includes('0912345678'));
                assert.ok(!(await draws.locator('.draw-candidates').innerText()).includes('091****678'));
                await screenshot('draw-preview');
                await draws.getByRole('button', { name: 'Quay', exact: true }).click();
                await page.getByRole('button', { name: 'Hủy', exact: true }).last().click();
                await draws.getByRole('button', { name: 'Quay', exact: true }).click();
                await page.emulateMedia({ reducedMotion: 'no-preference' });
                let drawPosts = 0;
                const countDrawPosts = request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/umbraco/management/api/v1/antc/contest-draws') drawPosts++; };
                page.on('request', countDrawPosts);
                await page.getByRole('button', { name: 'Xác nhận quay', exact: true }).click();
                await draws.locator('.draw-stage').waitFor();
                await draws.locator('.draw-stage').scrollIntoViewIfNeeded();
                assert.equal(await draws.getByRole('button', { name: 'Quay', exact: true }).isDisabled(), true);
                await screenshot('draw-animation');
                await draws.getByRole('button', { name: 'Bỏ qua hiệu ứng', exact: true }).click();
                await draws.locator('#draw-result tbody tr').waitFor();
                assert.equal(drawPosts, 1);
                page.off('request', countDrawPosts);
                await page.emulateMedia({ reducedMotion: 'reduce' });
                const result = draws.locator('#draw-result');
                await verifyPageSizes(result);
                const text = await result.innerText();
                assert.ok(text.includes('0912345678')); assert.ok(!text.includes('091****678'));
                await screenshot('draw-result');
                for (const title of ['Xuất người trúng CSV', 'Xuất đủ điều kiện CSV']) {
                    const [csv] = await Promise.all([page.waitForEvent('download'), result.getByRole('button', { name: title, exact: true }).click()]);
                    const stream = await csv.createReadStream(), chunks = [];
                    for await (const chunk of stream) chunks.push(chunk);
                    const bytes = Buffer.concat(chunks);
                    assert.equal(bytes.subarray(0, 3).toString('hex'), 'efbbbf');
                    assert.ok(bytes.toString('utf8').includes('0912345678'));
                }
                assert.equal(await draws.getByRole('button', { name: 'Sửa', exact: true }).count(), 0);
                assert.equal(await draws.getByRole('button', { name: 'Xóa', exact: true }).count(), 0);
                await page.reload();
                await page.locator('antc-contest-draws-view .summary').filter({ hasText: `${initialDraws + 1} lần quay` }).waitFor({ timeout: 30000 });
                assert.equal(await page.getByRole('link', { name: 'Lượt thi', exact: true }).count(), 1);
                assert.equal(await page.getByRole('link', { name: 'Quay số', exact: true }).count(), 0);
            }
        }
        await page.setViewportSize({ width: 900, height: 900 });
        await page.goto(root + 'entries-report');
        const compactEntries = page.locator('antc-contest-entries-report-view');
        await compactEntries.locator('table').waitFor({ timeout: 30000 });
        await verifyLayout(compactEntries);
        await screenshot('entries-compact');
        await page.setViewportSize({ width: 1500, height: 1000 });
        await page.goto(root + 'view/questions');
        const bank = page.locator('antc-contest-questions-view');
        const questionsUrl = page.url();
        await bank.getByRole('heading', { name: 'Câu hỏi', exact: true }).waitFor({ timeout: 30000 });
        assert.equal(await page.getByRole('link', { name: 'Ngân hàng câu hỏi', exact: true }).count(), 0);
        assert.equal(await bank.getByRole('heading', { name: 'Câu hỏi', exact: true }).count(), 1);
        await bank.locator('antc-contest-questions-table tbody tr').first().waitFor({ timeout: 30000 });
        await verifyLayout(bank);
        await bank.locator('[data-view]').first().click();
        await bank.locator('dialog[open]').waitFor({ state: 'visible' });
        await bank.getByRole('button', { name: 'Đóng', exact: true }).last().click();
        assert.equal(await bank.locator('dialog[open]').count(), 0);
        const mergedTable = bank.locator('antc-contest-questions-table');
        const searchedCode = await mergedTable.locator('[data-view]').first().innerText();
        await mergedTable.locator('.advanced-search > summary').click();
        await mergedTable.locator('input[name="term"]').fill(searchedCode);
        await Promise.all([
            page.waitForResponse(response => new URL(response.url()).pathname === '/api/v1/admin/quiz/questions' && new URL(response.url()).searchParams.get('search') === searchedCode),
            mergedTable.locator('#search').getByRole('button', { name: 'Tìm kiếm', exact: true }).click(),
        ]);
        const [excel] = await Promise.all([page.waitForEvent('download'), bank.getByRole('button', { name: 'Xuất ngân hàng Excel', exact: true }).click()]);
        const excelStream = await excel.createReadStream(); const excelChunks = [];
        for await (const chunk of excelStream) excelChunks.push(chunk);
        await bank.getByRole('button', { name: 'Nhập từ Excel', exact: true }).click();
        await bank.locator('#workbook').setInputFiles({ name: 'roundtrip-browser.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.concat(excelChunks) });
        await bank.getByRole('button', { name: 'Kiểm tra và xem trước', exact: true }).click();
        await bank.getByRole('button', { name: 'Xác nhận nhập ngân hàng', exact: true }).waitFor({ timeout: 30000 });
        const bankPreview = await bank.evaluate(v => v._preview);
        assert.deepEqual([bankPreview.added, bankPreview.updated, bankPreview.deactivated], [0, 0, 0]);
        assert.equal(bankPreview.errors.length, 0);
        await bank.getByRole('button', { name: 'Danh sách câu hỏi', exact: true }).click();
        await bank.locator('#create').waitFor({ state: 'visible' });
        assert.equal(await mergedTable.locator('input[name="term"]').inputValue(), searchedCode);
        await bank.getByRole('button', { name: 'Nhập từ Excel', exact: true }).click();
        assert.equal(await bank.locator('#workbook').evaluate(input => input.files[0].name), 'roundtrip-browser.xlsx');
        assert.equal((await bank.evaluate(v => v._preview)).previewId, bankPreview.previewId);
        assert.equal(page.url(), questionsUrl);
        await screenshot('bank-preview');
        await bank.getByRole('button', { name: 'Xác nhận nhập ngân hàng', exact: true }).click();
        await page.getByRole('button', { name: 'Hủy', exact: true }).last().click();
        assert.equal(await bank.getByRole('button', { name: 'Xác nhận nhập ngân hàng', exact: true }).isVisible(), true);
        await bank.getByRole('button', { name: 'Xác nhận nhập ngân hàng', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận nhập', exact: true }).click();
        await bank.locator('.success-notice').waitFor({ timeout: 30000 });
        await bank.getByRole('button', { name: 'Danh sách câu hỏi', exact: true }).click();
        await bank.locator('antc-contest-questions-table tbody tr').first().waitFor();
        assert.equal(await mergedTable.locator('input[name="term"]').inputValue(), searchedCode);
        assert.equal(page.url(), questionsUrl);
        await bank.getByRole('button', { name: 'Lịch sử nhập', exact: true }).click();
        await bank.getByRole('cell', { name: 'roundtrip-browser.xlsx', exact: true }).waitFor();
        await verifyPageSizes(bank);
        await bank.getByRole('combobox', { name: 'Số dòng lịch sử nhập', exact: true }).selectOption('100');
        await page.waitForFunction(view => !view._busy && view._history?.pageSize === 100, await bank.elementHandle());
        await screenshot('bank-history');
        await page.reload();
        await page.locator('antc-contest-questions-view').getByRole('button', { name: 'Lịch sử nhập', exact: true }).click({ timeout: 30000 });
        await page.locator('antc-contest-questions-view').getByRole('cell', { name: 'roundtrip-browser.xlsx', exact: true }).waitFor();
        await page.goto(root + 'bank');
        await page.locator('antc-contest-questions-view #create').waitFor({ timeout: 30000 });
        await page.goto(root + 'privacy');
        const privacy = page.locator('antc-contest-privacy-view');
        await privacy.locator('input[name="value"]').fill('0912345678', { timeout: 30000 });
        await privacy.getByRole('button', { name: 'Xem các lượt liên quan', exact: true }).click();
        await privacy.locator('.privacy-preview tbody tr').waitFor();
        assert.ok((await privacy.locator('.privacy-preview table').innerText()).includes('0912345678'));
        await verifyPageSizes(privacy);
        await privacy.getByRole('combobox', { name: 'Số dòng lượt liên quan', exact: true }).selectOption('10');
        await page.waitForFunction(view => !view._busy && view._preview?.pageSize === 10, await privacy.elementHandle());
        await privacy.locator('input[name="eraseMode"][value="delete"]').check();
        await privacy.locator('input[name="confirmation"]').fill('wrong');
        assert.equal(await privacy.getByRole('button', { name: 'Xóa theo yêu cầu', exact: true }).isDisabled(), true);
        await privacy.locator('input[name="confirmation"]').fill('XÓA VĨNH VIỄN');
        await privacy.getByRole('button', { name: 'Xóa theo yêu cầu', exact: true }).click();
        await page.getByRole('button', { name: 'Hủy', exact: true }).last().click();
        await privacy.locator('input[name="eraseMode"][value="anonymize"]').check();
        await privacy.locator('input[name="confirmation"]').fill('XÓA THÔNG TIN');
        await screenshot('privacy-preview');
        await privacy.getByRole('button', { name: 'Xóa theo yêu cầu', exact: true }).click();
        await page.getByRole('button', { name: 'Thực hiện xóa', exact: true }).click();
        await privacy.locator('.success-notice').waitFor({ timeout: 45000 });
        assert.match(await privacy.locator('.success-notice').innerText(), /hoàn tất VACUUM/);
        await privacy.locator('input[name="value"]').fill('0912345678');
        await privacy.getByRole('button', { name: 'Xem các lượt liên quan', exact: true }).click();
        await privacy.locator('.privacy-preview h3').filter({ hasText: '0 lượt' }).waitFor();
        await privacy.locator('input[name="bulkConfirmation"]').fill('XÓA DỮ LIỆU CÁ NHÂN');
        await privacy.getByRole('button', { name: 'Xóa dữ liệu cá nhân hàng loạt', exact: true }).click();
        await page.getByRole('button', { name: 'Thực hiện xóa', exact: true }).click();
        await privacy.locator('.privacy-danger button').waitFor();
        await privacy.locator('.table-wrap tbody tr').nth(1).waitFor({ timeout: 45000 });
        await screenshot('privacy-complete');
        assert.equal(errors.filter(e => /contest-reports|ContestReports/.test(e)).length, 0);
        console.log('Browser PASS: 7 routes, shared theme, responsive tables, 4-option radio selection, collapsible tree, create dialogs Close/Cancel, detail Escape, CSV and publication.');
    } catch (error) {
        const view = page ? await page.locator('antc-contest-entries-report-view').evaluateAll(nodes => nodes.map(n => ({ busy: n._busy, error: n._error, detail: !!n._detail, dialogOpen: n.shadowRoot.querySelector('dialog')?.open, buttons: [...n.shadowRoot.querySelectorAll('button')].map(b => ({ text: b.textContent, disabled: b.disabled })) }))) : [];
        console.error('Browser diagnostics:', page ? new URL(page.url()).pathname : 'no page', errors.slice(0, 10), view);
        throw error;
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
