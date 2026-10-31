// Presentation helpers. All numbers and dates come from the administration API.
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function campaignState(contest, now = Date.now()) {
    if (!contest.isActive) return { key: 'inactive', label: 'Ngừng dùng', color: 'off' };
    if (now < Date.parse(contest.startAt)) return { key: 'upcoming', label: 'Sắp diễn ra', color: 'upcoming' };
    if (now > Date.parse(contest.endAt)) return { key: 'ended', label: 'Đã kết thúc', color: 'off' };
    return { key: 'live', label: 'Đang diễn ra', color: 'on' };
}
export async function loadCampaigns(request) {
    const campaigns = []; let page = 1, result;
    do { result = await request(`/campaigns?page=${page++}&pageSize=100`); campaigns.push(...result.items); } while (page <= result.totalPages);
    return campaigns;
}
export function scheduleMarkup(contests, now = new Date()) {
    // Six calendar months, with the current month in the fourth column.
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const year = vn.getFullYear(), month = vn.getMonth();
    const boundary = delta => Date.UTC(year, month + delta, 1) - 7 * 3600000;
    const start = boundary(-3), end = boundary(3), span = end - start;
    const months = Array.from({ length: 6 }, (_, i) => new Date(boundary(i - 3) + 7 * 3600000));
    const visible = contests.filter(c => Date.parse(c.endAt) >= start && Date.parse(c.startAt) < end);
    const tracks = [];
    const bars = visible.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)).map(c => {
        const left = Math.max(start, Date.parse(c.startAt)), right = Math.min(end, Date.parse(c.endAt));
        let track = tracks.findIndex(last => last < left);
        if (track < 0) track = tracks.length;
        tracks[track] = right;
        const state = campaignState(c);
        return `<button type="button" data-open-campaign="${c.id}" class="schedule-bar ${state.key}" style="left:${100 * (left - start) / span}%;width:${Math.max(.6, 100 * (right - left) / span)}%;top:${track * 34 + 6}px" title="${escapeHtml(c.name)}">#${c.id} ${escapeHtml(c.name)}</button>`;
    }).join('');
    return `<section class="schedule-card" aria-label="Lịch 6 tháng"><div class="panel-heading"><h2>Lịch cuộc thi</h2><span class="muted">Tháng ${months[0].getUTCMonth() + 1}/${months[0].getUTCFullYear()} – tháng ${months[5].getUTCMonth() + 1}/${months[5].getUTCFullYear()}</span></div><div class="schedule-months">${months.map(m => `<span>Th${m.getUTCMonth() + 1}</span>`).join('')}</div><div class="schedule-track" style="height:${Math.max(52, tracks.length * 34 + 18)}px">${bars}<div class="schedule-today" style="left:${100 * (now.getTime() - start) / span}%"><span>Hôm nay</span></div></div>${visible.length ? '' : '<p class="muted">Chưa có cuộc thi trong khoảng thời gian này.</p>'}</section>`;
}
