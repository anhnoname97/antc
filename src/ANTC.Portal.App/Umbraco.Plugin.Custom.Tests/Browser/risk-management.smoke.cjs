// Writes only to a guarded isolated host. Uses the native document APIs and the real custom editors.
const h = require('./article-acceptance.helpers.cjs');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const ref = id => [{ type: 'document', unique: id }];

(async () => {
    const browser = await h.launch();
    let page;
    try {
        await h.isolated(browser);
        const session = await h.login(browser); page = session.page;
        const request = (url, body) => page.evaluate(async ({ url, body }) => {
            const { UMB_AUTH_CONTEXT } = await import('@umbraco-cms/backoffice/auth');
            const auth = await document.querySelector('umb-app').getContext(UMB_AUTH_CONTEXT);
            const response = await fetch('/umbraco/management/api/v1/antc/risks/' + url, {
                method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + await auth.getLatestToken(), 'Content-Type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body)
            });
            return { status: response.status, data: await response.json() };
        }, { url, body });
        let catalog = (await request('catalog')).data;
        const types = (await request('types')).data;
        h.assert.equal(catalog.filter(n => n.type === 'riskCategoryPage').length, 5);
        const canonicalRoot = '2f0dfb61-9591-4d14-970a-6be6f7d4b28c';
        h.assert.equal(catalog.find(n => n.type === 'ruiRoPage').key, canonicalRoot);
        h.assert.equal(catalog.find(n => n.type === 'alertListPage').key, '540fecd6-015a-4585-b896-d6272108aab0');
        h.assert(!types.riskCategoryPage, 'The replacement document type must be retired');
        const existingGroups = { luaDaoPage: '340daab5-ee51-4f38-8415-01eb5345de72', vayVaNoPage: '117dc275-7007-4fda-9749-090a3d934633',
            dauTuPage: '16a62a3c-0d74-4a5b-b607-81ba7056dec5', duLieuCaNhanPage: 'c2543936-24cb-4ef7-b9ed-8bd30070d7a4', baoHiemVaTietKiemPage: 'b12c0f34-008b-4889-809b-9aeeada902c4' };
        for (const [alias, id] of Object.entries(existingGroups)) {
            const node = catalog.find(n => n.key === id);
            h.assert(node && node.parentKey === canonicalRoot && node.contentTypeKey === types[alias], `Missing AnVu29 group ${alias}`);
        }
        const retired = await h.api(page, 'DocumentService', 'getDocumentById', { path: { id: '206ee00d-348e-58ba-8f9b-80a3bb45fe88' } });
        h.assert.equal(retired.status, 404);
        const group = catalog.find(n => n.type === 'riskCategoryPage');
        const folder = type => catalog.find(n => n.type === type);
        const articleFolder = folder('articleFolder'), alertFolder = folder('alertFolder'), tacticFolder = folder('tacticFolder');
        const read = id => h.readDocument(page, id);
        const update = async (id, values) => {
            const result = await h.api(page, 'DocumentService', 'putDocumentById', { path: { id }, body: h.updateBody(await read(id), values) });
            h.assert.equal(result.status, 200, JSON.stringify(result));
        };
        const tag = randomUUID().slice(0, 8);
        async function create(type, parent, values) {
            const id = randomUUID();
            const result = await h.api(page, 'DocumentService', 'postDocument', { body: {
                id, parent: { id: parent }, documentType: { id: types[type] }, template: null,
                variants: [{ culture: null, segment: null, name: `Kiểm thử Rủi ro ${type} ${tag}` }],
                values: Object.entries(values).map(([alias, value]) => ({ alias, value, culture: null, segment: null }))
            } });
            h.assert.equal(result.status, 201, JSON.stringify(result)); return id;
        }
        const article = await create('riskArticlePage', articleFolder.key, {
            title: 'Bài kiểm thử ' + tag, primaryGroup: ref(group.key), articleKind: ['Bài hướng dẫn'], description: 'Câu mời đọc kiểm thử.'
        });
        const publish = id => h.api(page, 'DocumentService', 'putDocumentByIdPublish', { path: { id }, body: { publishSchedules: [{ culture: null, schedule: null }] } });
        const incomplete = await publish(article);
        h.assert([400, 422].includes(incomplete.status), JSON.stringify(incomplete));

        await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${article}`);
        const editor = page.locator('antc-risk-editor');
        await editor.getByRole('radiogroup', { name: 'Loại bài' }).waitFor();
        await editor.locator('[alias=primaryGroup] antc-node-combobox input').waitFor();
        h.assert.equal(await editor.locator('[alias=warningSigns]').count(), 1);
        await editor.getByRole('radio', { name: /^Bài đọc thêm/ }).click();
        h.assert.equal(await editor.locator('[alias=warningSigns]').count(), 0);
        h.assert.equal(await editor.locator('[alias=series]').count(), 1);
        h.assert.equal(await editor.locator('[alias=topic]').count(), 0);
        await editor.getByRole('radio', { name: /^Bài đọc chuyên đề/ }).click();
        h.assert.equal(await editor.locator('[alias=series]').count(), 0);
        h.assert.equal(await editor.locator('[alias=topic]').count(), 1);
        await editor.getByRole('radio', { name: /^Bài hướng dẫn/ }).click();

        const groupPicker = editor.locator('[alias=primaryGroup] antc-node-combobox');
        await groupPicker.getByRole('button', { name: /^Bỏ / }).click();
        await groupPicker.getByRole('combobox').fill(group.name);
        await groupPicker.getByRole('combobox').press('ArrowDown');
        await groupPicker.getByRole('combobox').press('Enter');
        const nativeValue = await groupPicker.evaluate(e => e.value);
        h.assert.equal(nativeValue[0].unique, group.key); h.assert.equal(nativeValue[0].type, 'document');

        const signs = editor.locator('[alias=warningSigns] antc-line-list');
        await signs.getByRole('button', { name: '＋ Thêm dòng' }).click();
        await signs.getByRole('textbox', { name: 'Dòng 1' }).fill('Yêu cầu cung cấp mã OTP.');
        await signs.getByRole('textbox', { name: 'Dòng 1' }).press('Enter');
        await signs.getByRole('textbox', { name: 'Dòng 2' }).fill('Giục chuyển tiền ngay.');
        await signs.getByRole('button', { name: 'Chuyển lên', exact: true }).nth(1).click();
        h.assert.equal(await signs.getByRole('textbox', { name: 'Dòng 1' }).inputValue(), 'Giục chuyển tiền ngay.');
        const sources = editor.locator('[alias=references] antc-inline-list');
        await sources.getByRole('button', { name: '＋ Thêm dòng' }).click();
        await sources.getByRole('textbox', { name: 'Tên tài liệu', exact: true }).fill('Tài liệu kiểm thử');
        await sources.getByRole('textbox', { name: 'Đơn vị', exact: true }).fill('Đơn vị kiểm thử');
        await sources.getByRole('textbox', { name: 'Liên kết', exact: true }).fill('https://example.org/reference');
        await sources.getByRole('button', { name: 'Nhân bản', exact: true }).click();
        h.assert.equal(await sources.locator('tbody tr').count(), 2);
        await sources.getByRole('button', { name: 'Xóa dòng', exact: true }).last().click();
        const scenarios = editor.locator('[alias=scenarios] antc-inline-list');
        await scenarios.getByRole('button', { name: '＋ Thêm kịch bản' }).click();
        await scenarios.getByRole('textbox', { name: 'Tên kịch bản', exact: true }).fill('Cuộc gọi giả danh');
        await scenarios.getByRole('textbox', { name: 'Diễn biến từng bước', exact: true }).fill('Gọi tự xưng cán bộ\nYêu cầu chuyển tiền');
        const saved = page.waitForResponse(r => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith(`/document/${article}`));
        await h.footer(page).getByRole('button', { name: 'Lưu', exact: true }).click();
        h.assert((await saved).ok());
        const persisted = await read(article);
        const pv = alias => persisted.values.find(v => v.alias === alias)?.value;
        h.assert.equal(pv('primaryGroup')[0].unique, group.key);
        h.assert.deepEqual(pv('warningSigns'), ['Giục chuyển tiền ngay.', 'Yêu cầu cung cấp mã OTP.']);
        h.assert.equal(JSON.parse(pv('references'))[0].title, 'Tài liệu kiểm thử');
        h.assert.equal(JSON.parse(pv('scenarios'))[0].steps.length, 2);
        await page.reload(); await editor.locator('[alias=references] antc-inline-list').getByRole('textbox', { name: 'Tên tài liệu', exact: true }).waitFor();
        const topic = catalog.find(n => n.type === 'topicItem');
        await update(article, { summary: { markup: '<p>Tóm tắt bài kiểm thử.</p>', blocks: null }, actionsNow: ['Dừng chuyển tiền.'],
            topic: ref(topic.key), reviewDate: '2026-11-04T00:00:00', reviewer: 'Kiểm thử tự động' });
        h.assert.equal((await publish(articleFolder.key)).status, 200);
        const validPublish = await publish(article);
        h.assert.equal(validPublish.status, 200, JSON.stringify(validPublish));

        const channel = catalog.find(n => n.type === 'channelItem');
        const tactic = await create('tacticItem', tacticFolder.key, { code: 'kiem-thu-' + tag, isActive: true, containingArticle: ref(article), channels: ref(channel.key), cautionLevel: ['Cao'] });
        const audience = catalog.find(n => n.type === 'audienceItem');
        await update(audience.key, { tactics: ref(tactic) });
        const popularity = catalog.find(n => n.type === 'popularityItem');
        const alert = await create('alertPage', alertFolder.key, { title: 'Cảnh báo kiểm thử ' + tag, description: 'Tóm tắt.', updatedDate: '2026-11-04T00:00:00', cautionLevel: ['Cao'], popularity: ref(popularity.key), autoUnpublishDays: 180 });
        await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${alert}`);
        await editor.locator('[alias=tactics] antc-node-combobox').waitFor();
        const tacticPicker = editor.locator('[alias=tactics] antc-node-combobox');
        await tacticPicker.getByRole('combobox').fill(tag);
        await tacticPicker.getByRole('option', { name: new RegExp(tag) }).click();
        await h.assert.doesNotReject(() => editor.locator('[alias=channels] antc-node-combobox .chip').waitFor());
        await editor.locator('[alias=audiences] antc-node-combobox .chip').waitFor();
        // Existing manual selection survives selecting the same tactic again.
        const filled = await editor.evaluate(e => ({ channels: e._values.channels, audiences: e._values.audiences }));
        h.assert.equal(filled.channels[0].unique, channel.key); h.assert.equal(filled.audiences[0].unique, audience.key);
        const derived = await request(`${alert}/derive`, { tactics: ref(tactic) });
        h.assert.equal(derived.status, 200); h.assert(derived.data.related.some(n => n.key === article));

        await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${group.key}`);
        await editor.getByRole('heading', { name: 'Website tự lấy', exact: true }).waitFor();
        await editor.getByRole('tab', { name: 'SEO và chia sẻ', exact: true }).click();
        await editor.locator('[alias=canonicalUrl]').waitFor();
        await editor.getByRole('tab', { name: 'Nội dung', exact: true }).click();
        for (const width of [1440, 744, 390]) {
            await page.setViewportSize({ width, height: 1050 });
            await page.waitForTimeout(150);
            const bounds = await editor.boundingBox();
            h.assert(bounds.width <= width + 1, `Editor overflows viewport ${width}: ${bounds.width}`);
            if (width === 390) {
                await editor.getByRole('button', { name: 'Mở cây nội dung', exact: true }).click();
                h.assert(await page.locator('umb-section-sidebar').isVisible());
                await page.keyboard.press('Escape');
                h.assert(!(await page.locator('umb-section-sidebar').isVisible()));
            }
            if (process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `risk-group-${width}.png`) });
        }
        await page.setViewportSize({ width: 1440, height: 1050 });
        await page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${articleFolder.key}`);
        const collection = page.locator('antc-risk-collection');
        await collection.getByRole('searchbox', { name: 'Tìm theo tiêu đề' }).fill(tag);
        await collection.getByRole('link', { name: 'Bài kiểm thử ' + tag, exact: true }).waitFor();
        await collection.getByRole('combobox', { name: 'Loại bài', exact: true }).selectOption('Bài đọc thêm');
        await collection.getByText('Không có mục phù hợp.', { exact: true }).waitFor();
        await collection.getByRole('combobox', { name: 'Loại bài', exact: true }).selectOption('Bài hướng dẫn');
        await collection.getByRole('link', { name: 'Bài kiểm thử ' + tag, exact: true }).waitFor();
        await collection.getByRole('checkbox', { name: 'Chọn tất cả trong trang', exact: true }).check();
        await collection.getByRole('button', { name: 'Gỡ xuất bản', exact: true }).click();
        await collection.getByRole('button', { name: 'Thực hiện', exact: true }).click();
        await collection.getByText('Đã gỡ xuất bản 1 mục.', { exact: true }).waitFor();
        await collection.getByRole('checkbox', { name: 'Chọn tất cả trong trang', exact: true }).check();
        await collection.getByRole('button', { name: 'Xuất bản', exact: true }).click();
        await collection.getByRole('button', { name: 'Thực hiện', exact: true }).click();
        await collection.getByText('Đã xuất bản 1 mục.', { exact: true }).waitFor();
        const anonymous = await browser.newContext();
        h.assert.equal((await anonymous.request.get(`${h.base}/umbraco/management/api/v1/antc/risks/catalog`)).status(), 401);
        await anonymous.close();
        h.assert.deepEqual(session.errors, []);
        console.log(JSON.stringify({ passed: true, fixedPages: 7, article, tactic, alert, checks: ['native references', 'draft save/reload', 'three article kinds', 'line reorder', 'inline sources', 'scenario cards', 'incomplete publication denied', 'complete publication', 'alert autofill', 'derivation', 'SEO', 'responsive 1440/744/390', 'collection filters', 'bulk unpublish/publish', 'anonymous denied'], browserErrors: session.errors }));
    } catch (e) {
        if (page && process.env.ANTC_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'risk-failure.png') }).catch(() => {});
        throw e;
    } finally { await browser.close(); }
})().catch(e => { console.error(e.stack); process.exit(1); });
