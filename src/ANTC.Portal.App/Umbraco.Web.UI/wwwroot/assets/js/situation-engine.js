// Priority rules from the customer's 10/11/2026 demo. This module has no browser or storage side effects.
export function computeSituation(data, id, selected) {
  const situation = data.situations.find(s => s.id === id);
  if (!situation) return null;
  const codes = new Set(selected);
  const consequences = data.consequences.filter(c => codes.has(c.code));
  const unknown = codes.has('unk');
  const level = consequences.length ? 'd' : unknown && situation.level === 'n' ? 'h' : situation.level;
  if (!consequences.length) return { situation, level, unknown, consequences, steps: [{ text: situation.firstAction }, ...situation.nextActions.map(text => ({ text }))] };
  const items = [];
  for (const [ci, consequence] of consequences.entries()) {
    for (const [si, ref] of (consequence.steps || []).entries()) {
      if (ref.source === '3:1' && codes.has('app')) continue; // Offline advice must precede bank contact on a different device.
      const step = data.guides[ref.source];
      // An editor removed/unpublished a source: never return a partial emergency plan as complete.
      if (!step) return { unavailable: true };
      const item = { ...step, details: [...step.details], source: ref.source, order: ci * 100 + si, origin: 0 };
      if (ref.source === '3:5') {
        const sentence = item.details[1] || '';
        const at = sentence.indexOf('. ');
        item.details = [item.details[0], at < 0 ? sentence : sentence.slice(0, at + 1)].filter(Boolean);
      }
      if (ref.source === '3:6' && data.guides['3:5']) {
        const details = data.guides['3:5'].details;
        const sentence = details[1] || '', at = sentence.indexOf('. ');
        item.details = [...(at < 0 ? [] : [sentence.slice(at + 2)]), ...details.slice(2)];
      }
      items.push(item);
    }
  }
  items.push({ text: situation.firstAction, actionId: situation.actionId, priority: situation.priority, origin: 1, order: 9000 });
  situation.nextActions.forEach((text, i) => {
    const [actionId, priority] = /trình báo/.test(text) ? ['report', 7]
      : /\b113\b/.test(text) ? ['c113', .5]
      : /156|5656/.test(text) ? ['r156', 8.1]
      : /sửa chữa|bảo hành/.test(text) ? ['repair', 8]
      : /^(Lưu|Giữ nguyên)|lưu lại nội dung|[Cc]hụp lại/.test(text) ? ['', 6.2] : ['', 5.5];
    items.push({ text, actionId, priority, origin: 2, order: 9100 + i });
  });
  const reportKey = codes.has('threat') ? '8:6' : codes.has('money') || codes.has('goods') ? '2:4'
    : codes.has('acct') || codes.has('id') ? '6:7' : ['app', 'otp', 'sim', 'login'].some(c => codes.has(c)) ? '3:7' : null;
  if (reportKey) {
    const source = data.guides[reportKey];
    if (!source) return { unavailable: true };
    for (let i = items.length - 1; i >= 0; i--) if (items[i].actionId === 'report') items.splice(i, 1);
    const details = [...source.details];
    if (reportKey !== '2:4' && (codes.has('money') || codes.has('goods'))) details.push(...(data.guides['2:4']?.details || []));
    items.push({ ...source, details, source: reportKey, actionId: 'report', priority: 7, origin: 0, order: 0 });
  }
  items.sort((a, b) => a.priority - b.priority || a.origin - b.origin || a.order - b.order);
  const seenActions = new Set(), seenText = new Set(), steps = [];
  let lastBank = null;
  for (const item of items) {
    if (seenText.has(item.text) || item.actionId && seenActions.has(item.actionId)) continue;
    seenText.add(item.text); if (item.actionId) seenActions.add(item.actionId);
    if (['bank-otp', 'bank-lock', 'bank-money', 'bank-inflow', 'card-lock'].includes(item.actionId)) {
      if (lastBank && lastBank !== 'bank-otp') item.note = 'Nếu cùng ngân hàng, ví với bước trên thì nói cả hai việc trong cùng một cuộc gọi.';
      lastBank = item.actionId;
    }
    steps.push(item);
  }
  return { situation, level, unknown, consequences, steps };
}

export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const distance = (a, b) => {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = next;
  }
  return previous[b.length];
};
const synonyms = { ck: 'chuyen tien', otp: 'otp xac thuc', app: 'ung dung', link: 'duong dan', qr: 'qr', ctv: 'cong tac vien', sdt: 'dien thoai', ko: 'khong', khong: 'khong' };
export function searchSituations(situations, query) {
  const terms = normalize(query).split(' ').filter(Boolean).flatMap(x => (synonyms[x] || x).split(' '));
  if (!terms.length) return [];
  return situations.map(situation => {
    const title = normalize(situation.title), haystack = `${title} ${normalize(situation.keywords)}`, words = haystack.split(' ');
    const score = terms.reduce((sum, term) => sum + (title.split(' ').includes(term) ? 3 : words.includes(term) ? 2 : term.length >= 3 && words.some(w => w.startsWith(term)) ? 1
      : term.length >= 4 && words.some(w => w[0] === term[0] && Math.abs(w.length - term.length) <= 1 && distance(term, w) <= 1) ? 1.5 : 0), 0);
    return { situation, score };
  }).filter(x => x.score >= 2).sort((a, b) => b.score - a.score).slice(0, 6).map(x => x.situation);
}
