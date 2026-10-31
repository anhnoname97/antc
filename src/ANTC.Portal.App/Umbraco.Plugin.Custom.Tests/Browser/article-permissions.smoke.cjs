const h = require('./article-acceptance.helpers.cjs');
const { randomUUID, randomBytes } = require('node:crypto');
const path = require('node:path');
const probe = process.env.ANTC_PERMISSION_PROBE === '1';

(async () => {
  const browser = await h.launch();
  try {
    await h.isolated(browser);
    const admin = await h.login(browser); console.log('Admin login ready');
    const adminEditor = await h.openArticle(admin.page); console.log('Article opened');
    const properties = await adminEditor.evaluate(async element => {
      const { UMB_DOCUMENT_WORKSPACE_CONTEXT } = await import('@umbraco-cms/backoffice/document');
      return (await element.getContext(UMB_DOCUMENT_WORKSPACE_CONTEXT)).structure.getContentTypeProperties();
    });
    const propertyId = alias => properties.find(property => property.alias === alias).unique;
    let document = await h.readDocument(admin.page); console.log('Initial document read');
    const hiddenSeo = `Thiết lập SEO ẩn trên giao diện ${randomUUID()}`;
    h.assert.equal((await h.api(admin.page, 'DocumentService', 'putDocumentByIdUpdateAndPublish', { path: { id: h.fixtureId }, body: {
      ...h.updateBody(document, { summary: 'Tóm tắt nền kiểm tra quyền biên tập.', seoDescription: hiddenSeo, imageAlt: 'Ảnh kiểm tra quyền.',
        image: [{ key: randomUUID(), mediaKey: h.mediaId, crops: [] }] }), culturesToPublish: [] } })).status, 200);
    console.log('Baseline published');
    const baseVerbs = ['Umb.Document.Read', 'Umb.Document.PropertyValue.Read'];
    const editorVerbs = [...baseVerbs, 'Umb.Document.Create', 'Umb.Document.Update', 'Umb.Document.PropertyValue.Write'];
    const definitions = [
      { name: 'reader', verbs: baseVerbs, save: false, publish: false, unpublish: false },
      { name: 'writer', verbs: editorVerbs, save: true, publish: false, unpublish: false },
      { name: 'publisher', verbs: [...editorVerbs, 'Umb.Document.Publish'], save: true, publish: true, unpublish: false },
      { name: 'manager', verbs: [...editorVerbs, 'Umb.Document.Publish', 'Umb.Document.Unpublish'], save: true, publish: true, unpublish: true },
      { name: 'field-reader', verbs: editorVerbs, save: true, publish: false, unpublish: false, fieldLimited: true },
      { name: 'field-publisher', verbs: [...editorVerbs, 'Umb.Document.Publish'], save: true, publish: true, unpublish: false, fieldLimited: true },
      { name: 'no-read', verbs: [], save: false, publish: false, unpublish: false, noRead: true },
    ];
    const report = [];
    for (const role of definitions) { console.log(`Testing ${role.name}`);
      const groupId = randomUUID(), userId = randomUUID();
      const username = `antc-test-${role.name}-${randomBytes(4).toString('hex')}@example.invalid`;
      const password = `Antc!${randomBytes(16).toString('hex')}2026`;
      const group = await h.api(admin.page, 'UserGroupService', 'postUserGroup', { body: {
        id: groupId, name: `ANTC test ${role.name} ${randomBytes(5).toString('hex')}`, alias: `antcTest${randomBytes(5).toString('hex')}`,
        sections: ['Umb.Section.Content', 'Umb.Section.Media'], languages: [], hasAccessToAllLanguages: true,
        documentRootAccess: true, mediaRootAccess: true, elementRootAccess: false,
        fallbackPermissions: role.verbs,
        permissions: role.fieldLimited ? [
          { $type: 'DocumentPropertyValuePermissionPresentationModel', documentType: { id: h.articleType }, propertyType: { id: propertyId('summary') }, verbs: ['Umb.Document.PropertyValue.Read'] },
          { $type: 'DocumentPropertyValuePermissionPresentationModel', documentType: { id: h.articleType }, propertyType: { id: propertyId('body') }, verbs: [] },
          { $type: 'DocumentPropertyValuePermissionPresentationModel', documentType: { id: h.articleType }, propertyType: { id: propertyId('seoDescription') }, verbs: [] },
        ] : [],
      } });
      h.assert.equal(group.status, 201, group.error?.title);
      const user = await h.api(admin.page, 'UserService', 'postUser', { body: {
        id: userId, kind: 'Default', name: `ANTC test ${role.name}`, email: username, userName: username, userGroupIds: [{ id: groupId }],
      } });
      h.assert.equal(user.status, 201, user.error?.title);
      h.assert.equal((await h.api(admin.page, 'UserService', 'postUserByIdChangePassword', { path: { id: userId }, body: { newPassword: password } })).status, 200);
      const session = await h.login(browser, { username, password });
      try {
        if (role.noRead) {
          const denied = await h.api(session.page, 'DocumentService', 'getDocumentById', { path: { id: h.fixtureId } });
          h.assert.equal(denied.status, 403);
          await session.page.goto(`${h.base}/umbraco/section/content/workspace/document/edit/${h.fixtureId}`);
          await session.page.locator('umb-route-forbidden').waitFor();
          h.assert.equal(await session.page.locator('antc-article-editor').count(), 0);
          report.push({ role: role.name, readStatus: denied.status, forbiddenView: true, errors: session.errors });
          console.log(JSON.stringify(report.at(-1)));
          continue;
        }
        const editor = await h.openArticle(session.page);
        const footer = h.footer(session.page);
        const save = footer.getByRole('button', { name: 'Lưu', exact: true });
        const publish = footer.getByRole('button', { name: 'Lưu và xuất bản', exact: true });
        const input = editor.locator('#summary textarea');
        await input.waitFor();
        const result = { role: role.name, saveEnabled: await save.isEnabled(), publishEnabled: await publish.isEnabled(), summaryEditable: await input.isEditable() };
        const menu = footer.locator('umb-workspace-action-menu #popover-trigger');
        if (await menu.count()) await menu.last().click();
        result.scheduleVisible = await session.page.getByText('Lập lịch xuất bản', { exact: true }).filter({ visible: true }).count();
        result.unpublishVisible = await session.page.getByText('Hủy xuất bản', { exact: true }).filter({ visible: true }).count();
        await session.page.keyboard.press('Escape');
        const current = await h.readDocument(session.page);
        console.log(`API writes ${role.name}`);
        const updated = h.updateBody(current, { summary: `Yêu cầu sửa từ ${role.name}` });
        result.saveStatus = (await h.api(session.page, 'DocumentService', 'putDocumentById', { path: { id: h.fixtureId }, body: updated })).status;
        result.publishStatus = (await h.api(session.page, 'DocumentService', 'putDocumentByIdPublish', { path: { id: h.fixtureId }, body: { publishSchedules: [{ culture: null, schedule: null }] } })).status;
        result.scheduleStatus = (await h.api(session.page, 'DocumentService', 'putDocumentByIdPublish', { path: { id: h.fixtureId }, body: { publishSchedules: [{ culture: null,
          schedule: { publishTime: new Date(Date.now() + 86400000).toISOString(), unpublishTime: null } }] } })).status;
        result.unpublishStatus = (await h.api(session.page, 'DocumentService', 'putDocumentByIdUnpublish', { path: { id: h.fixtureId }, body: { cultures: null } })).status;
        result.savedSummary = (await h.readDocument(admin.page)).values.find(value => value.alias === 'summary').value;
        if (role.fieldLimited) {
          console.log(`PATCH ${role.name}`);
          result.patchStatus = (await h.api(session.page, 'DocumentService', 'patchDocumentByIdPatch', { path: { id: h.fixtureId }, body: {
            operations: [{ op: 'replace', path: '/values[alias=summary,culture=null,segment=null]/value', value: 'Sửa trường khóa qua PATCH' }],
          } })).status;
          console.log(`Combined ${role.name}`);
          const unchanged = h.updateBody(await h.readDocument(session.page), { summary: 'Sửa trường khóa khi xuất bản' });
          result.combinedStatus = (await h.api(session.page, 'DocumentService', 'putDocumentByIdUpdateAndPublish', { path: { id: h.fixtureId }, body: { ...unchanged, culturesToPublish: [] } })).status;
          result.bodyFieldVisible = await editor.locator('umb-content-workspace-property[alias=body]').count() > 0;
          result.bodyCountVisible = await editor.locator('#body .count').count() > 0;
          result.previews = await editor.locator('antc-article-seo-preview').evaluateAll(elements => elements.map(element => element._preview?.description));
          console.log(`Native save ${role.name}`);
          await h.setValues(editor, { safeAction: 'Sửa trường được phép; giữ nguyên summary/body đã khóa.' });
          const saved = session.page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname.endsWith(`/document/${h.fixtureId}`));
          await save.click();
          const response = await saved;
          result.nativeSaveStatus = response.status();

        }
        result.contentTabHidden = await session.page.locator('umb-workspace-split-view').getByRole('tab', { name: 'Nội dung', exact: true }).count() === 0;
        h.assert(result.contentTabHidden);
        result.errors = session.errors;
        report.push(result);
        console.log(JSON.stringify(result));
        if (!probe) {
          h.assert.equal(result.saveEnabled, role.save);
          h.assert.equal(result.publishEnabled, role.publish);
          h.assert.equal(result.summaryEditable, role.save && !role.fieldLimited);
          h.assert.equal(result.saveStatus, role.save && !role.fieldLimited ? 200 : 403);
          h.assert.equal(result.publishStatus, role.publish ? 200 : 403);
          h.assert.equal(result.scheduleStatus, role.publish ? 200 : 403);
          h.assert.equal(result.unpublishStatus, role.unpublish ? 200 : 403);
          if (role.fieldLimited) {
            h.assert.notEqual(result.savedSummary, `Yêu cầu sửa từ ${role.name}`, 'Read-only field cannot be changed through API');
            h.assert.equal(result.patchStatus, 403);
            h.assert.equal(result.combinedStatus, 403);
            h.assert.equal(result.nativeSaveStatus, 200, 'Native save of allowed fields must still work');
            h.assert.equal(result.bodyFieldVisible, false);
            h.assert.equal(result.bodyCountVisible, false);
            h.assert(result.previews.every(description => description !== hiddenSeo));
          }
          h.assert.deepEqual(result.errors, []);
        }
      } finally {
        await session.context.close();
        // Reset a valid public baseline and remove any schedule for the next role.
        document = await h.readDocument(admin.page);
        h.assert.equal((await h.api(admin.page, 'DocumentService', 'putDocumentByIdPublish', { path: { id: h.fixtureId }, body: { publishSchedules: [{ culture: null, schedule: { publishTime: null, unpublishTime: null } }] } })).status, 200);
        h.assert.equal((await h.api(admin.page, 'DocumentService', 'putDocumentByIdUpdateAndPublish', { path: { id: h.fixtureId }, body: { ...h.updateBody(document, { summary: 'Tóm tắt nền kiểm tra quyền biên tập.' }), culturesToPublish: [] } })).status, 200);
      }
    }
    if (process.env.ANTC_REPORT_DIR) {
      h.fs.mkdirSync(process.env.ANTC_REPORT_DIR, { recursive: true });
      h.fs.writeFileSync(path.join(process.env.ANTC_REPORT_DIR, 'permissions.json'), JSON.stringify(report, null, 2));
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
