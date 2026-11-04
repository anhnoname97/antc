// Read-only acceptance checks. Validation payloads and browser edits are never saved.
const {chromium}=require(process.env.ANTC_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.ANTC_TEST_URL||'http://localhost:11000';
const folderId=process.env.ANTC_CHECKLIST_FOLDER_ID||'5c018bd7-d1b8-5d2e-a3b3-bc7cb36eb24b';
const parentId='3d9ed535-67ea-4368-8ce4-7a4cb73cca57';
const titles=['Trước mọi quyết định có dính đến tiền','Trước khi ký hợp đồng, bấm đồng ý','Trước khi đầu tư, góp vốn','Trước khi vay, bảo lãnh, đứng tên','Trước khi nhận việc, nộp hồ sơ','Trước khi mua, chuyển khoản, đặt cọc','Khi người lạ liên hệ, gửi đường link','Khi đã lỡ đưa tiền, mã hoặc giấy tờ'];
const val=(d,a)=>d.values.find(v=>v.alias===a)?.value;
function set(d,alias,value){const p=d.values.find(v=>v.alias===alias);if(p)p.value=value;else d.values.push({alias,value,culture:null,segment:null});}
async function api(page,method,options){return page.evaluate(async({method,options})=>{const {DocumentService}=await import('@umbraco-cms/backoffice/external/backend-api');const r=await DocumentService[method]({...options,throwOnError:false});return {status:r.response.status,data:r.data,error:r.error};},{method,options});}
function sourceId(){if(process.env.ANTC_ARTICLE_TEST_ID)return process.env.ANTC_ARTICLE_TEST_ID;const dir=path.resolve(__dirname,'../../Umbraco.Web.UI/uSync/v18/Content');for(const f of fs.readdirSync(dir)){const xml=fs.readFileSync(path.join(dir,f),'utf8');if(xml.includes('<ContentType>article</ContentType>')&&!xml.includes('<Trashed>true</Trashed>'))return xml.match(/<Content Key="([^"]+)"/)[1];}throw Error('No source article available for read-only validation.');}
(async()=>{
 assert(process.env.ANTC_BACKOFFICE_USERNAME&&process.env.ANTC_BACKOFFICE_PASSWORD,'Set backoffice credentials.');
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1680,height:1150},reducedMotion:'reduce'});page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const out=process.env.ANTC_SELF_CHECK_ARTIFACTS;if(out)fs.mkdirSync(out,{recursive:true});
 try{
  await page.goto(`${base}/umbraco`);await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);await page.getByRole('button',{name:/^(Đăng nhập|Login|Log in)$/}).click();await page.getByRole('button',{name:/Hồ sơ người dùng|User profile/}).waitFor({timeout:45000});
  await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${parentId}`);
  const open=page.locator('umb-content-workspace-property[alias=chkOrder]').getByRole('link',{name:'Mở Danh sách kiểm tra'});await open.waitFor();assert((await open.getAttribute('href')).endsWith(folderId));await open.click();
  const collection=page.locator('umb-document-collection');await collection.waitFor();
  await collection.getByText(titles[0],{exact:true}).waitFor();
  for(const title of titles)assert(await collection.getByText(title,{exact:true}).isVisible());
  const result=await api(page,'getCollectionDocumentById',{path:{id:folderId},query:{orderBy:'name',orderDirection:'Ascending',take:50}});assert.equal(result.status,200);assert.equal(result.data.total,8);assert.deepEqual(result.data.items.map(r=>r.variants[0].name).sort(),[...titles].sort());assert(!(await collection.locator('uui-table-head').innerText()).includes('Thứ tự'));
  const filtered=await api(page,'getCollectionDocumentById',{path:{id:folderId},query:{orderBy:'name',orderDirection:'Ascending',filter:'bảo lãnh',take:50}});assert.equal(filtered.status,200);assert.equal(filtered.data.total,1);assert.equal(filtered.data.items[0].variants[0].name,titles[3]);
  if(out)await page.screenshot({path:path.join(out,'checklist-collection.png')});
  await collection.getByText(titles[0],{exact:true}).click();
  const field=a=>page.locator(`umb-content-workspace-property[alias="${a}"]`);await field('title').waitFor();assert.equal(await field('title').locator('input').inputValue(),titles[0]);
  for(const a of ['icon','lead','src','p1Intro','p1Qs','p1Note','p2Intro','p2Items','doD','doH','pdf','pdfState','ver','rev','illustration','illustrationAlt'])await field(a).waitFor();
  await field('pdfState').getByText('Chưa có tệp: nút tải mở bản in A4.',{exact:true}).waitFor();
  const id=result.data.items[0].id,original=(await api(page,'getDocumentById',{path:{id}})).data;assert.equal(val(original,'p1Qs').length,5);assert.equal(val(original,'p2Items').length,6);assert.equal(val(original,'ver'),'2.0');
  for(const row of result.data.items){const d=(await api(page,'getDocumentById',{path:{id:row.id}})).data;assert(val(d,'p1Qs').length>=1&&val(d,'p1Qs').length<=8);assert(val(d,'p2Items').length>=1&&val(d,'p2Items').length<=15);assert(val(d,'doD')&&val(d,'doH')&&val(d,'rev'));}
  const body={template:original.template,variants:original.variants,values:structuredClone(original.values),cultures:['*']};
  set(body,'src',[{type:'document',unique:sourceId()}]);let valid=await api(page,'putDocumentByIdValidate',{path:{id},body});assert(valid.status<300,JSON.stringify(valid));
  const bad=[];for(const [a,max] of [['title',90],['lead',240],['p1Intro',500],['p1Note',300],['p2Intro',300],['doD',400],['doH',400],['ver',20],['illustrationAlt',160],['seoTitle',60],['seoDescription',160]])bad.push([`${a} too long`,d=>set(d,a,'x'.repeat(max+1))]);
  bad.push(['missing source',d=>set(d,'src',[])],['no questions',d=>set(d,'p1Qs',[])],['9 questions',d=>set(d,'p1Qs',Array(9).fill('Câu hỏi'))],['no items',d=>set(d,'p2Items',[])],['16 items',d=>set(d,'p2Items',Array(16).fill('Ô tích'))],['missing version',d=>set(d,'ver','')],['missing review date',d=>set(d,'rev',null)]);
  for(const [name,mutate] of bad){const invalid=structuredClone(body);mutate(invalid);const r=await api(page,'putDocumentByIdValidate',{path:{id},body:invalid});assert(r.status>=400,`Missing validation ${name}: ${JSON.stringify(r)}`);}
  if(out)await page.screenshot({path:path.join(out,'checklist-content.png')});
  const previous=await field('title').locator('input').inputValue();await field('title').locator('input').fill('Kiểm tra giữ dữ liệu checklist');
  await page.getByRole('tab',{name:'SEO và chia sẻ',exact:true}).click();for(const a of ['pageUrl','seoTitle','seoDescription','ogImage','hideFromSearch','canonicalUrl','updatedDate'])await field(a).waitFor();
  if(out)await page.screenshot({path:path.join(out,'checklist-seo.png')});
  await page.getByRole('tab',{name:'Nội dung',exact:true}).last().click();assert.equal(await field('title').locator('input').inputValue(),'Kiểm tra giữ dữ liệu checklist');await field('title').locator('input').fill(previous);
  const expectedRefs=[['bb66c14e-7d82-4be3-910b-783db0c247bf',2,result.data.items[5].id],['286b8f0f-c033-4f3b-8491-2b59ccfbb53a',1,result.data.items[2].id],['286b8f0f-c033-4f3b-8491-2b59ccfbb53a',2,result.data.items[3].id]];
  for(const [tool,index,target] of expectedRefs){const d=(await api(page,'getDocumentById',{path:{id:tool}})).data;const link=val(d,'more').contentData[index].values.find(v=>v.alias==='trang').value;assert.equal(link[0].unique,target);}
  assert.deepEqual((await api(page,'getDocumentById',{path:{id}})).data.values,original.values);assert.deepEqual(errors,[]);
  console.log(`PASS: linked collection, 8 checklists without sort-order column, filter, 24 fields, PDF status, SEO, tool references and ${bad.length} validation cases. No content saved.`);
 }catch(e){if(out)await page.screenshot({path:path.join(out,'checklist-error.png')});console.error('Browser errors:',errors);throw e;}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
