import { escapeHtml, campaignState } from './contest-layout.js?v=1.15.0';

// Arrange the existing form controls without replacing their save/validation bindings.
export function arrangeCampaignEditor(dialog, item) {
    dialog.classList.add('campaign-editor');
    dialog.setAttribute('aria-label', item ? `Sửa cuộc thi ${item.name}` : 'Tạo cuộc thi');
    const form = dialog.querySelector('form');
    const header = form.querySelector('header');
    const started = !!item && Date.parse(item.startAt) <= Date.now();
    const deckLocked = started || !!item?.entryCount;
    const state = item && campaignState(item);
    header.querySelector('h2').innerHTML = `${item ? escapeHtml(item.name) : 'Tạo cuộc thi'} ${state ? `<span class="badge ${state.color}">${state.label}</span>` : ''}`;
    header.querySelector('p').textContent = item ? `Cuộc thi #${item.id} · Chỉnh sửa thông tin và cấu hình cuộc thi` : 'Thiết lập lịch, bộ đề và giải thưởng cho cuộc thi mới.';
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'editor-back'; back.textContent = '← Danh sách cuộc thi';
    back.addEventListener('click', () => dialog.close());
    header.querySelector('div').prepend(back);
    const body = document.createElement('div'); body.className = 'campaign-editor-body';
    const nav = document.createElement('nav'); nav.className = 'editor-nav'; nav.setAttribute('aria-label', 'Các phần của cuộc thi');
    const content = document.createElement('div'); content.className = 'editor-sections';
    const definitions = [
        ['info', 'Thông tin chung', ['name', 'description', 'active']],
        ['schedule', 'Lịch và lượt thi', ['startAt', 'endAt', 'maxAttempts', 'submitGraceHours']],
        ['questions', 'Bộ đề', []], ['prizes', 'Giải thưởng', []],
        ['advanced', 'Cài đặt nâng cao', ['readTimerFactor', 'focusArea']],
    ];
    const grid = form.querySelector('.form-grid');
    definitions.forEach(([id, title, fields], index) => {
        const panel = document.createElement(id === 'advanced' ? 'details' : 'section');
        panel.id = `campaign-${id}`; panel.className = 'editor-section';
        panel.innerHTML = id === 'advanced' ? `<summary>5. ${title} <small>· tốc độ đọc, mã lĩnh vực</small></summary>` : `<h2>${index + 1}. ${title}</h2>`;
        const controls = document.createElement('div'); controls.className = 'form-grid';
        fields.forEach(name => {
            const input = grid.querySelector(`[name="${name}"]`);
            const label = input.closest('label');
            if (name === 'active') {
                label.classList.add('visibility-switch', 'wide');
                input.setAttribute('role', 'switch'); input.setAttribute('aria-label', 'Hiển thị trên trang web');
                label.append(document.createTextNode(' · Hiển thị trên trang web'));
            }
            if (started && name !== 'active') input.readOnly = true;
            if (name === 'description') {
                const counter = document.createElement('small');
                const update = () => { counter.textContent = `${input.value.length} / ${input.maxLength} ký tự · Hiển thị dưới tên cuộc thi trên trang web.`; };
                input.addEventListener('input', update); update(); label.append(counter);
            }
            if (name === 'maxAttempts') {
                const stepper = document.createElement('div'); stepper.className = 'attempt-stepper';
                const step = (text, delta) => {
                    const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
                    button.disabled = started; button.setAttribute('aria-label', delta < 0 ? 'Giảm số lượt' : 'Tăng số lượt');
                    button.addEventListener('click', () => { input.value = String(Math.max(0, Math.min(1000, Number(input.value) + delta))); input.dispatchEvent(new Event('input', { bubbles: true })); });
                    return button;
                };
                input.before(stepper); stepper.append(step('−', -1), input, step('+', 1));
            }
            controls.append(label);
        });
        if (fields.length) panel.append(controls);
        if (id === 'questions') {
            panel.append(form.querySelector('.tree-heading'), form.querySelector('.contest-tree'));
            if (deckLocked) {
                panel.querySelectorAll('input[type="checkbox"]').forEach(input => { input.disabled = true; });
                const badge = document.createElement('span'); badge.className = 'badge off'; badge.textContent = 'Đã khóa'; panel.querySelector('h2').append(' ', badge);
            }
        }
        if (id === 'prizes') { const prizes = form.querySelector('.contest-prize-picker'); prizes.open = true; panel.append(prizes); }
        content.append(panel);
        const link = document.createElement('button'); link.type = 'button';
        link.innerHTML = `<span>${index + 1}</span>${title}`;
        link.addEventListener('click', () => { if (panel.tagName === 'DETAILS') panel.open = true; panel.scrollIntoView({ block: 'start', behavior: 'smooth' }); nav.querySelectorAll('button').forEach(b => b.removeAttribute('aria-current')); link.setAttribute('aria-current', 'step'); });
        if (!index) link.setAttribute('aria-current', 'step'); nav.append(link);
    });
    grid.remove(); body.append(nav, content); header.after(body);
    if (deckLocked) {
        const note = document.createElement('div'); note.className = 'editor-lock-note'; note.setAttribute('role', 'note');
        note.textContent = started ? 'Cuộc thi đã bắt đầu. Thông tin, lịch và bộ đề đã khóa; bạn có thể thay đổi trạng thái hiển thị và cấu hình giải thưởng.' : `Đã có ${item.entryCount} lượt dự thi. Bộ đề đã khóa để giữ nguyên dữ liệu bài làm.`;
        body.before(note);
    }
    const footer = form.querySelector('footer');
    const status = document.createElement('span'); status.className = 'editor-save-status'; status.setAttribute('role', 'status'); status.textContent = 'Chưa có thay đổi'; footer.prepend(status);
    const markDirty = () => { status.textContent = '● Có thay đổi chưa lưu'; status.classList.add('dirty'); };
    form.addEventListener('input', markDirty); form.addEventListener('change', markDirty);
    return { started, deckLocked };
}
