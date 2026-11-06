import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, css, nothing } from '@umbraco-cms/backoffice/external/lit';

class AntcEmergencyInfo extends UmbLitElement {
  static properties = { config: {}, value: {} };
  render() {
    const message = this.config?.getValueByAlias('message');
    const target = this.config?.getValueByAlias('target');
    const valid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(target || '');
    return html`<p>${message}</p>${valid ? html`<a href=${`/umbraco/section/content/workspace/document/edit/${target}`}>${this.config?.getValueByAlias('linkLabel') || 'Mở nội dung dùng chung'}</a>` : nothing}`;
  }
  static styles = css`:host{display:block;line-height:1.6}p{margin:0 0 8px}a{color:var(--uui-color-interactive)}`;
}
customElements.define('antc-emergency-info', AntcEmergencyInfo);
export default AntcEmergencyInfo;
