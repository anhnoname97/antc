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
        const verifyDefaultPageSize = async view => {
            for (const select of await view.locator('.pager select,.local-pager select').all()) {
                if (await select.isVisible()) assert.equal(await select.inputValue(), '10', 'New lists must start with 10 rows per page');
            }
        };
        const initial = await page.goto(root + 'dashboard');
        assert.ok(initial.ok(), `Backoffice HTML failed (${initial.status()}): ${(await page.locator('body').innerText()).slice(0, 6000)}`);
        await page.locator('input[name="username"]').fill('admin-test@example.invalid', { timeout: 30000 });
        await page.locator('input[name="password"]').fill(process.env.ANTC_TEST_PASSWORD);
        await page.locator('#umb-login-button').click();
        await page.waitForURL(url => url.pathname.startsWith('/umbraco/section/'), { timeout: 30000 });
        await page.goto(root + 'dashboard');
        await page.locator('antc-contest-dashboard-view').waitFor({ state: 'visible', timeout: 45000 });
        const dashboard = page.locator('antc-contest-dashboard-view');
        await dashboard.locator('.metrics').waitFor({ timeout: 30000 });
        await page.waitForFunction(view => !view._busy, await dashboard.elementHandle());
        assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-antc-contest-section')), true);
        assert.equal(await dashboard.locator('.dashboard-banner').count(), 1);
        assert.equal(await dashboard.locator('.metrics article').count(), 5);
        await verifyLayout(dashboard);
        await verifyPageSizes(dashboard);
        await verifyDefaultPageSize(dashboard);
        await screenshot('dashboard');
        // Navigate through the sidebar in the same document: page.goto hides SPA routing failures.
        const navigationMarker = await page.evaluate(() => window.__contestNavigationMarker = crypto.randomUUID());
        for (const [label, tag] of [
            ['Câu hỏi', 'antc-contest-questions-view'],
            ['Chuyên đề', 'antc-contest-topics-view'],
            ['Cuộc thi', 'antc-contest-view'],
            ['Giải thưởng', 'antc-contest-prizes-view'],
            ['Lượt thi', 'antc-contest-entries-report-view'],
            ['Thống kê câu hỏi', 'antc-contest-question-report-view'],
            ['Công bố kết quả', 'antc-contest-publication-view'],
            ['Xóa dữ liệu cá nhân', 'antc-contest-privacy-view'],
            ['Tổng quan', 'antc-contest-dashboard-view'],
            ['Câu hỏi', 'antc-contest-questions-view'],
            ['Cuộc thi', 'antc-contest-view'],
        ]) {
            await page.getByRole('link', { name: label, exact: true }).click();
            console.log('Sidebar click:', label, new URL(page.url()).pathname);
            await page.locator(tag).waitFor({ state: 'visible', timeout: 10000 });
            assert.equal(await page.evaluate(() => window.__contestNavigationMarker), navigationMarker, 'Sidebar must navigate without reloading the document');
        }
        assert.equal(errors.filter(e => /CustomElementRegistry|already been used/.test(e)).length, 0, 'No duplicate component registration during sidebar navigation');
        await page.goto(root + 'prizes');
        const prizes = page.locator('antc-contest-prizes-view');
        await prizes.getByText('TEST-FIRST', { exact: true }).waitFor({ timeout: 30000 });
        await verifyLayout(prizes);
        await verifyPageSizes(prizes);
        await verifyDefaultPageSize(prizes);
        await prizes.getByRole('button', { name: '+ Thêm giải thưởng', exact: true }).click();
        await prizes.locator('dialog[open]').waitFor();
        await prizes.getByRole('button', { name: 'Hủy', exact: true }).click();
        assert.equal(await prizes.locator('dialog[open]').count(), 0);
        await prizes.getByRole('button', { name: 'Sửa', exact: true }).first().click();
        await prizes.locator('dialog[open]').waitFor();
        assert.equal(await prizes.locator('input[name="prizeMoney"]').count(), 0);
        await screenshot('contest-prize-editor');
        await prizes.getByRole('button', { name: 'Đóng', exact: true }).click();
        assert.equal(await prizes.locator('dialog[open]').count(), 0);
        await page.goto(root + 'entries-report');
        const entries = page.locator('antc-contest-entries-report-view');
        const code = process.env.ANTC_TEST_ENTRY_CODE;
        await entries.getByRole('button', { name: code, exact: true }).click({ timeout: 30000 });
        await verifyDefaultPageSize(entries);
        const dialog = entries.locator('dialog'); await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.locator('[data-question-code]').count(), await entries.evaluate(view => view._detail.topics.reduce((total, topic) => total + Math.min(10, topic.total), 0)));
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
        await entries.locator('.advanced-search > summary').click();
        assert.equal(await entries.locator('.entries-filters > label').first().locator('input[name="search"]').count(), 1);
        const entryMode = entries.getByRole('combobox', { name: 'Chế độ', exact: true });
        assert.deepEqual(await entryMode.locator('option').allTextContents(), ['Tất cả', 'Ẩn danh', 'Công khai']);
        assert.equal(await entries.locator('select[name="mode"]').count(), 0);
        for (const width of [1920, 1600, 1500, 1280, 1100, 900, 460]) {
            await page.setViewportSize({ width, height: 1000 });
            if (width === 1920) await screenshot('entries-filters-wide-1920');
            const fromBox = await entries.locator('input[name="scoreFrom"]').boundingBox();
            const toBox = await entries.locator('input[name="scoreTo"]').boundingBox();
            assert.ok(Math.abs(fromBox.y - toBox.y) <= 1, 'Score range must remain on one row');
            assert.ok(toBox.x > fromBox.x + fromBox.width, 'Score inputs must be side by side, not overlap');
            const rangeColumns = await entries.locator('.entry-score-range').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
            assert.equal(rangeColumns, 2);
            if (width > 1100) {
                const searchBox = await entries.locator('input[name="search"]').boundingBox();
                const statusBox = await entries.locator('select[name="status"]').boundingBox();
                const sortBox = await entries.locator('select[name="sort"]').boundingBox();
                const dateBox = await entries.locator('input[name="to"]').boundingBox();
                assert.ok(Math.abs(searchBox.y - statusBox.y) <= 1, 'First row must align');
                assert.ok(Math.abs(fromBox.y - sortBox.y) <= 1 && Math.abs(toBox.y - dateBox.y) <= 1, `Second row must align: ${JSON.stringify({width,fromBox,toBox,sortBox,dateBox})}`);
            }
            if (width === 1920) await screenshot('entries-filters-wide-1920');
        }
        await page.setViewportSize({ width: 1500, height: 1000 });
        for (const value of ['false', 'true']) {
            await entryMode.selectOption(value);
            const [response] = await Promise.all([
                page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/contest-reports/entries') && new URL(r.url()).searchParams.get('hasPhone') === value),
                entries.getByRole('button', { name: 'Lọc dữ liệu', exact: true }).click(),
            ]);
            assert.equal(response.status(), 200);
            assert.equal(new URL(response.url()).searchParams.has('mode'), false);
            await page.waitForFunction(view => !view._busy, await entries.elementHandle());
            const data = await response.json();
            assert.ok(data.items.every(row => Boolean(row.phone) === (value === 'true')));
        }
        await screenshot('entries-advanced-filters');
        await entries.getByRole('button', { name: 'Đặt lại', exact: true }).click();
        await page.waitForFunction(view => !view._busy, await entries.elementHandle());
        const [downloaded] = await Promise.all([
            page.waitForEvent('download'),
            entries.getByRole('button', { name: 'Xuất danh sách CSV', exact: true }).click(),
        ]);
        assert.match(downloaded.suggestedFilename(), /entries\.csv$/);
        await page.goto(root + 'question-report');
        await page.locator('antc-contest-question-report-view table tbody tr').first().waitFor({ timeout: 30000 });
        const questionReport = page.locator('antc-contest-question-report-view');
        const reportRows = questionReport.locator('tbody tr');
        await reportRows.first().locator('.report-topic-title').waitFor();
        for (const row of await reportRows.all()) {
            const topic = row.locator('.report-topic-title');
            assert.equal(await topic.getAttribute('title'), await topic.innerText());
            assert.ok(!/^\d+$/.test(await topic.innerText()), 'Topic column must display its title, not its ID');
            assert.equal(await row.locator('.stat-answer.is-correct').count(), 1);
            const style = await row.locator('.stat-answer.is-correct').evaluate(el => ({ radius: getComputedStyle(el).borderRadius, color: getComputedStyle(el).backgroundColor }));
            assert.equal(style.radius, '50%');assert.notEqual(style.color, 'rgba(0, 0, 0, 0)');
            const rgb = style.color.match(/\d+/g).map(Number);
            assert.ok(rgb[1] > rgb[0] && rgb[1] > rgb[2], 'Correct-answer background must be green');
            const circle = await row.locator('.stat-answer.is-correct').boundingBox();
            assert.ok(Math.abs(circle.width - circle.height) <= 1, 'Correct-answer background must be a circle');
        }
        await screenshot('question-statistics-answers');
        const questionPager = questionReport.locator('[data-pagination="questions"]');
        assert.equal(await questionReport.locator('tbody tr').count(), 10);
        assert.equal(await questionPager.locator('select').inputValue(), '10');
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
            await verifyDefaultPageSize(view);
            for (const size of ['10', '100', '50']) {
                await view.locator('[data-page-size]').selectOption(size);
                await page.waitForFunction(({ view, size }) => !view.loading && view.result?.pageSize === Number(size), { view: await view.elementHandle(), size });
            }
            await page.waitForFunction(tag => { const host = (function find(root) { for (const node of root.querySelectorAll('*')) { if (node.localName === tag) return node; if (node.shadowRoot) { const found = find(node.shadowRoot); if (found) return found; } } })(document); return host && !host.loading; }, tag);
            await verifyLayout(view);
            if (name === 'contest') {
                const dates = view.locator('.campaign-dates').first();
                assert.deepEqual(await dates.locator('time').allTextContents().then(values => values.map(value => /^\d{2}\/\d{2}\/\d{4}$/.test(value))), [true, true]);
                const [startDate, endDate] = await dates.locator('time').evaluateAll(nodes => nodes.map(node => ({ left: node.getBoundingClientRect().left, width: node.getBoundingClientRect().width })));
                assert.ok(Math.abs(startDate.left - endDate.left) <= 1, 'Start and end dates must align');
                assert.ok(Math.abs(startDate.width - endDate.width) <= 1, 'Date digits must have equal widths');
                await view.locator('[data-state="upcoming"]').click();
                assert.equal(await view.locator('tbody .empty').count(), 1);
                await view.locator('[data-state="ended"]').click();
                assert.ok(await view.locator('[data-edit-campaign]').count() > 0);
                await view.locator('[data-state=""]').click();
            }
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
                await screenshot('contest-editor-new');
                await page.setViewportSize({ width: 900, height: 900 });
                assert.equal(await editor.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
                await screenshot('contest-editor-compact');
                await page.setViewportSize({ width: 1500, height: 1000 });
                await editor.locator('.contest-prize-picker').evaluate(el => { el.open = true; });
                await editor.locator(`[data-prize="${process.env.ANTC_TEST_PRIZE_ID}"]`).check();
                await editor.locator(`[data-prize-quantity="${process.env.ANTC_TEST_PRIZE_ID}"]`).fill('2');
                await editor.locator(`[data-prize-money="${process.env.ANTC_TEST_PRIZE_ID}"]`).fill('1500000');
                assert.equal(await editor.locator('[data-prize-count]').innerText(), '1 đã chọn');
                const topic = editor.locator('.tree-topic').first();
                assert.equal(await topic.evaluate(node => node.open), false);
                await topic.locator('.tree-caret').click();
                assert.equal(await topic.evaluate(node => node.open), true);
                await editor.locator('input[name="name"]').fill('Giữ nguyên khi lỗi');
                await editor.locator('input[name="maxAttempts"]').fill('0');
                assert.equal(await editor.locator('input[name="maxAttempts"]').evaluate(el => el.checkValidity()), true);
                await editor.locator('input[name="startAt"]').fill('2035-01-10T08:00');
                await editor.locator('input[name="endAt"]').fill('2035-01-15T08:00');
                await editor.locator('[data-question]').first().check();
                const rejectSave = route => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: { code: 'CONTEST_TIME_OVERLAP', message: 'Thời gian trùng cuộc thi khác.' } }) });
                await page.route('**/api/v1/admin/contest/campaigns', rejectSave);
                await editor.getByRole('button', { name: 'Lưu cuộc thi', exact: true }).click();
                await editor.locator('[data-save-error]').waitFor();
                assert.equal(await editor.isVisible(), true);
                assert.equal(await editor.locator('input[name="name"]').inputValue(), 'Giữ nguyên khi lỗi');
                assert.equal(await editor.locator('[data-question]:checked').count(), 1);
                assert.equal(await editor.locator(`[data-prize-quantity="${process.env.ANTC_TEST_PRIZE_ID}"]`).inputValue(), '2');
                assert.equal(await editor.locator(`[data-prize-money="${process.env.ANTC_TEST_PRIZE_ID}"]`).inputValue(), '1500000');
                await page.unroute('**/api/v1/admin/contest/campaigns', rejectSave);
            }
            await screenshot(name + '-form');
            await editor.getByRole('button', { name: 'Hủy', exact: true }).click();
            await editor.waitFor({ state: 'hidden' });
            await view.locator(trigger).click();
            await editor.waitFor({ state: 'visible' });
            await editor.getByRole('button', { name: 'Đóng', exact: true }).click();
            await editor.waitFor({ state: 'hidden' });
            if (name === 'contest') {
                await view.locator(`[data-edit-campaign="${process.env.ANTC_TEST_CONTEST_ID}"]`).click();
                await editor.waitFor({ state: 'visible' });
                assert.equal(await editor.locator('input[name="name"]').evaluate(el => el.readOnly), true);
                assert.equal(await editor.locator('input[name="startAt"]').evaluate(el => el.readOnly), true);
                assert.equal(await editor.locator('[data-question]:not(:disabled)').count(), 0);
                assert.equal(await editor.locator('.editor-nav button').count(), 5);
                assert.equal(await editor.locator('.editor-section').count(), 5);
                assert.equal(await editor.locator('input[name="active"]').isEnabled(), true);
                await screenshot('contest-update-validation');
                await editor.getByRole('button', { name: 'Hủy', exact: true }).click();
                await view.locator(`[data-edit-campaign="${process.env.ANTC_TEST_CONTEST_ID}"]`).click();
                await editor.waitFor({ state: 'visible' });
                await editor.locator('.contest-prize-picker').evaluate(el => { el.open = true; });
                await editor.locator(`[data-prize-money="${process.env.ANTC_TEST_PRIZE_ID}"]`).fill('2500000');
                await editor.getByRole('button', { name: 'Lưu riêng cấu hình giải thưởng', exact: true }).click();
                await editor.waitFor({ state: 'hidden' });
                await view.locator(`[data-edit-campaign="${process.env.ANTC_TEST_CONTEST_ID}"]`).click();
                await editor.waitFor({ state: 'visible' });
                await editor.locator('.contest-prize-picker').evaluate(el => { el.open = true; });
                assert.equal(await editor.locator(`[data-prize-money="${process.env.ANTC_TEST_PRIZE_ID}"]`).inputValue(), '2500000');
                await screenshot('contest-prize-money');
                await editor.getByRole('button', { name: 'Hủy', exact: true }).click();
                const contest = page.locator('antc-contest-view');
                assert.equal(await contest.getByRole('tab').count(), 3);
                const contestUrl = page.url();
                await contest.getByRole('tab', { name: 'Lượt dự thi', exact: true }).click();
                const inlineEntries = page.locator('antc-contest-entries-report-view');
                await inlineEntries.getByRole('button', { name: code, exact: true }).waitFor({ timeout: 30000 });
                assert.equal(await inlineEntries.locator('.advanced-search').evaluate(el => el.open), false);
                await inlineEntries.locator('.advanced-search > summary').click();
                await inlineEntries.locator('input[name="search"]').fill('Giữ bộ lọc');
                await inlineEntries.locator('.advanced-search > summary').click();
                assert.equal(await inlineEntries.locator('input[name="search"]').isVisible(), false);
                await inlineEntries.locator('.advanced-search > summary').click();
                assert.equal(await inlineEntries.locator('input[name="search"]').inputValue(), 'Giữ bộ lọc');
                await contest.getByRole('tab', { name: 'Quay số trúng thưởng', exact: true }).click();
                assert.equal(page.url(), contestUrl);
                await contest.getByRole('tab', { name: 'Lượt dự thi', exact: true }).click();
                assert.equal(await inlineEntries.locator('input[name="search"]').inputValue(), 'Giữ bộ lọc');
                await contest.getByRole('tab', { name: 'Quay số trúng thưởng', exact: true }).click();
                const draws = page.locator('antc-contest-draws-view');
                await draws.locator('select[name="contestId"]').selectOption(process.env.ANTC_TEST_CONTEST_ID, { timeout: 30000 });
                await draws.locator('select[name="prizeId"]').selectOption(process.env.ANTC_TEST_PRIZE_ID, { timeout: 30000 });
                await draws.locator('input[name="winners"]').fill('1');
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
                await page.locator('antc-contest-view').getByRole('tab', { name: 'Quay số trúng thưởng', exact: true }).click();
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
        await bank.locator('.question-preview').waitFor({ state: 'visible' });
        await screenshot('question-quick-preview');
        await bank.getByRole('button', { name: 'Đóng xem nhanh', exact: true }).click();
        assert.equal(await bank.locator('.question-preview').count(), 0);
        const mergedTable = bank.locator('antc-contest-questions-table');
        const searchedCode = await mergedTable.locator('[data-view]').first().innerText();
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
        if (page && process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'failure.png') }).catch(() => {});
        const view = page ? await page.locator('antc-contest-entries-report-view').evaluateAll(nodes => nodes.map(n => ({ busy: n._busy, error: n._error, detail: !!n._detail, dialogOpen: n.shadowRoot.querySelector('dialog')?.open, buttons: [...n.shadowRoot.querySelectorAll('button')].map(b => ({ text: b.textContent, disabled: b.disabled })) }))) : [];
        console.error('Browser diagnostics:', page ? new URL(page.url()).pathname : 'no page', errors.slice(0, 10), view);
        throw error;
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
