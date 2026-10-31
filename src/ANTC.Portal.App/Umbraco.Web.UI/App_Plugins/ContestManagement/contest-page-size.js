import { html } from '@umbraco-cms/backoffice/external/lit';
import { PAGE_SIZES } from './contest-pagination.js?v=1.15.7';

export const pageSizeSelect = (size, change, busy = false, label = 'Số dòng mỗi trang') => html`
    <label class="page-size">Số dòng<select aria-label=${label} ?disabled=${busy}
        @change=${event => change(Number(event.target.value))}>${PAGE_SIZES.map(n => html`<option value=${n} .selected=${size === n}>${n}</option>`)}</select></label>`;
