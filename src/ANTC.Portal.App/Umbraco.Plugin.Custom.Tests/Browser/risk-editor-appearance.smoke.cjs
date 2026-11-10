// Exercises appearance and unsaved values only. Does not save or publish documents.
const h = require('./article-acceptance.helpers.cjs');
const path = require('node:path');

(async () => {
    const browser = await h.launch();
    let page;
    try {
        const session = await h.login(browser); page = session.page;
        page.on('dialog', dialog => dialog.accept()); // Discard only this test context's unsaved edits on navigation.
        const catalog = await page.evaluate(async () => {
            const { UMB_AUTH_CONTEXT } = await import('@umbraco-cms/backoffice/auth');
            const auth = await document.querySelector('umb-app').getContext(UMB_AUTH_CONTEXT);
            const response = await fetch('/umbraco/management/api/v1/antc/risks/catalog', { headers: { Authorization: 'Bearer ' + await auth.getLatestToken() } });
            if (!response.ok) throw new Error('Cannot load the risk catalog');
            return response.json();
        });
        const pages = catalog.filter(n => ['ruiRoPage', 'alertListPage', 'riskCategoryPage', 'riskArticlePage', 'alertPage'].includes(n.type));
        h.assert(pages.length >= 7);
        const measurements = [];
        const sample = 'Mô tả SEO kiểm thử: nội dung ngắn gọn giúp người đọc nhận biết các rủi ro và tìm được thông tin phù hợp.';
        let checkedIcons = 0;
        for (const node of pages) {
            await page.setViewportSize({ width: 1440, height: 1050 });
            await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${node.key}`);
            const editor = page.locator('antc-risk-editor');
            await editor.getByRole('tab', { name: 'SEO và chia sẻ', exact: true }).waitFor();
            // Updating the textarea while its tab is hidden reproduces the original auto-height defect.
            await editor.evaluate((e, text) => e._dataset.setPropertyValue('seoDescription', text), sample);
            for (const width of [1440, 744, 390]) {
                await page.setViewportSize({ width, height: 1050 });
                await editor.getByRole('tab', { name: 'SEO và chia sẻ', exact: true }).click();
                const textarea = editor.locator('[alias=seoDescription] textarea');
                await textarea.waitFor();
                await page.waitForFunction(element => {
                    const bounds = element.getBoundingClientRect();
                    return bounds.height >= 40 && element.scrollHeight <= element.clientHeight + 2;
                }, await textarea.elementHandle(), { timeout: 5000 });
                const measured = await textarea.evaluate(e => {
                    const bounds = e.getBoundingClientRect();
                    return { height: bounds.height, width: bounds.width, scrollHeight: e.scrollHeight, clientHeight: e.clientHeight };
                });
                h.assert(measured.height >= 40 && measured.height < 300, `${node.name}/${width}: ${JSON.stringify(measured)}`);
                h.assert(measured.scrollHeight <= measured.clientHeight + 2, `Clipped SEO text: ${node.name}/${width}`);
                h.assert.equal(await textarea.inputValue(), sample);
                measurements.push({ page: node.name, viewport: width, ...measured });
                if (process.env.ANTC_SCREENSHOT_DIR && node.type === 'ruiRoPage')
                    await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `risk-seo-fixed-${width}.png`) });
                await editor.getByRole('tab', { name: node.type === 'riskArticlePage' ? 'Viết bài' : node.type === 'alertPage' ? 'Viết cảnh báo' : 'Nội dung', exact: true }).click();
            }
            if (!checkedIcons && node.type === 'riskCategoryPage') {
                await page.setViewportSize({ width: 1440, height: 1050 });
                const picker = editor.locator('[alias=icon] antc-fixed-choice');
                await picker.getByRole('combobox').waitFor();
                const stored = await picker.evaluate(e => e.value);
                const options = await picker.evaluate(e => { e._q = ''; return e._options(); });
                h.assert.equal(options.length, 34);
                for (const option of options) {
                    const code = option.split(' · ').at(-1), label = option.slice(0, option.lastIndexOf(' · '));
                    await picker.getByRole('combobox').fill(code);
                    const row = picker.getByRole('option', { name: label, exact: true });
                    await row.waitFor();
                    h.assert((await row.locator('svg path').getAttribute('d')).length > 5);
                    await row.click();
                    h.assert.equal(await picker.getByRole('combobox').inputValue(), label);
                    h.assert.equal(await picker.locator('.field svg').getAttribute('data-icon'), code);
                    h.assert.deepEqual(await picker.evaluate(e => e.value), [option]);
                    checkedIcons++;
                }
                await picker.getByRole('combobox').fill('id');
                await picker.getByRole('combobox').press('ArrowDown');
                await picker.getByRole('combobox').press('Enter');
                h.assert.equal(await picker.getByRole('combobox').inputValue(), 'Giấy tờ');
                h.assert.equal(await picker.locator('.field svg').getAttribute('data-icon'), 'id');
                if (process.env.ANTC_SCREENSHOT_DIR)
                    await picker.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'risk-icon-fixed.png') });
                await picker.getByRole('combobox').focus();
                await picker.getByRole('combobox').fill('');
                if (process.env.ANTC_SCREENSHOT_DIR)
                    await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'risk-icon-options-fixed.png') });
                await picker.getByRole('combobox').press('Escape');
                await picker.evaluate(e => { e.readonly = true; });
                h.assert(await picker.getByRole('combobox').isDisabled());
                await picker.evaluate(e => { const before = e.value; e._set('Tiền · money'); if (e.value !== before) throw new Error('Readonly icon changed'); e.readonly = false; e._set(null); });
                h.assert.equal(await picker.locator('.field svg').count(), 0);
                await picker.evaluate((e, v) => { e.value = v; }, stored);
            }
        }
        // The same component also serves caution levels; plain choices must remain unchanged.
        const plain = await page.evaluate(async () => {
            await import('/App_Plugins/AntcRisks/fixed-choice.js?v=1.2.0');
            const e = document.createElement('antc-fixed-choice');
            e.config = { getValueByAlias: () => ['Cần thận trọng', 'Cao', 'Rất cao'] }; e.value = ['Cao'];
            document.body.append(e); await e.updateComplete;
            const result = { label: e.shadowRoot.querySelector('input').value, icon: !!e.shadowRoot.querySelector('svg') }; e.remove(); return result;
        });
        h.assert.deepEqual(plain, { label: 'Cao', icon: false });
        h.assert.deepEqual(session.errors, []);
        console.log(JSON.stringify({ passed: true, pages: pages.length, seoChecks: measurements.length, icons: checkedIcons, browserErrors: session.errors, measurements }));
    } catch (e) {
        if (page && process.env.ANTC_SCREENSHOT_DIR)
            await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'risk-appearance-failure.png') }).catch(() => {});
        throw e;
    } finally { await browser.close(); }
})().catch(e => { console.error(e.stack); process.exit(1); });
