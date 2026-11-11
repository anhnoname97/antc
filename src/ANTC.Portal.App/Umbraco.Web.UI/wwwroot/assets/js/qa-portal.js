// Script tương tác trang Hỏi – Đáp (antoantaichinh.vn/hoi-dap)
document.addEventListener('DOMContentLoaded', function () {
  initQaContactToggle();
  initQaForm();
});

// 1. Accordion Hỏi – đáp nhanh: site.js da xu ly moi nut [data-open]; khong gan them o day (gan hai lan se mo roi dong ngay).

// 2. Toggle ô nhập liên hệ khi muốn nhận trả lời riêng
function initQaContactToggle() {
  var replyCheck = document.getElementById('qreply');
  var contactWrap = document.getElementById('qcontactwrap');
  var contactInput = document.getElementById('qcontact');

  if (replyCheck && contactWrap) {
    replyCheck.addEventListener('change', function () {
      contactWrap.hidden = !this.checked;
      if (this.checked && contactInput) {
        contactInput.focus();
      }
    });
  }
}

// 3. Biểu mẫu gửi câu hỏi và gọi API
function initQaForm() {
  var form = document.querySelector('form[data-form="ask"]');
  if (!form) return;

  var qtext = document.getElementById('qtext');
  var qreply = document.getElementById('qreply');
  var qcontact = document.getElementById('qcontact');
  var qok = document.getElementById('qok');
  var qpub = document.getElementById('qpub');
  var qerr = document.getElementById('qerr');
  var submitBtn = form.querySelector('button[type="submit"]');
  var originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Gửi';

  var askSection = document.getElementById('gui-cau-hoi');
  var sentSection = document.getElementById('qa-sent');
  var backBtn = document.getElementById('btn-back-qa');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Check honeypot: nếu bot điền thì giả vờ thành công
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) {
      showSuccess();
      return;
    }

    var content = (qtext.value || '').trim();
    var rep = qreply ? qreply.checked : false;
    var contact = qcontact ? (qcontact.value || '').trim() : '';
    var ok = qok ? qok.checked : false;
    var pub = qpub ? qpub.checked : false;
    var msg = '';

    // Validate client-side theo đặc tả
    if (content.length < 10) {
      msg = 'Câu hỏi còn trống hoặc quá ngắn (tối thiểu 10 ký tự). Viết thêm một chút để Ban biên tập hiểu chuyện bạn gặp.';
    } else if (/\d{9,}/.test(content.replace(/[\s.\-]/g, ''))) {
      msg = 'Câu hỏi có một dãy số dài, có thể là số tài khoản, số thẻ hay số giấy tờ. Hãy xóa dãy số đó rồi gửi lại.';
    } else if (rep && !contact) {
      msg = 'Bạn đã chọn nhận trả lời riêng. Hãy để lại thư điện tử hoặc số điện thoại, hoặc bỏ chọn ô đó.';
    } else if (!ok) {
      msg = 'Cần tích ô bắt buộc thì Ban biên tập mới được đọc và xử lý câu hỏi.';
    } else if (!pub && !rep) {
      msg = 'Bạn chưa cho đăng công khai và chưa để lại cách liên lạc, nên Ban biên tập không có cách gửi câu trả lời. Hãy chọn một trong hai.';
    }

    if (msg) {
      qerr.textContent = msg;
      qerr.hidden = false;
      qerr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Submit API
    qerr.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi…';

    var payload = {
      type: 'cau-hoi',
      content: content,
      wantReply: rep,
      contact: rep ? contact : null,
      consent: true,
      website: ''
    };

    fetch('/api/v1/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.status === 201) {
          return res.json().then(function () {
            showSuccess();
          });
        }

        if (res.status === 429) {
          throw new Error('Bạn đã gửi 5 lần trong một giờ. Vui lòng thử lại sau.');
        }

        return res.json().then(function (data) {
          var serverMsg = data && data.error && data.error.message;
          if (data && data.error && data.error.fields) {
            var firstKey = Object.keys(data.error.fields)[0];
            serverMsg = data.error.fields[firstKey];
          }
          throw new Error(serverMsg || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        }).catch(function (err) {
          if (err && err.message && err.message.indexOf('JSON') < 0) {
            throw err;
          }
          throw new Error('Máy chủ gặp sự cố khi xử lý. Vui lòng thử lại sau.');
        });
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
        qerr.textContent = (err && err.message) ? err.message : 'Chưa gửi được. Có thể mạng đang chập chờn hoặc máy chủ đang bận. Nội dung bạn gõ vẫn còn nguyên, hãy bấm gửi lại.';
        qerr.hidden = false;
        qerr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
  });

  function showSuccess() {
    form.reset();
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
    var contactWrap = document.getElementById('qcontactwrap');
    if (contactWrap) contactWrap.hidden = true;
    qerr.hidden = true;

    form.hidden = true;
    if (askSection) askSection.hidden = true;
    if (sentSection) {
      sentSection.hidden = false;
      sentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    var sentHeading = document.getElementById('h-sent');
    if (sentHeading) sentHeading.focus({ preventScroll: true });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (sentSection) sentSection.hidden = true;
      form.hidden = false;
      if (askSection) {
        askSection.hidden = false;
        askSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (qtext) qtext.focus();
    });
  }
}

