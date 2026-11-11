// Trang Gop y: gui qua API chung voi Hoi - Dap, type "gop-y" (ban chinh thuc 10/11/2026, vGopy).
(function () {
  var form = document.querySelector('form[data-form="gopy"]');
  if (!form) return;
  var text = document.getElementById('gtext');
  var ok = document.getElementById('gok');
  var err = document.getElementById('gerr');
  var done = document.getElementById('gdone');
  var btn = form.querySelector('button[type="submit"]');
  var label = btn.textContent;
  var pending = false;

  function showError(msg) {
    done.hidden = true;
    err.textContent = msg;
    err.hidden = false;
    err.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (pending) return;
    // May tu dien o an: bo qua lang le
    var hp = form.querySelector('.hp input');
    if (hp && hp.value) return;

    var content = (text.value || '').trim();
    if (content.length < 3) return showError('Góp ý còn trống. Một câu ngắn cũng được.');
    // API nhan tu 10 ky tu (QuestionRequestValidator)
    if (content.length < 10) return showError('Góp ý còn ngắn quá. Viết thêm vài chữ (ít nhất 10 ký tự) để Ban biên tập hiểu chỗ cần sửa.');
    if (!ok.checked) return showError('Cần tích ô đồng ý thì Ban biên tập mới được dùng góp ý.');

    pending = true;
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Đang gửi…';
    fetch('/api/v1/questions', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ type: 'gop-y', content: content, wantReply: false, contact: null, consent: true, website: '' })
    })
      .then(function (res) {
        if (res.status === 201) {
          form.querySelector('textarea').value = '';
          ok.checked = false;
          done.hidden = false;
          done.focus();
          return;
        }
        if (res.status === 429) throw new Error('Bạn gửi hơi nhanh. Thử lại sau ít phút.');
        return res.json().catch(function () { return null; }).then(function (data) {
          var fields = data && data.error && data.error.fields;
          var first = fields && fields[Object.keys(fields)[0]];
          throw new Error(first || (data && data.error && data.error.message) || '');
        });
      })
      .catch(function (x) {
        showError(x && x.message ? x.message
          : 'Chưa gửi được. Có thể mạng đang chập chờn hoặc máy chủ đang bận. Nội dung bạn gõ vẫn còn nguyên, hãy bấm gửi lại.');
      })
      .finally(function () {
        pending = false;
        btn.disabled = false;
        btn.textContent = label;
      });
  });
})();
