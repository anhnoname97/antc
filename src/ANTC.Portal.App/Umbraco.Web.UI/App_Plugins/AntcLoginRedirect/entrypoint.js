// Mac dinh Umbraco hien mot hop co nut "Dang nhap" (sau khi dang xuat hoac het phien),
// bam vao moi mo popup dang nhap. Trang chi co mot nha cung cap (Umbraco) nen thay hop do
// bang mot phan tu chuyen thang (redirect) toi trang dang nhap co san o nhap.
// Danh doi: khi het phien giua chung, noi dung dang sua chua luu se mat sau khi chuyen trang.
import { UmbModalBaseElement } from '@umbraco-cms/backoffice/modal';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { html } from '@umbraco-cms/backoffice/external/lit';

const MODAL_ALIAS = 'Umb.Modal.AppAuth';
const ELEMENT_NAME = 'antc-auth-redirect-modal';

// host: phan tu Umbraco (UmbLitElement) de lay auth context.
async function redirectToLogin(host) {
  if (host.__antcStarted) return;
  host.__antcStarted = true;
  try {
    const auth = await host.getContext(UMB_AUTH_CONTEXT);
    if (!auth) throw new Error('Khong co auth context');
    await auth.makeAuthorizationRequest('Umbraco', true);
  } catch (error) {
    console.error('[AntcLoginRedirect] Khong chuyen duoc toi trang dang nhap', error);
    location.href = '/umbraco';
  }
}

class AntcAuthRedirectModalElement extends UmbModalBaseElement {
  connectedCallback() {
    super.connectedCallback();
    redirectToLogin(this);
  }

  render() {
    return html`<uui-loader></uui-loader>`;
  }
}

if (!customElements.get(ELEMENT_NAME)) customElements.define(ELEMENT_NAME, AntcAuthRedirectModalElement);

// Trang /umbraco/logout cua Umbraco dung phan tu umb-app-auth (chi dung o day) de hien nut
// "Dang nhap bang Umbraco". Ghi de de no chuyen thang toi form dang nhap.
customElements.whenDefined('umb-app-auth').then(() => {
  const AppAuth = customElements.get('umb-app-auth');
  if (!AppAuth || AppAuth.prototype.__antcRedirect) return;
  AppAuth.prototype.__antcRedirect = true;
  // connectedCallback bi trinh duyet chot luc define nen khong ghi de duoc; render thi Lit goi lai moi lan ve.
  AppAuth.prototype.render = function () {
    redirectToLogin(this);
    return html`<uui-loader></uui-loader>`;
  };
  // Trang logout co the da hien truoc khi entry point nay nap xong: ve lai phan tu dang co.
  for (const el of findDeep(document, 'umb-app-auth')) el.requestUpdate?.();
});

function findDeep(root, tag, out = []) {
  for (const el of root.querySelectorAll('*')) {
    if (el.localName === tag) out.push(el);
    if (el.shadowRoot) findDeep(el.shadowRoot, tag, out);
  }
  return out;
}

export const onInit = (_host, extensionRegistry) => {
  extensionRegistry.unregister(MODAL_ALIAS);
  extensionRegistry.register({
    type: 'modal',
    alias: MODAL_ALIAS,
    name: 'ANTC chuyen thang toi trang dang nhap',
    elementName: ELEMENT_NAME,
  });
};
