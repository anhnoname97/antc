const form = document.getElementById('askForm');
if (form) {
    const content = form.querySelector('#askT');
    const consent = form.querySelector('#agree');
    const wantReply = form.querySelector('#wantReply');
    const contact = form.querySelector('#askM');
    const button = form.querySelector('#askBtn');
    const guard = form.querySelector('#guard');
    const message = form.querySelector('#sent');
    let sending = false;
    function check() {
        const length = content.value.trim().length;
        const hasNumbers = /\d{6,}/.test(content.value.replace(/[\s.\-]/g, ''));
        form.querySelector('#cnt').textContent = content.value.length + ' / 2000';
        guard.hidden = !hasNumbers;
        button.disabled = sending || !consent.checked || length < 10 || length > 2000 || hasNumbers;
        contact.disabled = !wantReply.checked;
        contact.required = wantReply.checked;
        form.querySelector('#mailbox').hidden = !wantReply.checked;
    }
    content.addEventListener('input', check);
    consent.addEventListener('change', check);
    wantReply.addEventListener('change', check);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (button.disabled || !form.reportValidity()) return;
        sending = true; check(); message.textContent = 'Đang gửi…';
        message.classList.remove('question-error');
        try {
            const response = await fetch('/api/v1/questions', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: form.querySelector('#askType').value, content: content.value,
                    wantReply: wantReply.checked, contact: wantReply.checked ? contact.value : '',
                    consent: consent.checked, website: form.querySelector('#website').value,
                }),
            });
            const result = await response.json().catch(() => null);
            if (response.status !== 201 || !result?.ok) throw new Error(result?.error?.message || 'Chưa gửi được nội dung. Vui lòng thử lại.');
            form.reset();
            message.textContent = 'Đã nhận nội dung của bạn. Ban biên tập sẽ xử lý; câu hỏi chỉ hiển thị công khai khi đã có câu trả lời và được duyệt.';
        } catch (error) {
            message.textContent = error.message || 'Không kết nối được máy chủ. Vui lòng thử lại.';
            message.classList.add('question-error');
        } finally { sending = false; check(); }
    });
    check();
}
