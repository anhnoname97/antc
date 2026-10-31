// Browser-memory edits only. Every document mutation request is blocked.
const h = require('./article-acceptance.helpers.cjs');
const path = require('node:path');

(async () => {
  const browser = await h.launch();
  let page;
  try {
    const session = await h.login(browser);
    page = session.page;
    const writes = [];
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      if (/\/document(?:\/|$)/.test(new URL(request.url()).pathname) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    const editor = await h.openArticle(page);
    const saved = await h.readDocument(page);
    const tab = id => editor.locator(`[role=tab][data-tab=${id}]`);
    const field = alias => editor.locator(`umb-content-workspace-property[alias=${alias}]`);
    const active = id => editor.locator(`[role=tab][data-tab=${id}][aria-selected=true]`).waitFor();
    h.assert.equal(await editor.getByRole('tab').count(), 4);
    await active('article');
    h.assert.equal(await editor.getByRole('tabpanel').count(), 1);
    h.assert(await editor.locator('#compose-panel-seo').evaluate(el => el.hidden && el.inert));
    const summary = field('summary').locator('textarea');
    const rte = field('body').locator('[contenteditable=true]').first();
    await rte.waitFor();
    await editor.evaluate(el => { el.__testRte = el.shadowRoot.querySelector('[alias=body]'); });
    await rte.evaluate(el => { window.__antcTestRte = el; });
    await summary.fill('Tóm tắt kiểm tra chuyển tab, chỉ lưu trong trình duyệt.');
    await rte.click();
    await page.keyboard.insertText(' Nội dung kiểm tra giữ nguyên trình soạn thảo.');
    const body = await rte.innerText();
    await tab('seo').click();
    await field('seoTitle').locator('input').fill('Tiêu đề SEO chưa lưu');
    await field('seoDescription').locator('textarea').fill('Mô tả SEO chưa lưu qua ba tab.');
    await tab('source').click();
    await field('sourceAgency').locator('input').fill('Nguồn kiểm tra chưa lưu');
    await tab('article').click();
    h.assert.equal(await summary.inputValue(), 'Tóm tắt kiểm tra chuyển tab, chỉ lưu trong trình duyệt.');
    h.assert.equal(await rte.innerText(), body);
    h.assert(await rte.evaluate(el => el === window.__antcTestRte));
    h.assert(await editor.evaluate(el => el.__testRte === el.shadowRoot.querySelector('[alias=body]')));
    await tab('seo').click();
    h.assert.equal(await field('seoTitle').locator('input').inputValue(), 'Tiêu đề SEO chưa lưu');
    await tab('source').click();
    h.assert.equal(await field('sourceAgency').locator('input').inputValue(), 'Nguồn kiểm tra chưa lưu');
    await editor.locator('antc-article-publication-info').getByText('Có thay đổi chưa lưu.', { exact: true }).waitFor();
    console.log('Unsaved summary, rich text, SEO and source values survive tab switches; native fields remain mounted');

    await tab('seo').click();
    await page.keyboard.press('ArrowRight');
    await active('history');
    h.assert(await tab('history').evaluate(el => el === el.getRootNode().activeElement));
    await page.keyboard.press('ArrowRight');
    await active('article');
    h.assert(await tab('article').evaluate(el => el === el.getRootNode().activeElement));
    await page.keyboard.press('End');
    await active('history');
    await page.keyboard.press('Home');
    await active('article');
    h.assert.equal(await editor.locator('[role=tab][tabindex="0"]').count(), 1);

    const card = editor.locator('.required-card');
    const requiredAliases = await editor.evaluate(el => el._properties.filter(property => property.validation?.mandatory && el._access.readable[property.alias]).map(property => property.alias));
    h.assert.deepEqual(await card.locator('[data-required]').evaluateAll(items => items.map(item => item.dataset.required)), ['$name', ...requiredAliases]);
    h.assert.deepEqual(requiredAliases.sort(), ['summary', 'updatedDate']);
    await h.setValues(editor, { summary: '', updatedDate: null, image: [], imageAlt: '', seoTitle: '', seoDescription: '' });
    const name = page.locator('umb-document-workspace-split-view-variant-selector uui-input input');
    const originalName = await name.inputValue();
    await name.fill('');
    await card.locator('.count').getByText('0/3', { exact: true }).waitFor();
    h.assert(await h.footer(page).getByRole('button', { name: 'Lưu và xuất bản', exact: true }).isEnabled());
    await card.getByRole('button', { name: 'Bổ sung Tên bài viết', exact: true }).click();
    await page.waitForFunction(el => el === el.getRootNode().activeElement, await name.elementHandle());
    await name.fill(originalName);
    await card.getByRole('button', { name: 'Bổ sung Ngày cập nhật', exact: true }).click();
    await active('source');
    const requiredDate = field('updatedDate').locator('input[type=date]');
    await page.waitForFunction(el => el === el.getRootNode().activeElement, await requiredDate.elementHandle());
    await requiredDate.fill('2026-10-31');
    await requiredDate.press('Tab');
    await card.locator('.count').getByText('2/3', { exact: true }).waitFor();
    await card.getByRole('button', { name: 'Bổ sung Tóm tắt', exact: true }).click();
    await active('article');
    await summary.fill('Tóm tắt kiểm tra các trường bắt buộc.');
    await card.locator('.count').getByText('3/3', { exact: true }).waitFor();
    h.assert.equal(await card.locator('[data-required=image], [data-required=imageAlt], [data-required=seoDescription]').count(), 0);
    console.log('Required card follows schema, updates 0/3 to 3/3 and focuses name/summary/date; optional image/SEO never block actions');

    await h.setValues(editor, { summary: 'Tóm tắt kiểm tra chuyển tab.', seoDescription: 'Mô tả SEO kiểm tra.', updatedDate: null });
    await tab('article').click();
    const validate = (byVariant = false) => editor.evaluate(async (el, byVariant) => {
      const { UMB_VALIDATION_CONTEXT } = await import('@umbraco-cms/backoffice/validation');
      const context = await el.getContext(UMB_VALIDATION_CONTEXT);
      try {
        if (byVariant) {
          const { UmbVariantId } = await import('@umbraco-cms/backoffice/variant');
          await context.validateByVariantIds([UmbVariantId.INVARIANT]);
        } else await context.validate();
      } catch {}
      return context.messages.getMessages();
    }, byVariant);
    const messages = await validate();
    h.assert(messages.some(message => message.path.includes('updatedDate')), JSON.stringify(messages));
    await active('source');
    await tab('source').locator('.tab-error').waitFor();
    const date = field('updatedDate').locator('input[type=date]');
    await date.waitFor();
    await page.waitForFunction(el => el === el.getRootNode().activeElement, await date.elementHandle());
    await tab('article').click();
    await validate(true);
    await active('source');
    await date.fill('2026-10-31');
    await date.press('Tab');
    await validate();
    await tab('source').locator('.tab-error').waitFor({ state: 'detached' });
    console.log('Native required-date validation opens source tab, focuses the field, repeats correctly and clears badge after correction');

    // A native server field message must also route to its hidden tab.
    await tab('article').click();
    await editor.evaluate(async el => {
      const { UMB_VALIDATION_CONTEXT, UmbDataPathPropertyValueQuery } = await import('@umbraco-cms/backoffice/validation');
      const context = await el.getContext(UMB_VALIDATION_CONTEXT);
      const query = UmbDataPathPropertyValueQuery({ alias: 'seoTitle', culture: null, segment: null });
      context.messages.addMessage('server', `$.values[${query}].value`, 'Thông báo kiểm thử chuyển tab.', 'antc-tab-test');
      context.focusFirstInvalidElement();
    });
    await active('seo');
    await tab('seo').locator('.tab-error').waitFor();
    await editor.evaluate(async el => {
      const { UMB_VALIDATION_CONTEXT } = await import('@umbraco-cms/backoffice/validation');
      (await el.getContext(UMB_VALIDATION_CONTEXT)).messages.removeMessageByKey('antc-tab-test');
    });
    await tab('seo').locator('.tab-error').waitFor({ state: 'detached' });
    console.log('Native server field messages reveal the SEO tab');

    const layouts = [];
    if (process.env.ANTC_SCREENSHOT_DIR) h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
    for (const width of [900, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      for (const id of ['article', 'seo', 'source', 'history']) {
        await tab(id).click();
        await active(id);
        await editor.evaluate(async el => { await el.updateComplete; await new Promise(resolve => requestAnimationFrame(resolve)); });
        h.assert.equal(await editor.getByRole('tabpanel').count(), 1);
        for (const textarea of await editor.locator('.compose-panel:not([hidden]) textarea').all()) {
          const geometry = await textarea.evaluate(el => ({ height: el.clientHeight, minimum: parseFloat(getComputedStyle(el).lineHeight) + parseFloat(getComputedStyle(el).paddingTop) + parseFloat(getComputedStyle(el).paddingBottom) }));
          h.assert(geometry.height >= geometry.minimum, `${width} ${id} textarea clipped: ${JSON.stringify(geometry)}`);
        }
        const overflow = await editor.evaluate(el => el.shadowRoot.querySelector('.scroll-area').scrollWidth > el.clientWidth + 1);
        h.assert(!overflow, `${width} ${id} horizontal overflow`);
        if (process.env.ANTC_SCREENSHOT_DIR && [1024, 1920].includes(width)) {
          await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `tabs-${id}-${width}.png`) });
        }
      }
      layouts.push(width);
    }
    h.assert.equal(await h.footer(page).locator('uui-button[data-mark^="workspace-action:"]').count(), 3);
    await page.reload();
    await summary.waitFor();
    h.assert.deepEqual((await h.readDocument(page)).values, saved.values);
    h.assert.deepEqual(writes, []);
    h.assert.deepEqual(session.errors, []);
    console.log(JSON.stringify({ layouts, writes, errors: session.errors }, null, 2));
  } catch (error) {
    if (page && process.env.ANTC_SCREENSHOT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'tabs-failure.png') }).catch(() => {});
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
