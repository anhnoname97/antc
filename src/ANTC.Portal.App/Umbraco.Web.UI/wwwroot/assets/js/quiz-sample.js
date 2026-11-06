import { loadSampleQuestions } from './quiz-sample-api.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const root = document.querySelector('[data-quiz-sample]');
if (root) {
  const status = root.querySelector('[data-quiz-status]');
  const message = root.querySelector('[data-quiz-message]');
  const retry = root.querySelector('[data-quiz-retry]');
  const content = root.querySelector('[data-quiz-content]');
  const dotsWrap = root.querySelector('[data-quiz-dots]');
  const cardWrap = root.querySelector('[data-quiz-card-wrap]');
  const navWrap = root.querySelector('[data-quiz-nav]');
  const moreWrap = root.querySelector('[data-quiz-more]');

  // Duong dan bai doc theo so chuyen de, may chu in vao trang. Chuyen de chua co bai thi khong hien lien ket
  const readingUrls = JSON.parse(root.dataset.readingUrls || '{}');

  let questions = [];
  const answers = Object.create(null);
  let currentIndex = 0;

  function getIndexFromHash() {
    const match = /^#cau-([1-8])$/.exec(location.hash);
    return match ? Number(match[1]) - 1 : 0;
  }

  function renderDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = questions.map((q, idx) => {
      const isCurrent = idx === currentIndex;
      const isDone = answers[idx] != null;
      return `<button type="button" data-dot="${idx}" aria-current="${isCurrent}" class="${isDone ? 'done' : ''}" aria-label="Câu ${idx + 1}">${idx + 1}</button>`;
    }).join('');
  }

  function renderCard() {
    if (!cardWrap || !questions[currentIndex]) return;
    const q = questions[currentIndex];
    const chosen = answers[currentIndex];
    const answered = chosen != null;

    const optsHtml = q.opt.map(([k, text]) => {
      let stateClass = '';
      if (answered) {
        if (k === q.ans) stateClass = ' right';
        else if (k === chosen) stateClass = ' wrong';
      }
      return `<button type="button" class="qzo${stateClass}" data-k="${esc(k)}" ${answered ? 'disabled' : ''}>` +
        `<span class="qzl">${esc(k)}</span><span>${esc(text)}</span></button>`;
    }).join('');

    let resHtml = '';
    if (answered) {
      const isCorrect = chosen === q.ans;
      const headHtml = isCorrect
        ? '<b class="ok">Đúng.</b> Đáp án phù hợp là <b>' + esc(q.ans) + '</b>.'
        : '<b class="no">Chưa đúng.</b> Đáp án phù hợp là <b>' + esc(q.ans) + '</b>.';

      const expHtml = q.opt.map(([k]) => {
        const isAns = k === q.ans;
        return `<p${isAns ? ' class="isans"' : ''}><b>${esc(k)}.</b> ${esc(q.exp?.[k] || '')}</p>`;
      }).join('');

      const safeHtml = q.safe ? `<div class="qzsafe"><b>HÀNH ĐỘNG AN TOÀN</b>${esc(q.safe)}</div>` : '';

      resHtml = `<div class="qzres"><p class="qzhead">${headHtml}</p><div class="qzexp">${expHtml}</div>${safeHtml}</div>`;
    }

    const sitHtml = q.sit ? `<div class="qzsit"><b>Tình huống</b>${esc(q.sit)}</div>` : '';

    cardWrap.innerHTML = `
      <div class="qz" data-mode="thu" data-i="${currentIndex}">
        <p class="qzcd">Câu ${currentIndex + 1} / ${questions.length} · Chuyên đề ${esc(q.cd)} · ${esc(q.lab)}</p>
        ${sitHtml}
        <p class="qzq">${esc(q.q)}</p>
        <div class="qzopts">${optsHtml}</div>
        ${resHtml}
      </div>
    `;
  }

  function renderNav() {
    if (!navWrap) return;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === questions.length - 1;

    let navHtml = '';
    if (!isFirst) {
      navHtml += '<button type="button" class="btn ghost" data-action="prev">‹ Câu trước</button>';
    }
    if (!isLast) {
      navHtml += '<button type="button" class="btn pri" data-action="next">Câu tiếp ›</button>';
    } else {
      navHtml += '<a href="/ngan-hang/" class="btn pri">Tự luyện đầy đủ 200 câu ›</a>';
    }
    navWrap.innerHTML = navHtml;
  }

  function renderMore() {
    if (!moreWrap || !questions[currentIndex]) return;
    const q = questions[currentIndex];
    const url = readingUrls[q.cd];
    moreWrap.innerHTML = url ? `<a href="${esc(url)}" class="more">Đọc bài Chuyên đề ${esc(q.cd)} ›</a>` : '';
  }

  function renderAll() {
    renderDots();
    renderCard();
    renderNav();
    renderMore();
  }

  function goTo(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
    const newHash = `#cau-${index + 1}`;
    if (location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }
    renderAll();
  }

  window.addEventListener('hashchange', () => {
    if (questions.length) {
      currentIndex = getIndexFromHash();
      renderAll();
    }
  });

  root.addEventListener('click', (e) => {
    const optBtn = e.target.closest('.qzo');
    if (optBtn && !optBtn.disabled && answers[currentIndex] == null) {
      const chosen = optBtn.dataset.k;
      answers[currentIndex] = chosen;
      renderAll();
      return;
    }

    const dotBtn = e.target.closest('[data-dot]');
    if (dotBtn) {
      const idx = Number(dotBtn.dataset.dot);
      goTo(idx);
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (action === 'prev') {
        goTo(currentIndex - 1);
      } else if (action === 'next') {
        goTo(currentIndex + 1);
      }
    }
  });

  async function load() {
    status.hidden = false;
    message.textContent = 'Đang tải câu hỏi…';
    retry.hidden = true;
    content.hidden = true;

    try {
      questions = await loadSampleQuestions();
      status.hidden = true;
      content.hidden = false;
      currentIndex = getIndexFromHash();
      if (!/^#cau-[1-8]$/.test(location.hash)) {
        history.replaceState(null, '', '#cau-1');
      }
      renderAll();
    } catch (err) {
      message.textContent = err.message || 'Không kết nối được máy chủ.';
      retry.hidden = false;
    }
  }

  retry.addEventListener('click', load);
  load();
}
