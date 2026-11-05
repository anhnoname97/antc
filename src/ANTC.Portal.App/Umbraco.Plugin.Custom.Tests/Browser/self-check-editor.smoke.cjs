// Read-only acceptance check. Changes stay in browser memory; validation does not save.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const id = process.env.ANTC_SELF_CHECK_ID || '3d9ed535-67ea-4368-8ce4-7a4cb73cca57';

async function api(page, method, options) {
  return page.evaluate(async ({method, options}) => {
    const { DocumentService } = await import('@umbraco-cms/backoffice/external/backend-api');
    const result = await DocumentService[method]({...options, throwOnError:false});
    return {status:result.response.status, data:result.data, error:result.error};
  }, {method, options});
}

(async () => {
  assert(process.env.ANTC_BACKOFFICE_USERNAME && process.env.ANTC_BACKOFFICE_PASSWORD, 'Set backoffice credentials.');
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1600,height:1100}, reducedMotion:'reduce'});
  page.setDefaultTimeout(20000);
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  try {
    await page.goto(`${base}/umbraco`);
    await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);
    await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
    await page.getByRole('button',{name:/^(Đăng nhập|Login|Log in)$/}).click();
    await page.getByRole('button',{name:/Hồ sơ người dùng|User profile/}).waitFor({timeout:45000});
    await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);
    const field = alias=>page.locator(`umb-content-workspace-property[alias="${alias}"]`);
    await field('title').waitFor({timeout:30000});
    console.log('Opened content form.');
    if(process.env.ANTC_SELF_CHECK_ARTIFACTS)await page.screenshot({path:path.join(process.env.ANTC_SELF_CHECK_ARTIFACTS,'current.png'),fullPage:true});
    assert.equal(await field('title').locator('input').inputValue(), 'Hãy tự kiểm tra');
    for (const name of ['Trước khi chuyển tiền','Trước khi đầu tư, vay','Khi nghi ngờ bị lừa']) {
      await field('tools').getByText(name,{exact:true}).waitFor();
    }
    await field('know').scrollIntoViewIfNeeded();
    if(process.env.ANTC_SELF_CHECK_ARTIFACTS)await page.screenshot({path:path.join(process.env.ANTC_SELF_CHECK_ARTIFACTS,'knowledge-current.png')});
    await field('know').locator('umb-block-list-entry').last().waitFor({state:'attached'});
    assert.equal(await field('know').locator('umb-block-list-entry').count(),2);
    await field('chkOrder').getByRole('link',{name:'Mở Danh sách kiểm tra'}).waitFor();
    await field('illustration').waitFor();
    await field('illustrationAlt').waitFor();
    const original = (await api(page,'getDocumentById',{path:{id}})).data;
    assert(original.values.find(v=>v.alias==='tools').value.length===3);
    const rows=original.values.find(v=>v.alias==='know').value.contentData;
    assert.equal(rows.length,2);
    for(const row of rows)assert.equal(row.values.find(v=>v.alias==='trang').value.length,1);

    const body={template:original.template,variants:original.variants,values:original.values,cultures:['*']};
    let result=await api(page,'putDocumentByIdValidate',{path:{id},body});
    assert(result.status<300, JSON.stringify(result));
    for (const [alias,value] of [['title','x'.repeat(91)],['lead','x'.repeat(241)],['seoTitle','x'.repeat(61)],['seoDescription','x'.repeat(161)],['illustrationAlt','x'.repeat(161)],['tools',original.values.find(v=>v.alias==='tools').value.slice(0,2)]]) {
      const invalid=structuredClone(body);
      const index=invalid.values.findIndex(v=>v.alias===alias);
      if(index>=0)invalid.values[index].value=value;
      else invalid.values.push({alias,value,culture:null,segment:null});
      result=await api(page,'putDocumentByIdValidate',{path:{id},body:invalid});
      assert(result.status>=400, `Expected validation error for ${alias}: ${JSON.stringify(result)}`);
    }
    // Verify drafts survive tab navigation without saving or publishing.
    const originalTitle=await field('title').locator('input').inputValue();
    await field('title').locator('input').fill('Kiểm tra giữ dữ liệu khi chuyển tab');
    await page.getByRole('tab',{name:'SEO và chia sẻ',exact:true}).click();
    await field('seoTitle').waitFor();
    for(const alias of ['pageUrl','seoTitle','seoDescription','ogImage','hideFromSearch','canonicalUrl','updatedDate'])await field(alias).waitFor();
    await page.waitForFunction(()=>{
      const find=root=>{
        for(const e of root.querySelectorAll('*')){
          if(e.localName==='antc-self-check-info' && e.shadowRoot?.textContent.includes('Đang lấy'))return true;
          if(e.shadowRoot && find(e.shadowRoot))return true;
        } return false;
      };return !find(document);
    });
    const out=process.env.ANTC_SELF_CHECK_ARTIFACTS;
    if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'seo.png'),fullPage:true});}
    await page.getByRole('tab',{name:'Nội dung',exact:true}).last().click();
    assert.equal(await field('title').locator('input').inputValue(),'Kiểm tra giữ dữ liệu khi chuyển tab');
    await field('title').locator('input').fill(originalTitle);
    if(out){await page.screenshot({path:path.join(out,'content.png'),fullPage:true});await field('know').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'knowledge.png')});}
    const after=(await api(page,'getDocumentById',{path:{id}})).data;
    assert.deepEqual(after.values,original.values,'Browser checks must not save content.');
    assert.deepEqual(errors,[]);
    console.log('PASS: content, 3 ordered tools, 2 knowledge links, SEO tab, server validation and unsaved edits across tabs.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
