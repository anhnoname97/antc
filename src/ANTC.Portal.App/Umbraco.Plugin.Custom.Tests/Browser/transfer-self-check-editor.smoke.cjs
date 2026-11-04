// Read-only checks: validation requests never persist the supplied test values.
const { chromium }=require(process.env.ANTC_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.ANTC_TEST_URL||'http://localhost:11000';
const investment=process.env.ANTC_TOOL_SCENARIO==='investment';
const expected=investment?{
 id:'286b8f0f-c033-4f3b-8491-2b59ccfbb53a',title:'Trước khi đầu tư, vay',options:['co','khong','chuaBiet'],advice:true,
 kinds:['phaiDung','phaiDung','tamHoan','canKiemTra','canKiemTra'],results:['Không nên tham gia','Rủi ro cao','Cần thẩm định kỹ'],
 steps:[[3,5,4],[1,2,4],[4,5]],
}:{
 id:'bb66c14e-7d82-4be3-910b-783db0c247bf',title:'Trước khi chuyển tiền',options:['co','co','khong','chuaBiet'],advice:false,
 kinds:['phaiDung','phaiDung','phaiDung','tamHoan','canKiemTra'],results:['Cần dừng lại','Cần kiểm tra thêm','Chưa phát hiện điểm dừng'],
 steps:[[1,2,4],[2,3,4],[1,2]],
};
const id=process.env.ANTC_COUNT_TOOL_ID||process.env.ANTC_TRANSFER_TOOL_ID||expected.id;
async function api(page,method,options){return page.evaluate(async({method,options})=>{
 const {DocumentService}=await import('@umbraco-cms/backoffice/external/backend-api');
 const r=await DocumentService[method]({...options,throwOnError:false});return {status:r.response.status,data:r.data,error:r.error};
},{method,options});}
const val=(document,alias)=>document.values.find(v=>v.alias===alias)?.value;
const nested=(block,alias)=>block.values.find(v=>v.alias===alias);
function set(document,alias,value){const p=document.values.find(v=>v.alias===alias);if(p)p.value=value;else document.values.push({alias,value,culture:null,segment:null});}
function resize(blockList,count){
 const rows=Array.from({length:count},()=>({...structuredClone(blockList.contentData[0]),key:randomUUID()}));
 blockList.contentData=rows;blockList.layout['Umbraco.BlockList']=rows.map(r=>({contentKey:r.key}));blockList.expose=rows.map(r=>({contentKey:r.key,culture:null,segment:null}));
}
(async()=>{
 assert(process.env.ANTC_BACKOFFICE_USERNAME&&process.env.ANTC_BACKOFFICE_PASSWORD,'Set backoffice credentials.');
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1600,height:1100},reducedMotion:'reduce'});page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>{if(!errors.length)console.error(e.stack);errors.push(e.message);});
 const out=process.env.ANTC_SELF_CHECK_ARTIFACTS;
 try{
  await page.goto(`${base}/umbraco`);
  await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);
  await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
  await page.getByRole('button',{name:/^(Đăng nhập|Login|Log in)$/}).click();
  await page.getByRole('button',{name:/Hồ sơ người dùng|User profile/}).waitFor({timeout:45000});
  await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);
  const field=alias=>page.locator(`umb-content-workspace-property[alias="${alias}"]`);
  await field('title').waitFor({timeout:30000});
  assert.equal(await field('title').locator('input').inputValue(),expected.title);
  for(const alias of ['slug','icon','card','lead','showAdvice','rule','qs','resD','resH','resN','noneMore','actD','actH','actN','more','illustration','illustrationAlt'])await field(alias).waitFor();
  const original=(await api(page,'getDocumentById',{path:{id}})).data;
  assert.equal(val(original,'qs').contentData.length,5);
  assert.equal(val(original,'showAdvice'),expected.advice);
  assert.deepEqual(val(original,'qs').contentData.map(q=>nested(q,'kind').value),expected.kinds);
  assert.deepEqual(['resD','resH','resN'].map(alias=>val(original,alias)),expected.results);
  const last=val(original,'qs').contentData[4];
  assert.equal(nested(last,'opts').value.contentData.length,expected.options.length);
  assert.deepEqual(nested(last,'opts').value.contentData.map(o=>nested(o,'mean').value),expected.options);
  if(investment)assert.deepEqual(nested(val(original,'qs').contentData[3],'opts').value.contentData.map(o=>nested(o,'mean').value),['co','khong','chuaBiet']);
  assert.equal(val(original,'actD').contentData.length,3);
  assert.equal(val(original,'actH').contentData.length,3);
  assert.equal(val(original,'actN').contentData.length,2);
  assert.deepEqual(['actD','actH','actN'].map(alias=>val(original,alias).contentData.map(r=>nested(r,'step').value)),expected.steps);
  assert.equal(val(original,'more').contentData.length,4);
  const body={template:original.template,variants:original.variants,values:structuredClone(original.values),cultures:['*']};
  // Use an existing valid action page only in validation payloads; never save fabricated mockup references.
  const reference=[{type:'document',unique:process.env.ANTC_ACTION_TEST_ID||'c306935d-90ce-427e-9309-802a3ff9b1a5'}];
  for(const alias of ['actD','actH','actN'])for(const row of val(body,alias).contentData)nested(row,'page').value=reference;
  for(const row of val(body,'more').contentData)nested(row,'trang').value=reference;
  let result=await api(page,'putDocumentByIdValidate',{path:{id},body});assert(result.status<300,JSON.stringify(result));
  const badCases=[
   ['title 91',d=>set(d,'title','x'.repeat(91))],['slug format',d=>set(d,'slug','Sai đường dẫn')],['slug 61',d=>set(d,'slug','x'.repeat(61))],
   ['card 161',d=>set(d,'card','x'.repeat(161))],['lead 241',d=>set(d,'lead','x'.repeat(241))],
   ['question kind',d=>nested(val(d,'qs').contentData[0],'kind').value='invalid'],
   ['question 301',d=>nested(val(d,'qs').contentData[0],'q').value='x'.repeat(301)],
   ['help 401',d=>nested(val(d,'qs').contentData[0],'help').value='x'.repeat(401)],
   ['option 121',d=>nested(nested(val(d,'qs').contentData[4],'opts').value.contentData[0],'label').value='x'.repeat(121)],
   ['option meaning',d=>nested(nested(val(d,'qs').contentData[4],'opts').value.contentData[0],'mean').value='invalid'],
   ['1 question',d=>resize(val(d,'qs'),1)],['9 questions',d=>resize(val(d,'qs'),9)],
   ['6 options',d=>resize(nested(val(d,'qs').contentData[4],'opts').value,6)],
   ['5 action steps',d=>resize(val(d,'actD'),5)],['step 0',d=>nested(val(d,'actD').contentData[0],'step').value=0],
   ['7 related links',d=>resize(val(d,'more'),7)],['alt 161',d=>set(d,'illustrationAlt','x'.repeat(161))],
   ['SEO title 61',d=>set(d,'seoTitle','x'.repeat(61))],['SEO description 161',d=>set(d,'seoDescription','x'.repeat(161))],
  ];
  for(const [name,mutate] of badCases){const invalid=structuredClone(body);mutate(invalid);result=await api(page,'putDocumentByIdValidate',{path:{id},body:invalid});assert(result.status>=400,`Missing validation: ${name} ${JSON.stringify(result)}`);}
  await field('qs').scrollIntoViewIfNeeded();
  const entries=field('qs').locator('umb-block-list-entry');
  await entries.last().waitFor({state:'attached'});
  assert.equal(await entries.count(),5);
  const card=entries.first().locator('ufm-antc-question-label').first();
  await card.waitFor();
  const badge=card.locator('.badge');
  assert.equal((await badge.innerText()).trim(),'Phải dừng');
  assert(await badge.isVisible(),'Kind badge must be visible on a collapsed card.');
  assert.equal(await entries.first().locator('antc-tool-choice').count(),0);
  // Expand the first inline question and check the human-readable enum editor.
  await entries.first().getByRole('button').first().click();
  const kind=page.locator('antc-tool-choice').first();
  const combo=kind.getByRole('combobox',{name:'Loại câu'});
  await combo.waitFor();
  await combo.click();
  assert.equal(await kind.getByRole('option').count(),3);
  assert.equal(await kind.getByRole('option',{name:'Phải dừng',exact:true}).getAttribute('aria-selected'),'true');
  const colors=await kind.locator('.option .dot').evaluateAll(xs=>xs.map(x=>getComputedStyle(x).backgroundColor));
  assert.equal(new Set(colors).size,3);
  if(out)await page.screenshot({path:path.join(out,'transfer-kind-menu.png')});
  await kind.getByRole('option',{name:'Tạm hoãn',exact:true}).click();
  await badge.getByText('Tạm hoãn',{exact:true}).waitFor();
  assert.equal(await combo.getAttribute('aria-expanded'),'false');
  await combo.focus();await combo.press('ArrowDown');await combo.press('ArrowDown');await combo.press('Enter');
  await badge.getByText('Cần kiểm tra',{exact:true}).waitFor();
  await kind.getByRole('button',{name:'Xóa loại câu'}).click();
  await badge.getByText('Chưa chọn loại câu',{exact:true}).waitFor();
  await combo.click();await kind.getByRole('option',{name:'Phải dừng',exact:true}).click();
  await combo.click();await combo.press('Escape');
  assert.equal(await combo.getAttribute('aria-expanded'),'false');
  await badge.getByText('Phải dừng',{exact:true}).waitFor();
  if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'transfer-question.png')});}
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab',{name:'SEO và chia sẻ',exact:true}).click();
  for(const alias of ['pageUrl','seoTitle','seoDescription','ogImage','hideFromSearch','canonicalUrl','updatedDate'])await field(alias).waitFor();
  const seoTitle=field('seoTitle').locator('input');
  const previous=await seoTitle.inputValue();await seoTitle.fill('Kiểm tra tiêu đề SEO');
  await page.getByRole('tab',{name:'Nội dung',exact:true}).last().click();
  await field('title').waitFor();
  await page.getByRole('tab',{name:'SEO và chia sẻ',exact:true}).click();
  assert.equal(await seoTitle.inputValue(),'Kiểm tra tiêu đề SEO');await seoTitle.fill(previous);
  if(out)await page.screenshot({path:path.join(out,'transfer-seo.png')});
  const after=(await api(page,'getDocumentById',{path:{id}})).data;
  assert.deepEqual(after.values,original.values,'Read-only checks must not save content.');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${expected.title}: 25 fields, 5 questions, nested options, results, image, SEO, enum editing and ${badCases.length} validation cases. No content saved.`);
 }catch(e){if(out)await page.screenshot({path:path.join(out,'transfer-error.png')});console.error('Browser errors:',errors);throw e;}
 finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
