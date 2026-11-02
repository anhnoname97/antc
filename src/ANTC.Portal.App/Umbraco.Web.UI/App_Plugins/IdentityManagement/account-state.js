import { UmbValueSummaryElementBase } from '@umbraco-cms/backoffice/value-summary';
import { html, css } from '@umbraco-cms/backoffice/external/lit';

class AccountState extends UmbValueSummaryElementBase {
    render() {
        const statuses = {
            Active: ['Đang hoạt động', 'active'], Invited: ['Chờ nhận lời mời', 'pending'],
            Disabled: ['Vô hiệu hóa', 'disabled'], LockedOut: ['Đã khóa', 'disabled'],
            Inactive: ['Chưa hoạt động', 'pending'],
        };
        const [label, state] = statuses[this._value] || [this._value || '—', 'unknown'];
        return html`<span class=${state}>${label}</span>`;
    }
    static styles = css`
        :host{display:inline-block;font-size:12px;line-height:1.5;white-space:nowrap}
        span{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:99px;background:#f1f3f8;color:#5b6478;font-weight:600}
        span::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
        .active{color:#0a5e57;background:#e3f4f1}.pending{color:#8a4a06;background:#fff1dc}.disabled{color:#a3201a;background:#fdecea}
    `;
}
if (!customElements.get('antc-account-state')) customElements.define('antc-account-state', AccountState);
export { AccountState as element };
export default AccountState;
