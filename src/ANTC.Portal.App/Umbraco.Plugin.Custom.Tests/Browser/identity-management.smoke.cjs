// Uses only the full-host test's disposable databases and test administrator.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.ANTC_BROWSER_EXECUTABLE || undefined });
    const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.ANTC_TEST_URL;
    const shot = async name => {
        if (!process.env.ANTC_SCREENSHOT_DIR) return;
        fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `${name}.png`) });
    };
    try {
        await page.goto(base + 'umbraco/section/user-management/workspace/user-root');
        await page.locator('input[name="username"]').fill('admin-test@example.invalid', { timeout: 30000 });
        await page.locator('input[name="password"]').fill(process.env.ANTC_TEST_PASSWORD);
        await page.locator('#umb-login-button').click();
        await page.waitForURL(url => url.pathname.startsWith('/umbraco/section/'), { timeout: 30000 });
        for (const [section, entity, title] of [
            ['user-management', 'user-root', 'Tài khoản'],
            ['user-management', 'user-group-root', 'Nhóm tài khoản'],
            ['member-management', 'member-root', 'Thành viên'],
            ['member-management', 'member-group-root', 'Nhóm thành viên'],
        ]) {
            await page.goto(`${base}umbraco/section/${section}/workspace/${entity}`);
            await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor({ timeout: 30000 });
            await page.locator('umb-collection-action-bundle uui-button').first().waitFor({ timeout: 30000 });
            await page.locator('antc-identity-result-count').getByRole('status').filter({ hasText: /\d+ kết quả/ }).waitFor();
            assert.equal(await page.locator('antc-identity-heading').count(), 1, 'Only one custom heading');
            assert.match(await page.locator('antc-identity-heading').evaluate(el => getComputedStyle(el).fontFamily), /Roboto/);
            assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--uui-color-interactive').trim()), '#0e7c72');
            await shot(entity);
            if (entity === 'user-root') {
                await page.getByRole('link', { name: 'Isolated Admin Test', exact: true }).first().waitFor();
                await page.locator('antc-account-state').getByText('Đang hoạt động', { exact: true }).waitFor();
                await shot(entity);
                await page.getByRole('link', { name: 'Isolated Admin Test', exact: true }).first().click();
                await page.locator('umb-user-details-workspace-view uui-box').first().waitFor();
                assert.equal(await page.locator('umb-user-details-workspace-view uui-box').first().evaluate(el => getComputedStyle(el).borderRadius), '14px');
                await shot('user-editor');
                const marker = await page.evaluate(() => window.identityNavigationMarker = crypto.randomUUID());
                await page.locator('umb-section-sidebar').getByRole('link', { name: 'Nhóm người dùng', exact: true }).click();
                await page.getByRole('heading', { name: 'Nhóm tài khoản', level: 1, exact: true }).waitFor();
                assert.equal(await page.evaluate(() => window.identityNavigationMarker), marker, 'Native sidebar must keep SPA navigation');
            }
            if (entity === 'user-group-root') {
                await page.locator('umb-table a').first().click();
                await page.locator('umb-user-group-details-workspace-view uui-box').first().waitFor();
                await shot('user-group-editor');
            }
            if (entity === 'member-group-root') {
                await page.goto(`${base}umbraco/section/member-management/workspace/member-group/create`);
                await page.locator('umb-workspace-header-name-editable input').fill('[TEST] Nhóm thành viên giao diện');
                await page.getByRole('button', { name: 'Lưu', exact: true }).click();
                await page.waitForURL(/\/workspace\/member-group\/edit\//);
                await shot('member-group-editor');
                await page.goto(`${base}umbraco/section/member-management/workspace/member-group-root`);
                await page.getByRole('link', { name: '[TEST] Nhóm thành viên giao diện', exact: true }).waitFor();
                await shot('member-group-root');
                await page.locator('[data-mark="section-link:Umb.Section.Users"]').click();
                await page.locator('umb-section-sidebar').getByRole('link', { name: 'Người dùng', exact: true }).click();
                await page.getByRole('heading', { name: 'Tài khoản', level: 1, exact: true }).waitFor();
                await page.locator('umb-table').waitFor();
                assert.equal(await page.locator('umb-table').evaluate(el => getComputedStyle(el).borderRadius), '12px');
                await page.locator('[data-mark="section-link:Umb.Section.Members"]').click();
                await page.getByRole('heading', { name: 'Nhóm thành viên', level: 1, exact: true }).waitFor();
            }
        }
        await page.setViewportSize({ width: 900, height: 850 });
        await page.goto(`${base}umbraco/section/user-management/workspace/user-group-root`);
        await page.getByRole('heading', { name: 'Nhóm tài khoản', exact: true }).waitFor();
        await page.locator('umb-table a').first().waitFor();
        await shot('identity-narrow');
        // Leaving via the real shell must release all section styles.
        await page.locator('[data-mark="section-link:Umb.Section.Content"]').click();
        await page.waitForFunction(() => !document.documentElement.hasAttribute('data-antc-identity-section'));
        assert.equal(await page.locator('antc-identity-heading').count(), 0);
        assert.deepEqual(errors, []);
        console.log('Identity browser PASS: four lists, account/group editors, Roboto, native data and section cleanup.');
    } catch (error) {
        await shot('identity-failure');
        console.error('URL', page.url(), 'Errors', errors, 'BODY', (await page.locator('body').innerText()).slice(-3500));
        console.error('WORKSPACES', await page.evaluate(() => {
            const found = [];
            function visit(root) { for (const node of root.querySelectorAll('*')) {
                if (/workspace|collection/.test(node.localName)) found.push({ tag: node.localName, manifest: node.manifest, alias: node.alias, headline: node.headline });
                if (node.shadowRoot) visit(node.shadowRoot);
            } }
            visit(document); return JSON.stringify(found);
        }));
        throw error;
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
