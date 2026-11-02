const { chromium, firefox, webkit } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11123';
const fixtureId = '90ab7780-e72b-4d53-ae5a-147dfb353e03';
const articleType = '3f9aac4c-9214-408f-8bb9-bedd2f37319b';
const mediaId = 'd2aa41d7-969b-5bcf-9465-283081375b20';

async function isolated(browser) {
  const url = new URL(base);
  assert(process.env.ANTC_ALLOW_ISOLATED_WRITES === '1' && url.port === '11123' && ['localhost', '127.0.0.1'].includes(url.hostname), 'Requires isolated localhost:11123 and explicit write flag');
  const marker = JSON.parse(fs.readFileSync(process.env.ANTC_TEST_MARKER_PATH, 'utf8'));
  const context = await browser.newContext();
  try {
    const response = await context.request.get(`${base}/antc-isolated-test.json`);
    assert(response.ok(), 'Isolated content root marker is missing');
    const actual = await response.json();
    assert(actual.isolated && actual.nonce === marker.nonce, 'Isolated marker mismatch');
  } finally { await context.close(); }
}
async function launch() {
  const engine = process.env.ANTC_BROWSER_ENGINE || 'chromium';
  return ({ chromium, firefox, webkit })[engine].launch({ ...(process.env.ANTC_BROWSER_PATH ? { executablePath: process.env.ANTC_BROWSER_PATH } : {}) });
}
async function login(browser, credentials = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  context.setDefaultTimeout(20000);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/umbraco`);
  await page.locator('input[name=username]').fill(credentials.username || process.env.ANTC_BACKOFFICE_USERNAME);
  await page.locator('input[name=password]').fill(credentials.password || process.env.ANTC_BACKOFFICE_PASSWORD);
  await page.getByRole('button', { name: /^(Đăng nhập|Login|Log in)$/ }).click();
  await page.getByRole('button', { name: /Hồ sơ người dùng|User profile/ }).waitFor({ timeout: 45000 });
  return { context, page, errors };
}
async function api(page, service, method, options = {}) {
  return page.evaluate(async ({ service, method, options }) => {
    const module = await import('@umbraco-cms/backoffice/external/backend-api');
    let timeout;
    let result;
    try {
      result = await Promise.race([module[service][method]({ ...options, throwOnError: false }),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(`API timeout: ${service}.${method}`)), 30000); })]);
    } finally { clearTimeout(timeout); }
    return { status: result.response.status, data: result.data, error: result.error, location: result.response.headers.get('location') };
  }, { service, method, options });
}
async function openArticle(page, id = fixtureId) {
  await page.waitForLoadState('networkidle');
  await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);
  const editor = page.locator('antc-article-editor');
  await editor.locator('#summary').waitFor();
  return editor;
}
async function setValues(editor, values) {
  await editor.evaluate(async (element, values) => {
    const { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } = await import('@umbraco-cms/backoffice/document');
    const dataset = await element.getContext(UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT);
    for (const [alias, value] of Object.entries(values)) dataset.setPropertyValue(alias, value);
  }, values);
}
async function readDocument(page, id = fixtureId) {
  const response = await api(page, 'DocumentService', 'getDocumentById', { path: { id } });
  assert.equal(response.status, 200);
  return response.data;
}
function updateBody(document, values = {}) {
  const body = { template: document.template, variants: document.variants, values: structuredClone(document.values) };
  for (const [alias, value] of Object.entries(values)) {
    const old = body.values.find(item => item.alias === alias && !item.culture && !item.segment);
    if (old) old.value = value; else body.values.push({ alias, value, culture: null, segment: null });
  }
  return body;
}
const footer = page => page.locator('umb-document-workspace-split-view umb-workspace-footer');
module.exports = { assert, fs, base, fixtureId, articleType, mediaId, isolated, launch, login, api, openArticle, setValues, readDocument, updateBody, footer };
