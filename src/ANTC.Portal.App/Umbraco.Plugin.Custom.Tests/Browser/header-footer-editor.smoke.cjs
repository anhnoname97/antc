// Read-only checks. Browser edits and validation payloads are never saved.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const siteId = '068471f0-605e-57ee-b164-547aee46bc79';
const value = (doc, alias) => doc.values.find(v => v.alias === alias)?.value;
const field = (page, alias) => page.locator(`umb-content-workspace-property[alias="${alias}"]`);
async function api(page, service, method, options) {
  return page.evaluate(async ({ service, method, options }) => {
    const sdk = await import('@umbraco-cms/backoffice/external/backend-api');
    const r = await sdk[service][method]({ ...options, throwOnError: false });
    return { status: r.response.status, data: r.data, error: r.error };
  }, { service, method, options });
}
(async () => {
  assert(process.env.ANTC_BACKOFFICE_USERNAME && process.env.ANTC_BACKOFFICE_PASSWORD, 'Set backoffice credentials.');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(`${base}/umbraco`);
    await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);
    await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
    await page.getByRole('button', { name: /^(Đăng nhập|Login|Log in)$/ }).click();
    await page.getByRole('button', { name: /Hồ sơ người dùng|User profile/ }).waitFor({ timeout: 45000 });
    const before = await api(page, 'DocumentService', 'getDocumentById', { path: { id: siteId } });
    assert.equal(before.status, 200);
    const doc = before.data;
    const mock = fs.readFileSync(path.resolve(__dirname, '../../../../docs/ban-dung-v2/antoantaichinh_v2.html'), 'utf8');
    const nav = value(doc, 'menu').contentData;
    assert.deepEqual(nav.map(b => value(b, 'label')), ['Khẩn cấp', 'Hãy tự kiểm tra', 'Các rủi ro']);
    assert.equal(value(nav[0], 'highlight'), true);
    const legacyAliases = ['headerCta', 'showHeaderAnnouncement', 'headerAnnouncementText', 'headerAnnouncementLink', 'footerPoliciesTitle', 'footerPolicies', 'footerPoliciesNote', 'copyright', 'footerPreviewNote'];
    assert(!doc.values.some(v => legacyAliases.includes(v.alias)));
    const schema = await api(page, 'DocumentTypeService', 'getDocumentTypeById', { path: { id: 'c440e1bd-e423-5094-a5ed-9e6224caaea1' } });
    assert.equal(schema.status, 200);
    assert(!schema.data.properties.some(p => legacyAliases.includes(p.alias)));
    assert(!schema.data.containers.some(c => c.name === 'Cấu hình bổ sung từ v1'));
    const info = value(doc, 'footerMenu').contentData;
    const support = value(doc, 'footerSupport').contentData;
    assert.deepEqual(info.map(b => value(b, 'label')), ['Về website', 'Nguyên tắc nội dung', 'Chính sách bảo mật', 'Điều khoản sử dụng']);
    assert.deepEqual(support.map(b => value(b, 'label')), ['Hỏi – Đáp', 'Liên hệ đúng nơi', 'Cách xác minh bạn đang ở đúng trang', 'Góp ý']);
    const commitments = value(doc, 'footerCommitments').contentData;
    assert.equal(commitments.length, 4);
    for (const b of commitments) assert(mock.includes(value(b, 'text')));
    assert(mock.includes(value(doc, 'headerTagline')));
    assert.equal(value(doc, 'headerTagline'), value(doc, 'footerTagline'));
    assert(mock.includes(value(doc, 'footerText')));
    assert.equal(value(doc, 'footerSponsorHiddenPages').length, 4);
    for (const b of [...nav, ...info, ...support]) {
      const target = value(b, 'page');
      assert.equal(target.length, 1);
      const r = await api(page, 'DocumentService', 'getDocumentById', { path: { id: target[0].unique } });
      assert.equal(r.status, 200, value(b, 'label'));
    }
    await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${siteId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Đầu trang', exact: true }).click();
    for (const alias of ['logoHeaderImage', 'headerLogoAlt', 'headerTagline', 'menu', 'showFontSizeControl', 'fontSizeControlLabel', 'showMobileNavigation']) await field(page, alias).waitFor();
    for (const label of ['Khẩn cấp', 'Hãy tự kiểm tra', 'Các rủi ro']) await field(page, 'menu').getByText(label).last().waitFor();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Chân trang', exact: true }).click();
    for (const alias of ['logoFooterImage', 'footerTagline', 'footerText', 'footerMenu', 'footerSupport', 'footerCommitments', 'footerOperatorText', 'footerSponsorHiddenPages']) await field(page, alias).waitFor();
    const lead = field(page, 'footerTagline').locator('textarea');
    const original = await lead.inputValue();
    await lead.fill('Bản kiểm tra trong bộ nhớ');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Đầu trang', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Chân trang', exact: true }).click();
    await page.waitForLoadState('networkidle');
    assert.equal(await lead.inputValue(), 'Bản kiểm tra trong bộ nhớ');
    await lead.fill(original);
    const payload = { template: doc.template, variants: doc.variants, values: doc.values, cultures: ['*'] };
    const valid = await api(page, 'DocumentService', 'putDocumentByIdValidate', { path: { id: siteId }, body: payload });
    assert.equal(valid.status, 200, JSON.stringify(valid.error));
    for (const alias of ['headerTagline', 'footerText', 'footerOperatorText']) {
      const invalid = structuredClone(payload);
      invalid.values.find(v => v.alias === alias).value = '';
      const r = await api(page, 'DocumentService', 'putDocumentByIdValidate', { path: { id: siteId }, body: invalid });
      assert.equal(r.status, 400, alias);
    }
    const after = await api(page, 'DocumentService', 'getDocumentById', { path: { id: siteId } });
    assert.deepEqual(after.data.values, doc.values);
    // Umbraco can dispose native clipboard property actions while switching tabs.
    // Restrict the exception to that known context lifecycle error; other errors fail.
    const clipboardContextError = /^UmbProperty(?:Dataset)?Context with API Alias: (?:default|UmbClipboardPropertyContext)\)\. Controller is hosted on (?:Not attached node|UMB-POPOVER-LAYOUT) > UMB-PROPERTY-ACTION$/;
    assert.deepEqual(errors.filter(e => !clipboardContextError.test(e)), []);
    if (errors.length) console.log(`Native clipboard context notifications during tab disposal: ${errors.length}`);
    console.log('PASS: both tabs, v2 mock content, 11 valid page links, 4 commitments, draft across tabs and 3 required-field validations. No content saved.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
