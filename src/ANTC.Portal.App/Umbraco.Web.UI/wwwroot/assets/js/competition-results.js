// API ket qua chi tra snapshot da duoc ban to chuc cong bo.
export function initCompetitionResults(page) {
  for (const root of page.querySelectorAll('[data-competition-results]')) {
    const find = name => root.querySelector(`[data-results-${name}]`);
    const status = find('status'), retry = find('retry'), table = find('table'), stats = find('stats');
    let pending = false;
    async function load() {
      if (pending) return;
      const id = root.dataset.contestId;
      if (!/^[1-9]\d*$/.test(id || '')) {
        status.textContent = 'Chưa có cuộc thi đã kết thúc để hiển thị kết quả.';
        return;
      }
      pending = true;
      root.setAttribute('aria-busy', 'true');
      table.hidden = stats.hidden = retry.hidden = true;
      find('rows').replaceChildren();
      status.hidden = false;
      status.textContent = 'Đang tải kết quả…';
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`/api/v1/contests/${id}/results?page=1&pageSize=20`, {
          headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store', signal: controller.signal
        });
        if (response.status === 404) {
          status.textContent = 'Không tìm thấy cuộc thi này.';
          return;
        }
        if (!response.ok) throw new Error('RESULTS_FAILED');
        const data = await response.json();
        if (!data?.contest || String(data.contest.id) !== id || !['pending', 'published'].includes(data.status))
          throw new Error('INVALID_RESULTS');
        const start = new Date(data.contest.startAt);
        if (Number.isNaN(start.getTime())) throw new Error('INVALID_DATE');
        find('month').textContent = 'tháng ' + new Intl.DateTimeFormat('vi-VN', {
          month: 'numeric', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh'
        }).format(start);
        find('description').textContent = `${data.contest.name}. Tên người thi được che thông tin nhận dạng. Không công bố số điện thoại.`;
        if (data.status === 'pending') {
          status.textContent = 'Ban tổ chức chưa công bố kết quả cuộc thi này.';
          return;
        }
        if (!Array.isArray(data.draws) || !Number.isSafeInteger(data.leaderboard?.total) || data.leaderboard.total < 0)
          throw new Error('INVALID_RESULTS');
        const winners = [];
        for (const draw of data.draws) {
          if (!Array.isArray(draw.winners)) throw new Error('INVALID_WINNERS');
          for (const winner of draw.winners) {
            if (typeof winner.fullName !== 'string' || !Number.isFinite(winner.score)) throw new Error('INVALID_WINNER');
            winners.push(winner);
          }
        }
        const rows = document.createDocumentFragment();
        winners.forEach((winner, index) => {
          const row = document.createElement('tr');
          for (const value of [index + 1, winner.fullName, winner.score]) {
            const cell = document.createElement('td');
            cell.textContent = String(value);
            row.append(cell);
          }
          rows.append(row);
        });
        find('rows').replaceChildren(rows);
        const number = new Intl.NumberFormat('vi-VN');
        find('ranked').textContent = number.format(data.leaderboard.total);
        find('winners').textContent = number.format(winners.length);
        stats.hidden = false;
        table.hidden = !winners.length;
        status.hidden = winners.length > 0;
        status.textContent = winners.length ? '' : 'Kết quả đã công bố. Chưa có danh sách đoạt giải.';
      } catch {
        table.hidden = stats.hidden = true;
        status.hidden = false;
        status.textContent = 'Chưa tải được kết quả. Vui lòng thử lại.';
        retry.hidden = false;
      } finally {
        clearTimeout(timer);
        pending = false;
        root.removeAttribute('aria-busy');
      }
    }
    retry.addEventListener('click', load);
    load();
  }
}
