// Read-only server verification. Edits stay in browser memory and are restored;
// this script never clicks Save, Publish or Preview (Preview can save a draft).
const { chromium, firefox, webkit } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const browserType = { chromium, firefox, webkit }[process.env.ANTC_BROWSER_ENGINE || 'chromium'];
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const articleId = process.env.ANTC_ARTICLE_ID || '90ab7780-e72b-4d53-ae5a-147dfb353e03';
const username = process.env.ANTC_BACKOFFICE_USERNAME;
const password = process.env.ANTC_BACKOFFICE_PASSWORD;
if (!username || !password) throw new Error('Set ANTC_BACKOFFICE_USERNAME and ANTC_BACKOFFICE_PASSWORD.');

(async () => {
  const browser = await browserType.launch({
    ...(process.env.ANTC_BROWSER_PATH ? { executablePath: process.env.ANTC_BROWSER_PATH } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(20000);
    const errors = [];
    const abortedImports = new Set();
    page.on('requestfailed', request => {
      if (/ABORTED|NS_BINDING_ABORTED|NS_ERROR_ABORT/.test(request.failure()?.errorText ?? '')) abortedImports.add(request.url());
    });
    const contentWrites = [];
    page.on('pageerror', error => errors.push(error.message));
    // Fail safely if an action unexpectedly attempts a content write.
    await page.route('**/umbraco/management/api/**', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (/\/document(?:\/|$)/.test(url.pathname) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
        contentWrites.push(`${request.method()} ${url.pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(`${base}/umbraco`);
    await page.locator('input[name=username]').fill(username);
    await page.locator('input[name=password]').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.getByRole('button', { name: /Hồ sơ người dùng|User profile/ }).waitFor({ timeout: 45000 });
    await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${articleId}`);

    const editor = page.locator('antc-article-editor');
    const workspace = page.locator('umb-workspace-split-view');
    const summary = editor.locator('#summary textarea');
    await summary.waitFor();
    await editor.locator('#body [contenteditable=true]').waitFor();
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    assert.equal(await editor.getByRole('button', { name: 'Kiểu đoạn', exact: true }).count(), 0);
    assert.equal(await editor.getByRole('button', { name: 'Hộp lưu ý', exact: true }).count(), 0);
    await editor.getByRole('button', { name: 'Căn trái', exact: true }).waitFor();
    await editor.getByRole('button', { name: 'Căn giữa', exact: true }).waitFor();
    await editor.getByRole('button', { name: 'Căn phải', exact: true }).waitFor();
    console.log('Article view loaded');
    await editor.locator('#summary').getByText('1–2 câu giới thiệu bài.', { exact: true }).waitFor();
    await editor.locator('umb-content-workspace-property[alias=body] #description').waitFor({ state: 'detached' });
    await editor.locator('umb-content-workspace-property[alias=safeAction]').getByText('Không bắt buộc.', { exact: true }).waitFor();
    await editor.locator('umb-content-workspace-property[alias=imageAlt]').getByText('Mô tả ngắn nội dung ảnh. Có thể để trống.', { exact: true }).waitFor();
    assert.equal(await editor.locator('aside .side-card').count(), 2);
    assert.equal(await editor.locator('aside antc-article-seo-preview, aside nav').count(), 0);
    assert(await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).isVisible());
    assert.equal(await workspace.getByRole('tab', { name: 'Nội dung', exact: true }).count(), 0);
    const originalSummary = await summary.inputValue();
    const footer = page.locator('umb-document-workspace-split-view umb-workspace-footer');
    const publish = footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true });
    await publish.waitFor();
    assert(await publish.isEnabled());
    assert.equal(await editor.locator('.checklist-card').count(), 0);
    assert.equal(await footer.locator('[data-mark="workspace-action:Umb.WorkspaceAction.Document.SaveAndPublish"]').count(), 1);
    const sample = 'Kiểm tra giao diện: giữ nguyên dữ liệu khi chuyển tab.';
    await summary.fill(sample);
    await page.waitForFunction(expected => {
      const find = root => {
        for (const element of root.querySelectorAll('*')) {
          if (element.localName === 'antc-article-editor') return element;
          if (element.shadowRoot) { const found = find(element.shadowRoot); if (found) return found; }
        }
      };
      return find(document)?._summary === expected;
    }, sample);
    assert.equal(await editor.locator('#summary .count').innerText(), `${Array.from(sample).length} ký tự`);

    await workspace.getByRole('tab', { name: 'Thông tin', exact: true }).click();
    await page.locator('umb-document-workspace-view-info').waitFor();
    await workspace.getByRole('tab', { name: 'Soạn bài', exact: true }).click();
    await summary.waitFor();
    assert.equal(await summary.inputValue(), sample);
    await summary.fill(originalSummary);
    await editor.getByRole('button', { name: 'Đậm', exact: true }).waitFor();
    console.log('Compose view restored original summary');

    const textareaGeometry = () => summary.evaluate(element => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve({
        height: element.clientHeight, scrollHeight: element.scrollHeight,
      })));
    }));
    await summary.fill('Tóm tắt ngắn.');
    const shortSummary = await textareaGeometry();
    await summary.fill(Array.from({ length: 6 }, (_, index) => `Dòng ${index + 1}: Nội dung tóm tắt cần hiển thị đầy đủ.`).join('\n'));
    const longSummary = await textareaGeometry();
    assert(longSummary.height > shortSummary.height + 40, 'Summary should grow for multiple lines');
    assert(longSummary.scrollHeight <= longSummary.height + 2, 'Six-line summary should not need an internal scrollbar');
    await summary.fill('Tóm tắt ngắn.');
    const shrunkSummary = await textareaGeometry();
    assert(shrunkSummary.height < longSummary.height - 40, 'Summary should shrink when text is removed');
    await summary.fill(originalSummary);

    for (const label of ['Gạch chân', 'Danh sách đánh số', 'Trích dẫn']) {
      assert(await editor.locator('#body').getByRole('button', { name: label, exact: true }).isVisible(), `Missing toolbar label: ${label}`);
    }
    if (await editor.getByRole('button', { name: 'Hộp lưu ý', exact: true }).count()) {
      assert(await editor.getByRole('button', { name: 'Kiểu đoạn', exact: true }).isVisible());
      assert(await editor.getByRole('button', { name: 'Bảng', exact: true }).isVisible());
      assert.equal(await editor.getByRole('button', { name: 'Xem mã nguồn', exact: true }).count(), 0);
      assert.equal(await editor.getByRole('button', { name: 'Căn trái', exact: true }).count(), 0);
    }
    assert.equal(await editor.locator('#body').getByRole('button', { name: 'Ordered List', exact: true }).count(), 0);

    // Verify layout in the actual backoffice shell, including the left tree.
    const layouts = [];
    for (const width of [1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const geometry = await editor.evaluate(element => {
        const root = element.shadowRoot;
        const main = root.querySelector('main').getBoundingClientRect();
        const side = root.querySelector('aside').getBoundingClientRect();
        const scroll = root.querySelector('.scroll-area');
        const viewport = scroll.getBoundingClientRect();
        const summary = root.querySelector('#summary').getBoundingClientRect();
        const body = root.querySelector('#body').getBoundingClientRect();
        const image = root.querySelector('#image').getBoundingClientRect();
        return {
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          editorOverflow: scroll.scrollWidth > scroll.clientWidth + 1,
          mainWidth: Math.round(main.width),
          leftInset: Math.round(main.left - viewport.left),
          rightInset: Math.round(viewport.right - side.right),
          singleColumn: side.bottom <= main.top + 1,
          fieldOrder: summary.top < body.top && body.top < image.top,
        };
      });
      assert(!geometry.pageOverflow, `Page overflow at ${width}px`);
      assert(!geometry.editorOverflow, `Editor overflow at ${width}px`);
      assert(geometry.fieldOrder);
      assert.equal(geometry.singleColumn, width <= 1024, `Unexpected layout at ${width}px`);
      if (width >= 1280) {
        assert(geometry.leftInset <= 25, `Excess empty space before writing column at ${width}px`);
        assert(geometry.rightInset <= 42, `Layout should use the available width at ${width}px`);
      }
      layouts.push({ width, ...geometry });
      if (process.env.ANTC_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.ANTC_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, `article-editor-${width}.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Native footer stays in charge of actions, outside the plugin.
    assert(await page.locator('umb-workspace-footer').getByRole('button', { name: 'Lưu', exact: true }).isVisible());
    assert(await page.locator('umb-workspace-footer').getByRole('button', { name: 'Lưu và xuất bản', exact: true }).isVisible());
    await editor.locator('#body').scrollIntoViewIfNeeded();
    const body = editor.locator('#body [contenteditable=true]');
    const typeBody = async text => {
      await body.click();
      await body.press('ControlOrMeta+a');
      await page.keyboard.insertText(text);
    };
    await typeBody('Một hai');
    await editor.locator('#body .count').getByText('2 từ', { exact: true }).waitFor();
    await body.press('ControlOrMeta+End');
    await body.press('Enter');
    await page.keyboard.insertText('Ba bốn');
    await editor.locator('#body .count').getByText('4 từ', { exact: true }).waitFor();

    // Prove the translated toolbar still runs the original commands.
    await typeBody('Văn bản in đậm');
    await body.press('ControlOrMeta+a');
    await editor.locator('#body').getByRole('button', { name: 'Đậm', exact: true }).click();
    assert.equal(await body.locator('strong').innerText(), 'Văn bản in đậm');
    await editor.locator('#body').getByRole('button', { name: 'Gạch chân', exact: true }).click();
    assert.equal(await body.locator('u').innerText(), 'Văn bản in đậm');

    if (await editor.getByRole('button', { name: 'Kiểu đoạn', exact: true }).count()) {
      await editor.getByRole('button', { name: 'Kiểu đoạn', exact: true }).click();
      await page.getByText('Tiêu đề cấp 2', { exact: true }).filter({ visible: true }).first().click();
      assert.equal(await body.locator('h2').innerText(), 'Văn bản in đậm');
      await editor.getByRole('button', { name: 'Kiểu đoạn', exact: true }).click();
      await page.getByText('Đoạn văn', { exact: true }).filter({ visible: true }).first().click();
      assert.equal(await body.locator('h2').count(), 0);
      const paragraphMarkup = await body.innerHTML();
      await editor.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
      assert.notEqual(await body.innerHTML(), paragraphMarkup);
      await editor.getByRole('button', { name: 'Làm lại', exact: true }).click();
      assert.equal(await body.innerHTML(), paragraphMarkup);
    }

    // Long content uses the outer scroll area and keeps its toolbar visible.
    await typeBody(Array.from({ length: 36 }, (_, index) => `Dòng nội dung dài ${index + 1}.`).join('\n'));
    await editor.evaluate(element => {
      const root = element.shadowRoot;
      root.querySelector('.scroll-area').scrollTop = root.querySelector('#body').offsetTop + 180;
    });
    const toolbarPosition = await editor.locator('#body umb-tiptap-toolbar').evaluate(element => {
      let parent = element;
      while (parent && parent.localName !== 'antc-article-editor') parent = parent.parentElement || parent.getRootNode().host;
      const viewport = parent.shadowRoot.querySelector('.scroll-area').getBoundingClientRect();
      const toolbar = element.getBoundingClientRect();
      const tabs = parent.shadowRoot.querySelector('.compose-tabs').getBoundingClientRect();
      return { top: toolbar.top, viewportTop: viewport.top, bottom: toolbar.bottom, viewportBottom: viewport.bottom, tabsTop: tabs.top, tabsBottom: tabs.bottom };
    });
    assert(toolbarPosition.top >= toolbarPosition.viewportTop - 1, 'Toolbar should stick without being clipped');
    assert(Math.abs(toolbarPosition.tabsTop - toolbarPosition.viewportTop) <= 1, 'Compose tabs stay visible while writing');
    assert(toolbarPosition.top >= toolbarPosition.tabsBottom - 1, 'Sticky toolbar must stay below compose tabs');
    assert(toolbarPosition.bottom < toolbarPosition.viewportBottom);

    // Resizing is local geometry only: keep the native editor instance, markup,
    // toolbar commands and unsaved values across the internal tabs.
    await typeBody('Nội dung chưa lưu để thử kéo chiều cao.');
    const nativeBody = editor.locator('umb-content-workspace-property[alias=body] umb-input-tiptap');
    const contentBox = nativeBody.locator('#editor');
    const grip = editor.getByRole('button', { name: 'Thay đổi chiều cao nội dung', exact: true });
    const markupBeforeResize = await body.innerHTML();
    await body.evaluate(element => { element.dataset.resizeIdentity = 'original'; });
    const contentHeight = () => contentBox.evaluate(element => element.getBoundingClientRect().height);
    const dragGrip = async delta => {
      await grip.scrollIntoViewIfNeeded();
      const box = await grip.boundingBox();
      const content = await contentBox.boundingBox();
      assert(Math.abs(box.x + box.width - content.x - content.width) <= 2, 'Grip aligns with input right edge');
      assert(Math.abs(box.y + box.height - content.y - content.height) <= 2, 'Grip aligns with input bottom edge');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + delta, { steps: 12 });
      await page.mouse.up();
    };
    const initialBodyHeight = await contentHeight();
    await dragGrip(220);
    const expandedBodyHeight = await contentHeight();
    assert(Math.abs(expandedBodyHeight - initialBodyHeight - 220) <= 2, 'Drag down expands content area');
    await dragGrip(-100);
    const reducedBodyHeight = await contentHeight();
    assert(Math.abs(expandedBodyHeight - reducedBodyHeight - 100) <= 2, 'Drag up shrinks content area');
    assert.equal(await body.innerHTML(), markupBeforeResize);
    assert.equal(await body.getAttribute('data-resize-identity'), 'original');
    await editor.getByRole('tab', { name: 'Nguồn và rà soát', exact: true }).click();
    await editor.getByRole('tab', { name: 'Bài viết', exact: true }).click();
    assert.equal(await contentHeight(), reducedBodyHeight, 'Internal tab changes retain manual height');
    assert.equal(await body.innerHTML(), markupBeforeResize);
    await grip.focus();
    await grip.press('Home');
    const minimumBodyHeight = await contentHeight();
    await grip.press('ArrowUp');
    assert.equal(await contentHeight(), minimumBodyHeight, 'Grip cannot collapse editor below minimum');
    await grip.press('ArrowDown');
    assert.equal(await contentHeight(), minimumBodyHeight + 20, 'Keyboard can resize content');
    await typeBody(Array.from({ length: 40 }, (_, index) => `Đoạn dài ${index + 1}.`).join('\n'));
    const scrollableBody = await contentBox.evaluate(element => {
      element.scrollTop = element.scrollHeight;
      return { height: element.clientHeight, total: element.scrollHeight, top: element.scrollTop };
    });
    assert(scrollableBody.total > scrollableBody.height && scrollableBody.top > 0,
      `Manually reduced editor scrolls to long content: ${JSON.stringify(scrollableBody)}`);
    for (const width of [1024, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await dragGrip(40);
      assert.equal(await editor.locator('.scroll-area').evaluate(element => element.scrollWidth > element.clientWidth + 1), false);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await grip.press('End');
    const maximumBodyHeight = await contentHeight();
    await grip.press('ArrowDown');
    assert.equal(await contentHeight(), maximumBodyHeight, 'Grip respects maximum height');
    await grip.press('Home');
    await grip.press('ArrowDown');
    await typeBody('Kéo góc dưới bên phải để đổi chiều cao ô nội dung.');
    await dragGrip(200);
    if (process.env.ANTC_SCREENSHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.ANTC_SCREENSHOT_DIR, 'article-editor-resize-1440.png') });
    }
    assert.equal(await editor.locator('antc-article-body-resize').count(), 1, 'Only body gets a resize grip');
    console.log('Body resize:', { initialBodyHeight, expandedBodyHeight, reducedBodyHeight, minimumBodyHeight, maximumBodyHeight, scrollableBody });
    await page.waitForLoadState('networkidle');
    await page.reload(); // Discard browser-only state before checking another workspace.
    console.log('Reloading article');
    await summary.waitFor();
    assert.equal(await summary.inputValue(), originalSummary);
    await page.waitForLoadState('networkidle');
    await page.goto(`${base}/umbraco/section/media`);
    await page.getByRole('heading', { name: 'Phương tiện', exact: true }).first().waitFor();
    assert.equal(await page.getByRole('tab', { name: 'Soạn bài', exact: true }).count(), 0);
    assert.equal(await page.locator('antc-article-editor').count(), 0);
    assert.deepEqual(contentWrites, []);
    // Firefox reports rejected imports when a full navigation cancels a module
    // request. Exclude only URLs with a verified network-abort event; a 404 or a
    // module exception still fails this test.
    const navigationCancellations = errors.filter(message => [...abortedImports].some(url => message.includes(url)));
    // This browser-generated delivery warning is recorded separately. Functional
    // geometry/scroll/auto-height assertions above must still pass in full.
    const browserWarnings = errors.filter(message => message === 'ResizeObserver loop completed with undelivered notifications.');
    for (let index = errors.length - 1; index >= 0; index--) if (navigationCancellations.includes(errors[index]) || browserWarnings.includes(errors[index])) errors.splice(index, 1);
    assert.deepEqual(errors, []);
    if (navigationCancellations.length) console.log('Verified navigation-canceled imports:', navigationCancellations);
    if (browserWarnings.length) console.log('Browser delivery warnings (not resolved):', browserWarnings);
    console.log(JSON.stringify({ layouts, sharedWorkspaceValues: true, nativeActions: true, keyboardNavigation: true, paragraphWordCount: true, summaryAutoHeight: { shortSummary, longSummary, shrunkSummary }, toolbarCommands: true, toolbarSticky: toolbarPosition, mediaUnaffected: true, contentWrites, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack); process.exit(1); });
